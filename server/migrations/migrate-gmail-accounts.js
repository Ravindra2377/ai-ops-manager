/**
 * Migration Script: Convert Legacy Gmail Connections to Multi-Account Structure
 * 
 * Purpose: Migrate existing users from single Gmail connection (legacy fields)
 *          to new gmailAccounts array structure for multi-account support
 * 
 * Safety: This script is idempotent - safe to run multiple times
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Email = require('../models/Email');
const { google } = require('googleapis');
const { decrypt } = require('../utils/encryption');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected for migration');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Get Gmail email address from tokens
const getGmailEmail = async (accessToken, refreshToken) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: decrypt(accessToken),
            refresh_token: decrypt(refreshToken),
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        return profile.data.emailAddress;
    } catch (error) {
        console.error('Error fetching Gmail email:', error.message);
        return null;
    }
};

// Migration function
const migrateUsers = async () => {
    console.log('\n🚀 Starting Gmail Multi-Account Migration...\n');

    const stats = {
        total: 0,
        migrated: 0,
        skipped: 0,
        alreadyMigrated: 0,
        errors: 0,
    };

    try {
        // Find all users
        const users = await User.find({});
        stats.total = users.length;

        console.log(`📊 Found ${stats.total} users to process\n`);

        for (const user of users) {
            console.log(`\n👤 Processing user: ${user.email} (${user._id})`);

            // Check if already migrated
            if (user.gmailAccounts && user.gmailAccounts.length > 0) {
                console.log('   ✓ Already migrated, skipping');
                stats.alreadyMigrated++;
                continue;
            }

            // Check if has legacy Gmail tokens
            if (!user.gmailAccessToken || !user.gmailRefreshToken) {
                console.log('   ⊘ No Gmail tokens found, skipping');
                stats.skipped++;
                continue;
            }

            try {
                // Get Gmail email address
                console.log('   → Fetching Gmail email address...');
                const gmailEmail = await getGmailEmail(
                    user.gmailAccessToken,
                    user.gmailRefreshToken
                );

                if (!gmailEmail) {
                    console.log('   ⚠ Could not fetch Gmail email, skipping');
                    stats.errors++;
                    continue;
                }

                console.log(`   → Gmail: ${gmailEmail}`);

                // Create gmailAccounts entry
                const gmailAccount = {
                    email: gmailEmail,
                    accessToken: user.gmailAccessToken,
                    refreshToken: user.gmailRefreshToken,
                    label: 'Personal', // Default label for migrated accounts
                    isPrimary: true,
                    status: 'connected',
                    provider: 'gmail',
                    lastSyncAt: user.lastSyncAt || null,
                    connectedAt: user.createdAt || new Date(),
                };

                // Add to gmailAccounts array
                user.gmailAccounts = [gmailAccount];
                user.activeGmailAccountId = user.gmailAccounts[0]._id;

                // Save user
                await user.save();

                console.log('   ✓ User migrated to gmailAccounts array');

                // Backfill emails with gmailAccountId
                console.log('   → Backfilling emails with gmailAccountId...');
                const emailUpdateResult = await Email.updateMany(
                    {
                        userId: user._id,
                        gmailAccountId: { $exists: false },
                    },
                    {
                        $set: { gmailAccountId: user.gmailAccounts[0]._id },
                    }
                );

                console.log(`   ✓ Updated ${emailUpdateResult.modifiedCount} emails`);

                stats.migrated++;
            } catch (error) {
                console.error(`   ❌ Error migrating user: ${error.message}`);
                stats.errors++;
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total users:          ${stats.total}`);
        console.log(`✅ Migrated:          ${stats.migrated}`);
        console.log(`✓  Already migrated:  ${stats.alreadyMigrated}`);
        console.log(`⊘  Skipped (no tokens): ${stats.skipped}`);
        console.log(`❌ Errors:            ${stats.errors}`);
        console.log('='.repeat(60) + '\n');

        if (stats.errors > 0) {
            console.log('⚠️  Some users had errors. Review logs above.');
        } else {
            console.log('✅ Migration completed successfully!');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
};

// Run migration
const runMigration = async () => {
    try {
        await connectDB();
        await migrateUsers();
        console.log('\n✅ Migration script completed. Closing connection...\n');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration script failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Execute if run directly
if (require.main === module) {
    runMigration();
}

module.exports = { migrateUsers };

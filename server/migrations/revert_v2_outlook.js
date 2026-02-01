const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const revert = async () => {
    try {
        console.log('Connecting to MongoDB for Revert...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected! Starting Revert...');

        // 1. Users Collection
        console.log('Reverting Users (connectedAccounts -> gmailAccounts)...');
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        let userCount = 0;

        for (const user of users) {
            if (user.connectedAccounts) {
                // Filter only gmail accounts just in case
                const gmailAccounts = user.connectedAccounts
                    .filter(acc => acc.provider === 'gmail')
                    .map(acc => {
                        const { provider, ...rest } = acc; // Remove provider field
                        return rest;
                    });

                await mongoose.connection.db.collection('users').updateOne(
                    { _id: user._id },
                    {
                        $set: { gmailAccounts: gmailAccounts },
                        $unset: { connectedAccounts: "" }
                    }
                );
                console.log(`✓ Reverted User: ${user.email}`);
                userCount++;
            }
        }

        // 2. Emails Collection
        console.log('Reverting Emails (providerMessageId -> gmailMessageId)...');

        const result = await mongoose.connection.db.collection('emails').updateMany(
            { providerMessageId: { $exists: true } },
            {
                $rename: {
                    "providerMessageId": "gmailMessageId",
                    "connectedAccountId": "gmailAccountId"
                },
                $unset: { provider: "" }
            }
        );

        console.log(`✓ Reverted ${result.modifiedCount} emails.`);

        console.log(`\nRevert Complete! ⏪\nReverted ${userCount} Users and ${result.modifiedCount} Emails.`);
        process.exit(0);
    } catch (error) {
        console.error('Revert Error:', error);
        process.exit(1);
    }
};

revert();

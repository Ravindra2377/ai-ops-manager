require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function clearGmailTokens() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find your user (replace with your email)
        const userEmail = process.argv[2];

        if (!userEmail) {
            console.error('❌ Please provide your email as argument');
            console.log('Usage: node clearGmailTokens.js your@email.com');
            process.exit(1);
        }

        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error(`❌ User not found: ${userEmail}`);
            process.exit(1);
        }

        console.log(`📧 Found user: ${user.email}`);
        console.log(`🔑 Current Gmail status: ${user.isGmailConnected ? 'Connected' : 'Disconnected'}`);

        // Clear Gmail tokens
        user.gmailAccessToken = null;
        user.gmailRefreshToken = null;
        user.isGmailConnected = false;
        user.gmailAccounts = [];

        await user.save();

        console.log('✅ Gmail tokens cleared successfully!');
        console.log('📱 You can now reconnect Gmail from the mobile app');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

clearGmailTokens();

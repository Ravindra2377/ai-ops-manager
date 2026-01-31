const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Email = require('../models/Email');
const User = require('../models/User');

const resetEmails = async () => {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is undefined. Check .env file path.');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Email.deleteMany({});
        console.log(`Deleted ${result.deletedCount} emails.`);

        console.log('Email database cleared successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetEmails();

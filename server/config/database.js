const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        // Debug logging for Render deployment
        if (!mongoUri) {
            console.error('❌ MONGODB_URI environment variable is not set!');
            console.log('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET')));
            process.exit(1);
        }

        console.log('🔄 Attempting MongoDB connection...');
        console.log('📍 MongoDB URI exists:', mongoUri ? 'Yes' : 'No');
        console.log('📍 URI starts with:', mongoUri ? mongoUri.substring(0, 20) + '...' : 'N/A');

        await mongoose.connect(mongoUri);

        console.log('✅ MongoDB connected successfully');
        console.log('📊 Database:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;

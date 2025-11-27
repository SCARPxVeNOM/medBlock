/**
 * MongoDB Database Configuration
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://pratikkumar56778_db_user:etgWQEDg5km05zam@cluster0.ectjae0.mongodb.net/medblock?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

async function connectDatabase() {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);

        isConnected = true;
        console.log('✓ MongoDB connected successfully');
        console.log(`✓ Database: medblock`);
        
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error);
        throw error;
    }
}

async function disconnectDatabase() {
    if (!isConnected) {
        return;
    }

    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
}

module.exports = {
    connectDatabase,
    disconnectDatabase,
    mongoose
};


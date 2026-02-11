// Script to setup Sri Lankan legal document templates
require('dotenv').config();
const mongoose = require('mongoose');
const { setupFinalTemplates } = require('./setupFinalTemplates');

const runSetup = async () => {
  try {
    console.log('🚀 Starting Sri Lankan Legal Templates Setup...\n');

    // Try multiple MongoDB connection options (same as app.js)
    const connectionOptions = [
      "mongodb+srv://triveni:M9fLy2oWyu8ewljr@cluster0.it4e3sl.mongodb.net/legal-management-system?retryWrites=true&w=majority",
      "mongodb://localhost:27017/legal-management-system",
      "mongodb://127.0.0.1:27017/legal-management-system"
    ];

    let connected = false;
    for (const connectionString of connectionOptions) {
      try {
        console.log(`📡 Attempting to connect to: ${connectionString.includes('cluster0') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
        await mongoose.connect(connectionString, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        });
        console.log('✅ Connected to MongoDB\n');
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Failed to connect with this option: ${error.message}`);
      }
    }

    if (!connected) {
      console.error('❌ Could not connect to any MongoDB instance');
      process.exit(1);
    }

    // Run setup
    await setupFinalTemplates();

    console.log('\n✅ Setup completed successfully!');
    console.log('🎉 All Sri Lankan legal document templates are now available in the system.');
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n📡 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
};

runSetup();

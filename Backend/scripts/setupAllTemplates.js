// Setup ALL templates - Court + Everyday
require('dotenv').config();
const mongoose = require('mongoose');
const { setupFinalTemplates } = require('./setupFinalTemplates');
const { addEverydayTemplates } = require('./addEverydayTemplates');

const runCompleteSetup = async () => {
  try {
    console.log('🚀 COMPLETE TEMPLATE SETUP\n');

    // Connect to MongoDB
    const connectionOptions = [
      "mongodb+srv://triveni:M9fLy2oWyu8ewljr@cluster0.it4e3sl.mongodb.net/legal-management-system?retryWrites=true&w=majority",
      "mongodb://localhost:27017/legal-management-system",
      "mongodb://127.0.0.1:27017/legal-management-system"
    ];

    let connected = false;
    for (const connectionString of connectionOptions) {
      try {
        console.log(`📡 Connecting to: ${connectionString.includes('cluster0') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
        await mongoose.connect(connectionString, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        });
        console.log('✅ Connected to MongoDB\n');
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }

    if (!connected) {
      console.error('❌ Could not connect to MongoDB');
      process.exit(1);
    }

    // Run both setups
    console.log('STEP 1: Setting up court/legal templates...\n');
    await setupFinalTemplates();
    
    console.log('\n\nSTEP 2: Adding everyday templates...\n');
    await addEverydayTemplates();

    // Final summary
    const DocumentTemplate = require('../Model/DocumentTemplate');
    const clientCount = await DocumentTemplate.countDocuments({ intendedFor: 'client', isActive: true });
    const lawyerCount = await DocumentTemplate.countDocuments({ intendedFor: 'lawyer', isActive: true });
    const bothCount = await DocumentTemplate.countDocuments({ intendedFor: 'both', isActive: true });
    const total = clientCount + lawyerCount + bothCount;

    console.log('\n\n' + '='.repeat(60));
    console.log('🎊 COMPLETE SETUP FINISHED!');
    console.log('='.repeat(60));
    console.log(`📊 CLIENT templates: ${clientCount}`);
    console.log(`📊 LAWYER templates: ${lawyerCount}`);
    console.log(`📊 BOTH templates: ${bothCount}`);
    console.log(`📊 TOTAL TEMPLATES: ${total}`);
    console.log('\n✨ All templates FREE');
    console.log('✨ Proper legal PDF formatting');
    console.log('✨ Government/court accepted formats');
    console.log('✨ Useful for everyday Sri Lankan life!');

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
};

runCompleteSetup();

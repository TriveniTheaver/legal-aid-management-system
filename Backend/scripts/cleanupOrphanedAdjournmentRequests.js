const mongoose = require('mongoose');
const AdjournmentRequest = require('../Model/AdjournmentRequest');
const CaseModel = require('../Model/CaseModel');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://legalaid:legalaid123@cluster0.8qgqj.mongodb.net/legalaid?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const cleanupOrphanedAdjournmentRequests = async () => {
  try {
    console.log('🔍 Starting cleanup of orphaned adjournment requests...');
    
    // Find all adjournment requests
    const allRequests = await AdjournmentRequest.find({});
    console.log(`📋 Found ${allRequests.length} total adjournment requests`);
    
    let orphanedCount = 0;
    let validCount = 0;
    
    for (const request of allRequests) {
      // Check if the case exists
      const caseExists = await CaseModel.findById(request.case);
      
      if (!caseExists) {
        console.log(`❌ Orphaned request found: ${request._id} - Case ${request.case} not found`);
        orphanedCount++;
        
        // Optionally delete the orphaned request
        // await AdjournmentRequest.findByIdAndDelete(request._id);
        // console.log(`🗑️ Deleted orphaned request: ${request._id}`);
      } else {
        validCount++;
        console.log(`✅ Valid request: ${request._id} - Case ${request.case} exists`);
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Total requests: ${allRequests.length}`);
    console.log(`   Valid requests: ${validCount}`);
    console.log(`   Orphaned requests: ${orphanedCount}`);
    
    if (orphanedCount > 0) {
      console.log(`\n⚠️ Found ${orphanedCount} orphaned requests.`);
      console.log(`   To delete them, uncomment the deletion code in this script.`);
    } else {
      console.log(`\n✅ No orphaned requests found!`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

const main = async () => {
  await connectDB();
  await cleanupOrphanedAdjournmentRequests();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

main().catch(console.error);

const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://triveni:M9fLy2oWyu8ewljr@cluster0.it4e3sl.mongodb.net/legal-management-system?retryWrites=true&w=majority');
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testAutoAssignment = async () => {
  try {
    console.log('🔍 Testing auto-assignment...');
    
    // Find a case without a lawyer assigned
    const CaseModel = require('../Model/CaseModel');
    const caseWithoutLawyer = await CaseModel.findOne({ 
      currentLawyer: { $exists: false },
      status: 'verified'
    });
    
    if (!caseWithoutLawyer) {
      console.log('❌ No cases without lawyers found for testing');
      return;
    }
    
    console.log(`📋 Testing with case: ${caseWithoutLawyer.caseNumber}`);
    
    // Test the auto-assignment endpoint
    try {
      const response = await axios.post('http://localhost:5000/api/lawyer-assignment/auto-assign', {
        caseId: caseWithoutLawyer._id
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Auto-assignment successful:', response.data);
    } catch (error) {
      console.log('❌ Auto-assignment failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

const main = async () => {
  await connectDB();
  await testAutoAssignment();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

main().catch(console.error);

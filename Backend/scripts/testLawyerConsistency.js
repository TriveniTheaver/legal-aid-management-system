const mongoose = require('mongoose');
const CaseModel = require('../Model/CaseModel');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const VerifiedLawyer = require('../Model/VerifiedLawyer');

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

const testLawyerConsistency = async () => {
  try {
    console.log('🔍 Testing lawyer assignment consistency...');
    
    // Find a case with currentLawyer assigned
    const caseWithLawyer = await CaseModel.findOne({ 
      currentLawyer: { $exists: true, $ne: null } 
    }).populate('currentLawyer', 'fullName email lawyerType');
    
    if (!caseWithLawyer) {
      console.log('❌ No cases with assigned lawyers found');
      return;
    }
    
    console.log(`📋 Testing case: ${caseWithLawyer.caseNumber}`);
    console.log(`   Status: ${caseWithLawyer.status}`);
    console.log(`   Current Lawyer: ${caseWithLawyer.currentLawyer?.fullName} (${caseWithLawyer.currentLawyer?._id})`);
    
    // Check corresponding assignment
    const assignment = await CaseLawyerAssignment.findOne({
      case: caseWithLawyer._id
    }).populate('lawyer', 'fullName email lawyerType');
    
    if (assignment) {
      console.log(`   Assignment Lawyer: ${assignment.lawyer?.fullName} (${assignment.lawyer?._id})`);
      console.log(`   Assignment Status: ${assignment.status}`);
      
      // Check if they match
      const caseLawyerId = caseWithLawyer.currentLawyer?._id?.toString();
      const assignmentLawyerId = assignment.lawyer?._id?.toString();
      
      if (caseLawyerId === assignmentLawyerId) {
        console.log('✅ Lawyer assignment is consistent between Case and Assignment');
      } else {
        console.log('❌ Lawyer assignment is INCONSISTENT!');
        console.log(`   Case lawyer ID: ${caseLawyerId}`);
        console.log(`   Assignment lawyer ID: ${assignmentLawyerId}`);
      }
    } else {
      console.log('⚠️ No assignment found for this case');
    }
    
    // Test date parsing
    console.log('\n📅 Testing date parsing...');
    const testDate = '2025-01-15';
    const oldWay = new Date(testDate);
    const newWay = new Date(testDate + 'T00:00:00');
    
    console.log(`   Input date: ${testDate}`);
    console.log(`   Old way: ${oldWay.toLocaleDateString('en-LK')} (${oldWay.toISOString()})`);
    console.log(`   New way: ${newWay.toLocaleDateString('en-LK')} (${newWay.toISOString()})`);
    
    if (oldWay.getDate() === newWay.getDate()) {
      console.log('✅ Date parsing is consistent');
    } else {
      console.log('❌ Date parsing shows timezone offset issue');
    }
    
    console.log('\n✅ Lawyer consistency test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

const main = async () => {
  await connectDB();
  await testLawyerConsistency();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

main().catch(console.error);

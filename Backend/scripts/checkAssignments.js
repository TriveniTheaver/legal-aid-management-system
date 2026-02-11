const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CaseModel = require('../Model/CaseModel');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');

// Load environment variables
dotenv.config();

const checkAssignments = async () => {
  try {
    console.log('🔍 Checking assignments and case IDs...');
    
    // Connect to MongoDB
    const connectionOptions = [
      "mongodb+srv://triveni:M9fLy2oWyu8ewljr@cluster0.it4e3sl.mongodb.net/legal-management-system?retryWrites=true&w=majority",
      "mongodb://localhost:27017/legal-management-system",
      "mongodb://127.0.0.1:27017/legal-management-system"
    ];

    let connected = false;
    for (const connectionString of connectionOptions) {
      try {
        console.log(`Attempting to connect to: ${connectionString.includes('cluster0') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
        await mongoose.connect(connectionString, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Failed to connect: ${error.message}`);
      }
    }
    
    if (!connected) {
      throw new Error('Could not connect to any MongoDB instance');
    }
    
    // Get all assignments
    const assignments = await CaseLawyerAssignment.find({}).populate('case');
    console.log(`\n📊 Found ${assignments.length} assignments:`);
    
    assignments.forEach((assignment, index) => {
      console.log(`\nAssignment ${index + 1}:`);
      console.log(`  ID: ${assignment._id}`);
      console.log(`  Case ID: ${assignment.case}`);
      console.log(`  Case populated: ${assignment.case ? 'Yes' : 'No'}`);
      if (assignment.case) {
        console.log(`  Case Number: ${assignment.case.caseNumber}`);
        console.log(`  Case Status: ${assignment.case.status}`);
      }
      console.log(`  Status: ${assignment.status}`);
    });
    
    // Get all cases
    const cases = await CaseModel.find({}).select('_id caseNumber status');
    console.log(`\n📊 Found ${cases.length} cases:`);
    
    cases.forEach((caseData, index) => {
      console.log(`\nCase ${index + 1}:`);
      console.log(`  ID: ${caseData._id}`);
      console.log(`  Number: ${caseData.caseNumber}`);
      console.log(`  Status: ${caseData.status}`);
    });
    
    // Check for mismatches
    console.log(`\n🔍 Checking for mismatches...`);
    const assignmentCaseIds = assignments.map(a => a.case?.toString()).filter(Boolean);
    const actualCaseIds = cases.map(c => c._id.toString());
    
    console.log(`Assignment case IDs: ${assignmentCaseIds.join(', ')}`);
    console.log(`Actual case IDs: ${actualCaseIds.join(', ')}`);
    
    const mismatches = assignmentCaseIds.filter(id => !actualCaseIds.includes(id));
    if (mismatches.length > 0) {
      console.log(`❌ Found ${mismatches.length} mismatched case IDs: ${mismatches.join(', ')}`);
    } else {
      console.log(`✅ All assignment case IDs match actual cases`);
    }
    
  } catch (error) {
    console.error('❌ Error checking assignments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the check
checkAssignments();

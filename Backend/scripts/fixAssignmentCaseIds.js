const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CaseModel = require('../Model/CaseModel');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');

// Load environment variables
dotenv.config();

const fixAssignmentCaseIds = async () => {
  try {
    console.log('🔧 Starting assignment-case ID fix...');
    
    // Connect to MongoDB using the same connection logic as app.js
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
    console.log(`📊 Found ${assignments.length} assignments`);
    
    let fixedCount = 0;
    let deletedCount = 0;
    
    for (const assignment of assignments) {
      console.log(`\n🔍 Processing assignment ${assignment._id}`);
      console.log(`  Case ID in assignment: ${assignment.case}`);
      console.log(`  Case populated: ${assignment.case ? 'Yes' : 'No'}`);
      
      if (!assignment.case) {
        console.log(`  ❌ Assignment has no case - deleting orphaned assignment`);
        await CaseLawyerAssignment.findByIdAndDelete(assignment._id);
        deletedCount++;
        continue;
      }
      
      // Check if the case actually exists
      const actualCase = await CaseModel.findById(assignment.case);
      if (!actualCase) {
        console.log(`  ❌ Case ${assignment.case} does not exist - deleting orphaned assignment`);
        await CaseLawyerAssignment.findByIdAndDelete(assignment._id);
        deletedCount++;
        continue;
      }
      
      console.log(`  ✅ Assignment is valid - case ${actualCase.caseNumber} exists`);
      fixedCount++;
    }
    
    console.log(`\n📈 Fix Summary:`);
    console.log(`  Valid assignments: ${fixedCount}`);
    console.log(`  Deleted orphaned assignments: ${deletedCount}`);
    
    // Now let's create proper assignments for existing cases
    console.log(`\n🔧 Creating assignments for existing cases...`);
    
    const cases = await CaseModel.find({ 
      status: { $in: ['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'] }
    }).populate('currentLawyer');
    
    let createdCount = 0;
    
    for (const caseData of cases) {
      if (!caseData.currentLawyer) {
        console.log(`  ⚠️ Case ${caseData.caseNumber} has no currentLawyer - skipping`);
        continue;
      }
      
      // Check if assignment already exists
      const existingAssignment = await CaseLawyerAssignment.findOne({
        case: caseData._id,
        lawyer: caseData.currentLawyer._id
      });
      
      if (existingAssignment) {
        console.log(`  ✅ Assignment already exists for case ${caseData.caseNumber}`);
        continue;
      }
      
      // Create new assignment
      const newAssignment = await CaseLawyerAssignment.create({
        case: caseData._id,
        lawyer: caseData.currentLawyer._id,
        client: caseData.user,
        assignmentType: 'auto',
        status: 'active',
        assignedAt: new Date(),
        acceptedAt: new Date(),
        activatedAt: new Date(),
        caseStatusWhenAssigned: caseData.status,
        caseStatusWhenAccepted: caseData.status,
        caseStatusWhenActivated: caseData.status
      });
      
      console.log(`  ✅ Created assignment for case ${caseData.caseNumber}`);
      createdCount++;
    }
    
    console.log(`\n📈 Final Summary:`);
    console.log(`  Valid assignments: ${fixedCount}`);
    console.log(`  Deleted orphaned: ${deletedCount}`);
    console.log(`  Created new assignments: ${createdCount}`);
    
    console.log('\n✅ Assignment-case ID fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing assignment-case IDs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixAssignmentCaseIds();

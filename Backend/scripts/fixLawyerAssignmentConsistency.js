const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CaseModel = require('../Model/CaseModel');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');

// Load environment variables
dotenv.config();

const fixLawyerAssignmentConsistency = async () => {
  try {
    console.log('🔧 Starting comprehensive lawyer assignment consistency fix...');
    
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
    
    // Step 1: Get all cases with currentLawyer
    console.log('\n📊 Step 1: Analyzing cases with currentLawyer...');
    const casesWithLawyer = await CaseModel.find({ 
      currentLawyer: { $exists: true, $ne: null } 
    }).populate('currentLawyer', 'fullName email');
    
    console.log(`Found ${casesWithLawyer.length} cases with currentLawyer`);
    
    let fixedCases = 0;
    let createdAssignments = 0;
    let updatedAssignments = 0;
    
    for (const caseData of casesWithLawyer) {
      console.log(`\n🔍 Processing case ${caseData.caseNumber}:`);
      console.log(`  Case ID: ${caseData._id}`);
      console.log(`  Current Lawyer: ${caseData.currentLawyer?._id} (${caseData.currentLawyer?.fullName})`);
      console.log(`  Status: ${caseData.status}`);
      
      // Step 2: Find or create assignment for this case
      let assignment = await CaseLawyerAssignment.findOne({
        case: caseData._id,
        lawyer: caseData.currentLawyer._id
      });
      
      if (!assignment) {
        console.log(`  ⚠️ No assignment found - creating new assignment`);
        
        // Create new assignment
        assignment = await CaseLawyerAssignment.create({
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
        
        createdAssignments++;
        console.log(`  ✅ Created assignment ${assignment._id}`);
      } else {
        console.log(`  ✅ Found existing assignment ${assignment._id}`);
        console.log(`  Assignment status: ${assignment.status}`);
        
        // Update assignment to match case status
        if (assignment.status !== 'active' && ['filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(caseData.status)) {
          assignment.status = 'active';
          assignment.activatedAt = new Date();
          assignment.caseStatusWhenActivated = caseData.status;
          await assignment.save();
          updatedAssignments++;
          console.log(`  ✅ Updated assignment status to active`);
        }
      }
      
      // Step 3: Ensure case currentLawyer matches assignment lawyer
      if (caseData.currentLawyer._id.toString() !== assignment.lawyer.toString()) {
        console.log(`  ⚠️ Mismatch detected - fixing case currentLawyer`);
        caseData.currentLawyer = assignment.lawyer;
        await caseData.save();
        fixedCases++;
        console.log(`  ✅ Fixed case currentLawyer`);
      }
      
      console.log(`  ✅ Case ${caseData.caseNumber} is now consistent`);
    }
    
    // Step 4: Handle cases without currentLawyer but with assignments
    console.log('\n📊 Step 4: Checking cases without currentLawyer...');
    const casesWithoutLawyer = await CaseModel.find({ 
      currentLawyer: { $exists: false } 
    });
    
    let restoredLawyers = 0;
    
    for (const caseData of casesWithoutLawyer) {
      const assignment = await CaseLawyerAssignment.findOne({
        case: caseData._id,
        status: { $in: ['accepted', 'active', 'completed'] }
      }).populate('lawyer');
      
      if (assignment && assignment.lawyer) {
        console.log(`  🔧 Restoring lawyer for case ${caseData.caseNumber}`);
        caseData.currentLawyer = assignment.lawyer._id;
        await caseData.save();
        restoredLawyers++;
        console.log(`  ✅ Restored lawyer ${assignment.lawyer.fullName}`);
      }
    }
    
    // Step 5: Clean up orphaned assignments
    console.log('\n📊 Step 5: Cleaning up orphaned assignments...');
    const allAssignments = await CaseLawyerAssignment.find({}).populate('case');
    let deletedOrphans = 0;
    
    for (const assignment of allAssignments) {
      if (!assignment.case) {
        console.log(`  🗑️ Deleting orphaned assignment ${assignment._id}`);
        await CaseLawyerAssignment.findByIdAndDelete(assignment._id);
        deletedOrphans++;
      }
    }
    
    // Final summary
    console.log('\n📈 COMPREHENSIVE FIX SUMMARY:');
    console.log(`  Cases processed: ${casesWithLawyer.length}`);
    console.log(`  Cases fixed: ${fixedCases}`);
    console.log(`  Assignments created: ${createdAssignments}`);
    console.log(`  Assignments updated: ${updatedAssignments}`);
    console.log(`  Lawyers restored: ${restoredLawyers}`);
    console.log(`  Orphaned assignments deleted: ${deletedOrphans}`);
    
    console.log('\n✅ Lawyer assignment consistency fix completed!');
    console.log('🎯 All cases now have consistent lawyer assignments from creation to closing.');
    
  } catch (error) {
    console.error('❌ Error fixing lawyer assignment consistency:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixLawyerAssignmentConsistency();

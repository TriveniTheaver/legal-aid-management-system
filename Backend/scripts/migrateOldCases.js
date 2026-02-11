const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CaseModel = require('../Model/CaseModel');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');

/**
 * Comprehensive Data Migration Script
 * Fixes all old cases and creates proper assignments
 */

async function migrateOldCases() {
  try {
    console.log('🚀 Starting comprehensive case migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get all cases
    const allCases = await CaseModel.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${allCases.length} total cases to migrate`);
    
    let migratedCases = 0;
    let createdAssignments = 0;
    let fixedCurrentLawyer = 0;
    
    for (const caseData of allCases) {
      console.log(`\n🔍 Processing case: ${caseData.caseNumber} (Status: ${caseData.status})`);
      
      // Check if case already has a CaseLawyerAssignment
      const existingAssignment = await CaseLawyerAssignment.findOne({
        case: caseData._id
      });
      
      if (existingAssignment) {
        console.log(`✅ Case ${caseData.caseNumber} already has assignment, skipping...`);
        continue;
      }
      
      // Check if case has currentLawyer
      if (caseData.currentLawyer) {
        console.log(`🔧 Case ${caseData.caseNumber} has currentLawyer, creating assignment...`);
        
        // Create assignment for existing lawyer
        const assignment = new CaseLawyerAssignment({
          case: caseData._id,
          lawyer: caseData.currentLawyer,
          client: caseData.user,
          assignmentType: 'migration',
          status: getAssignmentStatusFromCaseStatus(caseData.status),
          assignedAt: caseData.createdAt,
          acceptedAt: caseData.status === 'lawyer_assigned' ? caseData.createdAt : null,
          activatedAt: ['filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(caseData.status) ? caseData.updatedAt : null,
          completedAt: caseData.status === 'completed' ? caseData.updatedAt : null,
          caseStatusWhenAssigned: caseData.status,
          caseStatusWhenAccepted: caseData.status === 'lawyer_assigned' ? caseData.status : null,
          caseStatusWhenActivated: ['filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(caseData.status) ? caseData.status : null
        });
        
        await assignment.save();
        createdAssignments++;
        console.log(`✅ Created assignment for case ${caseData.caseNumber}`);
        
      } else if (['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(caseData.status)) {
        console.log(`⚠️ Case ${caseData.caseNumber} has status ${caseData.status} but no currentLawyer!`);
        
        // Try to find a lawyer to assign
        const availableLawyer = await VerifiedLawyer.findOne({
          availability: true,
          isActive: true
        }).sort({ ratings: -1 });
        
        if (availableLawyer) {
          console.log(`🔧 Assigning lawyer ${availableLawyer.fullName} to case ${caseData.caseNumber}`);
          
          // Update case with lawyer
          await CaseModel.findByIdAndUpdate(caseData._id, {
            currentLawyer: availableLawyer._id
          });
          fixedCurrentLawyer++;
          
          // Create assignment
          const assignment = new CaseLawyerAssignment({
            case: caseData._id,
            lawyer: availableLawyer._id,
            client: caseData.user,
            assignmentType: 'migration',
            status: getAssignmentStatusFromCaseStatus(caseData.status),
            assignedAt: caseData.createdAt,
            acceptedAt: caseData.status === 'lawyer_assigned' ? caseData.createdAt : null,
            activatedAt: ['filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(caseData.status) ? caseData.updatedAt : null,
            completedAt: caseData.status === 'completed' ? caseData.updatedAt : null,
            caseStatusWhenAssigned: caseData.status,
            caseStatusWhenAccepted: caseData.status === 'lawyer_assigned' ? caseData.status : null,
            caseStatusWhenActivated: ['filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'].includes(caseData.status) ? caseData.status : null
          });
          
          await assignment.save();
          createdAssignments++;
          console.log(`✅ Created assignment and fixed currentLawyer for case ${caseData.caseNumber}`);
        } else {
          console.log(`❌ No available lawyer found for case ${caseData.caseNumber}`);
        }
      }
      
      migratedCases++;
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`📊 Statistics:`);
    console.log(`   - Cases processed: ${migratedCases}`);
    console.log(`   - Assignments created: ${createdAssignments}`);
    console.log(`   - currentLawyer fields fixed: ${fixedCurrentLawyer}`);
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const casesWithAssignments = await CaseModel.aggregate([
      {
        $lookup: {
          from: 'caselawyerassignments',
          localField: '_id',
          foreignField: 'case',
          as: 'assignments'
        }
      },
      {
        $match: {
          'assignments.0': { $exists: true }
        }
      },
      {
        $count: 'total'
      }
    ]);
    
    console.log(`✅ Cases with assignments: ${casesWithAssignments[0]?.total || 0}`);
    
    // Check for cases that still need lawyers
    const casesNeedingLawyers = await CaseModel.find({
      status: { $in: ['lawyer_assigned', 'filing_requested', 'under_review', 'approved', 'filed', 'scheduling_requested', 'hearing_scheduled'] },
      currentLawyer: { $exists: false }
    });
    
    console.log(`⚠️ Cases still needing lawyers: ${casesNeedingLawyers.length}`);
    if (casesNeedingLawyers.length > 0) {
      console.log('Cases needing lawyers:');
      casesNeedingLawyers.forEach(c => console.log(`  - ${c.caseNumber} (${c.status})`));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

function getAssignmentStatusFromCaseStatus(caseStatus) {
  switch (caseStatus) {
    case 'pending':
    case 'verified':
    case 'lawyer_requested':
      return 'pending';
    case 'lawyer_assigned':
      return 'accepted';
    case 'filing_requested':
    case 'under_review':
    case 'approved':
    case 'filed':
    case 'scheduling_requested':
    case 'hearing_scheduled':
      return 'active';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'withdrawn';
    default:
      return 'pending';
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateOldCases()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateOldCases;

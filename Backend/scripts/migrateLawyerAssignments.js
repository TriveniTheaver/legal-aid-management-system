const mongoose = require('mongoose');
const LawyerAssignment = require('../Model/LawyerAssignment');
const CaseLawyerAssignment = require('../Model/CaseLawyerAssignment');
const Case = require('../Model/CaseModel');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');

// Migration script to move old lawyer assignments to new system
const migrateLawyerAssignments = async () => {
  try {
    console.log('🔄 Starting lawyer assignment migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://triveni:M9fLy2oWyu8ewljr@cluster0.it4e3sl.mongodb.net/legal-management-system?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Get all existing assignments
    const oldAssignments = await LawyerAssignment.find({});
    console.log(`📊 Found ${oldAssignments.length} existing assignments to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const oldAssignment of oldAssignments) {
      try {
        // Get case details
        const caseData = await Case.findById(oldAssignment.case);
        if (!caseData) {
          console.log(`❌ Case not found for assignment ${oldAssignment._id}`);
          errorCount++;
          continue;
        }

        // Get client details
        const client = await VerifiedClient.findById(caseData.user);
        if (!client) {
          console.log(`❌ Client not found for case ${caseData._id}`);
          errorCount++;
          continue;
        }

        // Get lawyer details
        const lawyer = await VerifiedLawyer.findById(oldAssignment.lawyer);
        if (!lawyer) {
          console.log(`❌ Lawyer not found for assignment ${oldAssignment._id}`);
          errorCount++;
          continue;
        }

        // Check if assignment already exists in new system
        const existingAssignment = await CaseLawyerAssignment.findOne({
          case: oldAssignment.case,
          lawyer: oldAssignment.lawyer
        });

        if (existingAssignment) {
          console.log(`⚠️ Assignment already exists for case ${caseData.caseNumber}`);
          continue;
        }

        // Create new assignment
        const newAssignment = new CaseLawyerAssignment({
          case: oldAssignment.case,
          lawyer: oldAssignment.lawyer,
          client: caseData.user,
          assignmentType: oldAssignment.assignedBy === 'system' ? 'auto' : 'manual',
          status: oldAssignment.status === 'accepted' ? 'accepted' : 'pending',
          clientMessage: oldAssignment.clientMessage || '',
          lawyerResponse: oldAssignment.lawyerResponse || '',
          assignedAt: oldAssignment.createdAt,
          acceptedAt: oldAssignment.status === 'accepted' ? oldAssignment.updatedAt : null,
          caseStatusWhenAssigned: caseData.status,
          caseStatusWhenAccepted: oldAssignment.status === 'accepted' ? 'lawyer_assigned' : null,
          statusHistory: [{
            fromStatus: 'initial',
            toStatus: oldAssignment.status === 'accepted' ? 'accepted' : 'pending',
            changedAt: oldAssignment.createdAt
          }]
        });

        await newAssignment.save();

        // Update case if assignment was accepted
        if (oldAssignment.status === 'accepted') {
          await Case.findByIdAndUpdate(oldAssignment.case, {
            status: 'lawyer_assigned',
            currentLawyer: oldAssignment.lawyer
          });
        }

        migratedCount++;
        console.log(`✅ Migrated assignment for case ${caseData.caseNumber} - Lawyer: ${lawyer.fullName}`);

      } catch (error) {
        console.error(`❌ Error migrating assignment ${oldAssignment._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} assignments`);
    console.log(`❌ Errors: ${errorCount} assignments`);
    console.log(`📈 Total processed: ${oldAssignments.length} assignments`);

    // Verify migration
    const newAssignmentCount = await CaseLawyerAssignment.countDocuments();
    console.log(`\n🔍 Verification: ${newAssignmentCount} assignments in new system`);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateLawyerAssignments();
}

module.exports = migrateLawyerAssignments;

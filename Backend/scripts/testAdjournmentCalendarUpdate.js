const mongoose = require('mongoose');
const AdjournmentRequest = require('../Model/AdjournmentRequest');
const ScheduledCase = require('../Model/ScheduledCase');
const CaseModel = require('../Model/CaseModel');
const VerifiedClient = require('../Model/VerifiedClient');
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

const testAdjournmentCalendarUpdate = async () => {
  try {
    console.log('🔍 Testing adjournment calendar update flow...');
    
    // Find a pending adjournment request
    const pendingRequest = await AdjournmentRequest.findOne({ status: 'pending' })
      .populate('case')
      .populate('client');
    
    if (!pendingRequest) {
      console.log('❌ No pending adjournment requests found for testing');
      return;
    }
    
    console.log(`📋 Found pending request: ${pendingRequest._id}`);
    console.log(`   Case: ${pendingRequest.case?.caseNumber || 'Unknown'}`);
    console.log(`   Original date: ${pendingRequest.originalHearingDate?.toLocaleDateString('en-LK')}`);
    console.log(`   Preferred date: ${pendingRequest.preferredDate?.toLocaleDateString('en-LK')}`);
    
    // Check current ScheduledCase
    const currentScheduledCase = await ScheduledCase.findOne({ case: pendingRequest.case._id });
    if (currentScheduledCase) {
      console.log(`📅 Current ScheduledCase:`);
      console.log(`   Date: ${currentScheduledCase.hearingDate?.toLocaleDateString('en-LK')}`);
      console.log(`   Time: ${currentScheduledCase.hearingTime?.startTime}-${currentScheduledCase.hearingTime?.endTime}`);
      console.log(`   Status: ${currentScheduledCase.status}`);
    } else {
      console.log('❌ No ScheduledCase found for this case');
    }
    
    // Check current Case record
    const currentCase = await CaseModel.findById(pendingRequest.case._id);
    if (currentCase) {
      console.log(`📋 Current Case record:`);
      console.log(`   Date: ${currentCase.hearingDate?.toLocaleDateString('en-LK')}`);
      console.log(`   Time: ${currentCase.hearingTime?.startTime}-${currentCase.hearingTime?.endTime}`);
      console.log(`   Status: ${currentCase.status}`);
    }
    
    // Simulate accepting the adjournment request
    console.log('\n🔄 Simulating adjournment acceptance...');
    
    const newHearingDate = pendingRequest.preferredDate;
    const newHearingTime = pendingRequest.preferredTime || {
      startTime: '10:00',
      endTime: '11:00'
    };
    
    // Update the adjournment request
    pendingRequest.status = 'accepted';
    pendingRequest.newHearingDate = newHearingDate;
    pendingRequest.newHearingTime = newHearingTime;
    pendingRequest.schedulerNotes = 'Test adjournment acceptance';
    pendingRequest.reviewedAt = new Date();
    await pendingRequest.save();
    
    // Update the case
    if (currentCase) {
      currentCase.hearingDate = newHearingDate;
      currentCase.hearingTime = newHearingTime;
      currentCase.status = 'hearing_scheduled';
      await currentCase.save();
      console.log('✅ Case record updated');
    }
    
    // Update the ScheduledCase
    if (currentScheduledCase) {
      currentScheduledCase.hearingDate = newHearingDate;
      currentScheduledCase.hearingTime = newHearingTime;
      currentScheduledCase.status = 'scheduled';
      currentScheduledCase.adjournmentNotes = `Rescheduled from ${pendingRequest.originalHearingDate?.toLocaleDateString('en-LK')} - Test adjournment acceptance`;
      await currentScheduledCase.save();
      console.log('✅ ScheduledCase record updated');
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    
    const updatedScheduledCase = await ScheduledCase.findOne({ case: pendingRequest.case._id });
    const updatedCase = await CaseModel.findById(pendingRequest.case._id);
    
    console.log(`📅 Updated ScheduledCase:`);
    console.log(`   Date: ${updatedScheduledCase?.hearingDate?.toLocaleDateString('en-LK')}`);
    console.log(`   Time: ${updatedScheduledCase?.hearingTime?.startTime}-${updatedScheduledCase?.hearingTime?.endTime}`);
    console.log(`   Status: ${updatedScheduledCase?.status}`);
    console.log(`   Notes: ${updatedScheduledCase?.adjournmentNotes}`);
    
    console.log(`📋 Updated Case record:`);
    console.log(`   Date: ${updatedCase?.hearingDate?.toLocaleDateString('en-LK')}`);
    console.log(`   Time: ${updatedCase?.hearingTime?.startTime}-${updatedCase?.hearingTime?.endTime}`);
    console.log(`   Status: ${updatedCase?.status}`);
    
    // Test calendar data query
    console.log('\n📅 Testing calendar data query...');
    const year = newHearingDate.getFullYear();
    const month = newHearingDate.getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const calendarCases = await ScheduledCase.find({
      hearingDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('case', 'caseNumber caseType');
    
    console.log(`📊 Found ${calendarCases.length} cases in calendar for ${year}-${month}`);
    
    const testCase = calendarCases.find(sc => sc.case._id.toString() === pendingRequest.case._id.toString());
    if (testCase) {
      console.log(`✅ Test case found in calendar data:`);
      console.log(`   Date: ${testCase.hearingDate?.toLocaleDateString('en-LK')}`);
      console.log(`   Time: ${testCase.hearingTime?.startTime}-${testCase.hearingTime?.endTime}`);
      console.log(`   Case: ${testCase.caseNumber}`);
    } else {
      console.log('❌ Test case not found in calendar data');
    }
    
    console.log('\n✅ Adjournment calendar update test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

const main = async () => {
  await connectDB();
  await testAdjournmentCalendarUpdate();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

main().catch(console.error);

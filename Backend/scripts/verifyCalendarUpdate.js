const mongoose = require('mongoose');
const ScheduledCase = require('../Model/ScheduledCase');
const CaseModel = require('../Model/CaseModel');

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

const verifyCalendarUpdate = async () => {
  try {
    console.log('🔍 Verifying calendar update mechanism...');
    
    // Get all scheduled cases
    const allScheduledCases = await ScheduledCase.find({})
      .populate('case', 'caseNumber caseType')
      .sort({ hearingDate: 1 });
    
    console.log(`📊 Total scheduled cases: ${allScheduledCases.length}`);
    
    if (allScheduledCases.length === 0) {
      console.log('❌ No scheduled cases found');
      return;
    }
    
    // Show sample cases
    console.log('\n📋 Sample scheduled cases:');
    allScheduledCases.slice(0, 3).forEach((sc, index) => {
      console.log(`   ${index + 1}. ${sc.caseNumber} - ${sc.hearingDate?.toLocaleDateString('en-LK')} ${sc.hearingTime?.startTime}-${sc.hearingTime?.endTime}`);
    });
    
    // Test calendar data query for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    console.log(`\n📅 Testing calendar query for ${year}-${month}:`);
    console.log(`   Start: ${startDate.toLocaleDateString('en-LK')}`);
    console.log(`   End: ${endDate.toLocaleDateString('en-LK')}`);
    
    const calendarCases = await ScheduledCase.find({
      hearingDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('case', 'caseNumber caseType')
    .sort({ hearingDate: 1, 'hearingTime.startTime': 1 });
    
    console.log(`📊 Found ${calendarCases.length} cases in current month`);
    
    if (calendarCases.length > 0) {
      console.log('\n📋 Calendar cases:');
      calendarCases.forEach((sc, index) => {
        console.log(`   ${index + 1}. ${sc.caseNumber} - ${sc.hearingDate?.toLocaleDateString('en-LK')} ${sc.hearingTime?.startTime}-${sc.hearingTime?.endTime}`);
      });
    }
    
    // Test adjournment notes
    const casesWithAdjournmentNotes = await ScheduledCase.find({
      adjournmentNotes: { $exists: true, $ne: null }
    });
    
    console.log(`\n🔄 Cases with adjournment notes: ${casesWithAdjournmentNotes.length}`);
    
    if (casesWithAdjournmentNotes.length > 0) {
      console.log('\n📋 Adjournment cases:');
      casesWithAdjournmentNotes.forEach((sc, index) => {
        console.log(`   ${index + 1}. ${sc.caseNumber} - ${sc.hearingDate?.toLocaleDateString('en-LK')}`);
        console.log(`      Notes: ${sc.adjournmentNotes}`);
      });
    }
    
    // Test date grouping (like the calendar does)
    console.log('\n📅 Testing date grouping...');
    const calendarData = {};
    calendarCases.forEach(scheduledCase => {
      const dateKey = scheduledCase.hearingDate.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push({
        id: scheduledCase._id,
        caseNumber: scheduledCase.caseNumber,
        startTime: scheduledCase.hearingTime.startTime,
        endTime: scheduledCase.hearingTime.endTime,
        courtroom: scheduledCase.courtroom
      });
    });
    
    console.log(`📊 Calendar data grouped into ${Object.keys(calendarData).length} dates`);
    
    Object.keys(calendarData).slice(0, 3).forEach(dateKey => {
      const hearings = calendarData[dateKey];
      console.log(`   ${dateKey}: ${hearings.length} hearings`);
      hearings.forEach(hearing => {
        console.log(`     - ${hearing.caseNumber} ${hearing.startTime}-${hearing.endTime}`);
      });
    });
    
    console.log('\n✅ Calendar update mechanism verification completed!');
    console.log('\n📝 Summary:');
    console.log(`   - Total scheduled cases: ${allScheduledCases.length}`);
    console.log(`   - Current month cases: ${calendarCases.length}`);
    console.log(`   - Cases with adjournment notes: ${casesWithAdjournmentNotes.length}`);
    console.log(`   - Calendar data dates: ${Object.keys(calendarData).length}`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
};

const main = async () => {
  await connectDB();
  await verifyCalendarUpdate();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

main().catch(console.error);

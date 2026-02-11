const mongoose = require('mongoose');
const ActivityLog = require('../Model/ActivityLog');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const VerifiedClient = require('../Model/VerifiedClient');
const Staff = require('../Model/Staff');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://triveni:M9fLy2oWyu8ewljr@cluster0.it4e3sl.mongodb.net/legal-management-system?retryWrites=true&w=majority', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.log('❌ MongoDB connection failed, trying localhost...');
    try {
      await mongoose.connect('mongodb://localhost:27017/legal-management-system', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to local MongoDB!');
    } catch (err) {
      console.error('❌ Could not connect to any MongoDB instance:', err);
      process.exit(1);
    }
  }
};

// Generate sample activity logs
const populateActivityLogs = async () => {
  try {
    console.log('🔍 Fetching users...');
    
    // Get some sample users
    const [lawyers, clients, staff] = await Promise.all([
      VerifiedLawyer.find().limit(3).lean(),
      VerifiedClient.find().limit(3).lean(),
      Staff.find().limit(2).lean()
    ]);
    
    console.log(`Found ${lawyers.length} lawyers, ${clients.length} clients, ${staff.length} staff`);
    
    // Clear existing logs
    console.log('🗑️ Clearing existing activity logs...');
    await ActivityLog.deleteMany({});
    
    const sampleLogs = [];
    const now = new Date();
    
    // Helper function to create log
    const createLog = (user, userModel, userType, action, category, description, daysAgo = 0, status = 'success') => {
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));
      
      return {
        userId: user._id,
        userModel,
        userName: user.fullName || user.name || user.email,
        userType,
        action,
        category,
        description,
        timestamp,
        status,
        metadata: {
          sample: true
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
    };
    
    // Lawyer activities
    lawyers.forEach((lawyer, index) => {
      sampleLogs.push(
        createLog(lawyer, 'VerifiedLawyer', 'verified_lawyer', 'user_login', 'user', `${lawyer.fullName} logged into the system`, index),
        createLog(lawyer, 'VerifiedLawyer', 'verified_lawyer', 'case_updated', 'case', `${lawyer.fullName} updated case details`, index + 1),
        createLog(lawyer, 'VerifiedLawyer', 'verified_lawyer', 'document_uploaded', 'document', `${lawyer.fullName} uploaded a legal document`, index + 2),
        createLog(lawyer, 'VerifiedLawyer', 'verified_lawyer', 'profile_updated', 'user', `${lawyer.fullName} updated their profile information`, index + 3)
      );
    });
    
    // Client activities
    clients.forEach((client, index) => {
      sampleLogs.push(
        createLog(client, 'VerifiedClient', 'verified_client', 'user_login', 'user', `${client.fullName} logged into the system`, index),
        createLog(client, 'VerifiedClient', 'verified_client', 'case_created', 'case', `${client.fullName} filed a new case`, index + 1),
        createLog(client, 'VerifiedClient', 'verified_client', 'payment_made', 'payment', `${client.fullName} completed payment for legal services`, index + 2),
        createLog(client, 'VerifiedClient', 'verified_client', 'document_downloaded', 'document', `${client.fullName} downloaded case documents`, index + 3),
        createLog(client, 'VerifiedClient', 'verified_client', 'feedback_submitted', 'system', `${client.fullName} submitted feedback`, index + 4)
      );
    });
    
    // Staff activities
    staff.forEach((staffMember, index) => {
      if (staffMember.role === 'admin') {
        sampleLogs.push(
          createLog(staffMember, 'Staff', 'admin', 'user_login', 'user', `Admin ${staffMember.name} logged into the system`, index),
          createLog(staffMember, 'Staff', 'admin', 'verification_approved', 'verification', `Admin ${staffMember.name} approved a lawyer verification request`, index + 1),
          createLog(staffMember, 'Staff', 'admin', 'verification_rejected', 'verification', `Admin ${staffMember.name} rejected a client verification request`, index + 2, 'success'),
          createLog(staffMember, 'Staff', 'admin', 'staff_created', 'staff', `Admin ${staffMember.name} created a new staff member`, index + 3),
          createLog(staffMember, 'Staff', 'admin', 'email_sent', 'system', `Admin ${staffMember.name} sent system email report`, index + 4),
          createLog(staffMember, 'Staff', 'admin', 'announcement_created', 'system', `Admin ${staffMember.name} created a system announcement`, index + 5)
        );
      } else if (staffMember.role === 'court_scheduler') {
        sampleLogs.push(
          createLog(staffMember, 'Staff', 'court_scheduler', 'user_login', 'user', `Court Scheduler ${staffMember.name} logged in`, index),
          createLog(staffMember, 'Staff', 'court_scheduler', 'court_scheduled', 'court', `Court Scheduler ${staffMember.name} scheduled a court hearing`, index + 1),
          createLog(staffMember, 'Staff', 'court_scheduler', 'adjournment_approved', 'court', `Court Scheduler ${staffMember.name} approved an adjournment request`, index + 2)
        );
      }
    });
    
    // Add some failed attempts
    if (lawyers.length > 0) {
      sampleLogs.push(
        createLog(lawyers[0], 'VerifiedLawyer', 'verified_lawyer', 'document_uploaded', 'document', `${lawyers[0].fullName} attempted to upload document - file size exceeded`, 5, 'failed'),
        createLog(lawyers[0], 'VerifiedLawyer', 'verified_lawyer', 'payment_made', 'payment', `${lawyers[0].fullName} payment transaction failed - insufficient funds`, 7, 'failed')
      );
    }
    
    // Insert all logs
    console.log(`📝 Creating ${sampleLogs.length} activity logs...`);
    const createdLogs = await ActivityLog.insertMany(sampleLogs);
    
    console.log(`✅ Successfully created ${createdLogs.length} activity logs!`);
    console.log('\n📊 Activity Log Summary:');
    console.log(`- Total Logs: ${createdLogs.length}`);
    console.log(`- User Activities: ${sampleLogs.filter(l => l.category === 'user').length}`);
    console.log(`- Case Activities: ${sampleLogs.filter(l => l.category === 'case').length}`);
    console.log(`- Document Activities: ${sampleLogs.filter(l => l.category === 'document').length}`);
    console.log(`- Payment Activities: ${sampleLogs.filter(l => l.category === 'payment').length}`);
    console.log(`- System Activities: ${sampleLogs.filter(l => l.category === 'system').length}`);
    console.log(`- Verification Activities: ${sampleLogs.filter(l => l.category === 'verification').length}`);
    console.log(`- Court Activities: ${sampleLogs.filter(l => l.category === 'court').length}`);
    console.log(`- Failed Activities: ${sampleLogs.filter(l => l.status === 'failed').length}`);
    
    // Get and display stats
    const stats = await ActivityLog.getActivityStats();
    console.log('\n📈 Activity Statistics:');
    console.log(`- Total Activities: ${stats.total}`);
    console.log(`- Today: ${stats.today}`);
    console.log(`- This Week: ${stats.thisWeek}`);
    console.log(`- This Month: ${stats.thisMonth}`);
    
  } catch (error) {
    console.error('❌ Error populating activity logs:', error);
    throw error;
  }
};

// Run the script
const run = async () => {
  try {
    await connectDB();
    await populateActivityLogs();
    console.log('\n✅ Activity log population completed successfully!');
    console.log('You can now view the logs in the Admin Dashboard -> System Activity Log');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

run();


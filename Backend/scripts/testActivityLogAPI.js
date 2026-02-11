const axios = require('axios');

// Test the Activity Log API endpoints
const testAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Activity Log API Endpoints...\n');
  
  // Note: These tests assume you have a valid admin token
  // You'll need to login as admin first and get a token
  
  const token = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin token
  
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Test 1: Get activity logs
    console.log('📋 Test 1: GET /api/activity-log/logs');
    try {
      const response = await axios.get(`${baseURL}/api/activity-log/logs`, config);
      console.log('✅ Success:', response.data.success);
      console.log('📊 Total logs:', response.data.data?.pagination?.totalLogs || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');
    
    // Test 2: Get statistics
    console.log('📊 Test 2: GET /api/activity-log/stats');
    try {
      const response = await axios.get(`${baseURL}/api/activity-log/stats`, config);
      console.log('✅ Success:', response.data.success);
      console.log('📈 Stats:', {
        total: response.data.data?.total || 0,
        today: response.data.data?.today || 0,
        thisWeek: response.data.data?.thisWeek || 0
      });
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');
    
    // Test 3: Get recent activities
    console.log('🕐 Test 3: GET /api/activity-log/recent');
    try {
      const response = await axios.get(`${baseURL}/api/activity-log/recent?limit=5`, config);
      console.log('✅ Success:', response.data.success);
      console.log('📝 Recent activities:', response.data.data?.count || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');
    
    // Test 4: Get activities by category
    console.log('📂 Test 4: GET /api/activity-log/category/user');
    try {
      const response = await axios.get(`${baseURL}/api/activity-log/category/user`, config);
      console.log('✅ Success:', response.data.success);
      console.log('👤 User activities:', response.data.data?.count || 0);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');
    
    // Test 5: Log a new activity (without auth requirement for testing)
    console.log('📝 Test 5: POST /api/activity-log/log');
    try {
      const testLog = {
        userId: '507f1f77bcf86cd799439011', // Dummy ID
        userModel: 'Staff',
        userName: 'Test Admin',
        userType: 'admin',
        action: 'other',
        category: 'system',
        description: 'API test log entry',
        status: 'success'
      };
      const response = await axios.post(`${baseURL}/api/activity-log/log`, testLog, config);
      console.log('✅ Success:', response.data.success);
      console.log('🆔 Log ID:', response.data.data?._id);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }
    console.log('');
    
    console.log('✅ API Testing Complete!\n');
    console.log('📝 Note: If you see 401/403 errors, you need to:');
    console.log('   1. Login as admin');
    console.log('   2. Get the JWT token from localStorage');
    console.log('   3. Replace YOUR_ADMIN_TOKEN_HERE in this script');
    console.log('   4. Run the script again');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running on http://localhost:5000\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not running on http://localhost:5000');
    console.log('Please start the backend server first: cd Backend && node app.js');
    return false;
  }
};

const run = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAPI();
  }
};

run();


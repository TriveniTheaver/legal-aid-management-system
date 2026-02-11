const axios = require('axios');

async function testAnnouncementAPI() {
  try {
    console.log('🧪 Testing Announcement API...');
    
    // Test if server is running
    const healthCheck = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running');
    
    // Test announcement routes
    const response = await axios.get('http://localhost:5000/api/announcements/all', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Announcement API response:', response.data);
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication required - this is expected');
    } else if (error.response?.status === 404) {
      console.log('❌ Route not found - check if announcement routes are properly configured');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
    }
  }
}

testAnnouncementAPI();

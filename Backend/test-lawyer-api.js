// Test script to verify lawyer API response format
const axios = require('axios');

async function testLawyerAPI() {
  try {
    console.log('Testing lawyer API endpoints...');
    
    // Test the available lawyers endpoint
    const response = await axios.get('http://localhost:5000/api/lawyer-assignment/available/Civil%20Litigation', {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if lawyers is an array
    if (Array.isArray(response.data.lawyers)) {
      console.log('✅ lawyers is an array with', response.data.lawyers.length, 'items');
    } else {
      console.log('❌ lawyers is not an array:', typeof response.data.lawyers);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testLawyerAPI();

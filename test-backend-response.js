#!/usr/bin/env node

// Simple test script to check backend response structure
import axios from 'axios';

async function testVisualAidEndpoint() {
  const baseURL = 'http://localhost:8000';
  const endpoint = '/api/v1/visual-aids/generate';
  
  const testPayload = {
    topic: "Solar System",
    grade: "5",
    subject: "Science",
    visualType: "infographic",
    style: "modern",
    color_scheme: "blue"
  };

  console.log('🧪 Testing Visual Aid Backend Response');
  console.log('🔗 URL:', baseURL + endpoint);
  console.log('📤 Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await axios.post(baseURL + endpoint, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('\n✅ SUCCESS - Backend Response:');
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers);
    console.log('🔍 Data Structure:', JSON.stringify(response.data, null, 2));
    console.log('🔍 Data Keys:', Object.keys(response.data || {}));
    
  } catch (error) {
    console.log('\n❌ ERROR - Backend Response:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📋 Headers:', error.response.headers);
      console.log('🔍 Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('🔗 No response received from backend');
      console.log('🔍 Request details:', error.request);
    } else {
      console.log('🚨 Request setup error:', error.message);
    }
  }
}

testVisualAidEndpoint();

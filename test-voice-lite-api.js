// Voice Lite API Test Script
// This will help us understand the correct API format

const testVoiceLiteAPI = async () => {
  const testEndpoint = 'http://localhost:8000/api/v1/voice/text-chat';
  
  // Test different payload formats
  const testFormats = [
    // Format 1: Just message
    { message: "Hello" },
    
    // Format 2: Message with user_id
    { 
      message: "Hello",
      user_id: "test_user"
    },
    
    // Format 3: Full format
    {
      message: "Hello",
      user_id: "test_user", 
      session_id: null,
      context: {},
      generate_audio: false
    },
    
    // Format 4: Different field name
    {
      text: "Hello",
      user: "test_user"
    }
  ];
  
  for (let i = 0; i < testFormats.length; i++) {
    console.log(`\n🧪 Testing format ${i + 1}:`, testFormats[i]);
    
    try {
      const response = await fetch(testEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testFormats[i])
      });
      
      console.log(`✅ Format ${i + 1} - Status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Format ${i + 1} - Response:`, data);
        break; // Found working format
      } else {
        const errorData = await response.json();
        console.log(`❌ Format ${i + 1} - Error:`, errorData);
      }
    } catch (error) {
      console.log(`❌ Format ${i + 1} - Exception:`, error);
    }
  }
};

// Run the test
testVoiceLiteAPI();

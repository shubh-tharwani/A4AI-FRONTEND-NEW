#!/usr/bin/env node

// Test script to verify backend generates unique results for different topics
import axios from 'axios';

const testTopics = [
  "Solar System with planets and moons",
  "Human heart anatomy and blood circulation", 
  "Photosynthesis process in plants",
  "Water cycle and weather patterns",
  "Ancient Egyptian pyramids and pharaohs"
];

async function testTopicUniqueness() {
  console.log('🧪 Testing Backend Topic Uniqueness');
  console.log('=' * 50);
  
  const baseURL = 'http://localhost:8000';
  const endpoint = '/api/v1/visual-aids/generate';
  
  const results = [];
  
  for (let i = 0; i < testTopics.length; i++) {
    const topic = testTopics[i];
    const testPayload = {
      topic: topic,
      grade: "5",
      subject: "Science",
      visualType: "infographic",
      style: "modern",
      color_scheme: "blue"
    };

    console.log(`\n🔍 Test ${i + 1}/5: "${topic}"`);
    console.log('📤 Payload:', JSON.stringify(testPayload, null, 2));
    
    try {
      const response = await axios.post(baseURL + endpoint, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      });
      
      const data = response.data?.data || response.data;
      
      results.push({
        topic: topic,
        id: data?.id,
        filename: data?.filename,
        image_url: data?.image_url,
        image_size: data?.metadata?.image_size,
        created_at: data?.metadata?.created_at
      });
      
      console.log('✅ Response received:');
      console.log(`  🆔 ID: ${data?.id}`);
      console.log(`  📁 Filename: ${data?.filename}`);
      console.log(`  📊 Size: ${data?.metadata?.image_size} bytes`);
      console.log(`  ⏰ Created: ${data?.metadata?.created_at}`);
      
    } catch (error) {
      console.log(`❌ Error for topic "${topic}":`, error.message);
      results.push({
        topic: topic,
        error: error.message
      });
    }
    
    // Add delay to avoid overwhelming the backend
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 UNIQUENESS ANALYSIS REPORT');
  console.log('=' * 50);
  
  // Check for uniqueness
  const ids = results.filter(r => r.id).map(r => r.id);
  const filenames = results.filter(r => r.filename).map(r => r.filename);
  const sizes = results.filter(r => r.image_size).map(r => r.image_size);
  
  console.log('🔍 Unique IDs:', new Set(ids).size, '/', ids.length);
  console.log('🔍 Unique Filenames:', new Set(filenames).size, '/', filenames.length);
  console.log('🔍 Unique Image Sizes:', new Set(sizes).size, '/', sizes.length);
  
  console.log('\n📋 Detailed Results:');
  results.forEach((result, i) => {
    console.log(`${i + 1}. "${result.topic}"`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   🆔 ID: ${result.id}`);
      console.log(`   📁 File: ${result.filename}`);
      console.log(`   📊 Size: ${result.image_size} bytes`);
    }
  });
  
  // Conclusions
  if (new Set(ids).size === ids.length) {
    console.log('\n✅ GOOD: All topics generated unique IDs');
  } else {
    console.log('\n⚠️  ISSUE: Some topics generated duplicate IDs - possible caching or placeholder responses');
  }
  
  if (new Set(filenames).size === filenames.length) {
    console.log('✅ GOOD: All topics generated unique filenames');
  } else {
    console.log('⚠️  ISSUE: Some topics generated duplicate filenames');
  }
  
  if (new Set(sizes).size > 1) {
    console.log('✅ GOOD: Topics generated different image sizes (likely unique content)');
  } else {
    console.log('⚠️  ISSUE: All topics generated same image size (possible placeholder images)');
  }
}

testTopicUniqueness().catch(console.error);

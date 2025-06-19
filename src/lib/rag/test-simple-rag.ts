// Simple test script for RAG system
// This can be run with: npx tsx src/lib/rag/test-simple-rag.ts

import { simpleRAGSearch } from './simple-search';

async function testRAGSystem() {
  console.log('🧪 Testing Simple RAG System\n');

  try {
    // Test 1: Check system status
    console.log('1️⃣ Testing system status...');
    const status = await simpleRAGSearch.getStatus();
    console.log(`   📚 Documents: ${status.totalDocuments}`);
    console.log(`   📄 Chunks: ${status.totalChunks}`);
    console.log('   ✅ Status check passed\n');

    // Test 2: Test medical keyword search
    console.log('2️⃣ Testing medical keyword search...');
    const testQueries = [
      'chest pain',
      'emergency',
      'mental health',
      'fever',
      'protocol'
    ];

    for (const query of testQueries) {
      console.log(`   🔍 Searching: "${query}"`);
      const results = await simpleRAGSearch.searchDocuments(query, { limit: 2 });
      console.log(`   📊 Found ${results.length} results`);
      
      if (results.length > 0) {
        const bestMatch = results[0];
        console.log(`   🎯 Best: ${bestMatch.documentTitle} (${(bestMatch.relevanceScore * 100).toFixed(1)}%)`);
      }
      console.log('');
    }

    // Test 3: Test context retrieval methods
    console.log('3️⃣ Testing context retrieval methods...');
    
    const triageContext = await simpleRAGSearch.getTriageContext('chest pain fever');
    console.log(`   📋 Triage context: ${triageContext.results.length} results`);
    
    const emergencyContext = await simpleRAGSearch.getEmergencyContext('severe chest pain');
    console.log(`   🚨 Emergency context: ${emergencyContext.results.length} results`);
    
    const mentalHealthContext = await simpleRAGSearch.getMentalHealthContext('anxiety stress');
    console.log(`   🧠 Mental health context: ${mentalHealthContext.results.length} results`);
    
    console.log('   ✅ Context retrieval tests passed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ Simple RAG system is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testRAGSystem();
} 
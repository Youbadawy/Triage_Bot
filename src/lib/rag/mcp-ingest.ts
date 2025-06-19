// Simple script to ingest documents using MCP Supabase tools
// This bypasses the need for OpenAI API key for initial testing

import { medicalChunker, policyChunker } from './document-chunker';

export async function testDocumentChunking() {
  console.log('🧪 Testing document chunking without embeddings...\n');

  // Sample medical content for testing
  const sampleContent = `
Emergency medical triage protocol for Canadian Armed Forces personnel. 

IMMEDIATE REFERRAL CRITERIA: 
1) Chest pain with shortness of breath
2) Severe bleeding that cannot be controlled
3) Loss of consciousness
4) Severe allergic reactions
5) Difficulty breathing or choking
6) Suspected heart attack or stroke symptoms
7) Severe burns covering large body areas
8) Suspected spinal injuries

URGENT CRITERIA:
1) Persistent vomiting with dehydration
2) High fever above 39°C with other symptoms
3) Severe pain that interferes with normal activities
4) Signs of infection in wounds
5) Mental health crisis with safety concerns

ROUTINE CARE:
1) Common cold and flu symptoms
2) Minor cuts and scrapes
3) Routine medication refills
4) Follow-up appointments
5) Preventive care and checkups
  `;

  try {
    // Test medical chunker
    console.log('📄 Testing medical document chunker...');
    const medicalChunks = await medicalChunker.chunkDocument(sampleContent, {
      documentId: 'test-doc-1',
      documentTitle: 'Test Medical Protocol',
      documentType: 'protocol',
      source: 'CAF'
    });

    console.log(`✅ Created ${medicalChunks.length} medical chunks`);
    medicalChunks.forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}: ${chunk.content.length} chars - "${chunk.content.substring(0, 50)}..."`);
    });

    // Test policy chunker
    console.log('\n📋 Testing policy document chunker...');
    const policyChunks = await policyChunker.chunkDocument(sampleContent, {
      documentId: 'test-doc-2',
      documentTitle: 'Test Policy Document',
      documentType: 'policy',
      source: 'CAF'
    });

    console.log(`✅ Created ${policyChunks.length} policy chunks`);
    policyChunks.forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}: ${chunk.content.length} chars - "${chunk.content.substring(0, 50)}..."`);
    });

    return {
      medicalChunks: medicalChunks.length,
      policyChunks: policyChunks.length,
      success: true
    };
  } catch (error) {
    console.error('❌ Error testing chunking:', error);
    return {
      medicalChunks: 0,
      policyChunks: 0,
      success: false
    };
  }
}

// Run if called directly
if (require.main === module) {
  testDocumentChunking().then(result => {
    console.log('\n📊 Test Results:');
    console.log(`   Medical chunks: ${result.medicalChunks}`);
    console.log(`   Policy chunks: ${result.policyChunks}`);
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
  });
} 
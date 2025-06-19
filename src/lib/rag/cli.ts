#!/usr/bin/env node

import { simpleRAGSearch } from './simple-search';
import { medicalReferenceService } from '../supabase/services';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🏥 CAF MedRoute RAG Management CLI\n');

  switch (command) {
    case 'status':
      await showStatus();
      break;
    
    case 'ingest':
      const documentId = args[1];
      if (documentId) {
        await ingestDocument(documentId);
      } else {
        await ingestAllDocuments();
      }
      break;
    
    case 'search':
      const query = args.slice(1).join(' ');
      if (query) {
        await searchDocuments(query);
      } else {
        console.log('❌ Please provide a search query');
      }
      break;
    
    case 'test':
      await testRAGSystem();
      break;
    
    case 'clear':
      await clearIndex();
      break;
    
    case 'list':
      await listDocuments();
      break;
    
    default:
      showHelp();
  }
}

async function showStatus() {
  console.log('📊 RAG System Status\n');
  
  try {
    const status = await simpleRAGSearch.getStatus();
    
    console.log(`📚 Total Documents: ${status.totalDocuments}`);
    console.log(`📄 Total Chunks: ${status.totalChunks}`);
    console.log(`⏰ Last Update: ${status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'Never'}`);
    
    console.log('\n✅ Simple RAG Search is operational');
    console.log('💡 Use "npm run rag search <query>" to test search functionality');
  } catch (error) {
    console.error('❌ Error getting status:', error);
  }
}

async function ingestDocument(documentId: string) {
  console.log(`🔄 Ingesting document: ${documentId}\n`);
  
  try {
    const success = await ragService.ingestDocument(documentId);
    if (success) {
      console.log('✅ Document ingested successfully');
    } else {
      console.log('❌ Failed to ingest document');
    }
  } catch (error) {
    console.error('❌ Error ingesting document:', error);
  }
}

async function ingestAllDocuments() {
  console.log('🔄 Ingesting all documents...\n');
  
  try {
    const result = await ragService.ingestAllDocuments();
    console.log(`\n✅ Ingestion complete:`);
    console.log(`   - Successful: ${result.success}`);
    console.log(`   - Failed: ${result.failed}`);
  } catch (error) {
    console.error('❌ Error ingesting documents:', error);
  }
}

async function searchDocuments(query: string) {
  console.log(`🔍 Searching for: "${query}"\n`);
  
  try {
    const results = await simpleRAGSearch.searchDocuments(query, { limit: 5 });
    
    console.log(`📊 Search Results (${results.length} found):\n`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.documentTitle}`);
      console.log(`   📋 Type: ${result.documentType} | Source: ${result.source}`);
      console.log(`   🎯 Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
      console.log(`   📄 Content: ${result.content.substring(0, 200)}...`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error searching documents:', error);
  }
}

async function testRAGSystem() {
  console.log('🧪 Testing RAG System\n');
  
  const testQueries = [
    'chest pain emergency',
    'mental health crisis',
    'sick parade guidelines',
    'fever symptoms',
    'suicidal thoughts'
  ];
  
  for (const query of testQueries) {
    console.log(`Testing: "${query}"`);
    
    try {
      const context = await ragService.getContext(query, { maxResults: 2 });
      console.log(`  ✅ Found ${context.totalResults} results in ${context.searchTime}ms`);
      
      if (context.results.length > 0) {
        const bestMatch = context.results[0];
        console.log(`  🎯 Best match: ${bestMatch.metadata.documentTitle} (${(bestMatch.similarity * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('');
  }
}

async function clearIndex() {
  console.log('🗑️ Clearing RAG index...\n');
  
  try {
    const success = await ragService.clearIndex();
    if (success) {
      console.log('✅ Index cleared successfully');
    } else {
      console.log('❌ Failed to clear index');
    }
  } catch (error) {
    console.error('❌ Error clearing index:', error);
  }
}

async function listDocuments() {
  console.log('📚 Available Documents\n');
  
  try {
    const protocols = await medicalReferenceService.getByType('protocol');
    const guidelines = await medicalReferenceService.getByType('guideline');
    
    console.log('📋 Protocols:');
    protocols.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
      console.log(`    Source: ${doc.source} | Tags: ${doc.tags?.join(', ') || 'None'}`);
    });
    
    console.log('\n📖 Guidelines:');
    guidelines.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
      console.log(`    Source: ${doc.source} | Tags: ${doc.tags?.join(', ') || 'None'}`);
    });
  } catch (error) {
    console.error('❌ Error listing documents:', error);
  }
}

function showHelp() {
  console.log('Usage: npm run rag <command> [options]\n');
  console.log('Commands:');
  console.log('  status              Show RAG system status');
  console.log('  ingest [doc-id]     Ingest document(s) into vector database');
  console.log('  search <query>      Search documents using vector similarity');
  console.log('  test                Run test queries against the system');
  console.log('  clear               Clear the entire vector index');
  console.log('  list                List all available documents');
  console.log('  help                Show this help message\n');
  console.log('Examples:');
  console.log('  npm run rag status');
  console.log('  npm run rag ingest');
  console.log('  npm run rag search "chest pain emergency"');
  console.log('  npm run rag test');
}

if (require.main === module) {
  main().catch(console.error);
} 
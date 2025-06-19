#!/usr/bin/env node

import { simpleRAGSearch } from './simple-search';
import { medicalReferenceService } from '../supabase/services';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🏥 CAF MedRoute Simple RAG CLI\n');

  switch (command) {
    case 'status':
      await showStatus();
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
    
    case 'list':
      await listDocuments();
      break;
    
    default:
      showHelp();
  }
}

async function showStatus() {
  console.log('📊 Simple RAG System Status\n');
  
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

async function searchDocuments(query: string) {
  console.log(`🔍 Searching for: "${query}"\n`);
  
  try {
    const results = await simpleRAGSearch.searchDocuments(query, { limit: 5 });
    
    console.log(`📊 Search Results (${results.length} found):\n`);
    
    if (results.length === 0) {
      console.log('No documents found matching your query.');
      return;
    }
    
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
  console.log('🧪 Testing Simple RAG System\n');
  
  const testQueries = [
    'chest pain emergency',
    'mental health crisis',
    'sick parade guidelines',
    'fever symptoms',
    'stress anxiety'
  ];
  
  for (const query of testQueries) {
    console.log(`Testing: "${query}"`);
    
    try {
      const results = await simpleRAGSearch.searchDocuments(query, { limit: 2 });
      console.log(`  ✅ Found ${results.length} results`);
      
      if (results.length > 0) {
        const bestMatch = results[0];
        console.log(`  🎯 Best match: ${bestMatch.documentTitle} (${(bestMatch.relevanceScore * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('');
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
  console.log('  status              Show simple RAG system status');
  console.log('  search <query>      Search documents using text similarity');
  console.log('  test                Run test queries against the system');
  console.log('  list                List all available documents');
  console.log('\nNote: This is the simplified RAG CLI that works without OpenAI embeddings.');
}

if (require.main === module) {
  main().catch(console.error);
} 
#!/usr/bin/env node

import { simpleRAGSearch } from './simple-search';
import { supabase } from '../supabase/config';
import { ragService } from './rag-service';

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'search':
      await handleSearch();
      break;
    case 'ingest':
      await handleIngest();
      break;
    case 'status':
      await handleStatus();
      break;
    case 'clear-cache':
      await handleClearCache();
      break;
    case 'health':
      await handleHealth();
      break;
    default:
      showHelp();
  }
}

function showHelp() {
  console.log(`
🏥 CAF MedRoute RAG CLI

Usage: npm run rag <command> [options]

Commands:
  search <query>     Search the medical knowledge base
  ingest [docId]     Ingest documents into the vector database
  status            Show index status and statistics
  clear-cache       Clear all RAG caches
  health            Show system health metrics
  help              Show this help message

Examples:
  npm run rag search "chest pain protocols"
  npm run rag ingest doc123
  npm run rag ingest (ingests all available documents)
  npm run rag status
  npm run rag clear-cache
  npm run rag health
  `);
}

async function handleSearch() {
  const query = process.argv[3];
  
  if (!query) {
    console.error('❌ Please provide a search query');
    console.log('Usage: npm run rag search "your query here"');
    return;
  }

  console.log(`🔍 Searching for: "${query}"`);
  
  try {
    const results = await ragService.searchDocuments(query, {
      limit: 5,
      threshold: 0.75
    });

    if (results.length === 0) {
      console.log('� No results found');
      return;
    }

    console.log(`\n✅ Found ${results.length} results:\n`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.sourceDocument.title}`);
      console.log(`   � Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   📄 Source: ${result.metadata.source}`);
      console.log(`   📝 Excerpt: ${result.content.substring(0, 150)}...`);
      console.log('');
    });

    // Get RAG context
    console.log('🧠 Getting RAG context...');
    const context = await ragService.getContext(query, { limit: 2 });
    console.log(`� Context Summary: ${context.contextSummary}`);
    console.log(`⏱️  Search Time: ${context.searchTime}ms`);
    
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

async function handleIngest() {
  const documentId = process.argv[3];
  
  if (documentId) {
    // Ingest specific document
    console.log(`📄 Ingesting document: ${documentId}`);
    
    try {
      const success = await ragService.ingestDocument(documentId);
      
      if (success) {
        console.log('✅ Document ingested successfully');
      } else {
        console.log('❌ Failed to ingest document');
      }
    } catch (error) {
      console.error('❌ Ingestion failed:', error);
    }
  } else {
    // Ingest all available documents
    console.log('📚 Starting bulk document ingestion...');
    
    try {
      // Get all available medical references using supabase directly
      const { data: references, error } = await supabase
        .from('medical_references')
        .select('id, title, document_type')
        .eq('is_active', true);

      if (error || !references) {
        console.error('❌ Failed to fetch documents:', error);
        return;
      }

      console.log(`📋 Found ${references.length} documents to ingest`);
      
      let success = 0;
      let failed = 0;

      for (const doc of references) {
        console.log(`📄 Processing: ${doc.title} (${doc.document_type})`);
        
        try {
          const result = await ragService.ingestDocument(doc.id);
          if (result) {
            success++;
            console.log(`  ✅ Success`);
          } else {
            failed++;
            console.log(`  ❌ Failed`);
          }
        } catch (error) {
          failed++;
          console.log(`  ❌ Error: ${error}`);
        }
      }

      console.log(`\n📊 Ingestion complete:`);
      console.log(`  ✅ Successful: ${success}`);
      console.log(`  ❌ Failed: ${failed}`);
      console.log(`  📈 Success Rate: ${((success / (success + failed)) * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Bulk ingestion failed:', error);
    }
  }
}

async function handleStatus() {
  console.log('📊 Getting index status...');
  
  try {
    const status = await ragService.getIndexStatus();
    
    console.log('\n📋 Index Status:');
    console.log(`  📄 Total Documents: ${status.totalDocuments}`);
    console.log(`  ✅ Indexed Documents: ${status.indexedDocuments}`);
    console.log(`  🧩 Total Chunks: ${status.totalChunks}`);
    console.log(`  📈 Index Coverage: ${((status.indexedDocuments / status.totalDocuments) * 100).toFixed(1)}%`);
    
    if (status.lastIndexed) {
      const lastIndexed = new Date(status.lastIndexed);
      console.log(`  🕒 Last Indexed: ${lastIndexed.toLocaleString()}`);
    }
    
    const avgChunksPerDoc = status.indexedDocuments > 0 ? 
      (status.totalChunks / status.indexedDocuments).toFixed(1) : '0';
    console.log(`  📊 Avg Chunks/Document: ${avgChunksPerDoc}`);
    
  } catch (error) {
    console.error('❌ Failed to get status:', error);
  }
}

async function handleClearCache() {
  console.log('🧹 Clearing RAG caches...');
  
  try {
    ragService.clearCache();
    console.log('✅ Cache cleared successfully');
    
    // Show cache stats after clearing
    const healthMetrics = ragService.getHealthMetrics();
    console.log('\n📊 Cache Statistics (after clearing):');
    console.log(`  🎯 RAG Cache Hit Rate: ${(healthMetrics.ragCacheHitRate * 100).toFixed(1)}%`);
    console.log(`  🗄️  DB Cache Hit Rate: ${(healthMetrics.dbCacheHitRate * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

async function handleHealth() {
  console.log('🏥 Checking system health...');
  
  try {
    const healthMetrics = ragService.getHealthMetrics();
    const indexStatus = await ragService.getIndexStatus();
    
    console.log('\n� System Health Report:');
    console.log('\n📈 Performance Metrics:');
    console.log(`  🎯 RAG Cache Hit Rate: ${(healthMetrics.ragCacheHitRate * 100).toFixed(1)}%`);
    console.log(`  🗄️  DB Cache Hit Rate: ${(healthMetrics.dbCacheHitRate * 100).toFixed(1)}%`);
    console.log(`  ⚡ Cache Health: ${healthMetrics.cache.healthy ? '✅ Healthy' : '⚠️ Degraded'}`);
    console.log(`  📊 Cache Size: ${healthMetrics.cache.totalSize} entries`);
    
    console.log('\n📋 Index Health:');
    console.log(`  📄 Documents: ${indexStatus.indexedDocuments}/${indexStatus.totalDocuments} (${((indexStatus.indexedDocuments / indexStatus.totalDocuments) * 100).toFixed(1)}%)`);
    console.log(`  🧩 Total Chunks: ${indexStatus.totalChunks}`);
    
    // Overall health assessment
    const overallHealth = 
      healthMetrics.cache.healthy && 
      healthMetrics.ragCacheHitRate > 0.3 && 
      indexStatus.indexedDocuments > 0;
    
    console.log(`\n🎯 Overall Status: ${overallHealth ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`);
    
    if (!overallHealth) {
      console.log('\n🔧 Recommendations:');
      if (healthMetrics.ragCacheHitRate < 0.3) {
        console.log('  • Cache hit rate is low - consider warming up cache');
      }
      if (indexStatus.indexedDocuments === 0) {
        console.log('  • No documents indexed - run ingestion: npm run rag ingest');
      }
      if (!healthMetrics.cache.healthy) {
        console.log('  • Cache issues detected - consider restarting service');
      }
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
} 
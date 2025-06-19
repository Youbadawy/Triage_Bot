# RAG (Retrieval-Augmented Generation) System

## 🎯 Overview

The RAG system enhances the CAF MedRoute triage chatbot with evidence-based medical recommendations using Canadian Armed Forces medical protocols and guidelines stored in a Supabase vector database.

## 🏗️ Architecture

```
User Input → Medical Keyword Extraction → RAG Search → Supabase Vector DB → Enhanced LLaMA Prompt → Evidence-Based Response
```

## 📁 File Structure

```
src/lib/rag/
├── README.md                 # This documentation
├── simple-search.ts         # Text-based search service (no OpenAI required)
├── simple-cli.ts            # CLI management tool
├── test-simple-rag.ts       # Test script
├── enhanced-triage-with-rag.ts # Enhanced triage flow with RAG
├── embedding-service.ts     # OpenAI embeddings (advanced features)
├── document-chunker.ts      # LangChain document processing
├── rag-service.ts          # Full RAG service (requires OpenAI)
├── cli.ts                  # Full CLI (requires OpenAI)
└── mcp-ingest.ts           # MCP document ingestion
```

## 🚀 Quick Start

### 1. Environment Setup

Ensure these environment variables are set in `.env.local`:

```bash
# Required for basic functionality
SUPABASE_URL=https://ledstwecyxoabdpqesiz.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Required for triage chatbot
OPENROUTER_API_KEY=sk-or-v1-your_key

# Optional for advanced features
OPENAI_API_KEY=sk-your_openai_key
```

### 2. Database Setup

The database schema is already created with sample data:
- ✅ 6 core tables with RLS policies
- ✅ pgvector extension enabled
- ✅ Sample medical reference documents
- ✅ Document chunks with mock embeddings

### 3. Test the System

```bash
# Test the simple RAG system
npx tsx src/lib/rag/test-simple-rag.ts

# Or use the CLI
npm run rag status
npm run rag search "chest pain"
npm run rag test
npm run rag list
```

## 🔍 Search Strategies

### 1. Simple Text Search (No OpenAI Required)
- Uses PostgreSQL full-text search
- Keyword matching with relevance scoring
- Works immediately with existing data

### 2. Vector Search (Requires OpenAI)
- Uses OpenAI text-embedding-3-small
- Semantic similarity search
- Higher accuracy for complex queries

## 🧠 Enhanced Triage Flow

The enhanced triage flow integrates RAG search to provide evidence-based recommendations:

```typescript
import { enhancedTriageChatbot } from '@/lib/rag/enhanced-triage-with-rag';

const result = await enhancedTriageChatbot({
  message: "I have severe chest pain",
  chatHistory: [],
  userId: "user123",
  sessionId: "session456"
});

// Result includes:
// - appointmentType: 'ER referral'
// - reason: "Based on CAF emergency protocols..."
// - complexity: 'complex'
// - evidenceBased: true
// - sources: ["CAF Medical Triage Protocol - Emergency Assessment"]
// - ragContext: { query, results, searchTime }
```

## 📊 Database Schema

### Core Tables

1. **medical_references** - Policy documents and guidelines
2. **document_chunks** - Text chunks with vector embeddings
3. **user_profiles** - Extended CAF user information
4. **triage_sessions** - Chat session tracking
5. **chat_messages** - Individual message storage
6. **appointment_bookings** - Scheduling system

### Key Features

- **Vector Storage**: 1536-dimension embeddings using pgvector
- **Full-text Search**: PostgreSQL websearch capabilities
- **Security**: Row Level Security (RLS) on all user data
- **Performance**: Optimized indexes for vector similarity

## 🛠️ API Reference

### SimpleRAGSearch Class

```typescript
// Get system status
const status = await simpleRAGSearch.getStatus();

// Search documents
const results = await simpleRAGSearch.searchDocuments("chest pain", {
  limit: 5,
  documentTypes: ['protocol', 'guideline']
});

// Get context for triage
const context = await simpleRAGSearch.getTriageContext("fever headache");
const emergencyContext = await simpleRAGSearch.getEmergencyContext("severe chest pain");
const mentalHealthContext = await simpleRAGSearch.getMentalHealthContext("anxiety stress");

// Format results for display
const formatted = simpleRAGSearch.formatResults(results);
```

### Enhanced Triage Integration

```typescript
// The enhanced triage flow automatically:
// 1. Extracts medical keywords from user input
// 2. Searches for relevant medical context
// 3. Enhances the LLaMA prompt with evidence
// 4. Returns evidence-based recommendations

const triageResult = await enhancedTriageChatbot({
  message: userInput,
  chatHistory: previousMessages,
  userId: currentUser.id
});
```

## 🔧 CLI Commands

```bash
# Check system status
npm run rag status

# Search documents
npm run rag search "emergency protocol"

# Run test queries
npm run rag test

# List all documents
npm run rag list
```

## 🧪 Testing

### Unit Tests
Run the test script to verify all components:

```bash
npx tsx src/lib/rag/test-simple-rag.ts
```

### Integration Tests
The enhanced triage flow can be tested through the chat interface or by calling the function directly.

### Performance Benchmarks
- **Search Response Time**: < 500ms target
- **Context Assembly**: < 200ms target
- **Total Triage Time**: < 3 seconds target

## 🛡️ Security & Compliance

### Data Protection
- **RLS Policies**: User data isolation at database level
- **API Security**: Environment variables for sensitive keys
- **Audit Trails**: All interactions logged with timestamps

### Medical Accuracy
- **Source Verification**: Only approved CAF medical documents
- **Fallback Mechanisms**: Safe defaults when RAG search fails
- **Evidence Attribution**: Clear source citations in responses
- **Professional Oversight**: Designed for healthcare review

## 🚀 Deployment

### Current Environment
- **Platform**: Next.js 15.3.3 on Firebase Hosting
- **Database**: Supabase (ledstwecyxoabdpqesiz.supabase.co)
- **AI Model**: OpenRouter LLaMA 4 Maverick (free tier)
- **Development**: Local development on port 9002

### Production Checklist
- [ ] Environment variable security audit
- [ ] Database backup procedures
- [ ] API rate limiting
- [ ] Error monitoring
- [ ] Performance benchmarking
- [ ] Load testing

## 📈 Performance Monitoring

### Key Metrics
- Search response times
- Database query performance
- Vector similarity accuracy
- User satisfaction scores
- System error rates

### Optimization Tips
1. Use appropriate search limits
2. Cache frequent queries
3. Monitor database connection pools
4. Optimize vector indexes
5. Implement query result caching

## 🔮 Future Enhancements

### Phase 3 Features
- [ ] Real-time document ingestion
- [ ] Advanced vector embeddings
- [ ] Multi-language support (English/French)
- [ ] Citation tracking and verification
- [ ] Analytics dashboard
- [ ] A/B testing for search algorithms

## 🐛 Troubleshooting

### Common Issues

1. **"supabaseUrl is required" Error**
   - Check `.env.local` has correct Supabase credentials
   - Verify environment variables are loaded

2. **"OPENAI_API_KEY is missing" Error**
   - This is expected for simple search mode
   - Use `simple-cli.ts` instead of `cli.ts`
   - Or add OpenAI API key for advanced features

3. **No Search Results**
   - Verify sample data exists in database
   - Check document chunks table has content
   - Try broader search terms

4. **Slow Performance**
   - Check database indexes are created
   - Monitor query execution plans
   - Consider query result caching

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=rag:*
```

## 📚 Documentation

- [Implementation Plan](../../../docs/rag-implementation-plan.md)
- [Database Schema](../supabase/README.md)
- [API Documentation](../../../docs/api-reference.md)

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Test with real medical scenarios
5. Ensure security compliance

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Phase 1 Complete, Phase 2 In Progress 
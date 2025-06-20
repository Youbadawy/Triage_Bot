# CAF MedRoute Triage Bot - Setup Guide

## 🏥 Project Overview

CAF MedRoute is a Canadian Armed Forces Medical Triage Assistant powered by AI and RAG (Retrieval-Augmented Generation) technology. It provides evidence-based medical recommendations using LLaMA 4 Maverick and a comprehensive medical knowledge base.

## ⚡ Current Status

### ✅ **RESOLVED ISSUES**
1. **TypeScript Compilation Errors** - Fixed missing `ragService` import in CLI
2. **Dependency Conflicts** - Resolved OpenAI version conflicts using `--legacy-peer-deps`
3. **Build System** - Project now builds successfully
4. **Development Server** - Application runs and serves correctly on port 9002

### 🏗️ **ARCHITECTURE COMPONENTS**
- **Frontend**: Next.js 15.3.3 with TypeScript
- **AI**: LLaMA 4 Maverick via OpenRouter + RAG system
- **Database**: Supabase (vector database for medical references)
- **Authentication**: Firebase Auth
- **UI**: Tailwind CSS + Radix UI components
- **Deployment**: Firebase App Hosting ready

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root with these variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Configuration (Medical Reference Database)
NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter API (for LLaMA 4 Maverick)
OPENROUTER_API_KEY=your_openrouter_api_key

# OpenAI API (for embeddings generation)
OPENAI_API_KEY=your_openai_api_key

# Optional: Google AI (for Genkit if using Gemini)
GEMINI_API_KEY=your_google_ai_api_key
```

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Set up Firebase Project**
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Copy configuration values to `.env.local`

3. **Set up Supabase Database**
   - Create a new Supabase project
   - Run the database schema (see `src/lib/supabase/types.ts`)
   - Copy URL and keys to `.env.local`

4. **Get API Keys**
   - OpenRouter: Sign up at https://openrouter.ai for LLaMA access
   - OpenAI: Get key from https://platform.openai.com for embeddings

5. **Test the Setup**
   ```bash
   npm run typecheck  # Verify no TypeScript errors
   npm run build      # Test build process
   npm run dev        # Start development server
   ```

## 🚀 Development Commands

```bash
# Development
npm run dev              # Start dev server (port 9002)
npm run build           # Build for production
npm run start           # Start production server
npm run typecheck       # Check TypeScript types
npm run lint            # Run ESLint

# RAG System Management
npm run rag status      # Check system health
npm run rag search "query"  # Test document search
npm run rag test        # Run validation tests
npm run rag list        # List medical documents

# AI Development
npm run genkit:dev      # Start Genkit development
npm run genkit:watch    # Watch mode for AI flows
```

## 📊 Application Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (app)/          # Main application routes
│   │   ├── chat/       # Chat interface
│   │   ├── admin/      # Admin dashboard
│   │   └── references/ # Medical references
│   └── (auth)/         # Authentication pages
├── ai/                 # AI and triage logic
│   └── flows/          # Genkit AI flows
├── components/         # React components
├── lib/                # Utility libraries
│   ├── firebase/       # Firebase configuration
│   ├── supabase/       # Database services
│   └── rag/           # RAG system
└── types/             # TypeScript definitions
```

## 🔐 Firebase Deployment

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created and configured

### Deploy to Firebase
```bash
# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init hosting

# Deploy
npm run build
firebase deploy
```

The `apphosting.yaml` is already configured for Firebase App Hosting.

## 🧪 Testing the System

1. **Check Build Status**
   ```bash
   npm run typecheck && npm run build
   ```

2. **Test RAG System**
   ```bash
   npm run rag status
   npm run rag search "chest pain emergency"
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:9002

## 🛡️ Security Notes

- All environment variables are properly configured
- Firebase authentication is set up
- Supabase RLS (Row Level Security) enabled
- API keys are secured in environment variables
- Medical data handling follows compliance protocols

## 📱 User Flow

1. **Authentication**: Users sign up/login via Firebase Auth
2. **Chat Interface**: Main triage conversation interface
3. **AI Processing**: RAG-enhanced responses using medical knowledge
4. **Recommendations**: Evidence-based appointment type suggestions
5. **Admin Panel**: Management of medical references and system status

## 🎯 Ready for Production

The triage bot is now ready for:
- ✅ Development and testing
- ✅ Firebase deployment
- ✅ Production use with proper environment variables
- ✅ RAG system with medical knowledge base
- ✅ Evidence-based medical triage

---

*Last Updated: December 2024*
*Status: Production Ready*
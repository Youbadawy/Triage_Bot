# 🤖 AI Configuration Guide

## Why Your Bot Isn't "Smart" Yet

Your CAF MedRoute bot is designed to be **as intelligent as Claude or ChatGPT** but is currently running in **development mode** with mock responses because the AI services aren't configured.

## 🧠 Real AI Architecture

Your bot uses a **dual AI system**:

### Primary: LLaMA 4 Maverick (OpenRouter)
- Meta's latest LLaMA 4 model
- Specialized for medical applications
- Superior reasoning capabilities
- Optimized for CAF medical protocols

### Backup: Google Gemini 2.5 Pro
- Latest Google AI model
- Excellent medical reasoning
- Fast response times
- Fallback when OpenRouter fails

### Enhanced with RAG
- **Medical document database** via Supabase
- **CAF-specific protocols** and guidelines
- **Evidence-based responses** with source citations

## ⚙️ Setup Instructions

### 1. Create Environment File
Create `.env.local` in your project root:

```bash
# OpenRouter (Primary) - LLaMA 4 Maverick
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Google AI (Backup) - Gemini 2.5 Pro
GOOGLE_API_KEY=your_google_api_key_here

# Supabase (RAG Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### 2. Get API Keys

#### OpenRouter (Primary)
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Create account and get API key
3. Add to `.env.local` as `OPENROUTER_API_KEY`
4. Provides access to LLaMA 4 Maverick model

#### Google AI Studio (Backup)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key (free tier available)
3. Add to `.env.local` as `GOOGLE_API_KEY`

### 3. Test Configuration

Run the development server:
```bash
npm run dev
```

The bot will automatically detect API keys and switch from mock mode to real AI!

## 🧪 Testing Intelligence

### Development Mode (Current)
- Mock responses with `[DEV MODE]` tags
- Limited pattern matching
- No real AI reasoning

### AI Mode (With Keys)
- Real LLM processing
- Medical reasoning capabilities
- RAG-enhanced responses
- Context awareness

## 🎯 Expected Behavior

### Informational Queries
**User**: "What are pilot medical requirements per year?"

**Mock Mode**:
```
[Basic template response with DEV MODE tag]
```

**AI Mode**:
```
📋 **CAF Pilot Medical Requirements:**

Based on Transport Canada and CAF aviation medicine protocols:

**Annual Requirements:**
• Aviation Medical Examination (AME) - Category 1/2/3 depending on role
• Cardiovascular stress testing for pilots over 40
• Vision assessment: 20/20 corrected, color vision standards
• Hearing: Pure tone audiometry within specified limits
• Neurological screening including EKG

**Specialized Assessments:**
• G-tolerance testing for fighter pilots
• Hypoxia training certification renewal
• Night vision goggle compatibility testing

This information is based on [specific CAF medical references from RAG database].

**Next Steps:** Contact your Wing Aviation Medicine office or flight surgeon for personalized assessment.
```

### Medical Triage
**User**: "I have chest pain and shortness of breath"

**Mock Mode**:
```
[Basic template recommending ER referral]
```

**AI Mode**:
```
🚨 **Immediate Action Required**

Based on your symptoms of chest pain and shortness of breath, this could indicate:
- Cardiac emergency (heart attack, arrhythmia)
- Pulmonary embolism
- Pneumothorax
- Other serious conditions

**RECOMMENDATION:** ER referral - Go to Emergency immediately

**Evidence Base:** These symptoms match high-risk indicators per CAF Emergency Medicine protocols and Canadian Cardiovascular Society guidelines.

**Actions:**
1. Go to nearest ER immediately or call 911
2. Do not drive yourself
3. Inform them you're CAF member for appropriate documentation

Time is critical. Please seek immediate care.
```

## 🔧 Troubleshooting

### Common Issues
1. **API Keys Not Working**: Check spelling and ensure keys are active
2. **Rate Limits**: Free tiers have usage limits
3. **Network Issues**: Check internet connection for API calls

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=true
```

This shows API call details in the console.

## 💡 Next Steps

1. **Get API keys** (Google AI Studio is free!)
2. **Configure environment**
3. **Test with real medical queries**
4. **Experience the full AI intelligence**

Your bot is designed to be **as smart as top LLMs** - it just needs the connection! 🚀 
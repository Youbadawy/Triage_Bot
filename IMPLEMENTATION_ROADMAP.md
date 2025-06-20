# CAF MedRoute - Implementation Roadmap

## 🚀 **IMMEDIATE ACTION PLAN** (Week 1-2)

### **Critical Security Fixes**

#### 1. Environment Variable Validation
```typescript
// Create: src/lib/config/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

// Add to src/app/layout.tsx (server component)
import { validateEnv } from '@/lib/config/env-validation';
validateEnv(); // Validate on app startup
```

#### 2. Rate Limiting Implementation
```typescript
// Create: src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        
        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per interval
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    await limiter.check(10, ip); // 10 requests per minute per IP
  } catch {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // Continue with request processing...
}
```

#### 3. API Key Security
```typescript
// Create: src/lib/utils/secret-scrubber.ts
const SECRETS_REGEX = [
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI API keys
  /sk_live_[a-zA-Z0-9]{24}/g, // Stripe live keys
  /pk_live_[a-zA-Z0-9]{24}/g, // Stripe public keys
  /AIza[0-9A-Za-z\\-_]{35}/g, // Google API keys
  /Bearer\s+[A-Za-z0-9\-_\.~\+\/]+=*/g, // Bearer tokens
];

export function scrubSecrets(text: string): string {
  let scrubbedText = text;
  SECRETS_REGEX.forEach(regex => {
    scrubbedText = scrubbedText.replace(regex, '[REDACTED]');
  });
  return scrubbedText;
}

// Update all console.error calls
console.error('Error:', scrubSecrets(JSON.stringify(error)));
```

### **Performance Critical Fixes**

#### 4. Database Query Optimization
```typescript
// Fix: src/lib/rag/rag-service.ts
async searchDocuments(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    documentTypes?: string[];
  } = {}
): Promise<RAGSearchResult[]> {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Searching for: "${query}"`);

    const queryEmbedding = await embeddingService.generateEmbedding(query);
    const searchResults = await vectorSearchService.searchDocuments(
      queryEmbedding,
      options.threshold || 0.78,
      options.limit || 10
    );

    // FIXED: Batch query instead of N+1
    const referenceIds = searchResults.map(result => result.reference_id);
    const { data: references } = await supabase
      .from('medical_references')
      .select('*')
      .in('id', referenceIds);

    // Create a map for O(1) lookup
    const referenceMap = new Map(references?.map(ref => [ref.id, ref]) || []);

    const enrichedResults: RAGSearchResult[] = searchResults
      .map(result => {
        const reference = referenceMap.get(result.reference_id);
        if (!reference || 
            (options.documentTypes && !options.documentTypes.includes(reference.document_type))) {
          return null;
        }

        return {
          content: result.content,
          similarity: result.similarity,
          metadata: {
            documentId: result.reference_id,
            documentTitle: reference.title,
            documentType: reference.document_type,
            source: reference.source,
            chunkIndex: result.metadata?.chunkIndex || 0,
          },
          sourceDocument: {
            id: reference.id,
            title: reference.title,
            url: reference.url,
            source: reference.source,
          },
        };
      })
      .filter(Boolean) as RAGSearchResult[];

    const searchTime = Date.now() - startTime;
    console.log(`✅ Found ${enrichedResults.length} relevant chunks in ${searchTime}ms`);

    return enrichedResults;
  } catch (error) {
    console.error('Error searching documents:', scrubSecrets(JSON.stringify(error)));
    return [];
  }
}
```

#### 5. Caching Layer Implementation
```typescript
// Create: src/lib/cache/cache-service.ts
import { LRUCache } from 'lru-cache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private ragCache = new LRUCache<string, CacheEntry<any>>({
    max: 1000,
    ttl: 1000 * 60 * 60, // 1 hour
  });

  private generateCacheKey(query: string, options: any): string {
    return `rag:${query}:${JSON.stringify(options)}`;
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600000
  ): Promise<T> {
    const cached = this.ragCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.ragCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  invalidate(pattern: string): void {
    for (const key of this.ragCache.keys()) {
      if (key.includes(pattern)) {
        this.ragCache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();

// Usage in RAG service
async searchDocuments(query: string, options: any) {
  const cacheKey = this.generateCacheKey(query, options);
  
  return await cacheService.getOrSet(
    cacheKey,
    () => this.performSearch(query, options),
    60 * 60 * 1000 // 1 hour TTL
  );
}
```

### **Error Handling Implementation**

#### 6. React Error Boundaries
```typescript
// Create: src/components/error-boundary.tsx
'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error; retry: () => void}>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Send to monitoring service
    // sentryService.captureException(error, { extra: errorInfo });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We encountered an unexpected error. Please try again.
            </p>
            <Button onClick={this.retry} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Create: src/components/error-fallbacks.tsx
export function ChatErrorFallback({ error, retry }: {error: Error; retry: () => void}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Chat temporarily unavailable</h3>
        <p className="text-sm text-muted-foreground">
          There was an issue loading the chat interface.
        </p>
      </div>
      <Button onClick={retry}>Retry Chat</Button>
    </div>
  );
}

// Usage in layouts and pages
// Wrap components:
<ErrorBoundary fallback={ChatErrorFallback}>
  <ChatInterface />
</ErrorBoundary>
```

#### 7. Database Indexes (Supabase SQL)
```sql
-- Run these in Supabase SQL Editor

-- Optimize vector searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Optimize medical references queries
CREATE INDEX IF NOT EXISTS idx_medical_references_active_type 
ON medical_references (is_active, document_type) 
WHERE is_active = true;

-- Optimize triage sessions queries
CREATE INDEX IF NOT EXISTS idx_triage_sessions_user_created 
ON triage_sessions (user_id, created_at DESC);

-- Optimize chat messages queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_timestamp 
ON chat_messages (session_id, timestamp DESC);

-- Add text search indexes
CREATE INDEX IF NOT EXISTS idx_medical_references_content_search 
ON medical_references USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_document_chunks_content_search 
ON document_chunks USING gin(to_tsvector('english', content));

-- Add constraints for data integrity
ALTER TABLE triage_sessions 
ADD CONSTRAINT valid_appointment_type 
CHECK (appointment_type IN ('sick parade', 'GP', 'mental health', 'physio', 'specialist', 'ER referral'));

ALTER TABLE triage_sessions 
ADD CONSTRAINT valid_complexity 
CHECK (complexity IN ('easy', 'medium', 'complex'));

-- Add foreign key constraints
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_session 
FOREIGN KEY (session_id) REFERENCES triage_sessions(id) ON DELETE CASCADE;

ALTER TABLE document_chunks 
ADD CONSTRAINT fk_document_reference 
FOREIGN KEY (reference_id) REFERENCES medical_references(id) ON DELETE CASCADE;
```

---

## 📋 **HIGH PRIORITY FIXES** (Week 3-4)

### **Testing Infrastructure**

#### 8. Basic Test Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

```typescript
// Create: jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}

module.exports = createJestConfig(customJestConfig)

// Create: jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Create: src/lib/test-utils.tsx
import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'
import { LanguageProvider } from '@/contexts/language-context'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  )
}

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

#### 9. Sample Tests
```typescript
// Create: src/components/__tests__/loading-spinner.test.tsx
import { render } from '@/lib/test-utils'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size={48} />)
    const spinner = container.querySelector('svg')
    expect(spinner).toHaveAttribute('width', '48')
    expect(spinner).toHaveAttribute('height', '48')
  })
})

// Create: src/lib/rag/__tests__/rag-service.test.ts
import { RAGService } from '../rag-service'

// Mock dependencies
jest.mock('../embedding-service')
jest.mock('../../supabase/config')

describe('RAGService', () => {
  let ragService: RAGService

  beforeEach(() => {
    ragService = RAGService.getInstance()
  })

  describe('searchDocuments', () => {
    it('returns empty array when no results found', async () => {
      // Mock empty search results
      const results = await ragService.searchDocuments('nonexistent query')
      expect(results).toEqual([])
    })

    it('handles errors gracefully', async () => {
      // Test error handling
      const results = await ragService.searchDocuments('')
      expect(results).toEqual([])
    })
  })
})
```

### **Monitoring Setup**

#### 10. Error Tracking
```typescript
// Create: src/lib/monitoring/error-tracking.ts
interface ErrorContext {
  user?: string;
  path?: string;
  extra?: Record<string, any>;
}

class ErrorTracker {
  private enabled: boolean = process.env.NODE_ENV === 'production';

  captureException(error: Error, context?: ErrorContext) {
    if (!this.enabled) {
      console.error('Error:', error, context);
      return;
    }

    // In production, integrate with Sentry or similar
    console.error('Production Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Send to monitoring service
    // sentry.captureException(error, { extra: context });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.enabled) {
      console.log(`[${level}] ${message}`);
      return;
    }

    // Send to monitoring service
    console.log(`[PROD ${level}] ${message}`);
  }
}

export const errorTracker = new ErrorTracker();

// Usage throughout the app
try {
  await processTriageRequest();
} catch (error) {
  errorTracker.captureException(error as Error, {
    user: user?.uid,
    path: '/chat',
    extra: { triageData },
  });
}
```

### **Accessibility Improvements**

#### 11. ARIA Labels and Keyboard Navigation
```typescript
// Update: src/components/ui/button.tsx - Add better accessibility
const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      // Ensure proper accessibility
      role={asChild ? undefined : "button"}
      tabIndex={props.disabled ? -1 : 0}
      aria-disabled={props.disabled}
      {...props}
    />
  )
})

// Update: src/app/(app)/chat/components/chat-input-form.tsx
export function ChatInputForm({ onSubmit, isLoading, onEmergencyKeywordDetected }: ChatInputFormProps) {
  // ... existing code ...

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="sticky bottom-0 flex items-start space-x-2 border-t bg-background p-4"
      aria-label={t('chatInputFormLabel') || "Send message to medical assistant"}
      role="form"
    >
      <Textarea
        id="message"
        placeholder={t('typeYourMessage') || "Describe your symptoms or concerns..."}
        className="flex-1 resize-none rounded-xl border-input bg-card p-3 shadow-sm focus-visible:ring-1 focus-visible:ring-ring min-h-[52px] max-h-[150px]"
        rows={1}
        {...register('message')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(handleFormSubmit)();
          }
        }}
        aria-invalid={errors.message ? 'true' : 'false'}
        aria-describedby={errors.message ? "message-error" : "message-help"}
        aria-label="Type your medical question or describe your symptoms"
      />
      
      <div id="message-help" className="sr-only">
        Type your question and press Enter to send, or Shift+Enter for a new line
      </div>
      
      {errors.message && (
        <div id="message-error" className="sr-only">
          {errors.message.message}
        </div>
      )}

      <Button 
        type="submit" 
        size="icon" 
        className="h-[52px] w-[52px] rounded-xl shrink-0" 
        disabled={isLoading || isCheckingEmergency}
        aria-label={isLoading ? "Sending message..." : "Send message"}
      >
        {isLoading || isCheckingEmergency ? (
          <LoadingSpinner size={20} aria-hidden="true" />
        ) : (
          <SendHorizonal size={20} aria-hidden="true" />
        )}
      </Button>
    </form>
  );
}
```

---

## 🎯 **SUCCESS METRICS & TESTING**

### **Performance Testing**
```bash
# Add to package.json scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lighthouse": "lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

### **Monitoring Dashboard**
```typescript
// Create: src/app/(app)/admin/monitoring/page.tsx
export default function MonitoringPage() {
  // Display key metrics:
  // - Error rates
  // - Response times  
  // - User activity
  // - System health
  // - Performance metrics
}
```

---

## 📞 **IMPLEMENTATION CHECKLIST**

### **Week 1-2: Critical Fixes** ✅
- [ ] Environment variable validation
- [ ] Rate limiting implementation  
- [ ] API key security improvements
- [ ] Database query optimization (N+1 fixes)
- [ ] Basic caching layer
- [ ] React error boundaries
- [ ] Database indexes

### **Week 3-4: Quality Improvements** ✅
- [ ] Testing infrastructure setup
- [ ] Basic test coverage (>50%)
- [ ] Error tracking implementation
- [ ] Accessibility improvements
- [ ] Performance monitoring
- [ ] Mobile responsiveness fixes

### **Month 2: Advanced Features** ✅
- [ ] Advanced caching with Redis
- [ ] CI/CD pipeline setup
- [ ] Comprehensive test suite (>80%)
- [ ] Security audit and fixes
- [ ] Performance optimization
- [ ] Documentation updates

---

**This roadmap provides concrete, actionable steps to transform the triage bot from production-ready to enterprise-grade quality.**

*Implementation Priority: Critical → High → Medium*  
*Expected Timeline: 4-8 weeks*  
*Developer Resources: 2-3 developers*
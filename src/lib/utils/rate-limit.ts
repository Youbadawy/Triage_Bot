import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000, // 1 minute default
  });

  return {
    check: (limit: number, token: string): Promise<RateLimitResult> =>
      new Promise((resolve, reject) => {
        const now = Date.now();
        const tokenCount = tokenCache.get(token) || [0, now];
        
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        
        tokenCount[0] += 1;
        const currentUsage = tokenCount[0];
        const resetTime = tokenCount[1] + (options.interval || 60000);
        
        const result: RateLimitResult = {
          success: currentUsage <= limit,
          limit,
          remaining: Math.max(0, limit - currentUsage),
          reset: resetTime,
        };

        if (!result.success) {
          reject(new Error(`Rate limit exceeded. Limit: ${limit}, Current: ${currentUsage}`));
        } else {
          resolve(result);
        }
      }),
  };
}

// Pre-configured rate limiters for different use cases
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // 500 unique tokens per minute
});

export const chatRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // 100 unique users per minute
});

export const adminRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 200, // 200 unique tokens per minute
});

// Helper function to get client IP
export function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Helper function to create rate limit response
export function createRateLimitResponse(error: Error): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      details: error.message,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}

// Rate limit decorator for API routes
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: ReturnType<typeof rateLimit>,
  limit: number = 10,
  getToken?: (request: Request) => string
) {
  return async (request: Request): Promise<Response> => {
    const token = getToken ? getToken(request) : getClientIP(request);
    
    try {
      await limiter.check(limit, token);
      return await handler(request);
    } catch (error) {
      console.warn(`Rate limit exceeded for token: ${token}`, error);
      return createRateLimitResponse(error as Error);
    }
  };
}
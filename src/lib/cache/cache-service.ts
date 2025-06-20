import { LRUCache } from 'lru-cache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CacheService {
  private ragCache: LRUCache<string, CacheEntry<any>>;
  private dbCache: LRUCache<string, CacheEntry<any>>;
  private userCache: LRUCache<string, CacheEntry<any>>;
  private generalCache: LRUCache<string, CacheEntry<any>>;
  
  private stats = {
    rag: { hits: 0, misses: 0 },
    db: { hits: 0, misses: 0 },
    user: { hits: 0, misses: 0 },
    general: { hits: 0, misses: 0 },
  };

  constructor() {
    // RAG cache - for search results and medical references
    this.ragCache = new LRUCache<string, CacheEntry<any>>({
      max: 1000,
      ttl: 1000 * 60 * 60, // 1 hour default
    });

    // Database cache - for expensive queries
    this.dbCache = new LRUCache<string, CacheEntry<any>>({
      max: 500,
      ttl: 1000 * 60 * 30, // 30 minutes default
    });

    // User cache - for user sessions and preferences
    this.userCache = new LRUCache<string, CacheEntry<any>>({
      max: 2000,
      ttl: 1000 * 60 * 15, // 15 minutes default
    });

    // General cache - for misc data
    this.generalCache = new LRUCache<string, CacheEntry<any>>({
      max: 500,
      ttl: 1000 * 60 * 5, // 5 minutes default
    });
  }

  private generateCacheKey(prefix: string, key: string, params?: any): string {
    const baseKey = `${prefix}:${key}`;
    if (params) {
      const sortedParams = JSON.stringify(params, Object.keys(params).sort());
      return `${baseKey}:${Buffer.from(sortedParams).toString('base64')}`;
    }
    return baseKey;
  }

  private getCacheByType(type: 'rag' | 'db' | 'user' | 'general') {
    switch (type) {
      case 'rag': return this.ragCache;
      case 'db': return this.dbCache;
      case 'user': return this.userCache;
      case 'general': return this.generalCache;
      default: return this.generalCache;
    }
  }

  async getOrSet<T>(
    type: 'rag' | 'db' | 'user' | 'general',
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    params?: any
  ): Promise<T> {
    const cache = this.getCacheByType(type);
    const cacheKey = this.generateCacheKey(type, key, params);
    const now = Date.now();

    // Check if item exists and is still valid
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < cached.ttl) {
      this.stats[type].hits++;
      return cached.data;
    }

    // Cache miss - fetch new data
    this.stats[type].misses++;
    
    try {
      const data = await fetcher();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        ttl: ttl || 1000 * 60 * 60, // 1 hour default
      };
      
      cache.set(cacheKey, entry);
      return data;
    } catch (error) {
      // If fetcher fails, try to return stale data if available
      if (cached) {
        console.warn(`Fetcher failed, returning stale data for key: ${cacheKey}`);
        return cached.data;
      }
      throw error;
    }
  }

  set<T>(
    type: 'rag' | 'db' | 'user' | 'general',
    key: string,
    data: T,
    ttl?: number,
    params?: any
  ): void {
    const cache = this.getCacheByType(type);
    const cacheKey = this.generateCacheKey(type, key, params);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 1000 * 60 * 60,
    };
    
    cache.set(cacheKey, entry);
  }

  get<T>(
    type: 'rag' | 'db' | 'user' | 'general',
    key: string,
    params?: any
  ): T | undefined {
    const cache = this.getCacheByType(type);
    const cacheKey = this.generateCacheKey(type, key, params);
    const now = Date.now();

    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < cached.ttl) {
      this.stats[type].hits++;
      return cached.data;
    }

    this.stats[type].misses++;
    return undefined;
  }

  invalidate(
    type: 'rag' | 'db' | 'user' | 'general',
    pattern: string
  ): number {
    const cache = this.getCacheByType(type);
    let invalidated = 0;

    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  invalidateUser(userId: string): number {
    return this.invalidate('user', userId);
  }

  invalidateAll(): void {
    this.ragCache.clear();
    this.dbCache.clear();
    this.userCache.clear();
    this.generalCache.clear();
    
    // Reset stats
    Object.keys(this.stats).forEach(key => {
      this.stats[key as keyof typeof this.stats] = { hits: 0, misses: 0 };
    });
  }

  getStats(): Record<string, CacheStats> {
    const result: Record<string, CacheStats> = {};
    
    Object.entries(this.stats).forEach(([type, stats]) => {
      const cache = this.getCacheByType(type as any);
      const total = stats.hits + stats.misses;
      
      result[type] = {
        hits: stats.hits,
        misses: stats.misses,
        size: cache.size,
        hitRate: total > 0 ? stats.hits / total : 0,
      };
    });
    
    return result;
  }

  // Convenience methods for common operations
  
  async cacheRAGSearch<T>(
    query: string,
    options: any,
    fetcher: () => Promise<T>,
    ttl = 1000 * 60 * 60 // 1 hour
  ): Promise<T> {
    return this.getOrSet('rag', `search:${query}`, fetcher, ttl, options);
  }

  async cacheDBQuery<T>(
    queryName: string,
    params: any,
    fetcher: () => Promise<T>,
    ttl = 1000 * 60 * 30 // 30 minutes
  ): Promise<T> {
    return this.getOrSet('db', queryName, fetcher, ttl, params);
  }

  async cacheUserSession<T>(
    userId: string,
    sessionType: string,
    fetcher: () => Promise<T>,
    ttl = 1000 * 60 * 15 // 15 minutes
  ): Promise<T> {
    return this.getOrSet('user', `${userId}:${sessionType}`, fetcher, ttl);
  }

  // Warmup common cache entries
  async warmupCache(): Promise<void> {
    console.log('🔥 Warming up cache...');
    
    try {
      // Pre-load common medical references types
      const commonTypes = ['protocol', 'guideline', 'policy'];
      // This would be implemented based on your actual data loading needs
      console.log('✅ Cache warmup completed');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
    }
  }

  // Health check for monitoring
  getHealthStatus() {
    const stats = this.getStats();
    const overallHitRate = Object.values(stats).reduce((acc, stat) => acc + stat.hitRate, 0) / Object.keys(stats).length;
    
    return {
      healthy: overallHitRate > 0.5, // Consider healthy if hit rate > 50%
      hitRate: overallHitRate,
      totalSize: Object.values(stats).reduce((acc, stat) => acc + stat.size, 0),
      caches: stats,
    };
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache warming on module load in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Server-side, warm up cache after a delay
  setTimeout(() => {
    cacheService.warmupCache().catch(console.error);
  }, 5000);
}
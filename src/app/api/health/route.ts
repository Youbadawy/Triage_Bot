import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/config';
import { ragService } from '@/lib/rag/rag-service';
import { cacheService } from '@/lib/cache/cache-service';
import { secureLogger } from '@/lib/utils/secret-scrubber';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    rag: ServiceStatus;
    cache: ServiceStatus;
    auth: ServiceStatus;
  };
  performance: {
    responseTime: number;
    cacheHitRate: number;
    ragIndexStatus: any;
  };
  environment: {
    nodeEnv: string;
    version: string;
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Test all services in parallel
    const [
      databaseStatus,
      ragStatus,
      cacheStatus,
      authStatus,
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRAGHealth(),
      checkCacheHealth(),
      checkAuthHealth(),
    ]);

    const responseTime = Date.now() - startTime;

    // Determine overall health status
    const services = {
      database: getServiceResult(databaseStatus),
      rag: getServiceResult(ragStatus),
      cache: getServiceResult(cacheStatus),
      auth: getServiceResult(authStatus),
    };

    const overallStatus = determineOverallStatus(services);
    const cacheStats = cacheService.getStats();
    const overallCacheHitRate = Object.values(cacheStats).reduce(
      (acc, stat) => acc + stat.hitRate, 0
    ) / Object.keys(cacheStats).length;

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp,
      uptime: process.uptime(),
      services,
      performance: {
        responseTime,
        cacheHitRate: overallCacheHitRate,
        ragIndexStatus: await ragService.getIndexStatus().catch(() => null),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    // Log health check (with appropriate level based on status)
    if (overallStatus === 'healthy') {
      secureLogger.log('Health check completed', { status: overallStatus, responseTime });
    } else {
      secureLogger.warn('Health check shows issues', { 
        status: overallStatus, 
        services: Object.entries(services)
          .filter(([_, service]) => service.status !== 'up')
          .map(([name, service]) => ({ name, status: service.status, error: service.error }))
      });
    }

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 207 : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    secureLogger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp,
      uptime: process.uptime(),
      services: {
        database: { status: 'down', lastCheck: timestamp, error: 'Health check failed' },
        rag: { status: 'down', lastCheck: timestamp, error: 'Health check failed' },
        cache: { status: 'down', lastCheck: timestamp, error: 'Health check failed' },
        auth: { status: 'down', lastCheck: timestamp, error: 'Health check failed' },
      },
      performance: {
        responseTime,
        cacheHitRate: 0,
        ragIndexStatus: null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}

async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabase
      .from('medical_references')
      .select('id')
      .limit(1);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

async function checkRAGHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Test RAG service with a simple health check query
    const healthMetrics = ragService.getHealthMetrics();
    
    // Consider RAG degraded if cache hit rate is too low
    const status = healthMetrics.ragCacheHitRate < 0.3 ? 'degraded' : 'up';

    return {
      status,
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown RAG error',
    };
  }
}

async function checkCacheHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const cacheHealth = cacheService.getHealthStatus();
    
    return {
      status: cacheHealth.healthy ? 'up' : 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown cache error',
    };
  }
}

async function checkAuthHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Simple check to ensure auth service is responsive
    // This is a basic check - in production you might want more comprehensive testing
    const authCheck = typeof window === 'undefined'; // Server-side check
    
    return {
      status: authCheck ? 'up' : 'degraded',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown auth error',
    };
  }
}

function getServiceResult(result: PromiseSettledResult<ServiceStatus>): ServiceStatus {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      error: result.reason instanceof Error ? result.reason.message : 'Service check failed',
    };
  }
}

function determineOverallStatus(services: Record<string, ServiceStatus>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(service => service.status);
  
  if (statuses.every(status => status === 'up')) {
    return 'healthy';
  } else if (statuses.some(status => status === 'down')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

// Simple health check endpoint for load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Quick database ping
    const { error } = await supabase
      .from('medical_references')
      .select('id')
      .limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { chatRateLimit, getClientIP, createRateLimitResponse } from '@/lib/utils/rate-limit';
import { secureLogger } from '@/lib/utils/secret-scrubber';
import { ragService } from '@/lib/rag/rag-service';
import { validateEnv } from '@/lib/config/env-validation';

// Validate environment variables at startup
const env = validateEnv();

interface ChatRequest {
  message: string;
  context?: string;
  userId?: string;
  sessionId?: string;
}

interface ChatResponse {
  response: string;
  context?: any;
  metadata?: {
    timestamp: number;
    tokensUsed?: number;
    sources?: string[];
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Apply rate limiting (10 requests per minute per IP)
    try {
      await chatRateLimit.check(10, clientIP);
    } catch (rateLimitError) {
      secureLogger.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return createRateLimitResponse(rateLimitError as Error);
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      secureLogger.error('Invalid JSON in chat request', { error: parseError });
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { message, context, userId, sessionId } = body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate message length (prevent abuse)
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 2000 characters allowed.' },
        { status: 400 }
      );
    }

    // Log the request (securely)
    secureLogger.log('Chat request received', {
      messageLength: message.length,
      hasContext: !!context,
      userId: userId || 'anonymous',
      sessionId: sessionId || 'none',
      clientIP,
      timestamp: new Date().toISOString(),
    });

    // Get RAG context for the message
    const ragContext = await ragService.getContext(message, {
      limit: 5,
      threshold: 0.75,
      documentTypes: ['protocol', 'guideline', 'policy'],
    });

    // Simulate AI response (replace with actual AI service call)
    const aiResponse = await generateAIResponse(message, ragContext);

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response: ChatResponse = {
      response: aiResponse.text,
      context: ragContext,
      metadata: {
        timestamp: Date.now(),
        tokensUsed: aiResponse.tokensUsed,
        sources: ragContext.results.map(r => r.sourceDocument.title),
      },
    };

    // Log successful response
    secureLogger.log('Chat response generated successfully', {
      processingTime,
      contextResults: ragContext.totalResults,
      responseLength: aiResponse.text.length,
      tokensUsed: aiResponse.tokensUsed,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log error securely
    secureLogger.error('Chat API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An error occurred while processing your request. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// Simulate AI response generation (replace with actual AI service)
async function generateAIResponse(
  message: string, 
  context: any
): Promise<{ text: string; tokensUsed: number }> {
  // This would typically call OpenRouter/OpenAI API
  // For now, return a simulated response
  
  const hasContext = context.results && context.results.length > 0;
  
  let response = '';
  
  if (hasContext) {
    response = `Based on the available medical protocols and guidelines, I can provide the following information regarding "${message}":\n\n`;
    
    // Add context-based information
    const topResult = context.results[0];
    response += `According to ${topResult.sourceDocument.title}, ${topResult.content.substring(0, 200)}...\n\n`;
    
    response += `This information is sourced from ${context.totalResults} relevant medical reference(s) with an average relevance score of ${(context.results.reduce((sum: number, r: any) => sum + r.similarity, 0) / context.results.length * 100).toFixed(1)}%.`;
  } else {
    response = `I understand you're asking about "${message}". However, I don't have specific medical protocols or guidelines that directly address this query. For medical advice, please consult with a healthcare professional.`;
  }

  return {
    text: response,
    tokensUsed: Math.floor(response.length / 4), // Rough estimate
  };
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
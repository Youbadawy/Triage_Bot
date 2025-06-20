'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { secureLogger } from '@/lib/utils/secret-scrubber';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error; retry: () => void; errorId: string}>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'feature';
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    // Log error securely (without exposing sensitive data)
    secureLogger.error('React Error Boundary caught an error:', errorDetails);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(errorDetails);
    }
  }

  private reportErrorToService = (errorDetails: any) => {
    // In a real implementation, this would send to Sentry, LogRocket, etc.
    try {
      // Example: sentry.captureException(errorDetails);
      console.warn('Error reported to monitoring service:', errorDetails.errorId);
    } catch (reportingError) {
      secureLogger.error('Failed to report error to monitoring service:', reportingError);
    }
  };

  retry = () => {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }

    // Add a small delay to prevent rapid retries
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: undefined 
      });
    }, 100);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent && this.state.error && this.state.errorId) {
        return (
          <FallbackComponent 
            error={this.state.error} 
            retry={this.retry}
            errorId={this.state.errorId}
          />
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback 
          error={this.state.error} 
          retry={this.retry}
          errorId={this.state.errorId || 'unknown'}
          level={this.props.level}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error?: Error;
  retry: () => void;
  errorId: string;
  level?: 'page' | 'component' | 'feature';
}

function DefaultErrorFallback({ error, retry, errorId, level = 'component' }: DefaultErrorFallbackProps) {
  const isPageLevel = level === 'page';
  
  return (
    <div className={`flex ${isPageLevel ? 'h-screen' : 'h-64'} items-center justify-center p-4`}>
      <Card className={`mx-auto ${isPageLevel ? 'max-w-lg' : 'max-w-md'} shadow-lg`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {isPageLevel ? 'Application Error' : 'Something went wrong'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isPageLevel 
              ? 'We encountered an unexpected error. Our team has been notified.'
              : 'This section encountered an error and needs to be reloaded.'
            }
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs">
                <strong>Debug Info:</strong><br />
                {error.message}
                <br />
                <small className="text-muted-foreground">Error ID: {errorId}</small>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 flex-col sm:flex-row">
            <Button onClick={retry} variant="outline" className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            {isPageLevel && (
              <Button 
                onClick={() => window.location.href = '/'}
                variant="default"
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          {process.env.NODE_ENV === 'production' && (
            <p className="text-xs text-muted-foreground text-center">
              Error ID: {errorId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error fallbacks for different sections

export function ChatErrorFallback({ error, retry, errorId }: {error: Error; retry: () => void; errorId: string}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Chat temporarily unavailable</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          The medical assistant is experiencing technical difficulties. Please try again in a moment.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={retry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Chat
        </Button>
        <Button 
          onClick={() => window.location.reload()}
          variant="default"
        >
          Refresh Page
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Debug Details</summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
            {error.message}
            {'\n'}
            Error ID: {errorId}
          </pre>
        </details>
      )}
    </div>
  );
}

export function AdminErrorFallback({ error, retry, errorId }: {error: Error; retry: () => void; errorId: string}) {
  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4 p-6">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Admin Dashboard Error</h3>
        <p className="text-sm text-muted-foreground max-w-lg">
          The admin dashboard encountered an error while loading. This could be due to a data loading issue or a temporary service disruption.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={retry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Loading
        </Button>
        <Button 
          onClick={() => window.location.href = '/chat'}
          variant="default"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Error ID: {errorId}
      </p>
    </div>
  );
}

export function AuthErrorFallback({ error, retry, errorId }: {error: Error; retry: () => void; errorId: string}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-6">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Authentication Error</h3>
        <p className="text-sm text-muted-foreground max-w-lg">
          There was a problem with the authentication system. Please try logging in again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={retry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button 
          onClick={() => window.location.href = '/login'}
          variant="default"
        >
          Go to Login
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Error ID: {errorId}
      </p>
    </div>
  );
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<{error: Error; retry: () => void; errorId: string}>,
  level: 'page' | 'component' | 'feature' = 'component'
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} level={level}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}
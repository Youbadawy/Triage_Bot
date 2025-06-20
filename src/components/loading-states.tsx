'use client';

import React from 'react';
import { Loader2, MessageSquare, Database, Search, Shield, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Base loading spinner component
export function LoadingSpinner({ 
  size = 'default', 
  className = '' 
}: { 
  size?: 'sm' | 'default' | 'lg'; 
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
      aria-label="Loading..."
    />
  );
}

// Inline loading component
export function InlineLoading({ 
  text = 'Loading...', 
  size = 'default' 
}: { 
  text?: string; 
  size?: 'sm' | 'default' | 'lg';
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <LoadingSpinner size={size} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

// Full page loading component
export function PageLoading({ 
  title = 'Loading...', 
  description = 'Please wait while we load your content.',
  showLogo = true 
}: { 
  title?: string; 
  description?: string;
  showLogo?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-8">
      {showLogo && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">CAF MedRoute</span>
          </div>
        </div>
      )}
      
      <LoadingSpinner size="lg" className="text-primary" />
      
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
    </div>
  );
}

// Chat loading states
export function ChatLoading() {
  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex justify-start">
        <div className="bg-muted rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-xs text-muted-foreground">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function ChatHistoryLoading() {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// Medical data loading states
export function MedicalDataLoading({ 
  type = 'general',
  count = 3 
}: { 
  type?: 'general' | 'search' | 'analysis';
  count?: number;
}) {
  const getTitle = () => {
    switch (type) {
      case 'search': return 'Searching medical knowledge base...';
      case 'analysis': return 'Analyzing medical data...';
      default: return 'Loading medical information...';
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-sm font-medium">{getTitle()}</span>
      </div>
      
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Admin dashboard loading states
export function AdminDashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Database loading states
export function DatabaseLoading({ 
  operation = 'loading',
  table = 'data' 
}: { 
  operation?: 'loading' | 'syncing' | 'indexing';
  table?: string;
}) {
  const getStatus = () => {
    switch (operation) {
      case 'syncing': return `Syncing ${table}...`;
      case 'indexing': return `Indexing ${table}...`;
      default: return `Loading ${table}...`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-48 space-y-4">
      <div className="relative">
        <Database className="h-12 w-12 text-primary animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <LoadingSpinner size="sm" className="text-primary" />
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">{getStatus()}</p>
        <p className="text-xs text-muted-foreground">This may take a moment...</p>
      </div>
    </div>
  );
}

// Authentication loading states
export function AuthLoading({ 
  action = 'Authenticating' 
}: { 
  action?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">CAF MedRoute</span>
      </div>
      
      <LoadingSpinner size="lg" className="text-primary" />
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">{action}...</p>
        <p className="text-xs text-muted-foreground">Please wait while we verify your credentials</p>
      </div>
    </div>
  );
}

// System status loading
export function SystemStatusLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-sm font-medium">Checking system status...</span>
      </div>
      
      <div className="space-y-3">
        {['API Services', 'Database', 'Authentication', 'Cache', 'AI Services'].map((service, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <span className="text-sm">{service}</span>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic table loading
export function TableLoading({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number;
}) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Export all loading states
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Inline: InlineLoading,
  Page: PageLoading,
  Chat: ChatLoading,
  ChatMessage: ChatMessageSkeleton,
  ChatHistory: ChatHistoryLoading,
  MedicalData: MedicalDataLoading,
  AdminDashboard: AdminDashboardLoading,
  Database: DatabaseLoading,
  Auth: AuthLoading,
  SystemStatus: SystemStatusLoading,
  Table: TableLoading,
};
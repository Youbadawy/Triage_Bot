'use client';

import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const getInitials = (name?: string | null) => {
    if (!name) return isUser ? 'U' : 'AI';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };
  
  // Format timestamp if available
  const formattedTimestamp = message.timestamp
    ? new Date(message.timestamp instanceof Date ? message.timestamp : message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';


  return (
    <div
      className={cn(
        'flex items-start space-x-3 py-3',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      {!isUser && !isSystem && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback><Bot size={18} /></AvatarFallback>
        </Avatar>
      )}

      <Card
        className={cn(
          'max-w-[75%] rounded-xl shadow-md',
          isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none',
          isSystem && 'bg-destructive text-destructive-foreground border-destructive text-center w-full max-w-[90%]'
        )}
      >
        <CardContent className="p-3 text-sm">
          {isSystem && <AlertTriangle className="inline-block mr-2 h-5 w-5" />}
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-0" {...props} />, // Remove default margin from p tags from markdown
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {formattedTimestamp && !isSystem && (
            <p className={cn(
              "text-xs mt-1",
              isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
            )}>
              {formattedTimestamp}
            </p>
          )}
        </CardContent>
      </Card>

      {isUser && (
         <Avatar className="h-8 w-8 shrink-0">
          {/* Replace with actual user avatar if available */}
          <AvatarFallback><User size={18} /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

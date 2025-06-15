'use client';

import type { ChatMessage } from '@/types';
import { ChatMessageItem } from './chat-message-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      <div className="space-y-2">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <ChatMessageItem 
            key="loading" 
            message={{ 
              id: 'loading', 
              role: 'assistant', 
              content: '...', // Or use a specific loading indicator component
              timestamp: new Date()
            }} 
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

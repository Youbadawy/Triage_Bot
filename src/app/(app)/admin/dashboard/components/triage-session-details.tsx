
'use client';

import type { TriageSession, ChatMessage } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, User, AlertTriangle, CalendarDays, LanguagesIcon, Fingerprint, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';


interface TriageSessionDetailsProps {
  session: TriageSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TriageSessionDetails({ session, isOpen, onClose }: TriageSessionDetailsProps) {
  const { t, language } = useLanguage();

  if (!session) return null;

  const formatDate = (dateInput: any) => { // date can be Firestore Timestamp, JS Date, or string
    let dateObj: Date;
    if (dateInput?.toDate && typeof dateInput.toDate === 'function') { // Firestore Timestamp
      dateObj = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (dateInput && dateInput._seconds && dateInput._nanoseconds) { // Handle plain object from Firestore if not instance of Timestamp
        dateObj = new Timestamp(dateInput._seconds, dateInput._nanoseconds).toDate();
    }
     else {
      dateObj = new Date(dateInput); // Attempt to parse if string or other
    }
    
    if (isNaN(dateObj.getTime())) { // Check for invalid date
        return t('invalidDate') || 'Invalid Date';
    }
    return format(dateObj, 'PPPppp', { locale: language === 'fr' ? frLocale : enLocale });
  };

  const MessageItem = ({ msg }: { msg: ChatMessage }) => (
    <div className={`flex items-start space-x-2 my-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && <Bot className="h-5 w-5 text-primary mt-1 shrink-0" />}
      {msg.role === 'system' && <AlertTriangle className="h-5 w-5 text-destructive mt-1 shrink-0" />}
      <div className={`p-3 rounded-lg max-w-[80%] text-sm shadow-sm ${
          msg.role === 'user' ? 'bg-primary/10 text-primary-foreground rounded-br-none' 
          : msg.role === 'assistant' ? 'bg-accent/20 rounded-bl-none' 
          : 'bg-destructive/10 text-destructive-foreground'
      }`}>
        <p className="font-semibold mb-1 capitalize">{t(msg.role) || msg.role}</p>
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        {msg.timestamp && <p className="text-xs text-muted-foreground mt-1">{formatDate(msg.timestamp)}</p>}
      </div>
      {msg.role === 'user' && <User className="h-5 w-5 text-gray-600 mt-1 shrink-0" />}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{t('triageSessionDetailsTitle') || 'Triage Session Details'}</DialogTitle>
          <DialogDescription>
            {t('sessionIdLabel') || 'Session ID'}: {session.id}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-1 -mx-1 my-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm p-4 border rounded-md bg-muted/20">
            <div className="space-y-1">
              <p className="flex items-center"><Fingerprint className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('userIdLabel') || 'User ID'}:</strong> <span className="ml-1 truncate">{session.userId}</span></p>
              <p className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('timestampLabel') || 'Timestamp'}:</strong> <span className="ml-1">{formatDate(session.timestamp)}</span></p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center"><LanguagesIcon className="w-4 h-4 mr-2 text-muted-foreground"/><strong>{t('languageLabel') || 'Language'}:</strong> <Badge variant="outline" className="ml-1">{session.language?.toUpperCase() || 'N/A'}</Badge></p>
              <p className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground"/>
                <strong>{t('emergencyTriggeredLabel') || 'Emergency Triggered'}:</strong> 
                <Badge variant={session.emergencyAlertTriggered ? 'destructive' : 'default'} className="ml-1">
                  {session.emergencyAlertTriggered ? t('yes') : t('no')}
                </Badge>
              </p>
            </div>
          </div>

          <div className="mb-4 p-4 border rounded-md bg-background">
            <h4 className="font-semibold text-md mb-1">{t('recommendation') || 'Recommendation'}:</h4>
            <p className="text-lg font-medium text-primary">{session.recommendation?.appointmentType || t('notAvailable') || 'Not available'}</p>
            <h5 className="font-semibold text-sm mt-2 mb-1">{t('reasonLabel') || 'Reason'}:</h5>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words">{session.recommendation?.reason || t('notAvailable') || 'Not available'}</p>
          </div>

          <div>
            <h4 className="font-semibold text-md mb-2">{t('chatTranscript') || 'Chat Transcript'}:</h4>
            <div className="border rounded-md p-3 bg-muted/20 max-h-[300px] overflow-y-auto">
              {session.chatHistory && session.chatHistory.length > 0 ? (
                session.chatHistory.map((msg, index) => (
                  <MessageItem key={msg.id || `chat-${index}`} msg={msg} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center">{t('noChatHistoryAvailable') || 'No chat history available.'}</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('closeButton') || 'Close'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


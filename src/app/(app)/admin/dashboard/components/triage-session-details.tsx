
'use client';

import type { TriageSession, ChatMessage } from '../../../../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../components/ui/dialog';
import { Button } from '../../../../../components/ui/button';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Badge } from '../../../../../components/ui/badge';
import { Bot, User, AlertTriangle, CalendarDays, LanguagesIcon, Fingerprint, MessageSquare, CheckCircle2, XCircle, ShieldQuestion } from 'lucide-react';
import { useLanguage } from '../../../../../contexts/language-context';
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

  const formatDate = (dateInput: any) => {
    let dateObj: Date;
    if (dateInput instanceof Timestamp) {
      dateObj = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (dateInput && typeof dateInput === 'object' && dateInput._seconds !== undefined) {
        dateObj = new Timestamp(dateInput._seconds, dateInput._nanoseconds).toDate();
    }
     else {
      dateObj = new Date(dateInput || Date.now()); 
    }
    
    if (isNaN(dateObj.getTime())) { 
        return t('invalidDate') || 'Invalid Date';
    }
    return format(dateObj, 'PPP p', { locale: language === 'fr' ? frLocale : enLocale });
  };

  const MessageItem = ({ msg }: { msg: ChatMessage }) => (
    <div className={`flex items-start space-x-2 my-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && <Bot className="h-5 w-5 text-primary mt-1 shrink-0" />}
      {msg.role === 'system' && <AlertTriangle className="h-5 w-5 text-destructive mt-1 shrink-0" />}
      <div className={`p-3 rounded-lg max-w-[85%] text-sm shadow-sm break-words ${
          msg.role === 'user' ? 'bg-primary/10 text-primary-foreground rounded-br-none' 
          : msg.role === 'assistant' ? 'bg-accent/20 text-accent-foreground rounded-bl-none' 
          : 'bg-destructive/10 text-destructive-foreground rounded-md' // System messages distinct
      }`}>
        <p className="font-semibold mb-0.5 capitalize">{t(msg.role) || msg.role}</p>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.timestamp && <p className="text-xs text-muted-foreground mt-1.5">{formatDate(msg.timestamp)}</p>}
      </div>
      {msg.role === 'user' && <User className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />}
    </div>
  );

  const recommendationType = session.recommendation?.appointmentType || t('notAvailable') || 'N/A';
  const isERReferral = recommendationType.toLowerCase().includes('er');
  const isErrorRec = recommendationType.toLowerCase().includes('error');

  let RecommendationIcon = ShieldQuestion;
  if (isERReferral) RecommendationIcon = AlertTriangle;
  else if (isErrorRec) RecommendationIcon = XCircle;
  else if (recommendationType !== (t('notAvailable') || 'N/A')) RecommendationIcon = CheckCircle2;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
             <Fingerprint className="w-7 h-7 mr-2 text-primary" />
            {t('triageSessionDetailsTitle') || 'Triage Session Details'}
          </DialogTitle>
          <DialogDescription>
            {t('sessionIdLabel') || 'Session ID'}: {session.id}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-1 -mx-1 my-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-4 text-sm p-4 border rounded-md bg-muted/30">
            <div className="space-y-1.5">
              <p className="flex items-center"><Fingerprint className="w-4 h-4 mr-2 text-muted-foreground shrink-0"/><strong>{t('userIdLabel') || 'User ID'}:</strong> <span className="ml-1.5 truncate">{session.userId}</span></p>
              <p className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-muted-foreground shrink-0"/><strong>{t('timestampLabel') || 'Timestamp'}:</strong> <span className="ml-1.5">{formatDate(session.timestamp)}</span></p>
            </div>
            <div className="space-y-1.5">
              <p className="flex items-center"><LanguagesIcon className="w-4 h-4 mr-2 text-muted-foreground shrink-0"/><strong>{t('languageLabel') || 'Language'}:</strong> <Badge variant="outline" className="ml-1.5">{session.language?.toUpperCase() || 'N/A'}</Badge></p>
              <p className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-muted-foreground shrink-0"/>
                <strong>{t('emergencyTriggeredLabel') || 'Emergency Triggered'}:</strong> 
                <Badge variant={session.emergencyAlertTriggered ? 'destructive' : 'secondary'} className="ml-1.5">
                  {session.emergencyAlertTriggered ? t('yes') : t('no')}
                </Badge>
              </p>
            </div>
          </div>

          <div className={`mb-4 p-4 border rounded-md ${isERReferral ? 'border-destructive bg-destructive/5' : isErrorRec ? 'border-orange-500 bg-orange-500/5' : 'border-primary bg-primary/5'}`}>
            <h4 className="font-semibold text-md mb-1.5 flex items-center">
                <RecommendationIcon className={`w-5 h-5 mr-2 shrink-0 ${isERReferral ? 'text-destructive' : isErrorRec ? 'text-orange-600' : 'text-primary'}`} />
                {t('recommendation') || 'Recommendation'}:
            </h4>
            <p className={`text-lg font-medium capitalize ${isERReferral ? 'text-destructive' : isErrorRec ? 'text-orange-700' : 'text-primary'}`}>
                {recommendationType}
            </p>
            <h5 className="font-semibold text-sm mt-2.5 mb-1">{t('reasonLabel') || 'Reason'}:</h5>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words">{session.recommendation?.reason || t('notAvailable') || 'Not available'}</p>
          </div>

          <div>
            <h4 className="font-semibold text-md mb-2">{t('chatTranscript') || 'Chat Transcript'}:</h4>
            <div className="border rounded-md p-2 sm:p-3 bg-muted/30 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
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

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>{t('closeButton') || 'Close'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

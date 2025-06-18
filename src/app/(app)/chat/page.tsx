
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage, AppointmentRecommendation } from '@/types';
import { ChatMessages } from './components/chat-messages';
import { ChatInputForm } from './components/chat-input-form';
import { RecommendationDisplay } from './components/recommendation-display';
import { processChatMessage } from './actions';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PanelRightOpen, PanelRightClose } from 'lucide-react';

const MAX_CHAT_HISTORY_FOR_AI = 10; // Max messages (user + assistant pairs) to send to AI

export default function ChatPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AppointmentRecommendation | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecommendationSidebarOpen, setIsRecommendationSidebarOpen] = useState(true);


  useEffect(() => {
    const initialMessageContent = language === 'fr' 
      ? t('initialChatGreetingFr') 
      : t('initialChatGreetingEn');

    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: initialMessageContent,
        timestamp: new Date(),
      },
    ]);
    setRecommendation(null);
    setIsEmergency(false);
    setSessionId(null); 
    setIsRecommendationSidebarOpen(true); 
  }, [language, t]); 

  const handleEmergencyKeywordDetected = () => {
    setIsEmergency(true);
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'system',
        content: `${t('emergencyTitle')}: ${t('emergencyMessage')}`,
        timestamp: new Date(),
      },
    ]);
    setRecommendation(null); 
    setIsRecommendationSidebarOpen(false); 
  };

  const saveTriageSessionToFirestore = useCallback(async (finalMessages: ChatMessage[], finalRecommendation: AppointmentRecommendation, emergencyDetected: boolean) => {
    if (!user) return null;
    try {
      const sessionData = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        chatHistory: finalMessages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp || new Date() })),
        recommendation: finalRecommendation,
        language: language,
        emergencyAlertTriggered: emergencyDetected,
      };
      const docRef = await addDoc(collection(db, 'triageSessions'), sessionData);
      return docRef.id;
    } catch (error) {
      console.error("Error saving triage session to Firestore:", error);
      toast({
        variant: "destructive",
        title: t('errorSavingSessionTitle'),
        description: t('errorSavingSessionDesc'),
      });
      return null;
    }
  }, [user, language, t, toast]);


  const handleSubmitMessage = async (userInput: string) => {
    if (!user || isEmergency) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    const chatHistoryForAI = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-MAX_CHAT_HISTORY_FOR_AI * 2) 
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

    try {
      const result = await processChatMessage({
        userInput,
        chatHistory: chatHistoryForAI,
        userId: user.uid,
        language,
      });

      if (result.error) {
        const displayError = t('aiError'); 
        const systemMessageContent = result.aiResponse?.content ? `${displayError} Details: ${result.aiResponse.content}` : displayError;
        
        setMessages((prevMessages) => [...prevMessages, {
          id: crypto.randomUUID(),
          role: 'system',
          content: systemMessageContent,
          timestamp: new Date(),
        }]);
        
        toast({
          variant: 'destructive',
          title: t('aiErrorTitle'),
          description: t('aiErrorDesc'),
        });
        setIsLoading(false); 
        return;
      }
      
      const aiResponseMsg = result.aiResponse;
      setMessages((prevMessages) => [...prevMessages, aiResponseMsg]);

      if (result.recommendation) {
        setRecommendation(result.recommendation);
        setIsRecommendationSidebarOpen(true); 
        const updatedMessages = [...messages, newUserMessage, aiResponseMsg];
        const newSessionId = await saveTriageSessionToFirestore(updatedMessages, result.recommendation, isEmergency);
        if (newSessionId) setSessionId(newSessionId);
      }

    } catch (error: any) {
      console.error('Error processing message:', error);
      const errorMessageContent = t('aiError');
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: errorMessageContent,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      toast({
        variant: 'destructive',
        title: t('aiErrorTitle'),
        description: t('aiErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Removed container and max-width, SidebarInset should manage this. Added py-4 for vertical padding.
    <div className="flex h-[calc(100vh-4rem)] flex-col py-4 px-2 sm:px-4"> 
      <Card className="flex flex-1 flex-col overflow-hidden shadow-xl">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-headline text-center text-primary">
              {t('chatWithAI')}
            </CardTitle>
            {recommendation && !isEmergency && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsRecommendationSidebarOpen(!isRecommendationSidebarOpen)}
                className="hidden md:inline-flex" 
                aria-label={isRecommendationSidebarOpen ? "Close recommendation panel" : "Open recommendation panel"}
              >
                {isRecommendationSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-1 p-0 overflow-hidden">
          <div className="flex flex-1 flex-row">
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {isEmergency && (
                 <div className="bg-destructive/10 p-4 text-destructive border-b border-destructive">
                    <div className="flex items-center font-semibold">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        {t('emergencyTitle')}
                    </div>
                    <p className="text-sm mt-1">{t('emergencyMessage')}</p>
                </div>
              )}
              <ChatMessages messages={messages} isLoading={isLoading && !isEmergency} />
              
              <div className="block md:hidden">
                {recommendation && !isEmergency && (
                  <div className="p-4 border-t bg-card">
                    <RecommendationDisplay recommendation={recommendation} />
                  </div>
                )}
              </div>

              {!isEmergency && (
                <ChatInputForm 
                  onSubmit={handleSubmitMessage} 
                  isLoading={isLoading}
                  onEmergencyKeywordDetected={handleEmergencyKeywordDetected}
                />
              )}
            </div>

            {isRecommendationSidebarOpen && recommendation && !isEmergency && (
              <div className="hidden md:flex md:flex-col w-80 lg:w-96 border-l bg-muted/20 overflow-y-auto transition-all duration-300 ease-in-out">
                <div className="p-4">
                    <RecommendationDisplay recommendation={recommendation} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

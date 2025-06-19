
'use client';

import { useEffect, useState } from 'react';
import type { TriageSession, ChatMessage } from '@/types';
import { TriageSessionsTable } from './components/triage-sessions-table';
import { TriageSessionDetails } from './components/triage-session-details';
import { PrepareForClinicModal } from './components/prepare-for-clinic-modal';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ListChecks } from "lucide-react";

const SESSIONS_LIMIT = 50; // Number of sessions to fetch

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth(); // isAdmin check is handled by AdminLayout
  const { t } = useLanguage();

  const [sessions, setSessions] = useState<TriageSession[]>([]);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<TriageSession | null>(null);
  const [selectedSessionForClinic, setSelectedSessionForClinic] = useState<TriageSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sessionsCol = collection(db, 'triageSessions');
        const q = query(sessionsCol, orderBy('timestamp', 'desc'), limit(SESSIONS_LIMIT));
        const snapshot = await getDocs(q);
        
        const sessionsData = snapshot.docs.map(doc => {
          const data = doc.data();

          // Ensure data.timestamp is a Firestore Timestamp for the session
          let firestoreSessionTimestamp: Timestamp;
          if (data.timestamp instanceof Timestamp) {
            firestoreSessionTimestamp = data.timestamp;
          } else if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            // This handles cases where data.timestamp might be a Firestore-like object but not an instance
            // For TriageSession, we need a Firestore Timestamp instance
            firestoreSessionTimestamp = new Timestamp(data.timestamp.seconds, data.timestamp.nanoseconds);
          } else {
            // Fallback or error - this indicates data inconsistency
            console.warn(`Session ${doc.id} has an invalid session timestamp. Using current time.`);
            firestoreSessionTimestamp = Timestamp.now();
          }

          const transformedChatHistory = (data.chatHistory || []).map((msgData: any) => {
            let chatMsgTimestamp: Timestamp; // Aim for Firestore Timestamp for consistency from DB
            if (msgData.timestamp instanceof Timestamp) {
              chatMsgTimestamp = msgData.timestamp;
            } else if (msgData.timestamp && typeof msgData.timestamp.toDate === 'function') {
              // Firestore-like object, convert to Timestamp instance
              chatMsgTimestamp = new Timestamp(msgData.timestamp.seconds, msgData.timestamp.nanoseconds);
            } else if (msgData.timestamp instanceof Date) {
              // If it's already a Date, convert to Firestore Timestamp
              chatMsgTimestamp = Timestamp.fromDate(msgData.timestamp);
            } else {
              // Fallback for unexpected formats, convert to Firestore Timestamp
              console.warn(`Chat message in session ${doc.id} has an invalid timestamp. Using current time.`);
              chatMsgTimestamp = Timestamp.fromDate(new Date(msgData.timestamp || Date.now()));
            }
            return {
              id: msgData.id || crypto.randomUUID(),
              role: msgData.role,
              content: msgData.content,
              timestamp: chatMsgTimestamp, // Ensured to be Firestore Timestamp
            } as ChatMessage; // ChatMessage type allows Date | Timestamp, Timestamp is fine
          });

          return {
            id: doc.id,
            userId: data.userId,
            recommendation: data.recommendation,
            language: data.language,
            emergencyAlertTriggered: data.emergencyAlertTriggered,
            timestamp: firestoreSessionTimestamp, // Ensured to be Firestore Timestamp
            chatHistory: transformedChatHistory,
          } as TriageSession;
        });
        setSessions(sessionsData);
      } catch (err: any) {
        console.error("Error fetching triage sessions:", err);
        setError(t('errorFetchingSessions') || 'Failed to load triage sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [t]);

  const handleViewDetails = (session: TriageSession) => {
    setSelectedSessionForDetails(session);
  };

  const handleCloseDetails = () => {
    setSelectedSessionForDetails(null);
  };

  const handlePrepareForClinic = (session: TriageSession) => {
    setSelectedSessionForClinic(session);
  };

  const handleClosePrepareForClinic = () => {
    setSelectedSessionForClinic(null);
  };

  if (isLoading && sessions.length === 0) { 
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-2">{t('loadingSessions') || 'Loading triage sessions...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <ListChecks className="w-8 h-8 mr-3 text-primary" />
          {t('adminDashboard')}
        </h1>
         {isLoading && <LoadingSpinner size={24} />}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errorTitle') || 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && 
        <TriageSessionsTable 
          sessions={sessions} 
          onViewDetails={handleViewDetails} 
          onPrepareForClinic={handlePrepareForClinic}
        />
      }

      {selectedSessionForDetails && (
        <TriageSessionDetails
          session={selectedSessionForDetails}
          isOpen={!!selectedSessionForDetails}
          onClose={handleCloseDetails}
        />
      )}

      {selectedSessionForClinic && (
        <PrepareForClinicModal
          session={selectedSessionForClinic}
          isOpen={!!selectedSessionForClinic}
          onClose={handleClosePrepareForClinic}
        />
      )}
    </div>
  );
}

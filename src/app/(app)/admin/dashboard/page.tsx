
'use client';

import { useEffect, useState } from 'react';
import type { TriageSession } from '@/types';
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
    // isAdmin check is primarily for initial gatekeeping, layout handles redirection.
    // Fetching can proceed if layout allows rendering.
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sessionsCol = collection(db, 'triageSessions');
        const q = query(sessionsCol, orderBy('timestamp', 'desc'), limit(SESSIONS_LIMIT));
        const snapshot = await getDocs(q);
        const sessionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure timestamp is correctly handled (Firestore Timestamps vs JS Dates)
          const transformedChatHistory = (data.chatHistory || []).map((msg: any) => ({
            ...msg,
            // Ensure msg.timestamp is valid before creating Date or passing to Timestamp
            timestamp: msg.timestamp instanceof Timestamp 
                         ? msg.timestamp 
                         : (msg.timestamp && msg.timestamp.toDate) // Check if it's a Firestore-like timestamp object
                           ? msg.timestamp.toDate()
                           : (msg.timestamp && typeof msg.timestamp === 'object' && msg.timestamp._seconds !== undefined) // Check for plain object from Firestore
                             ? new Timestamp(msg.timestamp._seconds, msg.timestamp._nanoseconds).toDate()
                             : new Date(msg.timestamp || Date.now()) // Fallback
          }));
          return { 
            id: doc.id, 
            ...data,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp : (data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())),
            chatHistory: transformedChatHistory
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

  if (isLoading && sessions.length === 0) { // Show full page loader only if no sessions are loaded yet
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

'use client';

import { useEffect, useState } from 'react';
import type { TriageSession } from '@/types';
import { TriageSessionsTable } from './components/triage-sessions-table';
import { TriageSessionDetails } from './components/triage-session-details';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ListChecks } from "lucide-react";

const SESSIONS_LIMIT = 50; // Number of sessions to fetch

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth(); // Already checked by layout, but good for completeness
  const { t } = useLanguage();

  const [sessions, setSessions] = useState<TriageSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TriageSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return; // Should be handled by layout, but defensive check

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sessionsCol = collection(db, 'triageSessions');
        // Order by timestamp descending, limit results for performance
        const q = query(sessionsCol, orderBy('timestamp', 'desc'), limit(SESSIONS_LIMIT));
        const snapshot = await getDocs(q);
        const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TriageSession));
        setSessions(sessionsData);
      } catch (err: any) {
        console.error("Error fetching triage sessions:", err);
        setError(t('errorFetchingSessions') || 'Failed to load triage sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [isAdmin, t]);

  const handleViewDetails = (session: TriageSession) => {
    setSelectedSession(session);
  };

  const handleCloseDetails = () => {
    setSelectedSession(null);
  };

  if (isLoading) {
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
        {/* Add any actions like refresh button here */}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errorTitle') || 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && <TriageSessionsTable sessions={sessions} onViewDetails={handleViewDetails} />}

      {selectedSession && (
        <TriageSessionDetails
          session={selectedSession}
          isOpen={!!selectedSession}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}

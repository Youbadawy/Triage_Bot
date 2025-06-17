
'use client';

import { useEffect, useState } from 'react';
import type { TriageSession } from '@/types';
import { TriageSessionsTable } from './components/triage-sessions-table';
import { TriageSessionDetails } from './components/triage-session-details';
import { PrepareForClinicModal } from './components/prepare-for-clinic-modal'; // New import
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ListChecks } from "lucide-react";

const SESSIONS_LIMIT = 50; // Number of sessions to fetch

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const [sessions, setSessions] = useState<TriageSession[]>([]);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<TriageSession | null>(null);
  const [selectedSessionForClinic, setSelectedSessionForClinic] = useState<TriageSession | null>(null); // New state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const sessionsCol = collection(db, 'triageSessions');
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
    setSelectedSessionForDetails(session);
  };

  const handleCloseDetails = () => {
    setSelectedSessionForDetails(null);
  };

  const handlePrepareForClinic = (session: TriageSession) => { // New handler
    setSelectedSessionForClinic(session);
  };

  const handleClosePrepareForClinic = () => { // New handler
    setSelectedSessionForClinic(null);
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
          onPrepareForClinic={handlePrepareForClinic} // Pass new handler
        />
      }

      {selectedSessionForDetails && (
        <TriageSessionDetails
          session={selectedSessionForDetails}
          isOpen={!!selectedSessionForDetails}
          onClose={handleCloseDetails}
        />
      )}

      {selectedSessionForClinic && ( // Render new modal
        <PrepareForClinicModal
          session={selectedSessionForClinic}
          isOpen={!!selectedSessionForClinic}
          onClose={handleClosePrepareForClinic}
        />
      )}
    </div>
  );
}

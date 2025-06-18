
'use client';

import type { TriageSession } from '@/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageCircle, AlertTriangle, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';


interface TriageSessionsTableProps {
  sessions: TriageSession[];
  onViewDetails: (session: TriageSession) => void;
  onPrepareForClinic: (session: TriageSession) => void;
}

export function TriageSessionsTable({ sessions, onViewDetails, onPrepareForClinic }: TriageSessionsTableProps) {
  const { t, language } = useLanguage();

  const formatDate = (dateInput: any) => { // date can be Firestore Timestamp, JS Date, or string
    let dateObj: Date;
    if (dateInput?.toDate) { // Firestore Timestamp
      dateObj = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      dateObj = new Date(dateInput); // Attempt to parse if string or other
    }
    
    if (isNaN(dateObj.getTime())) { // Check for invalid date
        return t('invalidDate') || 'Invalid Date';
    }
    return format(dateObj, 'PPpp', { locale: language === 'fr' ? frLocale : enLocale });
  };

  if (sessions.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{t('noTriageSessions') || 'No triage sessions found.'}</p>;
  }

  return (
    <div className="rounded-lg border shadow-md overflow-hidden bg-card">
      <Table>
        <TableCaption>{t('triageSessionsListDesc') || 'A list of recent triage sessions.'}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] sm:w-[180px]">{t('tableHeaderTimestamp') || 'Timestamp'}</TableHead>
            <TableHead>{t('tableHeaderUserID') || 'User ID'}</TableHead>
            <TableHead>{t('tableHeaderRecommendation') || 'Recommendation'}</TableHead>
            <TableHead className="text-center hidden sm:table-cell">{t('tableHeaderLanguage') || 'Language'}</TableHead>
            <TableHead className="text-center">{t('tableHeaderEmergency') || 'Emergency'}</TableHead>
            <TableHead className="text-right w-[180px] sm:w-[260px]">{t('tableHeaderActions') || 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium text-xs sm:text-sm">{formatDate(session.timestamp)}</TableCell>
              <TableCell className="truncate max-w-[100px] sm:max-w-[150px] text-xs sm:text-sm">{session.userId}</TableCell>
              <TableCell>
                <Badge variant={session.recommendation?.appointmentType?.toLowerCase().includes('er') ? "destructive" : "secondary"} className="text-xs sm:text-sm">
                  {session.recommendation?.appointmentType || t('notAvailableShort') || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                <Badge variant="outline" className="text-xs sm:text-sm">{session.language?.toUpperCase() || 'N/A'}</Badge>
              </TableCell>
              <TableCell className="text-center">
                {session.emergencyAlertTriggered ? (
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mx-auto" />
                ) : (
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-right space-x-0.5 sm:space-x-1">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(session)} title={t('viewDetailsButton') || 'View Details'} className="px-2 sm:px-3">
                  <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('viewDetailsButton') || 'View'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onPrepareForClinic(session)} title={t('prepareForClinicButton') || 'Prepare for Clinic'} className="px-2 sm:px-3">
                  <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('prepareForClinicButtonShort') || 'Prep Clinic'}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

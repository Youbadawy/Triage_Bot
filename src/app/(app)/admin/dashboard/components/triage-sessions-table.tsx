
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
  onPrepareForClinic: (session: TriageSession) => void; // New prop
}

export function TriageSessionsTable({ sessions, onViewDetails, onPrepareForClinic }: TriageSessionsTableProps) {
  const { t, language } = useLanguage();

  const formatDate = (date: any) => { // date can be Timestamp or Date
    const dateObj = date?.toDate ? date.toDate() : (date || new Date());
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
            <TableHead className="w-[180px]">{t('tableHeaderTimestamp') || 'Timestamp'}</TableHead>
            <TableHead>{t('tableHeaderUserID') || 'User ID'}</TableHead>
            <TableHead>{t('tableHeaderRecommendation') || 'Recommendation'}</TableHead>
            <TableHead className="text-center">{t('tableHeaderLanguage') || 'Language'}</TableHead>
            <TableHead className="text-center">{t('tableHeaderEmergency') || 'Emergency'}</TableHead>
            <TableHead className="text-right w-[260px]">{t('tableHeaderActions') || 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">{formatDate(session.timestamp)}</TableCell>
              <TableCell className="truncate max-w-[150px]">{session.userId}</TableCell>
              <TableCell>
                <Badge variant={session.recommendation.appointmentType.toLowerCase().includes('er') ? "destructive" : "secondary"}>
                  {session.recommendation.appointmentType}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{session.language.toUpperCase()}</Badge>
              </TableCell>
              <TableCell className="text-center">
                {session.emergencyAlertTriggered ? (
                  <AlertTriangle className="h-5 w-5 text-destructive mx-auto" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-green-600 mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(session)} title={t('viewDetailsButton') || 'View Details'}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('viewDetailsButton') || 'View'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onPrepareForClinic(session)} title={t('prepareForClinicButton') || 'Prepare for Clinic'}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('prepareForClinicButtonShort') || 'Prep Clinic'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

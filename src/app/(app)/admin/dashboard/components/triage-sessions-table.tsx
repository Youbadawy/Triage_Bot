
'use client';

import type { TriageSession } from '../../../../../types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';
import { Badge, badgeVariants } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Eye, MessageCircle, AlertTriangle, FileText, CalendarClock, UserSquare, LanguagesIcon, HelpCircle, BrainCircuit } from 'lucide-react';
import { useLanguage } from '../../../../../contexts/language-context';
import { format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';


interface TriageSessionsTableProps {
  sessions: TriageSession[];
  onViewDetails: (session: TriageSession) => void;
  onPrepareForClinic: (session: TriageSession) => void;
}

export function TriageSessionsTable({ sessions, onViewDetails, onPrepareForClinic }: TriageSessionsTableProps) {
  const { t, language } = useLanguage();

  const formatDate = (dateInput: any) => { 
    let dateObj: Date;
    if (dateInput instanceof Timestamp) {
      dateObj = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (dateInput && typeof dateInput === 'object' && dateInput._seconds !== undefined) { // Plain object from Firestore
      dateObj = new Timestamp(dateInput._seconds, dateInput._nanoseconds).toDate();
    }
     else {
      dateObj = new Date(dateInput); 
    }
    
    if (isNaN(dateObj.getTime())) { 
        return t('invalidDate') || 'Invalid Date';
    }
    return format(dateObj, 'MMM d, yyyy HH:mm', { locale: language === 'fr' ? frLocale : enLocale });
  };

  const getComplexityVariant = (complexity: 'easy' | 'medium' | 'complex' | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (complexity) {
      case 'easy':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'complex':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (sessions.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{t('noTriageSessions') || 'No triage sessions found.'}</p>;
  }

  return (
    <div className="rounded-lg border shadow-md overflow-hidden bg-card">
      <Table>
        <TableCaption className="py-4">{t('triageSessionsListDesc') || 'A list of recent triage sessions.'}</TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] sm:w-[180px]"><CalendarClock className="inline-block mr-1 h-4 w-4 text-muted-foreground" />{t('tableHeaderTimestamp') || 'Timestamp'}</TableHead>
            <TableHead><UserSquare className="inline-block mr-1 h-4 w-4 text-muted-foreground" />{t('tableHeaderUserID') || 'User ID'}</TableHead>
            <TableHead><HelpCircle className="inline-block mr-1 h-4 w-4 text-muted-foreground" />{t('tableHeaderRecommendation') || 'Recommendation'}</TableHead>
            <TableHead>{t('tableHeaderReason') || 'Reason'}</TableHead>
            <TableHead><BrainCircuit className="inline-block mr-1 h-4 w-4 text-muted-foreground" />{t('tableHeaderComplexity') || 'Complexity'}</TableHead>
            <TableHead className="text-center hidden md:table-cell"><LanguagesIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground" />{t('tableHeaderLanguage') || 'Language'}</TableHead>
            <TableHead className="text-center"><AlertTriangle className="inline-block mr-1 h-4 w-4 text-muted-foreground" />{t('tableHeaderEmergency') || 'Emergency'}</TableHead>
            <TableHead className="text-right w-[180px] sm:w-[220px]">{t('tableHeaderActions') || 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium text-xs sm:text-sm py-3">{formatDate(session.timestamp)}</TableCell>
              <TableCell className="truncate max-w-[100px] sm:max-w-[150px] text-xs sm:text-sm py-3">{session.userId}</TableCell>
              <TableCell className="py-3">
                <Badge 
                  variant={
                    session.recommendation?.appointmentType?.toLowerCase().includes('er') ? "destructive" 
                    : session.recommendation?.appointmentType?.toLowerCase().includes('error') ? "outline"
                    : "secondary"
                  } 
                  className="text-xs sm:text-sm capitalize"
                >
                  {session.recommendation?.appointmentType || t('notAvailableShort') || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="truncate max-w-[200px] text-xs sm:text-sm py-3">{session.recommendation?.reason || t('notAvailableShort') || 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={getComplexityVariant(session.recommendation?.complexity)} className="text-xs sm:text-sm capitalize">
                  {session.recommendation?.complexity || t('notAvailableShort') || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-center hidden md:table-cell py-3">
                <Badge variant="outline" className="text-xs sm:text-sm">{session.language?.toUpperCase() || 'N/A'}</Badge>
              </TableCell>
              <TableCell className="text-center py-3">
                {session.emergencyAlertTriggered ? (
                  <span title={t('yes') || "Yes"}>
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mx-auto" />
                  </span>
                ) : (
                  <span title={t('no') || "No"}>
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto" />
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-0.5 sm:space-x-1 py-2">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(session)} title={t('viewDetailsButton') || 'View Details'} className="px-2 sm:px-2">
                  <Eye className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">{t('viewDetailsButton') || 'View'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onPrepareForClinic(session)} title={t('prepareForClinicButton') || 'Prepare for Clinic'} className="px-2 sm:px-2">
                  <FileText className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">{t('prepareForClinicButtonShort') || 'Prep'}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

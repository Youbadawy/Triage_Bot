
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
import { useLanguage } from '../../../../../contexts/language-context';
import { format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
import { ClipboardCopy, AlertTriangle, CalendarDays, User, MessagesSquare, FileText } from 'lucide-react';
import { useToast } from '../../../../../hooks/use-toast';
import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';

interface PrepareForClinicModalProps {
  session: TriageSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrepareForClinicModal({ session, isOpen, onClose }: PrepareForClinicModalProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [generatedDate, setGeneratedDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGeneratedDate(format(new Date(), 'PPP p', { locale: language === 'fr' ? frLocale : enLocale }));
    }
  }, [isOpen, language]);

  if (!session) return null;

  const formatDateForReferral = (dateInput: any) => {
    let dateObj: Date;
    if (dateInput instanceof Timestamp) {
      dateObj = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (dateInput && typeof dateInput === 'object' && dateInput._seconds !== undefined) {
        dateObj = new Timestamp(dateInput._seconds, dateInput._nanoseconds).toDate();
    } else {
      dateObj = new Date(dateInput || Date.now());
    }
    
    if (isNaN(dateObj.getTime())) {
        return t('invalidDate') || 'Invalid Date';
    }
    return format(dateObj, 'PPP p', { locale: language === 'fr' ? frLocale : enLocale });
  };

  const getLastMessages = (chatHistory: ChatMessage[], count: number = 4) => {
    if (!chatHistory || chatHistory.length === 0) return t('noChatHistoryAvailable') || "No chat history available.";
    return chatHistory
      .slice(-count)
      .map(msg => `${msg.role === 'user' ? (t('user') || 'User') : (t('assistant') || 'Assistant')}: ${msg.content}`)
      .join('\n');
  };

  const referralText = `
--------------------------------------------------
${t('patientReferralTitle') || 'PATIENT REFERRAL FOR CLINIC SCHEDULING'}
--------------------------------------------------
${t('dateGeneratedLabel') || 'Date Generated'}: ${generatedDate}

${t('sessionIdLabel') || 'Triage Session ID'}: ${session.id}
${t('userIdLabel') || 'User ID (Internal)'}: ${session.userId}
${t('timestampLabel') || 'Triage Timestamp'}: ${formatDateForReferral(session.timestamp)}
${t('languageLabel') || 'Language of Triage'}: ${session.language.toUpperCase()}

${t('recommendedAppointmentLabel') || 'Recommended Appointment Type'}:
${session.recommendation.appointmentType}

${t('aiTriageSummaryLabel') || 'AI Triage Summary & Reason'}:
${session.recommendation.reason}

${t('emergencyAlertDuringTriageLabel') || 'Emergency Alert During Triage'}: ${session.emergencyAlertTriggered ? (t('yes')+' - '+ (t('followEmergencyProtocols') || 'Follow emergency protocols if applicable')) : t('no')}

--------------------------------------------------
${t('forClinicUseTitle') || 'FOR CLINIC USE:'}
--------------------------------------------------
${t('patientNameLabel') || 'Patient Name (if known)'}: _________________________
${t('patientContactNumberLabel') || 'Patient Contact Number'}: _________________________
${t('unitSectionLabel') || 'Unit / Section (if applicable)'}: ____________________

${t('appointmentScheduledLabel') || 'Appointment Scheduled'}: [ ] ${t('yes')} [ ] ${t('no')}
${t('scheduledDateTimeLabel') || 'Scheduled Date & Time'}: _________________________
${t('clinicianAssignedLabel') || 'Clinician Assigned'}: ____________________________
${t('confirmationSentLabel') || 'Confirmation Sent to Member'}: [ ] ${t('yes')} [ ] ${t('no')}
${t('clerkInitialsLabel') || 'Clerk Initials'}: _________
${t('notesLabel') || 'Notes'}:
__________________________________________________
__________________________________________________
__________________________________________________

--------------------------------------------------
${t('chatTranscriptSnippetTitle') || 'Chat Transcript Snippet (Last few messages for context)'}:
${getLastMessages(session.chatHistory)}
--------------------------------------------------
  `.trim();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralText)
      .then(() => {
        toast({ title: t('copiedToClipboardMessage') || 'Copied to clipboard!' });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({ title: t('copyToClipboardFailed') || 'Failed to copy.', variant: 'destructive' });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <FileText className="w-7 h-7 mr-2 text-primary" />
            {t('prepareForClinicModalTitle') || 'Prepare Session for Clinic Scheduling'}
          </DialogTitle>
          <DialogDescription>
            {t('prepareForClinicModalDesc') || 'Review the session details formatted for clinic use. You can copy this information to assist with scheduling.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-1 -mx-1 my-2 text-sm">
          <pre className="p-4 border rounded-md bg-muted/30 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
            {referralText}
          </pre>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose}>{t('closeButton') || 'Close'}</Button>
          <Button onClick={handleCopyToClipboard}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            {t('copyToClipboardButton') || 'Copy to Clipboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

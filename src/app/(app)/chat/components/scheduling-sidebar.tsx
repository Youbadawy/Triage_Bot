
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, AlertCircle } from 'lucide-react'; // Added icons
import type { AppointmentRecommendation } from '@/types';
import { useLanguage } from '@/contexts/language-context';

interface SchedulingSidebarProps {
  recommendation: AppointmentRecommendation | null;
  // isOpen: boolean; // Controlled by parent now
  onClose: () => void; // To allow clearing the recommendation from parent
}

export function SchedulingSidebar({ recommendation, onClose }: SchedulingSidebarProps) {
  const { t } = useLanguage();

  if (!recommendation) {
    return null;
  }

  const isERReferral = recommendation.appointmentType.toLowerCase().includes('er referral');


  return (
    <div className="w-full md:w-1/3 lg:w-1/4 border-l bg-card flex flex-col shadow-lg print:hidden">
      <CardHeader className="p-4 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            {isERReferral ? <AlertCircle className="h-5 w-5 mr-2 text-destructive" /> : <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />}
            {t('triageResults')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('closeButton') || 'Close'}>
            <X className="h-4 w-4" />
          </Button>
        </div>
         <CardDescription className={`text-xs ${isERReferral ? 'text-destructive/80' : 'text-muted-foreground'}`}>
            {t('triageResultsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4 overflow-y-auto flex-grow">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground">{t('recommendedAppointmentLabel') || 'Recommended Appointment'}:</h4>
          <p className={`text-md font-medium ${isERReferral ? 'text-destructive' : 'text-primary'}`}>
            {recommendation.appointmentType}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground">{t('reasonLabel')}:</h4>
          <p className="text-sm text-card-foreground whitespace-pre-wrap break-words">{recommendation.reason}</p>
        </div>
         {isERReferral && (
          <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-destructive text-sm">
            <p className="font-medium">{t('urgentActionRequired')}</p>
            <p>{t('erReferralInstruction')}</p>
          </div>
        )}
        <div className="mt-auto pt-4">
          <Button className="w-full" onClick={() => alert(t('scheduleFunctionalityComingSoon') || 'Scheduling functionality coming soon!')}>
            {t('scheduleButton') || 'Schedule Appointment'}
          </Button>
        </div>
      </CardContent>
    </div>
  );
}

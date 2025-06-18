
'use client';

import type { AppointmentRecommendation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface RecommendationDisplayProps {
  recommendation: AppointmentRecommendation | null;
}

// This component is currently not used in chat/page.tsx as the functionality
// has been integrated into SchedulingSidebar or directly into chat messages.
// It's kept here in case it's needed for other display purposes or future refactoring.
export function RecommendationDisplay({ recommendation }: RecommendationDisplayProps) {
  const { t } = useLanguage();

  if (!recommendation) {
    return null;
  }

  const isERReferral = recommendation.appointmentType.toLowerCase().includes('er referral');

  return (
    <Card className={`my-4 shadow-lg ${isERReferral ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/5'}`}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          {isERReferral ? <AlertCircle className="h-6 w-6 text-destructive" /> : <CheckCircle2 className="h-6 w-6 text-primary" />}
          <CardTitle className={`text-xl font-headline ${isERReferral ? 'text-destructive' : 'text-primary'}`}>
            {t('triageResults')}
          </CardTitle>
        </div>
        <CardDescription className={isERReferral ? 'text-destructive/80' : 'text-muted-foreground'}>
          {t('triageResultsDescription') || 'Based on your symptoms, here is our recommendation:'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold text-base">{t('recommendation')}:</h4>
          <p className={`text-lg font-medium ${isERReferral ? 'text-destructive' : 'text-primary'}`}>
            {recommendation.appointmentType}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-base">{t('reasonLabel')}:</h4>
          <p className="text-muted-foreground">{recommendation.reason}</p>
        </div>
        {isERReferral && (
          <div className="rounded-md border border-destructive bg-destructive/5 p-3 text-destructive">
            <p className="font-medium">{t('urgentActionRequired') || 'Urgent Action Required:'}</p>
            <p className="text-sm">{t('erReferralInstruction') || 'Please proceed to the nearest Emergency Room immediately or contact emergency services (911).'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

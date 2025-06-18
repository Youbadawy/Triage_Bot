
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { AppointmentRecommendation } from '@/types';
import { useLanguage } from '@/contexts/language-context';

interface SchedulingSidebarProps {
  recommendation: AppointmentRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SchedulingSidebar({ recommendation, isOpen, onClose }: SchedulingSidebarProps) {
  const { t } = useLanguage();

  if (!isOpen || !recommendation) {
    return null;
  }

  return (
    <div className="w-full md:w-1/3 border-l bg-gray-50 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t('schedulingSidebarTitle') || 'Next Steps'}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('recommendationTitle') || 'Recommendation'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>{t('appointmentTypeLabel') || 'Appointment Type:'}</strong> {recommendation.appointmentType}</p>
          <p><strong>{t('reasonLabel') || 'Reason:'}</strong> {recommendation.reason}</p>
          <div className="mt-4">
            <Button className="w-full">{t('scheduleButton') || 'Schedule Appointment'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

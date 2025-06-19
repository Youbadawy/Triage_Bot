
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { BookText } from 'lucide-react';

export default function ReferencesPage() {
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <BookText className="h-7 w-7 mr-3 text-primary" />
            <CardTitle className="text-2xl font-headline">
              {t('referencesPageTitle') || 'References & LLM Prompts'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('referencesPageDesc') || 'This page contains information about the policies, guidelines, and the exact prompts used by the AI assistant.'}
          </p>
          <p className="mt-4">Reference content has been temporarily simplified to aid in diagnosing a startup issue. The full content will be restored once the issue is resolved.</p>
        </CardContent>
      </Card>
    </div>
  );
}

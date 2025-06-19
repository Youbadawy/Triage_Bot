
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { BookText } from 'lucide-react';

export default function ReferencesPage() {
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <BookText className="h-7 w-7 mr-3 text-primary" />
            <CardTitle className="text-2xl font-headline">
              {t('referencesPageTitle') || 'References'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('referencesPageDesc') || 'This page will contain information about the policies, guidelines, and sources used by the AI assistant.'}
          </p>
          <div className="mt-6 prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold">{t('placeholderSectionTitle') || 'Content Coming Soon'}</h2>
            <p>
              {t('placeholderSectionContent') || 'The specific references and source materials that inform the AI\'s responses regarding CAF medical policies and routing rules will be detailed here. This ensures transparency and allows users to understand the basis of the AI\'s recommendations.'}
            </p>
            <p>
              {t('placeholderCheckBack') || 'Please check back later for updated information.'}
            </p>
            {/* 
              Future content could include:
              - Links to official CAF policy documents (if publicly available or permitted for internal use display)
              - Summaries of key routing guidelines
              - Versioning information for the knowledge base
              - Contact information for policy clarifications
            */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

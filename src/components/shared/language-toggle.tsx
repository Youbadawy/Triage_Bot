'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label={t('toggleLanguage', { lang: language === 'en' ? 'Français' : 'English' })}>
      <Languages className="h-5 w-5" />
      <span className="sr-only">{language === 'en' ? 'Switch to French' : 'Switch to English'}</span>
    </Button>
  );
}

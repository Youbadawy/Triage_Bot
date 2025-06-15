'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { UserNav } from './user-nav';
import { LanguageToggle } from './language-toggle';
import { useLanguage } from '@/contexts/language-context';
import { HeartPulse } from 'lucide-react';

export function Navbar() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <HeartPulse className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block font-headline">
            {t('appName')}
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <LanguageToggle />
          {!loading && (user ? (
            <UserNav />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">{t('loginButton')}</Link>
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}


'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useLanguage } from '@/contexts/language-context';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login'); 
      } else if (!isAdmin) {
        router.replace('/chat'); 
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !isAdmin) {
    
    let message = t('loadingAdmin') || "Loading admin section...";
    if (!loading && user && !isAdmin) {
      message = t('adminAccessDenied') || "Access Denied. You are not an administrator.";
    } else if (!loading && !user && !isAdmin) { 
       message = t('adminNotAuthenticated') || "Please login to access this section.";
    }


    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center text-center p-4">
        {(!loading && ((user && !isAdmin) || !user)) && <ShieldAlert className="w-16 h-16 text-destructive mb-4" />}
        <p className="text-lg mb-4">{message}</p>
        {(loading) && <LoadingSpinner size={48} /> }
        {(!loading && ((user && !isAdmin) || !user)) && 
          <Button onClick={() => router.push('/chat')} className="mt-4">{t('backToApp') || "Back to App"}</Button>
        }
      </div>
    );
  }
  // Removed container and py-8, SidebarInset will handle padding
  return <div className="p-4 sm:p-6 md:p-8">{children}</div>; 
}

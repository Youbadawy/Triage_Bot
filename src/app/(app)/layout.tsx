
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/shared/navbar';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { MessageSquareText, LayoutDashboard, HeartPulse, BookText } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center space-x-2">
            <HeartPulse className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg font-headline group-data-[collapsible=icon]:hidden">
              {t('appName')}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/chat'}
                tooltip={t('chatWithAI')}
              >
                <Link href="/chat">
                  <MessageSquareText />
                  <span>{t('chatWithAI')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname.startsWith('/admin')}
                  tooltip={t('adminDashboard')}
                >
                  <Link href="/admin/dashboard">
                    <LayoutDashboard />
                    <span>{t('adminDashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/references'}
                tooltip={t('referencesMenuItem')}
              >
                <Link href="/references">
                  <BookText />
                  <span>{t('referencesMenuItem')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* UserNav is in the top Navbar, so footer can be minimal or for other links if needed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Navbar />
        <main className="flex-1 bg-background"> {/* Ensure main content area has a background */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

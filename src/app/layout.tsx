import type { Metadata } from 'next';
// Import Inter directly if not using variable, or keep variable if used in tailwind.config
// import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context'; 

// const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CAF MedRoute', // This will be overridden by LanguageContext if t('appName') is used
  description: 'Canadian Armed Forces Medical Triage Assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang attribute will be set by LanguageProvider effect
    <html suppressHydrationWarning> 
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      {/* Use inter.variable if Inter font variable is defined and used in tailwind.config.ts for font-body/font-headline */}
      {/* <body className={`${inter.variable} font-body antialiased`}> */}
      <body className={`font-body antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

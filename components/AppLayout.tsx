'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Sidebar } from '@/components/Sidebar';
import { AppDataProvider } from '@/lib/AppDataContext';
import { useAuth } from '@/lib/AuthContext';
import { SidebarProvider } from '@/lib/SidebarContext';
import { cn } from '@/lib/utils';

import { FullScreenLoader } from './FullScreenLoader';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  requireAuth?: boolean;
}

function AppLayoutInner({
  children,
  className,
  requireAuth = true,
}: AppLayoutProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (requireAuth && !authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router, requireAuth]);

  // For auth pages (login, signup, etc.), render without dashboard layout
  if (!requireAuth) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Loading state for dashboard pages
  if (authLoading) {
    return <FullScreenLoader />;
  }

  // Redirect if not authenticated (this should be handled by useEffect, but just in case)
  if (!user) {
    return null;
  }

  // Dashboard layout with unified padding
  return (
    <AppDataProvider uid={user.uid}>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            'flex-1 min-h-0 overflow-y-auto bg-muted/10 transition-all duration-300 ',
            // Mobile: no margin (sidebar is overlay when open)
            'ml-0',
            // Desktop: margin based on sidebar state
            'md:px-8',
            // Unified padding for all dashboard pages
            'md:p-6 p-2',
            className
          )}
        >
          <div className="md:hidden h-4" />{' '}
          {/* Spacer for mobile menu button */}
          <div className="max-w-6xl mx-auto space-y-8 px-6 py-10">
            {children}
          </div>
        </main>
      </div>
    </AppDataProvider>
  );
}

export function AppLayout({
  children,
  className,
  requireAuth = true,
}: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutInner className={className} requireAuth={requireAuth}>
        {children}
      </AppLayoutInner>
    </SidebarProvider>
  );
}

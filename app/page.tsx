'use client';

import { AppLayout } from '@/components/AppLayout';
import { Dashboard } from '@/components/Dashboard';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { LandingPage } from '@/components/LandingPage';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

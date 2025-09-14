'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { FullScreenLoader } from '@/components/FullScreenLoader';
import { WorkoutDashboard } from '@/components/WorkoutDashboard';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <FullScreenLoader />
    );
  }

  return (
    <div className="container mx-auto p-4">
      <WorkoutDashboard />
    </div>
  );
}

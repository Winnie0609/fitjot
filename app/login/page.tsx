'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { FullScreenLoader } from '@/components/FullScreenLoader';
import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <FullScreenLoader />;
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <LoginForm />
    </div>
  );
}

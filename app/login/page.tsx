'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppLayout } from '@/components/AppLayout';
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

  return (
    <AppLayout requireAuth={false}>
      <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
        <LoginForm />
      </div>
    </AppLayout>
  );
}

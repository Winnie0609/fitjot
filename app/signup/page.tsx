'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppLayout } from '@/components/AppLayout';
import { SignUpForm } from '@/components/SignUpForm';
import { useAuth } from '@/lib/AuthContext';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <AppLayout requireAuth={false}>
      <div className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
        <SignUpForm />
      </div>
    </AppLayout>
  );
}

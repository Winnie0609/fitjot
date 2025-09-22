'use client';

import { AppLayout } from '@/components/AppLayout';
import { WorkoutDashboard } from '@/components/WorkoutDashboard';

export default function WorkoutPage() {
  return (
    <AppLayout>
      <WorkoutDashboard />
    </AppLayout>
  );
}

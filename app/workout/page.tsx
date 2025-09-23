import { AppLayout } from '@/components/AppLayout';
import { WorkoutDashboard } from '@/components/WorkoutSession';
import { getExercises } from '@/lib/db';

export default async function WorkoutPage() {
  const exerciseData = await getExercises();

  return (
    <AppLayout>
      <WorkoutDashboard exerciseData={exerciseData} />
    </AppLayout>
  );
}

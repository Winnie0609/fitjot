import { InBodyDataDocument, WorkoutSessionDocument } from '@/lib/types';

export interface SummaryInfo {
  latestWorkout: {
    date: Date | null;
    mood: WorkoutSessionDocument['mood'] | null;
  };
  latestInBody: {
    date: Date | null;
    weightDelta: number | null;
    pbfDelta: number | null;
    smmDelta: number | null; // skeletal muscle mass
    weight: number | null;
    pbf: number | null;
    smm: number | null;
  };
}

// Helper to get workout categories based on exercise names
export function getWorkoutCategories(exercises: { name: string }[]): string[] {
  const categories = new Set<string>();

  exercises.forEach((ex) => {
    const name = ex.name.toLowerCase();
    if (
      name.includes('squat') ||
      name.includes('leg') ||
      name.includes('quad') ||
      name.includes('calf') ||
      name.includes('glute')
    ) {
      categories.add('Legs');
    } else if (
      name.includes('bench') ||
      name.includes('chest') ||
      name.includes('pec')
    ) {
      categories.add('Chest');
    } else if (
      name.includes('shoulder') ||
      name.includes('delt') ||
      (name.includes('press') && !name.includes('leg'))
    ) {
      categories.add('Shoulders');
    } else if (
      name.includes('back') ||
      name.includes('row') ||
      name.includes('pull') ||
      name.includes('lat')
    ) {
      categories.add('Back');
    } else if (
      name.includes('bicep') ||
      (name.includes('curl') && !name.includes('leg'))
    ) {
      categories.add('Arms');
    } else if (name.includes('tricep') || name.includes('dip')) {
      categories.add('Arms');
    } else if (
      name.includes('core') ||
      name.includes('ab') ||
      name.includes('plank')
    ) {
      categories.add('Core');
    } else {
      categories.add('Other');
    }
  });

  return Array.from(categories);
}

export function computeSummaryInfo(
  sessions: WorkoutSessionDocument[],
  inbodies: (InBodyDataDocument & { id: string })[]
): SummaryInfo {
  const latestWorkout = sessions.length
    ? sessions
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
    : null;

  const sortedInBody = inbodies.slice().sort((a, b) => {
    const ad = a.reportDate ? new Date(a.reportDate).getTime() : 0;
    const bd = b.reportDate ? new Date(b.reportDate).getTime() : 0;
    return bd - ad;
  });

  const latest = sortedInBody[0];
  const prev = sortedInBody[1];

  const weight = latest?.bodyComposition?.totalWeight?.value ?? null;
  const pbf = latest?.bodyComposition?.pbf?.value ?? null;
  const smm = latest?.bodyComposition?.skeletalMuscleMass?.value ?? null;

  const prevWeight = prev?.bodyComposition?.totalWeight?.value ?? null;
  const prevPbf = prev?.bodyComposition?.pbf?.value ?? null;
  const prevSmm = prev?.bodyComposition?.skeletalMuscleMass?.value ?? null;

  return {
    latestWorkout: {
      date: latestWorkout ? new Date(latestWorkout.date) : null,
      mood: latestWorkout?.mood ?? null,
    },
    latestInBody: {
      date: latest?.reportDate ? new Date(latest.reportDate) : null,
      weight,
      pbf,
      smm,
      weightDelta:
        weight !== null && prevWeight !== null
          ? Number((weight - prevWeight).toFixed(1))
          : null,
      pbfDelta:
        pbf !== null && prevPbf !== null
          ? Number((pbf - prevPbf).toFixed(1))
          : null,
      smmDelta:
        smm !== null && prevSmm !== null
          ? Number((smm - prevSmm).toFixed(1))
          : null,
    },
  };
}

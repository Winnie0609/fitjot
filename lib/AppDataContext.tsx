'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getExercises, getInBodyData, getWorkoutSessions } from '@/lib/db';
import {
  ExerciseData,
  InBodyDataDocument,
  WorkoutSessionDocument,
} from '@/lib/types';

interface AppDataContextValue {
  loading: boolean;
  error: string | null;
  workoutSessions: WorkoutSessionDocument[];
  inBodyRecords: (InBodyDataDocument & { id: string })[];
  exercises: ExerciseData[];
  // Time range filtering for dashboard components
  timeRange: 'week' | 'month' | 'all';
  setTimeRange: (range: 'week' | 'month' | 'all') => void;
  filteredWorkoutSessions: WorkoutSessionDocument[];
  // weeklySummaryData: { date: string; sessions: number; volume: number }[];
  // latestInBody: (Record<string, unknown> & { id: string }) | null;
  // topExercises: { exerciseId: string; name: string; count: number }[];
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(
  undefined
);

export function AppDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutSessions, setWorkoutSessions] = useState<
    WorkoutSessionDocument[]
  >([]);
  const [inBodyRecords, setInBodyRecords] = useState<
    (InBodyDataDocument & { id: string })[]
  >([]);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, i, e] = await Promise.all([
        getWorkoutSessions({ uid }),
        getInBodyData({ uid }),
        getExercises(),
      ]);
      setWorkoutSessions(s);
      setInBodyRecords(
        i as unknown as Array<InBodyDataDocument & { id: string }>
      );
      setExercises(e);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    // Fetch once after login
    void fetchAll();
  }, [fetchAll]);

  // Helper: compute start date for filtering
  const rangeStartDate = useMemo(() => {
    const now = new Date();
    if (timeRange === 'all') return null;
    if (timeRange === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6); // last 7 days including today
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // month: last 30 days (simple, avoids month length edge cases)
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [timeRange]);

  const filteredWorkoutSessions = useMemo(() => {
    if (!rangeStartDate) return workoutSessions;
    return workoutSessions.filter((s) => {
      const d = new Date(s.date);
      return d >= rangeStartDate;
    });
  }, [workoutSessions, rangeStartDate]);

  // Summary computations moved to lib/summary.ts

  // const topExercises = useMemo(() => {
  //   const countMap = new Map<string, { name: string; count: number }>();
  //   for (const s of sessions) {
  //     for (const ex of s.exercises ?? []) {
  //       const key = ex.exerciseId || ex.name;
  //       const name = ex.name;
  //       const prev = countMap.get(key) || { name, count: 0 };
  //       prev.count += 1;
  //       countMap.set(key, prev);
  //     }
  //   }
  //   const arr = Array.from(countMap.entries()).map(([exerciseId, v]) => ({
  //     exerciseId,
  //     name: v.name,
  //     count: v.count,
  //   }));
  //   arr.sort((a, b) => b.count - a.count);
  //   return arr.slice(0, 5);
  // }, [sessions]);

  const value: AppDataContextValue = {
    loading,
    error,
    workoutSessions,
    inBodyRecords,
    exercises,
    timeRange,
    setTimeRange,
    filteredWorkoutSessions,
    // weeklySummaryData,
    // latestInBody,
    // topExercises,
    refresh: fetchAll,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

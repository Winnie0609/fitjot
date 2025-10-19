'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useMemo, useState } from 'react';

import { getInBodyData, getUser, getWorkoutSessions } from '@/lib/db';
import {
  InBodyDataDocument,
  UserProfile,
  WorkoutSessionDocument,
} from '@/lib/types';

interface AppDataContextValue {
  loading: boolean;
  error: string | null;
  workoutSessions: WorkoutSessionDocument[];
  userProfile: UserProfile | null;
  inBodyRecords: (InBodyDataDocument & { id: string })[];
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
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Query for workout sessions with React Query
  const {
    data: workoutSessions = [],
    isLoading: workoutLoading,
    error: workoutError,
  } = useQuery({
    queryKey: ['workoutSessions', uid],
    queryFn: () => getWorkoutSessions({ uid }),
    enabled: !!uid, // Only run query if uid exists
  });

  // Query for InBody records with React Query
  const {
    data: inBodyRecords = [],
    isLoading: inBodyLoading,
    error: inBodyError,
  } = useQuery({
    queryKey: ['inBodyRecords', uid],
    queryFn: async () => {
      const data = await getInBodyData({ uid });
      return data as unknown as Array<InBodyDataDocument & { id: string }>;
    },
    enabled: !!uid, // Only run query if uid exists
  });

  const {
    data: userProfile = null,
    isLoading: userProfileLoading,
    error: userProfileError,
  } = useQuery({
    queryKey: ['userProfile', uid],
    queryFn: () => getUser({ uid }),
    enabled: uid ? true : false,
  });

  const loading = workoutLoading || inBodyLoading || userProfileLoading;
  const error =
    workoutError?.message ||
    inBodyError?.message ||
    userProfileError?.message ||
    null;

  // Refresh function - invalidate cache and refetch
  const refresh = async () => {
    // Invalidate cache to ensure data is fresh after mutations
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['workoutSessions', uid],
      }),
      queryClient.invalidateQueries({
        queryKey: ['inBodyRecords', uid],
      }),
      queryClient.invalidateQueries({
        queryKey: ['userProfile', uid],
      }),
    ]);
  };

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
    timeRange,
    setTimeRange,
    filteredWorkoutSessions,
    userProfile,
    // weeklySummaryData,
    // latestInBody,
    // topExercises,
    refresh,
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

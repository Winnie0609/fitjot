'use client';

import {
  BarChart3,
  Dumbbell,
  Frown,
  Meh,
  Plus,
  Smile,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useAppData } from '@/lib/AppDataContext';
import { useAuth } from '@/lib/AuthContext';
import { computeSummaryInfo } from '@/lib/summary';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalInBodyRecords: 0,
    recentWorkouts: 0,
    recentInBodyRecords: 0,
  });
  const router = useRouter();
  const { workoutSessions, inBodyRecords, loading, filteredWorkoutSessions } =
    useAppData();

  useEffect(() => {
    if (!user || loading) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWorkouts = workoutSessions.filter((session) => {
      const created = session.createdAt ? new Date(session.createdAt) : null;
      return !!created && created > thirtyDaysAgo;
    });

    const recentInBody = inBodyRecords.filter((record) => {
      const date = record.reportDate ? new Date(record.reportDate) : null;
      return !!date && date > thirtyDaysAgo;
    });

    setStats({
      totalWorkouts: workoutSessions.length,
      totalInBodyRecords: inBodyRecords.length,
      recentWorkouts: recentWorkouts.length,
      recentInBodyRecords: recentInBody.length,
    });
  }, [user, loading, workoutSessions, inBodyRecords]);

  // Summary computations (pure): latest workout/mood + latest InBody (with deltas)
  const summary = computeSummaryInfo(filteredWorkoutSessions, inBodyRecords);

  const statCards = [
    {
      title: 'Total Workouts',
      value: stats.totalWorkouts,
      change: `+${stats.recentWorkouts} this month`,
      icon: Dumbbell,
      color: 'text-blue-600',
    },
    {
      title: 'InBody Records',
      value: stats.totalInBodyRecords,
      change: `+${stats.recentInBodyRecords} this month`,
      icon: BarChart3,
      color: 'text-green-600',
    },
    {
      title: 'This Month',
      value: stats.recentWorkouts + stats.recentInBodyRecords,
      change: 'Combined activities',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex justify-between gap-4 flex-col md:items-center md:flex-row items-start md:gap-0">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome Back, {user?.displayName}.
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your fitness overview.
          </p>
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            onClick={() => router.push('/workout')}
            className="bg-secondary hover:bg-primary/10 cursor-pointer"
          >
            <CardContent className="flex items-center justify-center  font-semibold">
              <Plus className="h-4 w-4 mr-2 text-primary font-bold" />
              Add New Session
            </CardContent>
          </Card>
          <Card
            onClick={() => router.push('/inbody')}
            className="bg-secondary hover:bg-primary/10 cursor-pointe"
          >
            <CardContent className="flex items-center justify-center font-semibold">
              <Plus className="h-4 w-4 mr-2 text-primary font-bold" />
              Add New Record
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Summary */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        {/* <WeeklyCalendarData className="mb-4" /> */}
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Latest Workout - Compact Card */}
          <Card className="md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground uppercase">
                    Latest Workout
                  </div>
                  <div className="flex items-center gap-2 flex-col md:flex-row">
                    <p className="text-lg font-semibold">
                      {loading
                        ? '-'
                        : summary.latestWorkout.date
                        ? new Date(
                            summary.latestWorkout.date
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>
                    {summary.latestWorkout.mood === 'happy' && (
                      <Smile className="h-4 w-4 text-green-600" />
                    )}
                    {summary.latestWorkout.mood === 'neutral' && (
                      <Meh className="h-4 w-4 text-amber-600" />
                    )}
                    {summary.latestWorkout.mood === 'sad' && (
                      <Frown className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  {/* Exercise preview */}
                  {!loading && filteredWorkoutSessions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {filteredWorkoutSessions[0]?.exercises
                        ?.slice(0, 2)
                        .map((ex, _) => ex.name)
                        .join(', ')}
                      {(filteredWorkoutSessions[0]?.exercises?.length || 0) >
                        2 && ' +more'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest InBody - Compact Card */}
          <Card className="md:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground uppercase">
                    Latest InBody
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <p className="text-lg font-semibold">
                      {loading
                        ? '-'
                        : summary.latestInBody.date
                        ? new Date(
                            summary.latestInBody.date
                          ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>

                    {!loading && summary.latestInBody.weight && (
                      <div className="gap-2 md:flex-row flex-col text-xs flex items-center gap-4 flex-wrap">
                        <div>
                          <div className="font-medium text-xl">
                            {summary.latestInBody.weight}kg
                            {summary.latestInBody.weightDelta !== null && (
                              <span
                                className={
                                  summary.latestInBody.weightDelta >= 0
                                    ? 'text-red-600 ml-1'
                                    : 'text-green-600 ml-1'
                                }
                              >
                                (
                                {summary.latestInBody.weightDelta >= 0
                                  ? '+'
                                  : ''}
                                {summary.latestInBody.weightDelta})
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">Weight</span>
                        </div>

                        <div className="text-muted-foreground text-2xl font-regular md:block hidden">
                          |
                        </div>
                        <div>
                          <div className="font-medium text-xl">
                            {summary.latestInBody.pbf}%
                            {summary.latestInBody.pbfDelta !== null && (
                              <span
                                className={
                                  summary.latestInBody.pbfDelta >= 0
                                    ? 'text-red-600 ml-1'
                                    : 'text-green-600 ml-1'
                                }
                              >
                                ({summary.latestInBody.pbfDelta >= 0 ? '+' : ''}
                                {summary.latestInBody.pbfDelta})
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">PBF</span>
                        </div>
                        <div className="text-muted-foreground text-2xl font-regular md:block hidden">
                          |
                        </div>
                        <div>
                          <div className="font-medium text-xl">
                            {summary.latestInBody.smm}kg
                            {summary.latestInBody.smmDelta !== null && (
                              <span
                                className={
                                  summary.latestInBody.smmDelta >= 0
                                    ? 'text-green-600 ml-1'
                                    : 'text-red-600 ml-1'
                                }
                              >
                                ({summary.latestInBody.smmDelta >= 0 ? '+' : ''}
                                {summary.latestInBody.smmDelta})
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">SMM</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* <BarChart3 className="h-4 w-4 text-muted-foreground" /> */}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="gap-4">
                <Icon
                  className={`h-10 w-10 ${stat.color} ml-6 p-3 bg-secondary rounded-full`}
                />
                <CardContent>
                  <div className="text-4xl font-bold">
                    {loading ? '-' : stat.value}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase">
                    {stat.title}
                  </div>
                  {/* <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p> */}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-muted-foreground">More analysis coming soon...</p>
    </div>
  );
}

'use client';

import { BarChart3, Dumbbell, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { getInBodyData, getWorkoutSessions } from '@/lib/db';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalInBodyRecords: 0,
    recentWorkouts: 0,
    recentInBodyRecords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        setIsLoading(true);
        const [workoutSessions, inBodyRecords] = await Promise.all([
          getWorkoutSessions({ uid: user.uid }),
          getInBodyData({ uid: user.uid }),
        ]);

        // Calculate recent records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentWorkouts = workoutSessions.filter(
          (session) =>
            session.createdAt && new Date(session.createdAt) > thirtyDaysAgo
        );

        const recentInBodyRecords = inBodyRecords.filter(
          (record) =>
            record.reportDate && new Date(record.reportDate as string) > thirtyDaysAgo
        );

        setStats({
          totalWorkouts: workoutSessions.length,
          totalInBodyRecords: inBodyRecords.length,
          recentWorkouts: recentWorkouts.length,
          recentInBodyRecords: recentInBodyRecords.length,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const quickActions = [
    {
      title: 'New Workout Session',
      description: 'Log your latest workout session',
      icon: Dumbbell,
      href: '/workout',
      action: 'workout',
      color: 'bg-blue-500',
    },
    {
      title: 'New InBody Record',
      description: 'Add your latest body composition data',
      icon: BarChart3,
      href: '/inbody',
      action: 'inbody',
      color: 'bg-green-500',
    },
  ];

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
    <div className="px-6 py-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Hello, {user?.displayName}!</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your fitness overview.
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.action}
                className="hover:shadow-md transition-shadow cursor-pointer group"
              >
                <Link href={action.href}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-lg ${action.color} text-white`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stats Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? '-' : stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Activity Placeholder */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Recent activity timeline coming soon...</p>
              <p className="text-sm">
                Track your progress and see your latest workouts and body
                composition updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

'use client';

import {
  Activity,
  BarChart3,
  Dumbbell,
  Frown,
  Meh,
  Plus,
  Smile,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppData } from '@/lib/AppDataContext';
import { useAuth } from '@/lib/AuthContext';
import { computeSummaryInfo, getWorkoutCategories } from '@/lib/summary';

export function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    inBodyRecords,
    filteredInBodyRecords,
    workoutSessions,
    filteredWorkoutSessions,
    loading,
    timeRange,
    setTimeRange,
  } = useAppData();

  // Calculate stats based on ALL data (not filtered)
  const stats = useMemo(() => {
    if (loading) {
      return {
        totalWorkouts: 0,
        totalInBodyRecords: 0,
        workoutFrequency: 0,
        mostTrainedMuscle: 'None',
      };
    }

    // Calculate workout frequency (last 7 days) using ALL data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const uniqueDays = new Set(
      workoutSessions
        .map((session) => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime();
        })
        .filter((timestamp) => {
          const date = new Date(timestamp);
          return date >= sevenDaysAgo;
        })
    );

    // Calculate most trained muscle category using ALL data
    const muscleCount = new Map<string, number>();
    workoutSessions.forEach((session) => {
      const categories = getWorkoutCategories(session.exercises);
      categories.forEach((category) => {
        muscleCount.set(category, (muscleCount.get(category) ?? 0) + 1);
      });
    });

    const mostTrainedMuscle =
      muscleCount.size > 0
        ? Array.from(muscleCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : 'None';

    return {
      totalWorkouts: workoutSessions.length,
      totalInBodyRecords: inBodyRecords.length,
      workoutFrequency: uniqueDays.size,
      mostTrainedMuscle,
    };
  }, [workoutSessions, inBodyRecords, loading]);

  // Summary computations using ALL data
  const summary = useMemo(
    () => computeSummaryInfo(workoutSessions, inBodyRecords),
    [workoutSessions, inBodyRecords]
  );

  // Top 5 exercises by frequency
  const topExercises = useMemo(() => {
    const exerciseCount = new Map<string, number>();

    filteredWorkoutSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const name = exercise.name;
        exerciseCount.set(name, (exerciseCount.get(name) ?? 0) + 1);
      });
    });

    return Array.from(exerciseCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredWorkoutSessions]);

  // Workout categories distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const categoryCount = new Map<string, number>();

    filteredWorkoutSessions.forEach((session) => {
      const categories = getWorkoutCategories(session.exercises);
      categories.forEach((category) => {
        categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
      });
    });

    return Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [filteredWorkoutSessions]);

  // Separate InBody trend data for weight and body fat (using filtered data)
  const weightTrendData = useMemo(() => {
    if (!filteredInBodyRecords.length) return [];

    return filteredInBodyRecords
      .filter((record) => record.reportDate)
      .map((record) => ({
        date: new Date(record.reportDate),
        weight: record.bodyComposition?.totalWeight?.value ?? null,
      }))
      .filter((record) => record.weight !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredInBodyRecords]);

  const bodyFatTrendData = useMemo(() => {
    if (!filteredInBodyRecords.length) return [];

    return filteredInBodyRecords
      .filter((record) => record.reportDate)
      .map((record) => ({
        date: new Date(record.reportDate),
        pbf: record.bodyComposition?.pbf?.value ?? null,
      }))
      .filter((record) => record.pbf !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredInBodyRecords]);

  const pieChartConfig = {
    Legs: { label: 'Legs', color: '#3b82f6' },
    Back: { label: 'Back', color: '#ef4444' },
    Chest: { label: 'Chest', color: '#10b981' },
    Shoulders: { label: 'Shoulders', color: '#f59e0b' },
    Arms: { label: 'Arms', color: '#8b5cf6' },
    Core: { label: 'Core', color: '#ec4899' },
    Other: { label: 'Other', color: '#6b7280' },
  };

  const moodIcons = {
    happy: <Smile className="h-5 w-5 text-green-500" />,
    neutral: <Meh className="h-5 w-5 text-yellow-500" />,
    sad: <Frown className="h-5 w-5 text-red-500" />,
  };

  const statCards = [
    {
      title: 'Total Workouts',
      value: stats.totalWorkouts,
      icon: Dumbbell,
      color: 'blue-400',
    },
    {
      title: 'InBody Records',
      value: stats.totalInBodyRecords,
      icon: BarChart3,
      color: 'green-400',
    },
    {
      title: 'Workout Frequency',
      value: stats.workoutFrequency,
      subtitle: 'Last 7 days',
      icon: Activity,
      color: 'purple-400',
    },
    {
      title: 'Most Trained Muscle',
      value: stats.mostTrainedMuscle,
      icon: TrendingUp,
      color: 'orange-400',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold">
          Welcome Back, {user?.displayName}.
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your fitness overview.
        </p>
      </section>

      {/* Quick Access */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card
            onClick={() => router.push('/workout')}
            className="bg-secondary hover:bg-primary/10 cursor-pointer transition-colors px-1"
          >
            <CardContent className="flex items-center justify-center font-semibold">
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={'px-1 py-6'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon
                  className={`h-10 w-10 text-primary bg-muted-foreground/10 rounded-full p-2`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {typeof card.value === 'string' && card.value === 'None'
                    ? '-'
                    : card.value}
                </div>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Latest Summary */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Latest Workout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md font-medium text-muted-foreground">
              Latest Workout
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.latestWorkout.date ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  {summary.latestWorkout.mood && (
                    <div className="text-lg text-muted-foreground mr-4">
                      {moodIcons[summary.latestWorkout.mood]}
                    </div>
                  )}
                  <div className="text-lg font-medium">
                    {summary.latestWorkout.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                {(() => {
                  const latestSession = workoutSessions
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )[0];

                  if (!latestSession?.exercises?.length) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No exercises recorded
                      </p>
                    );
                  }

                  const sessionCategories = getWorkoutCategories(
                    latestSession.exercises
                  );

                  return (
                    <div className="space-y-3">
                      {sessionCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sessionCategories.map((category) => (
                            <span
                              key={category}
                              className="text-xs bg-primary text-white px-2 py-1 rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        {latestSession.exercises.map((exercise) => (
                          <div key={exercise.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{exercise.name}</p>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {exercise.sets.length} sets
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workouts yet</p>
            )}
          </CardContent>
        </Card>

        {/* Latest InBody */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md font-medium text-muted-foreground">
              Latest InBody
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.latestInBody.date ? (
              <div className="space-y-3">
                <div className="text-lg font-medium">
                  {summary.latestInBody.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Weight</div>
                    <div className="text-4xl mb-1 font-semibold">
                      {summary.latestInBody.weight !== null
                        ? `${summary.latestInBody.weight}kg`
                        : 'N/A'}
                    </div>
                    {summary.latestInBody.weightDelta !== null && (
                      <div
                        className={`text-xs ${
                          summary.latestInBody.weightDelta > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {summary.latestInBody.weightDelta > 0 ? '+' : ''}
                        {summary.latestInBody.weightDelta}kg
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Body Fat
                    </div>
                    <div className="text-4xl mb-1 font-semibold">
                      {summary.latestInBody.pbf !== null
                        ? `${summary.latestInBody.pbf}%`
                        : 'N/A'}
                    </div>
                    {summary.latestInBody.pbfDelta !== null && (
                      <div
                        className={`text-xs ${
                          summary.latestInBody.pbfDelta < 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {summary.latestInBody.pbfDelta > 0 ? '+' : ''}
                        {summary.latestInBody.pbfDelta}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No InBody records yet
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Chart Section with Filter */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Analytics</h2>
          <Select
            value={timeRange}
            onValueChange={(value: 'week' | 'month' | 'all') =>
              setTimeRange(value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* InBody Trend Charts */}
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          {/* Weight Trend */}
          {weightTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md font-medium text-muted-foreground">
                  Weight Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ weight: { color: '#3b82f6' } }}
                  className="h-[200px] w-full"
                >
                  <LineChart
                    data={weightTrendData}
                    margin={{ left: -50, right: 20, top: 5, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: Date) => {
                        if (!value) return '';
                        return value.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                      }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={false} />
                    <ChartTooltip
                      content={(props) => {
                        if (!props.active || !props.payload?.length)
                          return null;
                        const data = props.payload[0];
                        const date = props.label;
                        const value = data.value;
                        return (
                          <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-sm shadow-lg">
                            <div className="text-xs text-muted-foreground mb-1">
                              {date instanceof Date
                                ? date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : date}
                            </div>
                            <div className="font-medium">{value} kg</div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#60a5fa"
                      name="Weight"
                      unit=" kg"
                      dot={{ r: 4, fill: '#60a5fa' }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Body Fat Trend */}
          {bodyFatTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md font-medium text-muted-foreground">
                  Body Fat Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ pbf: { color: '#ef4444' } }}
                  className="h-[200px] w-full"
                >
                  <LineChart
                    data={bodyFatTrendData}
                    margin={{ left: -50, right: 20, top: 5, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: Date) => {
                        if (!value) return '';
                        return value.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                      }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={false} />
                    <ChartTooltip
                      content={(props) => {
                        if (!props.active || !props.payload?.length)
                          return null;
                        const data = props.payload[0];
                        const date = props.label;
                        const value = data.value;
                        return (
                          <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-sm shadow-lg">
                            <div className="text-xs text-muted-foreground mb-1">
                              {date instanceof Date
                                ? date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : date}
                            </div>
                            <div className="font-medium">{value}%</div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pbf"
                      stroke="#fb7185"
                      name="Body Fat"
                      unit=" %"
                      dot={{ r: 4, fill: '#fb7185' }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Workout Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Category Pie Chart */}
          {categoryDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md font-medium text-muted-foreground">
                  Workout Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={pieChartConfig}
                  className="h-[250px] w-full max-w-xs mx-auto"
                >
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      label={false}
                    >
                      {categoryDistribution.map((entry, index) => {
                        const greenColors = [
                          '#86efac', // green-300
                          '#4ade80', // green-400
                          '#22c55e', // green-500
                          '#16a34a', // green-600
                          '#15803d', // green-700
                          '#166534', // green-800
                        ];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={greenColors[index] || '#22c55e'}
                          />
                        );
                      })}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                {categoryDistribution.length > 0 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Most:{' '}
                      <span className="font-medium">
                        {categoryDistribution[0].category}
                      </span>
                      {' • '}
                      Least:{' '}
                      <span className="font-medium">
                        {
                          categoryDistribution[categoryDistribution.length - 1]
                            .category
                        }
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top 5 Exercises Bar Chart */}
          {topExercises.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-md font-medium text-muted-foreground">
                  Top 5 Exercises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ count: { color: '#3b82f6' } }}
                  className="h-[250px] w-full"
                >
                  <BarChart
                    data={topExercises}
                    layout="vertical"
                    barCategoryGap={2}
                    margin={{ right: -20, top: 5, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      textAnchor="end"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4} barSize={35}>
                      {topExercises.map((entry, index) => {
                        const colors = [
                          '#60a5fa', // blue-400
                          '#3b82f6', // blue-500
                          '#2563eb', // blue-600
                          '#1d4ed8', // blue-700
                          '#1e40af', // blue-800
                        ];
                        return (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

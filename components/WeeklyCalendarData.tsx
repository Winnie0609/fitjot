import { useState } from 'react';

import { useAppData } from '@/lib/AppDataContext';

import { WeeklyCalendar } from './ui/WeeklyCalendar';

export function WeeklyCalendarData({ className }: { className?: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { workoutSessions } = useAppData();
  const workoutDates = workoutSessions.map((session) => session.date);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <WeeklyCalendar
      className={className}
      selectedDate={selectedDate}
      workoutDates={workoutDates}
      onDateClick={handleDateClick}
    />
  );
}

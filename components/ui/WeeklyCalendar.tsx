'use client';

import { addDays, format, isSameDay, startOfWeek } from 'date-fns';

import { cn } from '@/lib/utils';

interface WeeklyCalendarProps {
  selectedDate?: Date;
  workoutDates?: Date[];
  onDateClick?: (date: Date) => void;
  weekStartDate?: Date;
  className?: string;
}

export function WeeklyCalendar({
  selectedDate = new Date(),
  workoutDates = [],
  onDateClick,
  weekStartDate,
  className,
}: WeeklyCalendarProps) {
  const startDate =
    weekStartDate || startOfWeek(selectedDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(startDate, index)
  );

  const hasWorkout = (date: Date) => {
    return workoutDates.some((workoutDate) => isSameDay(date, workoutDate));
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  return (
    <div
      className={cn(
        'flex justify-between items-center w-full max-w-md',
        className
      )}
    >
      {weekDays.map((date, index) => {
        const dayName = format(date, 'EEE'); // Sun, Mon, Tue...
        const dayNumber = format(date, 'd'); // 1, 2, 3...
        const hasWorkoutDate = hasWorkout(date);
        const isTodayDate = isToday(date);
        const isSelectedDate = isSelected(date);

        return (
          <div
            key={index}
            className={cn(
              'flex flex-col items-center space-y-1 cursor-pointer'
            )}
            onClick={() => handleDateClick(date)}
          >
            {/* day name */}
            <div
              className={cn(
                'text-xs font-medium uppercase tracking-wide',
                isTodayDate ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {dayName}
            </div>

            {/* day number */}
            <div
              className={cn(
                'relative flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200',
                isTodayDate && !isSelectedDate && 'bg-primary text-white',
                isSelectedDate &&
                  'text-primary ring-2 ring-primary ring-offset-0',
                !isTodayDate &&
                  !isSelectedDate &&
                  'text-foreground hover:bg-secondary hover:text-primary',
                isTodayDate &&
                  isSelectedDate &&
                  'text-foreground bg-primary text-white ring-2 ring-primary ring-offset-0'
              )}
            >
              {dayNumber}
            </div>

            {/* workout indicator */}
            <div className="h-1 flex justify-center mt-1">
              {hasWorkoutDate && (
                <div className={cn('w-1 h-1 rounded-full bg-primary')} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

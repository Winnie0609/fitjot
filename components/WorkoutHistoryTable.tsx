'use client';

import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Frown,
  Meh,
  Smile,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWorkoutCategories } from '@/lib/summary';
import { Session, WorkoutSet } from '@/lib/types';

// Helper function to group sets
function groupSets(sets: WorkoutSet[]) {
  const grouped = new Map<
    string,
    { reps: number; weight: number; count: number }
  >();
  sets.forEach((set) => {
    const key = `${set.reps}x${set.weight}`;
    if (grouped.has(key)) {
      grouped.get(key)!.count++;
    } else {
      grouped.set(key, { ...set, count: 1 });
    }
  });
  return Array.from(grouped.values());
}

const moodIcons = {
  happy: <Smile className="h-5 w-5 text-green-500" />,
  neutral: <Meh className="h-5 w-5 text-yellow-500" />,
  sad: <Frown className="h-5 w-5 text-red-500" />,
};

interface WorkoutHistoryTableProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
}

export function WorkoutHistoryTable({
  sessions,
  onEdit,
  onDelete,
}: WorkoutHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (sessionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedRows(newExpanded);
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <p>No workout sessions recorded yet.</p>
        <p>Click &quot;Add New Record&quot; to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="border rounded-lg">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 px-8 bg-muted/30 border-b text-sm font-medium text-muted-foreground">
            <div className="col-span-1"></div>
            <div className="col-span-3">Date</div>
            <div className="col-span-3">Categories</div>
            <div className="col-span-3">Exercises</div>
            <div className="col-span-2"></div>
          </div>

          {/* Table Rows */}
          {sessions.map((session) => {
            const categories = getWorkoutCategories(session.exercises);
            const isExpanded = expandedRows.has(session.id);

            return (
              <div
                data-testid="workout-session-row"
                key={session.id}
                className="border-b last:border-b-0"
              >
                {/* Main Row */}
                <div
                  className="grid grid-cols-12 gap-4 p-4 px-8 hover:bg-muted/20 transition-colors items-center cursor-pointer"
                  onClick={() => toggleRow(session.id)}
                >
                  {/* mood */}
                  <div className="col-span-1">
                    {session.mood && moodIcons[session.mood]}
                  </div>
                  {/* date */}
                  <div className="col-span-3 text-sm">
                    {format(session.date, 'dd MMM yyyy')}
                  </div>
                  {/* categories */}
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {categories.slice(0, 2).map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="text-xs"
                        >
                          {category}
                        </Badge>
                      ))}
                      {categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* exercises */}
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {session.exercises.length} exercises
                  </div>
                  {/* actions */}
                  <div className="col-span-3 flex gap-1 items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(session)}
                      aria-label={`Edit session on ${format(
                        session.date,
                        'dd MMM yyyy'
                      )}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(session.id)}
                      aria-label={`Delete session on ${format(
                        session.date,
                        'dd MMM yyyy'
                      )}`}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 bg-muted/10"
                    onClick={() => toggleRow(session.id)}
                  >
                    <div className="grid gap-4">
                      {session.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="border-l-2 border-primary/20 pl-4"
                        >
                          <h4 className="font-medium text-sm">
                            {exercise.name}
                            {exercise.rpe && (
                              <Badge
                                variant="secondary"
                                className="text-xs ml-2"
                              >
                                RPE {exercise.rpe}
                              </Badge>
                            )}
                          </h4>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {groupSets(exercise.sets).map((set, index) => (
                              <div key={index} className="flex">
                                <span key={index} className="mr-3">
                                  {set.count} × {set.reps} reps @ {set.weight}kg
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {session.notes && (
                        <div className="border-l-2 border-muted pl-4">
                          <h4 className="font-medium text-sm">Notes</h4>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {session.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-3">
        {sessions.map((session) => {
          const categories = getWorkoutCategories(session.exercises);
          const isExpanded = expandedRows.has(session.id);

          return (
            <div
              key={session.id}
              className="border rounded-lg overflow-hidden"
              onClick={() => toggleRow(session.id)}
            >
              {/* Mobile Row Header */}
              <div
                className="p-4 bg-background cursor-pointer"
                onClick={() => toggleRow(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {session.mood && moodIcons[session.mood]}
                    <div>
                      <div className="text-sm">
                        {format(session.date, 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.exercises.length} exercises
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(session)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(session.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Categories on mobile */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-xs"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Mobile Expanded Content */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 bg-muted/10 border-t"
                  onClick={() => toggleRow(session.id)}
                >
                  <div className="space-y-3 mt-3">
                    {session.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="border-l-2 border-primary/20 pl-3"
                      >
                        <h4 className="font-medium text-sm">
                          {exercise.name}
                          {exercise.rpe && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              RPE {exercise.rpe}
                            </Badge>
                          )}
                        </h4>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {groupSets(exercise.sets).map((set, index) => (
                            <div key={index} className="flex">
                              <div key={index} className="mr-3">
                                {set.count} × {set.reps} reps @ {set.weight}kg
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {session.notes && (
                      <div className="border-l-2 border-muted pl-3">
                        <h4 className="font-medium text-sm">Notes</h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {session.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

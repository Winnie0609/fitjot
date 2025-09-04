'use client';

import { format } from 'date-fns';
import { Edit, Frown,Meh, Smile, Trash2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Session, WorkoutSet } from '@/lib/types';

import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

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
  happy: <Smile className="h-6 w-6 text-green-500" />,
  neutral: <Meh className="h-6 w-6 text-yellow-500" />,
  sad: <Frown className="h-6 w-6 text-red-500" />,
};

interface SessionListProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionList({ sessions, onEdit, onDelete }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <p>No workout sessions recorded yet.</p>
        <p>Click &quot;New Session&quot; to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <Collapsible>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {session.mood && moodIcons[session.mood]}
                      {format(session.date, 'M/d/yyyy (E)')}
                    </CardTitle>
                    <CardDescription>
                      {session.exercises.length} exercises
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(session)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(session.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {session.exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <h4 className="font-semibold">
                      {exercise.name}
                      {exercise.rpe && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {' '}
                          (RPE {exercise.rpe})
                        </span>
                      )}
                    </h4>
                    <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                      {groupSets(exercise.sets).map((set, index) => (
                        <li key={index}>
                          {set.count} x {set.reps} reps @ {set.weight} kg
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {session.notes && (
                  <div className="pt-2">
                    <h4 className="font-semibold">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {session.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}

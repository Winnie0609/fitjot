'use client';

import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Frown,
  Meh,
  Plus,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { ElementType, useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Exercise, Session, WorkoutSet } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// Helper to create a new workout set
const createNewSet = (): WorkoutSet => ({
  id: crypto.randomUUID(),
  reps: 0,
  weight: 0,
});

// Helper to create a new exercise
const createNewExercise = (): Exercise => ({
  id: crypto.randomUUID(),
  name: '',
  sets: [createNewSet()],
});

// Initial state for a new session
const initialSessionState: Session = {
  id: crypto.randomUUID(),
  date: new Date(),
  exercises: [createNewExercise()],
  mood: 'happy',
  notes: '',
};

const moods: { name: NonNullable<Session['mood']>; icon: ElementType }[] = [
  { name: 'happy', icon: Smile },
  { name: 'neutral', icon: Meh },
  { name: 'sad', icon: Frown },
];

interface SessionFormProps {
  onSave: (session: Session) => void;
  initialData?: Session | null;
}

export function SessionForm({ onSave, initialData }: SessionFormProps) {
  const [session, setSession] = useState<Session>(
    initialData || initialSessionState
  );
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const initialState = initialData || initialSessionState;
    setSession(initialState);
    setErrors({}); // Reset errors when data changes
  }, [initialData]);

  // --- HANDLER FUNCTIONS ---

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setSession((prev) => {
        const newDate = new Date(selectedDate);
        const existingTime = new Date(prev.date);
        // Preserve time from the old date
        newDate.setHours(existingTime.getHours(), existingTime.getMinutes());
        return { ...prev, date: newDate };
      });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // e.g., "14:30"
    if (!timeValue) return;

    setSession((prev) => {
      const newDate = new Date(prev.date);
      const [hours, minutes] = timeValue.split(':').map(Number);
      newDate.setHours(hours, minutes);
      return { ...prev, date: newDate };
    });
  };

  const handleMoodChange = (mood: NonNullable<Session['mood']>) => {
    setSession((prev) => ({ ...prev, mood }));
  };

  const handleExerciseChange = (
    exId: string,
    field: 'name' | 'rpe',
    value: string | number
  ) => {
    // Clear error for this field on change
    if (field === 'name' && errors[exId]) {
      setErrors((prev) => ({ ...prev, [exId]: undefined }));
    }

    const processedValue =
      field === 'rpe' ? Math.max(0, Number(value)) || '' : value;

    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId ? { ...ex, [field]: processedValue } : ex
      ),
    }));
  };

  const handleSetChange = (
    exId: string,
    setId: string,
    field: 'reps' | 'weight',
    value: number
  ) => {
    const processedValue = Math.max(0, value || 0);
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId ? { ...set, [field]: processedValue } : set
              ),
            }
          : ex
      ),
    }));
  };

  const addExercise = () => {
    setSession((prev) => ({
      ...prev,
      exercises: [...prev.exercises, createNewExercise()],
    }));
  };

  const handleRemoveExerciseRequest = (exId: string) => {
    setExerciseToDelete(exId);
  };

  const performRemoveExercise = () => {
    if (!exerciseToDelete) return;
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseToDelete),
    }));
    setExerciseToDelete(null);
  };

  const addSet = (exId: string) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id === exId) {
          const lastSet =
            ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
          const newSet = {
            id: crypto.randomUUID(),
            reps: lastSet?.reps || 0,
            weight: lastSet?.weight || 0,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      }),
    }));
  };

  const removeSet = (exId: string, setId: string) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.filter((set) => set.id !== setId) }
          : ex
      ),
    }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string | undefined> = {};
    session.exercises.forEach((ex) => {
      if (!ex.name.trim()) {
        newErrors[ex.id] = 'Exercise name is required.';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return; // Block submission
    }

    onSave(session);
    // Only reset the form if we are NOT in edit mode
    if (!initialData) {
      setSession(initialSessionState);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-none pt-0">
      <CardHeader className="px-1 pt-0">
        {/* Title is now handled by the Dialog in the parent component */}
      </CardHeader>
      <CardContent className="space-y-6 px-1 pb-0">
        {/* Date and Mood Section */}
        <div className="flex gap-4 align-start flex-wrap">
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[150px] justify-start text-left font-normal',
                      !session.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {session.date ? (
                      format(session.date, 'P')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={session.date}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                className="w-[110px] [&::-webkit-calendar-picker-indicator]:ml-2 pl-2"
                value={format(session.date, 'HH:mm')}
                onChange={handleTimeChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <div className="flex gap-2">
              {moods.map(({ name, icon: Icon }) => (
                <Button
                  key={name}
                  variant={session.mood === name ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleMoodChange(name)}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-4">
          <Label>Exercises</Label>
          {session.exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="border bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-lg space-y-4"
            >
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={`exercise-name-${exercise.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Exercise Name
                  </Label>
                  <Input
                    id={`exercise-name-${exercise.id}`}
                    placeholder="e.g., Bench Press"
                    value={exercise.name}
                    onChange={(e) =>
                      handleExerciseChange(exercise.id, 'name', e.target.value)
                    }
                    className={cn(errors[exercise.id] && 'border-destructive')}
                  />
                  {errors[exercise.id] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors[exercise.id]}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`rpe-${exercise.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    RPE
                  </Label>
                  <Input
                    id={`rpe-${exercise.id}`}
                    type="number"
                    placeholder="8"
                    className="w-16"
                    value={exercise.rpe}
                    min={0}
                    onChange={(e) =>
                      handleExerciseChange(
                        exercise.id,
                        'rpe',
                        parseInt(e.target.value, 10)
                      )
                    }
                  />
                </div>
              </div>

              {/* Sets */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="w-8 space-y-1">
                    <Label className="text-xs text-muted-foreground">Set</Label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Reps
                    </Label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Weight (kg)
                    </Label>
                  </div>
                  <div className="w-10"></div>
                </div>
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="flex items-center gap-2">
                    <div className="w-8 text-sm font-medium text-muted-foreground text-center">
                      {setIndex + 1}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="12"
                        value={set.reps}
                        min={0}
                        onChange={(e) =>
                          handleSetChange(
                            exercise.id,
                            set.id,
                            'reps',
                            parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="50"
                        value={set.weight}
                        min={0}
                        onChange={(e) =>
                          handleSetChange(
                            exercise.id,
                            set.id,
                            'weight',
                            parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(exercise.id, set.id)}
                    >
                      <X className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Delete Set</span>
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => addSet(exercise.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleRemoveExerciseRequest(exercise.id)}
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                <div className="text-red-500">Remove Exercise</div>
              </Button>
            </div>
          ))}
          <Button variant="secondary" className="w-full" onClick={addExercise}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any thoughts on today's session? e.g., form tips, PRs, etc."
              value={session.notes || ''}
              onChange={(e) =>
                setSession((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end px-1 pt-6">
        <Button onClick={handleSubmit}>Save</Button>
      </CardFooter>
      <AlertDialog
        open={!!exerciseToDelete}
        onOpenChange={(open) => !open && setExerciseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove this exercise and all its
              sets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExerciseToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performRemoveExercise}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
  type Control,
  Resolver,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { z } from 'zod';

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
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Session } from '@/lib/types';
import { cn } from '@/lib/utils';

const setSchema = z.object({
  id: z.string(),
  reps: z.preprocess(
    (val) => (String(val).trim() === '' ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  weight: z.preprocess(
    (val) => (String(val).trim() === '' ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
});

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Exercise name is required.'),
  rpe: z
    .preprocess(
      (val) => (String(val).trim() === '' ? undefined : Number(val)),
      z.number().optional()
    )
    .optional(),
  sets: z.array(setSchema).min(1, 'Add at least one set.'),
});

const sessionSchema = z.object({
  date: z.date(),
  mood: z.enum(['happy', 'neutral', 'sad']),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, 'Add at least one exercise.'),
});

type SessionFormData = z.infer<typeof sessionSchema>;

// Helper to create a new workout set
const createNewSet = () => ({
  id: crypto.randomUUID(),
  reps: 0,
  weight: 0,
});

// Helper to create a new exercise
const createNewExercise = () => ({
  id: crypto.randomUUID(),
  name: '',
  sets: [createNewSet()],
});

const moods: { name: NonNullable<Session['mood']>; icon: ElementType }[] = [
  { name: 'happy', icon: Smile },
  { name: 'neutral', icon: Meh },
  { name: 'sad', icon: Frown },
];

interface SessionFormProps {
  onSave: (session: SessionFormData) => void;
  onClose: () => void;
  initialData?: Session | null;
}

export function SessionForm({
  onSave,
  onClose,
  initialData,
}: SessionFormProps) {
  const [exerciseToDelete, setExerciseToDelete] = useState<number | null>(null);

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema) as Resolver<SessionFormData>,
    defaultValues:
      initialData ||
      (() => ({
        date: new Date(),
        exercises: [createNewExercise()],
        mood: 'happy',
        notes: '',
        rpe: 0,
      }))(),
  });

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: 'exercises',
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const onSubmit = (data: SessionFormData) => {
    onSave(data);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date and Mood Section */}
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date & Time</FormLabel>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[150px] justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'P')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      className="w-[110px]"
                      value={format(field.value, 'HH:mm')}
                      onChange={(e) => {
                        const newDate = new Date(field.value);
                        const [hours, minutes] = e.target.value
                          .split(':')
                          .map(Number);
                        newDate.setHours(hours, minutes);
                        field.onChange(newDate);
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {moods.map(({ name, icon: Icon }) => (
                        <Button
                          key={name}
                          variant={field.value === name ? 'default' : 'outline'}
                          size="icon"
                          type="button"
                          onClick={() => field.onChange(name)}
                        >
                          <Icon className="h-5 w-5" />
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Exercises Section */}
          <div className="space-y-4">
            <FormLabel>Exercises</FormLabel>
            {exerciseFields.map((exercise, exIndex) => (
              <ExerciseField
                key={exercise.id}
                exIndex={exIndex}
                control={form.control}
                onRemoveRequest={() => setExerciseToDelete(exIndex)}
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => appendExercise(createNewExercise())}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Exercise
            </Button>
            <FormMessage>
              {form.formState.errors.exercises?.root?.message}
            </FormMessage>
          </div>

          {/* Notes Section */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any thoughts on today's session? e.g., form tips, PRs, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog
        open={exerciseToDelete !== null}
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
            <AlertDialogAction
              onClick={() => {
                if (exerciseToDelete !== null) {
                  removeExercise(exerciseToDelete);
                  setExerciseToDelete(null);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Sub-component for a single Exercise
function ExerciseField({
  exIndex,
  control,
  onRemoveRequest,
}: {
  exIndex: number;
  control: Control<SessionFormData>;
  onRemoveRequest: () => void;
}) {
  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet,
  } = useFieldArray({
    control,
    name: `exercises.${exIndex}.sets`,
  });

  return (
    <div className="border bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-lg space-y-4">
      <div className="flex items-end gap-2">
        <FormField
          control={control}
          name={`exercises.${exIndex}.name`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-xs text-muted-foreground">
                Exercise Name
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Bench Press" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`exercises.${exIndex}.rpe`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                RPE
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="8"
                  className="w-16"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Sets */}
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="w-8">
            <Label className="text-xs text-muted-foreground">Set</Label>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Reps</Label>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
          </div>
          <div className="w-10" />
        </div>
        {setFields.map((set, setIndex) => (
          <div key={set.id} className="flex items-center gap-2">
            <div className="w-8 text-sm font-medium text-muted-foreground text-center">
              {setIndex + 1}
            </div>
            <FormField
              control={control}
              name={`exercises.${exIndex}.sets.${setIndex}.reps`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input type="number" placeholder="12" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`exercises.${exIndex}.sets.${setIndex}.weight`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input type="number" placeholder="50" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSet(setIndex)}
            >
              <X className="h-4 w-4 text-red-500" />
              <span className="sr-only">Delete Set</span>
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => appendSet(createNewSet())}
      >
        <Plus className="h-4 w-4 mr-2" /> Add Set
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-red-500 hover:text-red-500"
        onClick={onRemoveRequest}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Remove Exercise
      </Button>
    </div>
  );
}

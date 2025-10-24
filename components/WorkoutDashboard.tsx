'use client';

import { format } from 'date-fns';
import { Loader2, Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';

// Lazy load SessionForm - only load when modal opens
const SessionForm = dynamic(
  () =>
    import('@/components/SessionForm').then((mod) => ({
      default: mod.SessionForm,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    ssr: false, // Form doesn't need SSR
  }
);
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
import { WorkoutHistoryTable } from '@/components/WorkoutHistoryTable';
import { useAppData } from '@/lib/AppDataContext';
import { useAuth } from '@/lib/AuthContext';
import { deleteWorkoutSession } from '@/lib/db';
import { type ExerciseData, type Session } from '@/lib/types';

import { Button } from './ui/button';

export function WorkoutDashboard({
  exerciseData,
}: {
  exerciseData: ExerciseData[];
}) {
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { workoutSessions, loading, refresh } = useAppData();

  // No local copy of sessions; render directly from provider
  useEffect(() => {
    if (!user) return;
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleFormClose();
      }
    };
    if (isFormOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormOpen]);

  const handleSessionSaved = async () => {
    // After create/update, refresh provider data
    await refresh();
    handleFormClose();
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (sessionId: string) => {
    const session = (workoutSessions as unknown as Session[]).find(
      (s: Session) => s.id === sessionId
    );
    if (session) {
      setSessionToDelete(session);
    }
  };

  const performDelete = async () => {
    if (!sessionToDelete || !sessionToDelete.id) return;
    setIsDeleting(true);

    try {
      await deleteWorkoutSession({ sessionId: sessionToDelete.id });
      await refresh();
      toast.error(
        `Session for ${format(
          sessionToDelete.date,
          'dd MMM yyyy'
        )} has been deleted.`
      );
      setSessionToDelete(null); // Close the dialog
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    setEditingSession(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSession(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center md:flex-row flex-col gap-4 items-start">
          <div>
            <h1 className="text-3xl font-bold">Workout Sessions</h1>
            <p className="text-muted-foreground">
              Track and manage your workout sessions
            </p>
          </div>

          <Button onClick={handleAddNew} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add New Session
          </Button>
        </div>

        <div data-testid="skeleton-loader" className="overflow-hidden">
          {/* Desktop Table Skeleton */}
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
              {/* Table Rows Skeleton */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b last:border-b-0">
                  <div className="p-4 px-8">
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile List Skeleton */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center md:flex-row flex-col gap-4 items-start">
          <div>
            <h1 className="text-3xl font-bold">Workout Sessions</h1>
            <p className="text-muted-foreground">
              Track and manage your workout sessions
            </p>
          </div>

          <Button onClick={handleAddNew} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add New Session
          </Button>
        </div>

        <WorkoutHistoryTable
          sessions={workoutSessions as unknown as Session[]}
          onEdit={handleEditSession}
          onDelete={handleDeleteRequest}
        />
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="container mx-auto max-w-2xl p-4 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingSession ? 'Edit Session' : 'Create a New Session'}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleFormClose}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <SessionForm
              onSaved={handleSessionSaved}
              onClose={handleFormClose}
              initialData={editingSession}
              exerciseData={exerciseData}
              isFormOpen={isFormOpen}
            />
          </div>
        </div>
      )}

      <AlertDialog
        open={!!sessionToDelete || (!!sessionToDelete && isDeleting)}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete the workout session from{' '}
              <b>
                {sessionToDelete && format(sessionToDelete.date, 'dd MMM yyyy')}
              </b>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSessionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Continue'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import { format } from 'date-fns';
import { Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { SessionForm } from '@/components/SessionForm';
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

  const handleSessionSaved = () => {
    // After create/update, refresh provider data
    void refresh();
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
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
            Add New Record
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
        open={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete the workout session from{' '}
              <b>
                {sessionToDelete && format(sessionToDelete.date, 'dd MMM yyyy')}
              </b>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

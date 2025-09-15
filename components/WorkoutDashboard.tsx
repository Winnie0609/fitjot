'use client';

import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FullScreenLoader } from '@/components/FullScreenLoader';
import { SessionForm } from '@/components/SessionForm';
import { SessionList } from '@/components/SessionList';
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
import { useAuth } from '@/lib/AuthContext';
import {
  addWorkoutSession,
  deleteWorkoutSession,
  getWorkoutSessions,
  updateWorkoutSession,
} from '@/lib/db';
import {
  type ExerciseDocument,
  type Session,
  type WorkoutSessionDocument,
} from '@/lib/types';

import Header from './Header';
import { Button } from './ui/button';

export function WorkoutDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setSessions([]); // Clear sessions on logout
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const userSessions: Session[] = await getWorkoutSessions({
          userId: user.uid,
        });
        setSessions(userSessions);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        toast.error('Could not load sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user, authLoading]);

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

  const handleSaveSession = async (formData: Omit<Session, 'id'>) => {
    if (!user) {
      toast.error('You must be logged in to save a session.');
      return;
    }

    // Convert form data to the Firestore document structure, ensuring no undefined values are sent.
    const sessionDocument: Omit<WorkoutSessionDocument, 'id'> = {
      userId: user.uid,
      date: formData.date,
      exercises: formData.exercises.map((ex): ExerciseDocument => {
        const exerciseData: ExerciseDocument = {
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
        };
        if (ex.rpe !== undefined) {
          exerciseData.rpe = ex.rpe;
        }
        return exerciseData;
      }),
    };

    if (formData.mood) {
      sessionDocument.mood = formData.mood;
    }
    if (formData.notes) {
      sessionDocument.notes = formData.notes;
    }

    try {
      if (editingSession?.id) {
        // Update existing session
        await updateWorkoutSession({
          sessionId: editingSession.id,
          userId: user.uid,
          sessionData: sessionDocument as WorkoutSessionDocument,
        });
        setSessions(
          sessions.map((s) =>
            s.id === editingSession.id
              ? { ...formData, id: editingSession.id }
              : s
          )
        );
        toast.success(
          `Session for ${format(formData.date, 'P')} has been updated.`
        );
      } else {
        // Create new session
        const newDocRef = await addWorkoutSession({
          userId: user.uid,
          sessionData: sessionDocument as WorkoutSessionDocument,
        });

        setSessions([...sessions, { ...formData, id: newDocRef.id }]);
        toast.success(
          `Session for ${format(formData.date, 'P')} has been saved.`
        );
      }
      handleFormClose();
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session. Please try again.');
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setSessionToDelete(session);
    }
  };

  const performDelete = async () => {
    if (!sessionToDelete || !sessionToDelete.id) return;

    try {
      await deleteWorkoutSession({ sessionId: sessionToDelete.id });
      setSessions(sessions.filter((s) => s.id !== sessionToDelete.id));
      toast.error(
        `Session for ${format(sessionToDelete.date, 'P')} has been deleted.`
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

  if (authLoading || isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Header handleAddNew={handleAddNew} />
      <SessionList
        sessions={sessions}
        onEdit={handleEditSession}
        onDelete={handleDeleteRequest}
      />

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
              onSave={handleSaveSession}
              onClose={handleFormClose}
              initialData={editingSession}
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
              <b>{sessionToDelete && format(sessionToDelete.date, 'P')}</b>.
              This action cannot be undone.
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

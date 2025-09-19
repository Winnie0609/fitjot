'use client';

import { format } from 'date-fns';
import { Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { deleteWorkoutSession, getWorkoutSessions } from '@/lib/db';
import { type InBodyDataDocument, type Session } from '@/lib/types';

import { InBodyForm } from './InBodyForm';
import { Button } from './ui/button';

export function WorkoutDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInBodyFormOpen, setIsInBodyFormOpen] = useState(false);
  const [inBodyData, setInBodyData] = useState<
    (InBodyDataDocument & { id: string }) | null
  >(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const userSessions: Session[] = await getWorkoutSessions({
          uid: user.uid,
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
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleFormClose();
        handleInBodyFormClose();
      }
    };
    if (isFormOpen || isInBodyFormOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormOpen, isInBodyFormOpen]);

  const handleSessionSaved = (saved: Session) => {
    if (editingSession?.id) {
      setSessions(sessions.map((s) => (s.id === saved.id ? saved : s)));
    } else {
      setSessions([...sessions, saved]);
    }
    handleFormClose();
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
        `Session for ${format(sessionToDelete.date, 'dd MMM yyyy')} has been deleted.`
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

  const handleInBodyFormClose = () => {
    setIsInBodyFormOpen(false);
    setInBodyData(null);
  };

  if (isLoading) {
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
        <div className="flex justify-between items-center">
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

        <SessionList
          sessions={sessions}
          onEdit={handleEditSession}
          onDelete={handleDeleteRequest}
        />
      </div>

      {isInBodyFormOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="container mx-auto max-w-2xl p-4 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {inBodyData ? 'Edit InBody Data' : 'Create a New InBody Data'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleInBodyFormClose}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <InBodyForm
              onSaved={() => {}}
              onClose={handleInBodyFormClose}
              initialData={inBodyData}
            />
          </div>
        </div>
      )}

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
              <b>{sessionToDelete && format(sessionToDelete.date, 'dd MMM yyyy')}</b>.
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

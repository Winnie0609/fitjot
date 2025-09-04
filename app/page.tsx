'use client';

import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { getSessions, saveSessions } from '@/lib/storage';
import { Session } from '@/lib/types';

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessionToDeleteData, setSessionToDeleteData] =
    useState<Session | null>(null);

  // Handle 'Escape' key press to close the form
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

  // Load sessions from local storage on initial render
  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleSaveSession = (sessionToSave: Session) => {
    const isEditing = sessions.some((s) => s.id === sessionToSave.id);
    let updatedSessions;

    if (isEditing) {
      updatedSessions = sessions.map((s) =>
        s.id === sessionToSave.id ? sessionToSave : s
      );
    } else {
      updatedSessions = [...sessions, sessionToSave];
    }

    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // Close form and clear editing state
    setIsFormOpen(false);
    setEditingSession(null);

    // Show success toast
    toast.success(
      `Session for ${format(sessionToSave.date, 'P')} has been saved.`
    );
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  // Step 1: When delete is clicked, set the session ID to open the dialog
  const handleDeleteRequest = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setSessionToDeleteData(sessions.find((s) => s.id === sessionId) || null);
  };

  // Step 2: Perform the actual deletion if confirmed
  const performDelete = () => {
    if (!sessionToDelete) return;
    const sessionToDeleteData = sessions.find((s) => s.id === sessionToDelete);

    const updatedSessions = sessions.filter((s) => s.id !== sessionToDelete);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setSessionToDelete(null); // Close the dialog

    // Show delete toast
    if (sessionToDeleteData) {
      toast.error(
        `Session for ${format(sessionToDeleteData.date, 'P')} has been deleted.`
      );
    }
  };

  // When the form is closed, ensure we clear any editing state
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSession(null);
  };

  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Workout Log</h1>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <SessionList
          sessions={sessions}
          onEdit={handleEditSession}
          onDelete={handleDeleteRequest}
        />
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-auto p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingSession ? 'Edit session' : 'Create a new session'}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleFormClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SessionForm
              onSave={handleSaveSession}
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
              You are deleting a workout session on:
              <b>
                {sessionToDeleteData?.date
                  ? format(sessionToDeleteData.date, 'P')
                  : ''}
              </b>
            </AlertDialogDescription>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              workout session.
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

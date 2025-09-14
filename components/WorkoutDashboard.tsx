'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { X } from 'lucide-react';

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
import { SessionForm } from '@/components/SessionForm';
import { SessionList } from '@/components/SessionList';
import { Session } from '@/lib/types';
import { saveSessions, getSessions } from '@/lib/storage';
import Header from './Header';
import { Button } from './ui/button';

export function WorkoutDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

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

  const handleSaveSession = (session: Session) => {
    const isEditing = sessions.some((s) => s.id === session.id);
    let updatedSessions;

    if (isEditing) {
      updatedSessions = sessions.map((s) =>
        s.id === session.id ? session : s
      );
    } else {
      updatedSessions = [...sessions, session];
    }
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    handleFormClose();
    toast.success(`Session for ${format(session.date, 'P')} has been saved.`);
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

  const performDelete = () => {
    if (!sessionToDelete) return;

    const updatedSessions = sessions.filter((s) => s.id !== sessionToDelete.id);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    toast.error(
      `Session for ${format(sessionToDelete.date, 'P')} has been deleted.`
    );
    setSessionToDelete(null); // Close the dialog
  };

  const handleAddNew = () => {
    setEditingSession(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSession(null);
  };

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

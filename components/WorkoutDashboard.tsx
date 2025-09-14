'use client';

import { useEffect, useState } from 'react';

import { SessionForm } from '@/components/SessionForm';
import { SessionList } from '@/components/SessionList';
import { saveSessions } from '@/lib/storage';
import { Session } from '@/lib/types';

import Header from './Header';

export function WorkoutDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const loadedSessions = localStorage.getItem('workout-sessions');
    if (loadedSessions) {
      setSessions(JSON.parse(loadedSessions));
    }
  }, []);

  const handleSaveSession = (session: Session) => {
    let updatedSessions;
    if (editingSession) {
      updatedSessions = sessions.map((s) =>
        s.id === session.id ? session : s
      );
    } else {
      updatedSessions = [...sessions, session];
    }
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setEditingSession(null);
    setIsFormOpen(false);
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  const handleAddNew = () => {
    setEditingSession(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Header handleAddNew={handleAddNew} />
      </div>
      <SessionList
        sessions={sessions}
        onEdit={handleEditSession}
        onDelete={handleDeleteSession}
      />
      {isFormOpen && (
        <SessionForm onSave={handleSaveSession} initialData={editingSession} />
      )}
    </>
  );
}

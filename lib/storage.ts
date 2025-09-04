'use client';

import { Session } from './types';

const SESSIONS_STORAGE_KEY = 'workout-log:sessions';

/**
 * Retrieves all saved sessions from localStorage.
 * Returns an empty array if no sessions are found or if there's an error.
 */
export function getSessions(): Session[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const savedSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (savedSessions) {
      // Dates are stored as strings in JSON, so we need to parse them back to Date objects.
      const parsed = JSON.parse(savedSessions);
      return parsed.map((session: Session) => ({
        ...session,
        date: new Date(session.date),
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to retrieve sessions from localStorage:', error);
    return [];
  }
}

/**
 * Saves the entire list of sessions to localStorage.
 * This function will overwrite any existing data.
 * @param sessions The array of sessions to save.
 */
export function saveSessions(sessions: Session[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const dataToStore = JSON.stringify(sessions);
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, dataToStore);
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
}

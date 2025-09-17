import { signInAnonymously } from 'firebase/auth';
import { collection, deleteDoc,getDocs } from 'firebase/firestore';
import { afterEach,beforeAll, describe, expect, it } from 'vitest';

import { auth,db } from '../../lib/firebase';
import { WorkoutSessionDocument } from '../../lib/types';
import { addWorkoutSession, getWorkoutSessions } from '../db';

// Helper function to clear all data in the emulator
const clearFirestore = async () => {
  const querySnapshot = await getDocs(collection(db, 'workout_sessions'));
  const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

let testUid = '';

describe('Firestore DB Service', () => {
  // Prepare auth and clean DB before tests
  beforeAll(async () => {
    await clearFirestore();
    const cred = await signInAnonymously(auth);
    testUid = cred.user.uid;
  });

  // Clear the database after each test to ensure isolation
  afterEach(async () => {
    await clearFirestore();
  });

  it('should add a workout session and then retrieve it', async () => {
    // Arrange
    const newSession: Omit<WorkoutSessionDocument, 'id'> = {
      userId: testUid,
      date: new Date(),
      mood: 'happy',
      notes: 'Great session!',
      exercises: [
        {
          id: 'ex1',
          name: 'Bench Press',
          sets: [{ id: 'set1', reps: 5, weight: 100 }],
        },
      ],
    };

    // Act: Add the session (must match auth uid to satisfy rules)
    await addWorkoutSession({ userId: testUid, sessionData: newSession });

    // Act: Retrieve sessions for that user
    const sessions = await getWorkoutSessions({ userId: testUid });

    // Assert
    expect(sessions).toHaveLength(1);
    expect(sessions[0].userId).toBe(testUid);
    expect(sessions[0].notes).toBe('Great session!');
    expect(sessions[0].exercises[0].name).toBe('Bench Press');
  });
});

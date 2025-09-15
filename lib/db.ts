import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy, // Added orderBy
  query,
  serverTimestamp,
  Timestamp, // Added Timestamp
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import { WorkoutSessionDocument } from './types';

const WORKOUT_SESSIONS_COLLECTION = 'workout_sessions';

const addWorkoutSession = async ({
  userId,
  sessionData,
}: {
  userId: string;
  sessionData: WorkoutSessionDocument;
}) => {
  const data = {
    ...sessionData,
    userId: userId,
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(
      collection(db, WORKOUT_SESSIONS_COLLECTION),
      data
    );
    return docRef;
  } catch (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }
};

const getWorkoutSessions = async ({ userId }: { userId: string }) => {
  const q = query(
    collection(db, WORKOUT_SESSIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as WorkoutSessionDocument;
    // Convert Firestore Timestamp to JS Date object right here
    return {
      ...data,
      id: doc.id,
      date: (data.date as unknown as Timestamp).toDate(),
    };
  });
};

const updateWorkoutSession = async ({
  sessionId,
  userId,
  sessionData,
}: {
  sessionId: string;
  userId: string;
  sessionData: WorkoutSessionDocument;
}) => {
  const data = {
    ...sessionData,
    userId: userId,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, WORKOUT_SESSIONS_COLLECTION, sessionId), data);

    return {
      ...data,
      id: sessionId,
    };
  } catch (error) {
    console.error('Error updating workout session:', error);
    throw error;
  }
};

const deleteWorkoutSession = async ({ sessionId }: { sessionId: string }) => {
  try {
    await deleteDoc(doc(db, WORKOUT_SESSIONS_COLLECTION, sessionId));
  } catch (error) {
    console.error('Error deleting workout session:', error);
    throw error;
  }
};

export {
  addWorkoutSession,
  deleteWorkoutSession,
  getWorkoutSessions,
  updateWorkoutSession,
};

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import { UserProfile, WorkoutSessionDocument } from './types';

const WORKOUT_SESSIONS_COLLECTION = 'workout_sessions';
const USERS_COLLECTION = 'users';

/**
 * Function to add a user to the database
 * add, get, update
 */

const addUserToDb = async ({
  userId,
  userData,
}: {
  userId: string;
  userData: UserProfile;
}) => {
  const data = {
    ...userData,
    uid: userId,
    createdAt: serverTimestamp(),
  };

  // if document already exists, skip it
  const userInDb = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (userInDb.exists()) {
    return;
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, userId), data);
  } catch (error) {
    console.error('Error adding user to db:', error);
    throw error;
  }
};

/**
 * Function to handle a workout session in the database
 * add, get, update, delete
 */

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
    // Convert Firestore Timestamp to JS Date object
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
  addUserToDb,
  addWorkoutSession,
  deleteWorkoutSession,
  getWorkoutSessions,
  updateWorkoutSession,
};

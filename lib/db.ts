import {
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
  writeBatch,
} from 'firebase/firestore';

import { db } from './firebase';
import {
  ExerciseData,
  InBodyDataDocument,
  UserProfile,
  WorkoutSessionDocument,
} from './types';

const WORKOUT_SESSIONS_COLLECTION = 'workout_sessions';
const USERS_COLLECTION = 'users';
const IN_BODY_DATA_COLLECTION = 'in_body_data';
const EXERCISES_COLLECTION = 'exercises';

/**
 * Helper function to mark a user as onboarded if they aren't already.
 * This uses a merge write to avoid an extra read.
 */
function markUserAsOnboardedIfNeeded(
  batch: ReturnType<typeof writeBatch>,
  uid: string
) {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  batch.set(userDocRef, { isOnboard: true }, { merge: true });
}

/**
 * Function to add a user to the database
 * add, get, update
 */

const addUserToDb = async ({
  uid,
  userData,
}: {
  uid: string;
  userData: UserProfile;
}) => {
  const data = {
    ...userData,
    uid: uid,
    createdAt: serverTimestamp(),
  };

  // if document already exists, skip it
  const userInDb = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (userInDb.exists()) {
    return;
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), data);
  } catch (error) {
    console.error('Error adding user to db:', error);
    throw error;
  }
};

const updateUser = async ({
  uid,
  userData,
}: {
  uid: string;
  userData: UserProfile;
}) => {
  const data = {
    ...userData,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, USERS_COLLECTION, uid), data);
};

const getUser = async ({ uid }: { uid: string }) => {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  return docSnap.data() as UserProfile;
};

/**
 * Function to handle a workout session in the database
 * add, get, update, delete
 */

const addWorkoutSession = async ({
  uid,
  sessionData,
}: {
  uid: string;
  sessionData: WorkoutSessionDocument;
}) => {
  const data = {
    ...sessionData,
    uid: uid,
    createdAt: serverTimestamp(),
  };
  try {
    const batch = writeBatch(db);
    markUserAsOnboardedIfNeeded(batch, uid);

    const docRef = doc(collection(db, WORKOUT_SESSIONS_COLLECTION));
    batch.set(docRef, data);

    await batch.commit();

    return docRef;
  } catch (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }
};

const getWorkoutSessions = async ({ uid }: { uid: string }) => {
  const q = query(
    collection(db, WORKOUT_SESSIONS_COLLECTION),
    where('uid', '==', uid),
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
  uid,
  sessionData,
}: {
  sessionId: string;
  uid: string;
  sessionData: WorkoutSessionDocument;
}) => {
  const data = {
    ...sessionData,
    uid: uid,
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

/*
 * Functions to handle InBody data in the database
 * add, get, update, delete
 */

const addInBodyData = async ({
  uid,
  inBodyData,
}: {
  uid: string;
  inBodyData: InBodyDataDocument | Record<string, unknown>;
}) => {
  const data = {
    ...inBodyData,
    uid: uid,
    createdAt: serverTimestamp(),
  } as Record<string, unknown>;

  try {
    const batch = writeBatch(db);
    markUserAsOnboardedIfNeeded(batch, uid);

    const docRef = doc(collection(db, IN_BODY_DATA_COLLECTION));
    batch.set(docRef, data);

    await batch.commit();

    return docRef;
  } catch (error) {
    console.error('Error creating inbody data:', error);
    throw error;
  }
};

const getInBodyData = async ({ uid }: { uid: string }) => {
  const q = query(
    collection(db, IN_BODY_DATA_COLLECTION),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const createdAt =
      (data.createdAt as Timestamp | undefined)?.toDate?.() ?? undefined;
    const reportDate =
      (data.reportDate as Timestamp | Date | undefined) instanceof Timestamp
        ? (data.reportDate as Timestamp).toDate()
        : (data.reportDate as Date | undefined);
    return {
      id: d.id,
      ...data,
      createdAt,
      reportDate,
    } as Record<string, unknown> & { id: string };
  });
};

const updateInBodyData = async ({
  recordId,
  uid,
  inBodyData,
}: {
  recordId: string;
  uid: string;
  inBodyData: Partial<InBodyDataDocument> | Record<string, unknown>;
}) => {
  const data = {
    ...inBodyData,
    uid,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>;
  await updateDoc(doc(db, IN_BODY_DATA_COLLECTION, recordId), data);
};

const deleteInBodyData = async ({ recordId }: { recordId: string }) => {
  await deleteDoc(doc(db, IN_BODY_DATA_COLLECTION, recordId));
};

/*
 * Functions to handle Exercises in the database
 * get
 */

const getExercises = async (): Promise<ExerciseData[]> => {
  const q = query(collection(db, EXERCISES_COLLECTION));
  const snap = await getDocs(q);

  const exercises = snap.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ExerciseData)
  );

  return exercises;
};

export {
  addInBodyData,
  addUserToDb,
  addWorkoutSession,
  deleteInBodyData,
  deleteWorkoutSession,
  getExercises,
  getInBodyData,
  getUser,
  getWorkoutSessions,
  updateInBodyData,
  updateUser,
  updateWorkoutSession,
};

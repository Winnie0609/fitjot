/**
 * Represents a single set of a workout exercise.
 * Using a unique ID for easier state management and React keys.
 */
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
}

/**
 * Represents a single exercise within a workout log, containing multiple sets.
 */
export interface Exercise {
  id: string;
  name: string;
  rpe?: number; // Rate of Perceived Exertion
  sets: WorkoutSet[];
}

/**
 * Represents a full workout session for a specific date.
 * This is the main data structure for a single day's workout session.
 */
export interface Session {
  id: string;
  date: Date;
  mood?: 'happy' | 'neutral' | 'sad';
  notes?: string;
  exercises: Exercise[];
}

// =================================================================
// Firestore Data Structures
// =================================================================

/**
 * Represents the structure of a user document in the Firestore 'users' collection.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a single set of an exercise as stored in Firestore.
 * No ID is needed as the array order is sufficient.
 */
export interface WorkoutSetDocument {
  id: string;
  reps: number;
  weight: number;
}

/**
 * Represents a single exercise as stored in Firestore.
 */
export interface ExerciseDocument {
  id: string;
  name: string;
  rpe?: number;
  sets: WorkoutSetDocument[];
}

/**
 * Represents a full workout session document in the 'workout_sessions' collection.
 */
export interface WorkoutSessionDocument {
  id?: string; // Optional: The document ID from Firestore.
  userId: string;
  date: Date;
  mood?: 'happy' | 'neutral' | 'sad';
  notes?: string;
  exercises: ExerciseDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

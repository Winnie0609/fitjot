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

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
  exerciseId: string;
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
  isOnboard?: boolean;
}

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
  isOnboard?: boolean;
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
  exerciseId: string; // This is the ID from the global exercise list
  name: string;
  rpe?: number;
  sets: WorkoutSetDocument[];
}

/**
 * Represents a full workout session document in the 'workout_sessions' collection.
 */
export interface WorkoutSessionDocument {
  id?: string; // Optional: The document ID from Firestore.
  uid: string;
  date: Date;
  mood?: 'happy' | 'neutral' | 'sad';
  notes?: string;
  exercises: ExerciseDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Represents a single InBody data document in the 'in_body_data' collection.
 */

export interface InBodyDataDocument {
  uid: string;
  reportDate: Date;
  reportTime: string;
  overallScore: number;
  bodyCompositionAnalysis?: {
    totalBodyWater: {
      value?: number;
      unit: 'L';
      range: string;
    };
    protein: {
      value?: number;
      unit: 'kg' | 'lbs';
      range: string;
    };
    mineral: {
      value?: number;
      unit: 'kg' | 'lbs';
      range: string;
    };
    bodyFatMass: {
      value?: number;
      unit: 'kg' | 'lbs';
      range: string;
    };
    weight: {
      value?: number;
      unit: 'kg' | 'lbs';
      range: string;
    };
  };
  bodyComposition?: {
    totalWeight: {
      value: number;
      unit: 'kg' | 'lbs';
    };
    skeletalMuscleMass: {
      value: number;
      unit: 'kg' | 'lbs';
    };
    bodyFatMass: {
      value: number;
      unit: 'kg' | 'lbs';
    };
    bmi: {
      value: number;
      unit: 'kg/m2' | 'lbs/in2';
    };
    pbf: {
      value: number;
      unit: '%';
    };
    segmentalLeanAnalysis: {
      rightArm: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      leftArm: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      trunk: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      rightLeg: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      leftLeg: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
    };
    segmentalFatAnalysis: {
      rightArm: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      leftArm: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      trunk: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      rightLeg: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
      leftLeg: {
        weight: number;
        unit: 'kg' | 'lbs';
        percentage: number;
        status: 'normal' | 'low' | 'high';
      };
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Represents a single exercise from the global 'exercises' collection.
 */
export interface ExerciseData {
  id: string;
  titleEn: string;
  titleZh: string;
  aliases: string[];
  force: string | null;
  level: string;
  mechanic: string | null;
  bodyPart: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  instructionsEn: string[];
  instructionsZh: string[];
  category: string;
  thumbnailUrl?: string;
  isCardio: boolean;
  type: 'global' | 'custom';
  createdBy: 'system' | string; // 'system' or a user ID
}

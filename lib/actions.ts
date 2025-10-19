'use server';

import { collection, doc, writeBatch } from 'firebase/firestore';

import { db } from './firebase';
import { InBodyDataDocument, WorkoutSessionDocument } from './types';

// Exercise catalog inspired by scripts/mock-data-leia.ts
const CATALOG = {
  legs: [
    { id: 'GgJImaH41mall9QmpULZ', name: 'Barbell Squat' },
    { id: 'dcNAK2byRc0PISHq7xEm', name: 'Leg Press' },
    { id: 'pZ5buCuRQPqCxm8nBK25', name: 'Leg Extensions' },
  ],
  chest: [
    {
      id: '1mcOhYXnVKkmbFTQnYuo',
      name: 'Barbell Bench Press - Medium Grip',
    },
    { id: 'sFVDWFabE9GCZB7LMt5s', name: 'Incline Dumbbell Press' },
    { id: 'hZerw8hS232MtGFcXbQo', name: 'Dumbbell Flyes' },
  ],
  back: [
    { id: 'EIvCqFt1ZDAcpuikSEIz', name: 'Pullups' },
    { id: 'TideaQ5oDN7cLiqeHjY3', name: 'Seated Cable Rows' },
    { id: 'VjTrXpOXTWBRKCRs1gzQ', name: 'Wide-Grip Lat Pulldown' },
  ],
  core: [
    { id: 'HpEc4Q06IANCZl8qwkdf', name: 'Crunches' },
    { id: 'nljN8RVYHGoiiUBbLbUg', name: 'Hanging Leg Raise' },
    { id: 'yI6ChLNLfbHNLH6DVy3K', name: 'Plank' },
  ],
};

// Mock Data
const sampleWorkoutSessions: Omit<WorkoutSessionDocument, 'uid'>[] = [
  {
    date: new Date('2025-07-21'),
    mood: 'happy',
    notes: 'Leg day! Focused on deep squats and solid form. Felt a great burn.',
    exercises: [
      {
        id: 'exercise-1',
        exerciseId: CATALOG.legs[0].id,
        name: CATALOG.legs[0].name,
        rpe: 8,
        sets: [
          { id: 'set-1', reps: 12, weight: 40 },
          { id: 'set-2', reps: 12, weight: 40 },
          { id: 'set-3', reps: 10, weight: 45 },
          { id: 'set-3', reps: 10, weight: 45 },
        ],
      },
      {
        id: 'exercise-2',
        exerciseId: CATALOG.legs[1].id,
        name: CATALOG.legs[1].name,
        rpe: 7,
        sets: [
          { id: 'set-1', reps: 12, weight: 80 },
          { id: 'set-2', reps: 12, weight: 80 },
          { id: 'set-3', reps: 12, weight: 85 },
          { id: 'set-3', reps: 12, weight: 85 },
        ],
      },
    ],
  },
  {
    date: new Date('2025-07-23'),
    mood: 'neutral',
    notes:
      'Chest day. Bench press felt a bit heavy today but pushed through. Flyes were good.',
    exercises: [
      {
        id: 'exercise-1',
        exerciseId: CATALOG.chest[0].id,
        name: CATALOG.chest[0].name,
        rpe: 8,
        sets: [
          { id: 'set-1', reps: 12, weight: 50 },
          { id: 'set-2', reps: 10, weight: 50 },
          { id: 'set-3', reps: 8, weight: 50 },
          { id: 'set-3', reps: 8, weight: 50 },
        ],
      },
      {
        id: 'exercise-2',
        exerciseId: CATALOG.chest[2].id,
        name: CATALOG.chest[2].name,
        rpe: 7,
        sets: [
          { id: 'set-1', reps: 12, weight: 10 },
          { id: 'set-2', reps: 12, weight: 10 },
          { id: 'set-3', reps: 12, weight: 10 },
          { id: 'set-3', reps: 12, weight: 10 },
        ],
      },
    ],
  },
  {
    date: new Date('2025-07-25'),
    mood: 'happy',
    notes:
      'Back day was awesome. Had a great mind-muscle connection on the rows.',
    exercises: [
      {
        id: 'exercise-1',
        exerciseId: CATALOG.back[1].id,
        name: CATALOG.back[1].name,
        rpe: 7,
        sets: [
          { id: 'set-1', reps: 12, weight: 45 },
          { id: 'set-2', reps: 12, weight: 45 },
          { id: 'set-3', reps: 12, weight: 45 },
          { id: 'set-3', reps: 12, weight: 45 },
        ],
      },
      {
        id: 'exercise-2',
        exerciseId: CATALOG.back[2].id,
        name: CATALOG.back[2].name,
        rpe: 7,
        sets: [
          { id: 'set-1', reps: 12, weight: 40 },
          { id: 'set-2', reps: 10, weight: 45 },
          { id: 'set-3', reps: 10, weight: 45 },
          { id: 'set-3', reps: 10, weight: 45 },
        ],
      },
    ],
  },
  {
    date: new Date('2025-07-26'),
    mood: 'happy',
    notes: 'Finished the week with a solid core workout. Planks are killer.',
    exercises: [
      {
        id: 'exercise-1',
        exerciseId: CATALOG.core[1].id,
        name: CATALOG.core[1].name,
        rpe: 8,
        sets: [
          { id: 'set-1', reps: 15, weight: 0 },
          { id: 'set-2', reps: 15, weight: 0 },
          { id: 'set-3', reps: 12, weight: 0 },
        ],
      },
      {
        id: 'exercise-2',
        exerciseId: CATALOG.core[2].id,
        name: CATALOG.core[2].name,
        rpe: 9,
        // Assuming weight is duration in seconds for Plank
        sets: [
          { id: 'set-1', reps: 1, weight: 60 },
          { id: 'set-2', reps: 1, weight: 60 },
        ],
      },
    ],
  },
];

const sampleInBodyData: Omit<InBodyDataDocument, 'uid'>[] = [
  {
    reportDate: new Date('2025-07-01'),
    reportTime: '08:00',
    overallScore: 72,
    bodyComposition: {
      totalWeight: { value: 68, unit: 'kg' },
      skeletalMuscleMass: { value: 28, unit: 'kg' },
      bodyFatMass: { value: 18, unit: 'kg' },
      bmi: { value: 23.5, unit: 'kg/m2' },
      pbf: { value: 26.5, unit: '%' },
    },
  },
  {
    reportDate: new Date('2025-07-15'),
    reportTime: '08:10',
    overallScore: 74,
    bodyComposition: {
      totalWeight: { value: 67, unit: 'kg' },
      skeletalMuscleMass: { value: 28, unit: 'kg' },
      bodyFatMass: { value: 17, unit: 'kg' },
      bmi: { value: 23.1, unit: 'kg/m2' },
      pbf: { value: 25.4, unit: '%' },
    },
  },
  {
    reportDate: new Date('2025-08-01'),
    reportTime: '08:05',
    overallScore: 75,
    bodyComposition: {
      totalWeight: { value: 67, unit: 'kg' },
      skeletalMuscleMass: { value: 29, unit: 'kg' },
      bodyFatMass: { value: 16, unit: 'kg' },
      bmi: { value: 23.1, unit: 'kg/m2' },
      pbf: { value: 23.9, unit: '%' },
    },
  },
  {
    reportDate: new Date('2025-08-15'),
    reportTime: '07:55',
    overallScore: 77,
    bodyComposition: {
      totalWeight: { value: 66, unit: 'kg' },
      skeletalMuscleMass: { value: 30, unit: 'kg' },
      bodyFatMass: { value: 14, unit: 'kg' },
      bmi: { value: 22.8, unit: 'kg/m2' },
      pbf: { value: 21.2, unit: '%' },
    },
  },
  {
    reportDate: new Date('2025-09-01'),
    reportTime: '08:00',
    overallScore: 79,
    bodyComposition: {
      totalWeight: { value: 66, unit: 'kg' },
      skeletalMuscleMass: { value: 31, unit: 'kg' },
      bodyFatMass: { value: 13, unit: 'kg' },
      bmi: { value: 22.8, unit: 'kg/m2' },
      pbf: { value: 19.7, unit: '%' },
    },
  },
];

export async function seedSampleData(uid: string) {
  if (!uid) {
    throw new Error('User ID is required');
  }

  try {
    const batch = writeBatch(db);

    // Add workout sessions
    const workoutSessionsCollection = collection(db, 'workout_sessions');
    sampleWorkoutSessions.forEach((session) => {
      const docRef = doc(workoutSessionsCollection);
      batch.set(docRef, { ...session, uid });
    });

    // Add InBody data
    const inBodyDataCollection = collection(db, 'in_body_data');
    sampleInBodyData.forEach((data) => {
      const docRef = doc(inBodyDataCollection);
      batch.set(docRef, { ...data, uid });
    });

    // Update user's isOnboard flag
    const userDocRef = doc(db, 'users', uid);
    batch.update(userDocRef, { isOnboard: true });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return { success: false, error: 'Failed to seed sample data' };
  }
}

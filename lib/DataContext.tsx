'use client';

import { createContext, type ReactNode,useContext } from 'react';

import { type InBodyDataDocument, type WorkoutSessionDocument } from './types';

interface DataContextType {
  workoutSessions: WorkoutSessionDocument[];
  inBodyRecords: InBodyDataDocument[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DataContextType;
}) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

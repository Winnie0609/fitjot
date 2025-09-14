import { getAuth, type User } from 'firebase/auth';
import { createContext, FC, ReactNode, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { app } from './firebase';

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error?: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const auth = getAuth(app);
  const [user, loading, error] = useAuthState(auth);
  const value = { user, loading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };

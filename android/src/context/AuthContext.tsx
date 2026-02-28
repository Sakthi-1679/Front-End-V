import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthResponse } from '../types';
import { getSession, clearSession } from '../services/api';
import { registerForPushNotifications } from '../services/notifications';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  loginUser: (data: AuthResponse) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session?.user && session?.token) {
          setUser(session.user);
          setToken(session.token);
        }
      } catch (e) {
        console.warn('Session restore failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginUser = async (data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    // Register push token after login
    try { await registerForPushNotifications(); } catch(e) {}
  };

  const logoutUser = async () => {
    await clearSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isAdmin: user?.role?.toUpperCase() === UserRole.ADMIN,
      loading,
      loginUser,
      logoutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

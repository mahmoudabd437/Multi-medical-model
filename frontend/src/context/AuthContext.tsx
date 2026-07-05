import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { changePassword as changePasswordRequest, getCurrentUser, login as loginRequest, logout as logoutRequest, requestPasswordReset as requestPasswordResetRequest } from '@/services/api/auth';
import { getApiAccessToken, setApiAccessToken } from '@/services/api/client';

export type AuthUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  avatar: string;
  initials: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const fallbackUser: AuthUser = {
  id: 'user_001',
  name: 'Dr. Amelia Carter',
  role: 'Lead Radiologist',
  email: 'amelia.carter@medaiplatform.dev',
  department: 'Radiology',
  avatar: 'AC',
  initials: 'AC',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getApiAccessToken()) {
      void refreshUser();
      return;
    }

    void refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const session = await loginRequest({ email, password });
      setApiAccessToken(session.access);
      setUser(session.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await logoutRequest();
    } finally {
      setApiAccessToken(null);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await requestPasswordResetRequest(email);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePasswordRequest(currentPassword, newPassword);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      signIn,
      signOut,
      refreshUser,
      requestPasswordReset,
      changePassword,
    }),
    [changePassword, loading, refreshUser, requestPasswordReset, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

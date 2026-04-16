/* eslint-disable react-refresh/only-export-components */
// Context files always export both a Provider component and a hook — suppression is intentional.
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authLogin, authLogout, authMe } from '@/api/appointments';

interface AuthUser {
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if there's an active session (JWT cookie).
  // authMe returns null if not logged in — no redirect needed here.
  useEffect(() => {
    authMe()
      .then((data) => setUser(data))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authLogin(email, password); // throws on 401 — caller handles it
    setUser({ email: data.email });
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

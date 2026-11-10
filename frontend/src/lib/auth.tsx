import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import api, { getAccessToken, setAccessToken, waitForBackend } from './api';
import type { Role, User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  connectionError: boolean;
  retryConnection: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        await waitForBackend();
      } catch {
        if (active) setConnectionError(true);
        if (active) setLoading(false);
        return;
      }
      try {
        const response = await api.get('/users/me');
        if (active) setUser(response.data.data);
      } catch (error) {
        if (!active) return;
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0)) {
          setAccessToken(null);
        } else {
          setConnectionError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [retryCount]);
  const retryConnection = () => {
    setConnectionError(false);
    setLoading(true);
    setRetryCount((count) => count + 1);
  };
  const signIn = async (email: string, password: string) => {
    await waitForBackend();
    const r = await api.post('/auth/login', { email, password });
    setAccessToken(r.data.data.accessToken);
    setUser(r.data.data.user);
    setConnectionError(false);
  };
  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, connectionError, retryConnection, signIn, signOut, updateUser: setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider missing');
  return value;
};
export const roleLabel = (role: Role) =>
  ({ READER: 'Độc giả', LIBRARIAN: 'Thủ thư', ADMIN: 'Quản trị viên' })[role];

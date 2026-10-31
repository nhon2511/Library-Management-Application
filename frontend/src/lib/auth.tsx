import { createContext, useContext, useEffect, useState } from 'react';
import api, { getAccessToken, setAccessToken } from './api';
import type { Role, User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    api
      .get('/users/me')
      .then((r) => setUser(r.data.data))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);
  const signIn = async (email: string, password: string) => {
    const r = await api.post('/auth/login', { email, password });
    setAccessToken(r.data.data.accessToken);
    setUser(r.data.data.user);
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser: setUser }}>
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

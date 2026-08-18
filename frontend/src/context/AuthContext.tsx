import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active?: boolean;
  email_verified_at?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate server-managed session on initial application mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.id) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    if (res.data && res.data.id) {
      setUser(res.data);
    } else {
      const meRes = await api.get('/auth/me');
      setUser(meRes.data);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.post('/auth/register', {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    if (res.data && res.data.id) {
      setUser(res.data);
    } else {
      const meRes = await api.get('/auth/me');
      setUser(meRes.data);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // Tokens are HttpOnly cookies, not exposed to JS
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

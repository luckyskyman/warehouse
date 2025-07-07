import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/warehouse';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('warehouse_user', JSON.stringify(data.user));
      localStorage.setItem('warehouse_session', data.sessionId);
    } catch (error) {
      throw error instanceof Error ? error : new Error('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('warehouse_user');
    localStorage.removeItem('warehouse_session');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('warehouse_user');
    const savedSession = localStorage.getItem('warehouse_session');
    if (savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('warehouse_user');
        localStorage.removeItem('warehouse_session');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/warehouse';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  sessionId: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

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
      setSessionId(data.sessionId);
      localStorage.setItem('warehouse_user', JSON.stringify(data.user));
      localStorage.setItem('warehouse_session', data.sessionId);
      
      // 로그인 시 권한별 캐시 무효화 (페이지 새로고침 없음)
      queryClient.clear(); // 전체 캐시 초기화로 권한 변경 즉시 반영
      
      // 주요 데이터 다시 가져오기 (BOM 데이터 포함)
      await queryClient.prefetchQuery({ queryKey: ['/api/work-diary'] });
      await queryClient.prefetchQuery({ queryKey: ['/api/users'] });
      await queryClient.prefetchQuery({ queryKey: ['/api/notifications'] });
      await queryClient.prefetchQuery({ 
        queryKey: ['/api/bom'],
        queryFn: async () => {
          const response = await fetch('/api/bom', {
            headers: { 'x-session-id': data.sessionId }
          });
          if (!response.ok) return [];
          return response.json();
        }
      });
    } catch (error) {
      throw error instanceof Error ? error : new Error('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('warehouse_user');
    localStorage.removeItem('warehouse_session');
  };

  const refreshUser = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'x-session-id': sessionId }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('warehouse_user', JSON.stringify(userData));
        
        // 권한 변경 후 캐시 무효화
        queryClient.clear();
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('warehouse_user');
    const savedSession = localStorage.getItem('warehouse_session');
    if (savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser));
        setSessionId(savedSession);
        
        // 세션 복원 후 중요한 데이터 prefetch (BOM 데이터 포함)
        setTimeout(async () => {
          try {
            await queryClient.prefetchQuery({ 
              queryKey: ['/api/bom'],
              queryFn: async () => {
                const response = await fetch('/api/bom', {
                  headers: { 'x-session-id': savedSession }
                });
                if (!response.ok) return [];
                return response.json();
              }
            });
          } catch (error) {
            console.log('BOM 데이터 prefetch 실패:', error);
          }
        }, 100);
      } catch (error) {
        localStorage.removeItem('warehouse_user');
        localStorage.removeItem('warehouse_session');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, sessionId, refreshUser }}>
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

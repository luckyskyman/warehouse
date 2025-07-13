import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface WorkNotification {
  id: number;
  userId: number;
  diaryId: number;
  type: 'new_diary' | 'comment' | 'mention' | 'status_change';
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user, sessionId } = useAuth();

  return useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      return response.json();
    },
    enabled: !!user && !!sessionId,
    refetchInterval: 30000, // 30초마다 새 알림 확인
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: async () => {
      // 알림 읽음 처리 후 업무일지 상태도 함께 새로고침 (부드럽게)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/work-diary'] })
      ]);
    },
  });
}

export function useCompleteWorkDiary() {
  return useMutation({
    mutationFn: async (diaryId: number) => {
      const response = await apiRequest('POST', `/api/work-diary/${diaryId}/complete`);
      return response.json();
    },
    onSuccess: async (data, diaryId) => {
      console.log('완료 처리 성공, 캐시 무효화 시작');
      
      // 모든 관련 캐시 완전 제거
      queryClient.removeQueries({ queryKey: ['/api/work-diary'] });
      queryClient.removeQueries({ queryKey: ['/api/notifications'] });
      
      // 즉시 새로 불러오기
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/work-diary'] }),
        queryClient.refetchQueries({ queryKey: ['/api/notifications'] })
      ]);
      
      console.log('캐시 무효화 완료');
    },
  });
}
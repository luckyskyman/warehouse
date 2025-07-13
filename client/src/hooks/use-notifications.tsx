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
    onSuccess: () => {
      // 알림 읽음 처리 후 업무일지 상태도 함께 새로고침
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-diary'] });
      // 즉시 새로고침하여 상태 변경사항 반영
      queryClient.refetchQueries({ queryKey: ['/api/work-diary'] });
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
      // 즉시 캐시 무효화 및 새로고침으로 실시간 반영
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/work-diary'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/work-diary', diaryId] })
      ]);
      
      // 강제 새로고침으로 즉시 UI 업데이트
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/work-diary'] }),
        queryClient.refetchQueries({ queryKey: ['/api/notifications'] })
      ]);
    },
  });
}
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
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

export function useCompleteWorkDiary() {
  return useMutation({
    mutationFn: async (diaryId: number) => {
      const response = await apiRequest('POST', `/api/work-diary/${diaryId}/complete`);
      return response.json();
    },
    onSuccess: (data, diaryId) => {
      // 업무일지 목록과 개별 업무일지 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/work-diary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      // 특정 업무일지 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/work-diary', diaryId] });
      // 전체 업무일지 목록 강제 새로고침
      queryClient.refetchQueries({ queryKey: ['/api/work-diary'] });
    },
  });
}
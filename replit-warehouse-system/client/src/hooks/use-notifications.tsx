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
      if (!response.ok) {
        return []; // 인증 실패 시 빈 배열 반환
      }
      return response.json();
    },
    enabled: true, // 항상 활성화 (로그인 여부와 관계없이)
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
      console.log('완료 처리 성공 - 서버 응답:', data);
      // 서버 성공 시에는 아무것도 하지 않음 (이미 UI 업데이트됨)
    },
    onError: (err) => {
      console.error('완료 처리 실패:', err);
      // 오류 시에만 롤백하도록 상위 컴포넌트에 알림
    },
  });
}
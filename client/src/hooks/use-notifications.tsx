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
    onMutate: async (diaryId) => {
      // 낙관적 업데이트: 즉시 UI를 업데이트
      await queryClient.cancelQueries({ queryKey: ['/api/work-diary'] });
      
      // 이전 상태 백업
      const previousWorkDiaries = queryClient.getQueryData(['/api/work-diary']);
      
      console.log('낙관적 업데이트 시작 - diaryId:', diaryId);
      console.log('이전 데이터:', previousWorkDiaries);
      
      // 즉시 상태 업데이트
      queryClient.setQueryData(['/api/work-diary'], (old: any) => {
        if (!old) return old;
        const updated = old.map((diary: any) => {
          if (diary.id === diaryId) {
            console.log('업무일지 상태 변경:', diary.id, diary.status, '→ completed');
            return { ...diary, status: 'completed' };
          }
          return diary;
        });
        console.log('업데이트된 데이터:', updated);
        return updated;
      });
      
      return { previousWorkDiaries };
    },
    onError: (err, diaryId, context) => {
      // 오류 발생 시 이전 상태로 롤백
      if (context?.previousWorkDiaries) {
        queryClient.setQueryData(['/api/work-diary'], context.previousWorkDiaries);
      }
      console.error('완료 처리 실패:', err);
    },
    onSuccess: async (data, diaryId) => {
      // 성공 시 서버 데이터로 동기화
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/work-diary'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
      ]);
    },
  });
}
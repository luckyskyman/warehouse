import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem, Transaction, BomGuide, WarehouseLayout, ExchangeQueue, InventoryStats } from '@/types/warehouse';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';

export function useInventory() {
  return useQuery({
    queryKey: ['/api/inventory'],
  });
}

export function useInventoryItem(code: string) {
  return useQuery({
    queryKey: ['/api/inventory', code],
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: any) => apiRequest('POST', '/api/inventory', item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ code, ...updates }: any) => apiRequest('PATCH', `/api/inventory/${code}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (code: string) => apiRequest('DELETE', `/api/inventory/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
  });
}

export function useAdjustInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newStock, reason }: { id: number; newStock: number; reason: string }) => 
      apiRequest('PATCH', `/api/inventory/${id}/adjust`, { newStock, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
  });
}

export function useTransactions(itemCode?: string) {
  return useQuery({
    queryKey: itemCode ? ['/api/transactions', itemCode] : ['/api/transactions'],
    queryFn: () => {
      const url = itemCode 
        ? `/api/transactions?itemCode=${encodeURIComponent(itemCode)}`
        : '/api/transactions';
      return fetch(url).then(res => res.json());
    }
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transaction: any) => {
      console.log('[클라이언트] 트랜잭션 생성 요청:', transaction);
      return apiRequest('POST', '/api/transactions', transaction);
    },
    onSuccess: (data, variables) => {
      console.log('[클라이언트] 트랜잭션 생성 성공:', variables);
      
      // 모든 관련 캐시를 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exchange-queue'] });
      
      // 불량품 교환 출고인 경우 추가적으로 캐시를 강제 새로고침
      if (variables.reason === '불량품 교환 출고') {
        console.log('[React Query] 불량품 교환 출고 처리 완료 - 캐시 강제 새로고침');
        // 약간의 지연 후 캐시 새로고침 (서버 처리 완료 대기)
        setTimeout(() => {
          queryClient.removeQueries({ queryKey: ['/api/exchange-queue'] });
          queryClient.refetchQueries({ queryKey: ['/api/exchange-queue'] });
        }, 500);
      }
    },
    onError: (error, variables) => {
      console.error('[클라이언트] 트랜잭션 생성 실패:', error, variables);
    }
  });
}

export function useBomGuides() {
  const { sessionId } = useAuth();
  return useQuery({
    queryKey: ['/api/bom'],
    queryFn: async () => {
      const response = await fetch('/api/bom', {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      if (!response.ok) {
        throw new Error('BOM 목록을 불러올 수 없습니다.');
      }
      return response.json();
    },
    enabled: !!sessionId
  });
}

export function useBomGuidesByName(guideName: string) {
  const { sessionId } = useAuth();
  return useQuery({
    queryKey: ['/api/bom', guideName],
    queryFn: async () => {
      const response = await fetch(`/api/bom/${encodeURIComponent(guideName)}`, {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      if (!response.ok) {
        throw new Error('BOM 상세 정보를 불러올 수 없습니다.');
      }
      return response.json();
    },
    enabled: !!guideName && !!sessionId,
  });
}

export function useCreateBomGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bom: any) => apiRequest('POST', '/api/bom', bom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bom'] });
    },
  });
}

export function useWarehouseLayout() {
  return useQuery({
    queryKey: ['/api/warehouse/layout'],
  });
}

export function useCreateWarehouseZone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (zone: any) => apiRequest('POST', '/api/warehouse/layout', zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/layout'] });
    },
  });
}

export function useUpdateWarehouseZone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...zone }: any) => apiRequest('PUT', `/api/warehouse/layout/${id}`, zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/layout'] });
    },
  });
}

export function useDeleteWarehouseZone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/warehouse/layout/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/layout'] });
    },
  });
}

export function useExchangeQueue() {
  return useQuery({
    queryKey: ['/api/exchange-queue'],
  });
}

export function useProcessExchangeQueueItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/exchange-queue/${id}/process`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exchange-queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
  });
}

export function useInventoryStats() {
  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();

  const stats: InventoryStats = {
    totalItems: inventory.length,
    totalStock: inventory.reduce((sum: number, item: InventoryItem) => sum + item.stock, 0),
    shortageItems: inventory.filter((item: InventoryItem) => item.stock < item.minStock && item.stock >= 0).length,
    warehouseZones: warehouseLayout.length,
  };

  return { stats };
}
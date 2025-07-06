import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem, Transaction, BomGuide, WarehouseLayout, ExchangeQueue, InventoryStats } from '@/types/warehouse';
import { apiRequest } from '@/lib/queryClient';

export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
    select: (data) => data || [],
  });
}

export function useInventoryItem(code: string) {
  return useQuery<InventoryItem>({
    queryKey: ['/api/inventory', code],
    enabled: !!code,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest('POST', '/api/inventory', item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ code, updates }: { code: string; updates: Partial<InventoryItem> }) => {
      const response = await apiRequest('PATCH', `/api/inventory/${code}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
  });
}

export function useTransactions(itemCode?: string) {
  return useQuery<Transaction[]>({
    queryKey: itemCode ? ['/api/transactions', itemCode] : ['/api/transactions'],
    select: (data) => data || [],
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/transactions', transaction);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exchange-queue'] });
    },
  });
}

export function useBomGuides() {
  return useQuery<BomGuide[]>({
    queryKey: ['/api/bom'],
    select: (data) => data || [],
  });
}

export function useBomGuidesByName(guideName: string) {
  return useQuery<BomGuide[]>({
    queryKey: ['/api/bom', guideName],
    enabled: !!guideName,
    select: (data) => data || [],
  });
}

export function useCreateBomGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bom: Omit<BomGuide, 'id' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/bom', bom);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bom'] });
    },
  });
}

export function useWarehouseLayout() {
  return useQuery<WarehouseLayout[]>({
    queryKey: ['/api/warehouse/layout'],
    select: (data) => data || [],
  });
}

export function useCreateWarehouseZone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (layout: Omit<WarehouseLayout, 'id' | 'createdAt'>) => {
      const response = await apiRequest('POST', '/api/warehouse/layout', layout);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/layout'] });
    },
  });
}

export function useExchangeQueue() {
  return useQuery<ExchangeQueue[]>({
    queryKey: ['/api/exchange-queue'],
    select: (data) => data || [],
  });
}

export function useProcessExchangeQueueItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/exchange-queue/${id}/process`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exchange-queue'] });
    },
  });
}

export function useInventoryStats() {
  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  
  const stats: InventoryStats = {
    totalStock: inventory.reduce((sum, item) => sum + item.stock, 0),
    totalItems: inventory.length,
    shortageItems: inventory.filter(item => item.stock <= item.minStock).length,
    warehouseZones: [...new Set(warehouseLayout.map(layout => layout.zoneName))].length || 4,
  };
  
  return stats;
}

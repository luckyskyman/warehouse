import { useInventoryStats, useInventory } from '@/hooks/use-inventory';
import { useIsMobile } from '@/hooks/use-mobile';
import InventoryAlerts from '@/components/notifications/inventory-alerts';
import { useMemo } from 'react';

export function StatsGrid() {
  const { stats } = useInventoryStats();
  const { data: inventory = [] } = useInventory();
  const isMobile = useIsMobile();

  // 재고가 있는 아이템만으로 통계 재계산
  const filteredStats = useMemo(() => {
    const stockedItems = inventory.filter(item => item.stock > 0);
    const totalStock = stockedItems.reduce((sum, item) => sum + item.stock, 0);
    const totalItems = stockedItems.length;
    const shortageItems = stockedItems.filter(item => item.stock <= item.minStock).length;
    
    return {
      totalStock,
      totalItems,
      shortageItems,
      warehouseZones: stats?.warehouseZones || 0
    };
  }, [inventory, stats]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="warehouse-card">
          <div className="text-3xl font-bold text-gray-800">{filteredStats.totalStock.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">총 재고량 (ea)</div>
        </div>
        
        <div className="warehouse-card">
          <div className="text-3xl font-bold text-gray-800">{filteredStats.totalItems}</div>
          <div className="text-sm text-gray-600 mt-1">재고 보유 품목 수</div>
        </div>
        
        <div className="warehouse-card">
          <div className="text-3xl font-bold text-gray-800">{filteredStats.shortageItems}</div>
          <div className="text-sm text-gray-600 mt-1">부족 품목</div>
        </div>
        
        <div className="warehouse-card">
          <div className="text-3xl font-bold text-gray-800">{filteredStats.warehouseZones}</div>
          <div className="text-sm text-gray-600 mt-1">창고 구역</div>
        </div>
      </div>
      
      {/* Inventory Alerts */}
      <InventoryAlerts />
    </div>
  );
}

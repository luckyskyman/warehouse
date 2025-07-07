import { useInventoryStats } from '@/hooks/use-inventory';

export function StatsGrid() {
  const { stats } = useInventoryStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      <div className="warehouse-card">
        <div className="text-3xl font-bold text-gray-800">{stats?.totalStock?.toLocaleString() || 0}</div>
        <div className="text-sm text-gray-600 mt-1">총 재고량 (ea)</div>
      </div>
      
      <div className="warehouse-card">
        <div className="text-3xl font-bold text-gray-800">{stats?.totalItems || 0}</div>
        <div className="text-sm text-gray-600 mt-1">총 품목 수</div>
      </div>
      
      <div className="warehouse-card">
        <div className="text-3xl font-bold text-gray-800">{stats?.shortageItems || 0}</div>
        <div className="text-sm text-gray-600 mt-1">부족 품목</div>
      </div>
      
      <div className="warehouse-card">
        <div className="text-3xl font-bold text-gray-800">{stats?.warehouseZones || 0}</div>
        <div className="text-sm text-gray-600 mt-1">창고 구역</div>
      </div>
    </div>
  );
}

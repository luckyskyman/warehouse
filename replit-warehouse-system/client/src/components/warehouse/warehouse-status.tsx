import { useMemo } from 'react';
import { useInventory, useWarehouseLayout } from '@/hooks/use-inventory';

export function WarehouseStatus() {
  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();

  const zoneData = useMemo(() => {
    const zones = [...new Set(warehouseLayout.map(layout => layout.zoneName))];
    
    return zones.map(zoneName => {
      const zoneItems = inventory.filter(item => item.location?.startsWith(zoneName));
      return {
        name: zoneName,
        items: zoneItems,
        totalItems: zoneItems.length,
        totalStock: zoneItems.reduce((sum, item) => sum + item.stock, 0),
      };
    });
  }, [inventory, warehouseLayout]);

  const getZoneTitle = (zoneName: string) => {
    const titles: Record<string, string> = {
      'A구역': 'A구역 (태양광 패널)',
      'B구역': 'B구역 (인버터)',
      'C구역': 'C구역 (케이블/전선)',
      'D구역': 'D구역 (기타 부품)',
    };
    return titles[zoneName] || zoneName;
  };

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🏪 창고 현황
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zoneData.map((zone) => (
          <div key={zone.name} className="warehouse-zone-card">
            <div className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">
              {getZoneTitle(zone.name)}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>품목 수: {zone.totalItems}개</span>
                <span>총 재고: {zone.totalStock.toLocaleString()}개</span>
              </div>
            </div>

            <div className="space-y-3">
              {zone.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">저장된 품목이 없습니다.</p>
              ) : (
                zone.items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{item.code}</div>
                        <div className="text-sm text-gray-600">{item.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {item.stock.toLocaleString()} {item.unit}
                        </div>
                        <div className="text-xs text-gray-500">{item.location}</div>
                      </div>
                    </div>
                    
                    {item.stock <= item.minStock && (
                      <div className="mt-2">
                        <span className="status-badge-out-of-stock">재고 부족</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {zoneData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          창고 구역이 설정되지 않았습니다.
        </div>
      )}
    </div>
  );
}

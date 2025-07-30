import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Package, MapPin, BarChart3 } from 'lucide-react';
import { parseLocation } from '@shared/location-utils';
import type { InventoryItem } from '@shared/schema';

// 구역별 이모티콘 매핑 함수
const getZoneEmoji = (zoneName: string): string => {
  const zoneEmojiMap: { [key: string]: string } = {
    'A': '🅰️',
    'B': '🅱️', 
    'C': '🅲️',
    'D': '🅳️'
  };
  return zoneEmojiMap[zoneName] || '📦';
};

interface GroupedInventory {
  zoneName: string;
  subZones: {
    [subZoneName: string]: {
      floors: {
        [floor: number]: InventoryItem[];
      };
      totalItems: number;
      totalStock: number;
    };
  };
  totalItems: number;
  totalStock: number;
  utilizationRate: number;
}

export function WarehouseStatusEnhanced() {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedSubZones, setExpandedSubZones] = useState<Set<string>>(new Set());

  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
  });

  // 재고 데이터를 위치별로 그룹핑
  const groupedInventory = (): GroupedInventory[] => {
    const zones: { [zoneName: string]: GroupedInventory } = {};

    inventory.forEach(item => {
      if (!item.location) return;

      const parsed = parseLocation(item.location);
      
      if (!parsed.isValid || !parsed.zoneName) return;

      // 구역 초기화
      if (!zones[parsed.zoneName]) {
        zones[parsed.zoneName] = {
          zoneName: parsed.zoneName,
          subZones: {},
          totalItems: 0,
          totalStock: 0,
          utilizationRate: 0
        };
      }

      // 세부구역 초기화
      if (!zones[parsed.zoneName].subZones[parsed.subZoneName]) {
        zones[parsed.zoneName].subZones[parsed.subZoneName] = {
          floors: {},
          totalItems: 0,
          totalStock: 0
        };
      }

      // 층수 초기화
      const floor = parsed.floor || 1;
      if (!zones[parsed.zoneName].subZones[parsed.subZoneName].floors[floor]) {
        zones[parsed.zoneName].subZones[parsed.subZoneName].floors[floor] = [];
      }

      // 아이템 추가
      zones[parsed.zoneName].subZones[parsed.subZoneName].floors[floor].push(item);
      zones[parsed.zoneName].subZones[parsed.subZoneName].totalItems++;
      zones[parsed.zoneName].subZones[parsed.subZoneName].totalStock += item.stock;
      zones[parsed.zoneName].totalItems++;
      zones[parsed.zoneName].totalStock += item.stock;
    });

    // 사용률 계산 (임의의 최대 용량 기준)
    Object.values(zones).forEach(zone => {
      const maxCapacity = zone.totalItems * 1.5; // 50% 여유 공간 가정
      zone.utilizationRate = Math.min((zone.totalItems / maxCapacity) * 100, 100);
    });

    return Object.values(zones).sort((a, b) => a.zoneName.localeCompare(b.zoneName));
  };

  const toggleZone = (zoneName: string) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName);
      } else {
        newSet.add(zoneName);
      }
      return newSet;
    });
  };

  const toggleSubZone = (subZoneKey: string) => {
    setExpandedSubZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subZoneKey)) {
        newSet.delete(subZoneKey);
      } else {
        newSet.add(subZoneKey);
      }
      return newSet;
    });
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'bg-red-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.stock < 0) return 'text-red-600 font-semibold';
    if (item.stock === 0) return 'text-orange-600 font-semibold';
    if (item.stock <= item.minStock) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  const zones = groupedInventory();

  if (zones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            창고 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>위치 정보가 있는 재고가 없습니다.</p>
            <p className="text-sm mt-1">재고 전체 동기화를 통해 위치 정보를 추가해보세요.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            창고 현황 ({zones.length}개 구역)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {zones.reduce((sum, zone) => sum + zone.totalItems, 0)}
              </div>
              <div className="text-sm text-gray-500">총 제품 종류</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {zones.reduce((sum, zone) => sum + zone.totalStock, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">총 재고 수량</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(zones.reduce((sum, zone) => sum + zone.utilizationRate, 0) / zones.length)}%
              </div>
              <div className="text-sm text-gray-500">평균 사용률</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {zones.map(zone => (
        <Card key={zone.zoneName}>
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
              onClick={() => toggleZone(zone.zoneName)}
            >
              <div className="flex items-center gap-3">
                {expandedZones.has(zone.zoneName) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <h3 className="text-lg font-semibold">
                  {getZoneEmoji(zone.zoneName)} {zone.zoneName}구역
                </h3>
                <Badge variant="outline">
                  {Object.keys(zone.subZones).length}개 세부구역
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">{zone.totalItems}종류</div>
                  <div className="text-xs text-gray-500">{zone.totalStock.toLocaleString()}개</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getUtilizationColor(zone.utilizationRate)}`}></div>
                  <span className="text-sm">{Math.round(zone.utilizationRate)}%</span>
                </div>
              </div>
            </div>
          </CardHeader>

          {expandedZones.has(zone.zoneName) && (
            <CardContent>
              <div className="space-y-3">
                {Object.entries(zone.subZones).map(([subZoneName, subZone]) => {
                  const subZoneKey = `${zone.zoneName}-${subZoneName}`;
                  return (
                    <div key={subZoneKey} className="border rounded-lg p-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-1 p-1 rounded"
                        onClick={() => toggleSubZone(subZoneKey)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedSubZones.has(subZoneKey) ? 
                            <ChevronDown className="w-3 h-3" /> : 
                            <ChevronRight className="w-3 h-3" />
                          }
                          <span className="font-medium">📦 {subZoneName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Object.keys(subZone.floors).length}층
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {subZone.totalItems}종류 • {subZone.totalStock.toLocaleString()}개
                        </div>
                      </div>

                      {expandedSubZones.has(subZoneKey) && (
                        <div className="mt-3 space-y-2">
                          {Object.entries(subZone.floors)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([floor, items]) => (
                            <div key={floor} className="bg-gray-50 rounded p-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">{floor}층</span>
                                <Badge variant="outline" className="text-xs">
                                  {items.length}개 제품
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                {items.slice(0, 6).map(item => (
                                  <div key={item.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{item.code}</div>
                                      <div className="text-xs text-gray-500 truncate">{item.name}</div>
                                    </div>
                                    <div className={`text-right ${getStockStatusColor(item)}`}>
                                      <div className="font-medium">{item.stock.toLocaleString()}</div>
                                      <div className="text-xs">{item.unit}</div>
                                    </div>
                                  </div>
                                ))}
                                {items.length > 6 && (
                                  <div className="col-span-2 text-center text-xs text-gray-500 py-1">
                                    +{items.length - 6}개 제품 더 있음
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
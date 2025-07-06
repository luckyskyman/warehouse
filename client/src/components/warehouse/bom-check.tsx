import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBomGuides, useBomGuidesByName, useInventory } from '@/hooks/use-inventory';
import { BomCheckResult } from '@/types/warehouse';

export function BomCheck() {
  const [selectedGuide, setSelectedGuide] = useState('');
  const { data: bomGuides = [] } = useBomGuides();
  const { data: bomItems = [] } = useBomGuidesByName(selectedGuide);
  const { data: inventory = [] } = useInventory();

  const guideNames = useMemo(() => {
    return Array.from(new Set(bomGuides.map(bom => bom.guideName)));
  }, [bomGuides]);

  // 부품 코드별 기본 품명 매핑
  const getItemName = (itemCode: string): string => {
    const partNameMap: Record<string, string> = {
      // Fasteners
      '30011554': 'SET - M12x40 BOLT/NUT/WASHER',
      '30015819': 'STARLOCK WASHER, 12 DIA SHAFT',
      
      // Grid Components
      '60007657': 'MK3 GRID, TRACK SUPPORT, STUB',
      '60007658': 'MK3 GRID, TRACK SUPPORT, 2W, Y',
      '60007659': 'MK3 GRID, TRACK SUPPORT, 3W, Y',
      '60008594': 'MK3 GRID, ANTI-CRUSH BLOCK 561',
      '60008595': 'MK3 GRID, ANTI-CRUSH BLOCK 761',
      '60010149': 'MK3 GRID, TS SPREADER PLATE, 1 HOLE',
      '60010152': 'MK3 GRID, MOVEMENT JOINT, SHELF TYPE',
      '60011059': 'MK3 GRID, T/S SPREADER PLATE, 3 HOLE',
      '60011060': 'MK3 GRID, TRACK SUPPORT, 4W, Y',
      '60011064': 'MK3 GRID, T/S SPREADER PLATE, 4 HOLE',
      '60011074': 'MK3 GRID, TRACK SUPPORT, 2W, X',
      '60011075': 'MK3 GRID, TRACK SUPPORT, 3W, X',
      '60011464': 'MK3 GRID, TOTE GUIDE, CHANNEL 1H VAR3',
      '60011775': 'MK3B GRID, FRAME, 1&8H, 3-4W, Y',
      '60014483': 'MK3 GRID, PERIMETER CONNECTION',
      '60015814': 'MK3 GRID, TS SPREADER PLATE, 2 HOLE',
      '60016181': 'MK3B, FRAME, BRACE INSERT, 1H, X, 2W',
      '60016278': 'MK3B GRID, FRAME, 1H, 2W, X',
      '60018450': 'MK3 GRID, MOVEMENT JOINT, LATCH TYPE'
    };
    
    return partNameMap[itemCode] || `부품 ${itemCode}`;
  };

  const bomCheckResults = useMemo((): BomCheckResult[] => {
    // 부품별로 필요 수량을 합산
    const aggregatedBom = bomItems.reduce((acc, bomItem) => {
      if (acc[bomItem.itemCode]) {
        acc[bomItem.itemCode].requiredQuantity += bomItem.requiredQuantity;
      } else {
        acc[bomItem.itemCode] = {
          itemCode: bomItem.itemCode,
          requiredQuantity: bomItem.requiredQuantity
        };
      }
      return acc;
    }, {} as Record<string, { itemCode: string; requiredQuantity: number }>);

    // 재고와 비교하여 결과 생성
    return Object.values(aggregatedBom).map(bomItem => {
      const inventoryItem = inventory.find(item => item.code === bomItem.itemCode);
      
      // 동일한 부품 코드의 모든 재고량을 합산 (여러 위치에 있을 수 있음)
      const totalStock = inventory
        .filter(item => item.code === bomItem.itemCode)
        .reduce((sum, item) => sum + item.stock, 0);
      
      return {
        code: bomItem.itemCode,
        name: inventoryItem?.name || getItemName(bomItem.itemCode),
        needed: bomItem.requiredQuantity,
        current: totalStock,
        status: (totalStock >= bomItem.requiredQuantity ? 'ok' : 'shortage') as 'ok' | 'shortage'
      };
    }).sort((a, b) => a.code.localeCompare(b.code)); // 부품 코드순으로 정렬
  }, [bomItems, inventory]);

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        ⚙️ 설치가이드별 자재 확인
      </h2>
      
      <div className="mb-6">
        <Label htmlFor="guideSelect">설치가이드 선택</Label>
        <Select value={selectedGuide} onValueChange={setSelectedGuide}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {guideNames.map(guideName => (
              <SelectItem key={guideName} value={guideName}>{guideName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedGuide && (
        <div className="overflow-x-auto">
          <table className="warehouse-table">
            <thead>
              <tr>
                <th>필요 부품코드</th>
                <th>품명</th>
                <th>필요수량</th>
                <th>현재고</th>
                <th>부족수량</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {bomCheckResults.map((result) => (
                <tr key={result.code}>
                  <td className="font-mono">{result.code}</td>
                  <td>{result.name}</td>
                  <td>{result.needed.toLocaleString()}</td>
                  <td>{result.current.toLocaleString()}</td>
                  <td className={result.status === 'shortage' ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                    {result.status === 'shortage' 
                      ? (result.needed - result.current).toLocaleString()
                      : '-'
                    }
                  </td>
                  <td>
                    <span className={result.status === 'ok' ? 'status-ok' : 'status-shortage'}>
                      {result.status === 'ok' ? '충분' : '부족'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedGuide && bomCheckResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          선택한 가이드에 대한 BOM 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}

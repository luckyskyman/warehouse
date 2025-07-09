import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBomGuides, useBomGuidesByName, useInventory } from '@/hooks/use-inventory';
import { BomCheckResult } from '@/types/warehouse';

export function BomCheck() {
  const [selectedGuide, setSelectedGuide] = useState('');
  const { data: bomGuides = [], isLoading: bomLoading } = useBomGuides();
  const { data: bomItems = [], isLoading: bomItemsLoading } = useBomGuidesByName(selectedGuide);
  const { data: inventory = [] } = useInventory();

  

  const guideNames = useMemo(() => {
    return Array.from(new Set(bomGuides.map(bom => bom.guideName)));
  }, [bomGuides]);

  // 제품 마스터 데이터에서 품명 찾기
  const getItemName = (itemCode: string): string => {
    const masterItem = inventory.find(item => item.code === itemCode);
    return masterItem?.name || `부품 ${itemCode}`;
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
        {bomLoading ? (
          <div className="p-4 text-center text-gray-500">
            설치가이드 목록을 불러오는 중...
          </div>
        ) : (
          <Select value={selectedGuide} onValueChange={setSelectedGuide}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder={guideNames.length > 0 ? "설치가이드를 선택하세요" : "등록된 설치가이드가 없습니다"} />
            </SelectTrigger>
            <SelectContent>
              {guideNames.length > 0 ? (
                guideNames.map(guideName => (
                  <SelectItem key={guideName} value={guideName}>{guideName}</SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500">
                  설치가이드가 없습니다. 먼저 BOM 데이터를 업로드하세요.
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        {!bomLoading && guideNames.length === 0 && (
          <p className="text-sm text-yellow-600 mt-2">
            📋 엑셀관리 탭에서 자재명세서(BOM) 파일을 업로드하세요.
          </p>
        )}
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

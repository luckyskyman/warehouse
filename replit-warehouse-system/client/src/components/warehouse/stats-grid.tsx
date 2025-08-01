import { useInventoryStats, useInventory } from '@/hooks/use-inventory';
import { useIsMobile } from '@/hooks/use-mobile';
import InventoryAlerts from '@/components/notifications/inventory-alerts';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, TrendingDown, Download } from 'lucide-react';
import { exportShortageItemsToExcel } from '@/lib/excel-utils';
import { useToast } from '@/hooks/use-toast';

export function StatsGrid() {
  const { stats } = useInventoryStats();
  const { data: inventory = [] } = useInventory();
  const isMobile = useIsMobile();
  const [shortageModalOpen, setShortageModalOpen] = useState(false);
  const { toast } = useToast();

  // 전체 재고 통계 계산
  const filteredStats = useMemo(() => {
    const totalStock = inventory.reduce((sum, item) => sum + Math.max(0, item.stock), 0); // 마이너스 재고는 0으로 계산
    const totalItems = inventory.filter(item => item.stock > 0).length; // 재고가 있는 품목만
    const shortageCount = inventory.filter(item => item.stock < item.minStock).length; // 부족 품목 (마이너스 포함)
    
    return {
      totalStock,
      totalItems,
      shortageItems: shortageCount,
      warehouseZones: stats?.warehouseZones || 0
    };
  }, [inventory, stats]);

  // 부족 품목 상세 데이터 (마이너스 재고 + 부족 재고)
  const shortageItems = useMemo(() => {
    return inventory
      .filter(item => item.stock < item.minStock)
      .sort((a, b) => {
        // 마이너스 재고를 맨 위에, 그 다음 부족 재고
        if (a.stock < 0 && b.stock >= 0) return -1;
        if (a.stock >= 0 && b.stock < 0) return 1;
        // 같은 범주 내에서는 재고량이 적은 순서
        return a.stock - b.stock;
      });
  }, [inventory]);

  const getUrgencyLevel = (item: any) => {
    if (item.stock < 0) return 'critical';
    if (item.stock === 0) return 'urgent';
    if (item.stock < item.minStock * 0.5) return 'warning';
    return 'low';
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">긴급</Badge>;
      case 'urgent':
        return <Badge variant="destructive" className="text-xs bg-orange-500">매우부족</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs bg-yellow-500 text-white">부족</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">주의</Badge>;
    }
  };

  const handleExportShortageItems = () => {
    try {
      exportShortageItemsToExcel(shortageItems);
      toast({
        title: "엑셀 내보내기 완료",
        description: `${shortageItems.length}개 부족품목이 엑셀 파일로 저장되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "내보내기 실패",
        description: "엑셀 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

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
        
        <div 
          className="warehouse-card cursor-pointer hover:bg-red-50 transition-colors"
          onClick={() => setShortageModalOpen(true)}
        >
          <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
            {shortageItems.length}
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="text-sm text-gray-600 mt-1">부족 품목 (클릭하여 상세보기)</div>
        </div>
        
        <div className="warehouse-card">
          <div className="text-3xl font-bold text-gray-800">{filteredStats.warehouseZones}</div>
          <div className="text-sm text-gray-600 mt-1">창고 구역</div>
        </div>
      </div>
      
      {/* Inventory Alerts */}
      <InventoryAlerts />

      {/* 부족 품목 상세 모달 */}
      <Dialog open={shortageModalOpen} onOpenChange={setShortageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              부족 품목 상세 현황 ({shortageItems.length}개)
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh]">
            {shortageItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>부족한 품목이 없습니다.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>긴급도</TableHead>
                    <TableHead>제품코드</TableHead>
                    <TableHead>제품명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>현재고</TableHead>
                    <TableHead>최소재고</TableHead>
                    <TableHead>부족량</TableHead>
                    <TableHead>위치</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shortageItems.map((item) => {
                    const shortageAmount = item.minStock - item.stock;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {getUrgencyBadge(getUrgencyLevel(item))}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            item.stock < 0 ? 'text-red-600' : 
                            item.stock === 0 ? 'text-orange-600' : 'text-yellow-600'
                          }`}>
                            {item.stock}
                          </span>
                        </TableCell>
                        <TableCell>{item.minStock}</TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">
                            {shortageAmount > 0 ? `+${shortageAmount}` : shortageAmount}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.location ? (
                            <Badge variant="outline" className="text-xs">
                              {item.location}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">미지정</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              <TrendingDown className="h-4 w-4 inline mr-1" />
              총 {shortageItems.length}개 품목이 부족합니다
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleExportShortageItems}
                variant="outline"
                className="flex items-center gap-2"
                disabled={shortageItems.length === 0}
              >
                <Download className="h-4 w-4" />
                엑셀 내보내기
              </Button>
              <Button onClick={() => setShortageModalOpen(false)}>
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

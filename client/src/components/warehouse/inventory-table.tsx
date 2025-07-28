import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Package, AlertTriangle, CheckCircle, Clock, History, MapPin, Settings, Trash2, MoreHorizontal } from 'lucide-react';
import { useInventory, useWarehouseLayout, useTransactions, useDeleteInventoryItem, useAdjustInventoryItem } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import type { InventoryItem } from '@/types/warehouse';

const getLocationVariant = (location: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!location) return "outline";
    return "default";
  };

export function InventoryTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  // 위치 조정 모달
  const [locationDialog, setLocationDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null
  });
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSubZone, setSelectedSubZone] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  
  // 이력 조회 모달
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null
  });
  
  // 수량 조정 모달
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null
  });
  const [newStock, setNewStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  
  // 삭제 확인 모달
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null
  });

  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const { user } = useAuth();
  const { toast } = useToast();

  // 창고 레이아웃에서 선택 가능한 옵션들 추출
  const availableZones = useMemo(() => {
    return Array.from(new Set((warehouseLayout as any[]).map((layout: any) => layout.zoneName)));
  }, [warehouseLayout]);

  const availableSubZones = useMemo(() => {
    if (!selectedZone) return [];
    return Array.from(new Set(
      (warehouseLayout as any[])
        .filter((layout: any) => layout.zoneName === selectedZone)
        .map((layout: any) => layout.subZoneName)
    ));
  }, [warehouseLayout, selectedZone]);

  const availableFloors = useMemo(() => {
    if (!selectedZone || !selectedSubZone) return [];
    return Array.from(new Set(
      (warehouseLayout as any[])
        .filter((layout: any) => layout.zoneName === selectedZone && layout.subZoneName === selectedSubZone)
        .map((layout: any) => layout.floor)
    ));
  }, [warehouseLayout, selectedZone, selectedSubZone]);
  
  const deleteInventoryItem = useDeleteInventoryItem();
  const adjustInventoryItem = useAdjustInventoryItem();

  const handleLocationAssign = (item: InventoryItem) => {
    setLocationDialog({ open: true, item });
    setSelectedZone('');
    setSelectedSubZone('');
    setSelectedFloor('');
  };

  // 이력 보기
  const handleHistoryView = (item: InventoryItem) => {
    setHistoryDialog({ open: true, item });
  };

  // 위치 조정
  const handleLocationChange = (item: InventoryItem) => {
    setLocationDialog({ open: true, item });
    setSelectedZone('');
    setSelectedSubZone('');
    setSelectedFloor('');
  };

  // 수량 조정
  const handleStockAdjust = (item: InventoryItem) => {
    setAdjustDialog({ open: true, item });
    setNewStock(item.stock.toString());
    setAdjustReason('');
  };

  // 삭제
  const handleDelete = (item: InventoryItem) => {
    setDeleteDialog({ open: true, item });
  };



  // 수량 조정 실행
  const performStockAdjust = async () => {
    if (!adjustDialog.item || !newStock || !adjustReason) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      toast({
        title: "입력 오류",
        description: "유효한 재고 수량을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      await adjustInventoryItem.mutateAsync({
        id: adjustDialog.item.id,
        newStock: stockValue,
        reason: adjustReason
      });

      toast({
        title: "수량 조정 완료",
        description: `${adjustDialog.item.name}의 재고가 ${stockValue}${adjustDialog.item.unit}으로 조정되었습니다.`,
      });

      setAdjustDialog({ open: false, item: null });
      setNewStock('');
      setAdjustReason('');
    } catch (error) {
      toast({
        title: "수량 조정 실패",
        description: "수량 조정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 삭제 실행
  const performDelete = async () => {
    if (!deleteDialog.item) return;

    try {
      await deleteInventoryItem.mutateAsync(deleteDialog.item.code);

      toast({
        title: "삭제 완료",
        description: `${deleteDialog.item.name}이(가) 삭제되었습니다.`,
      });

      setDeleteDialog({ open: false, item: null });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "항목 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const assignLocation = async () => {
    if (!locationDialog.item || !selectedZone || !selectedSubZone || !selectedFloor) {
      toast({
        title: "입력 오류",
        description: "모든 위치 정보를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const location = `${selectedZone}-${selectedSubZone}-${selectedFloor}`;
      const sessionId = localStorage.getItem('warehouse_session');

      const response = await fetch(`/api/inventory/${locationDialog.item.code}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        body: JSON.stringify({ location })
      });

      if (!response.ok) throw new Error('위치 지정 실패');

      await queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });

      toast({
        title: "위치 지정 완료",
        description: `${locationDialog.item.name}의 위치가 ${location}으로 설정되었습니다.`,
      });

      setLocationDialog({ open: false, item: null });
    } catch (error) {
      toast({
        title: "위치 지정 실패",
        description: "위치 지정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };



  const filteredInventory = useMemo(() => {
    return (inventory as any[])
      .filter((item: any) =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => {
        // 마이너스 재고를 맨 위에, 그 다음 부족 재고, 마지막에 정상 재고
        if (a.stock < 0 && b.stock >= 0) return -1;
        if (a.stock >= 0 && b.stock < 0) return 1;
        if (a.stock < a.minThreshold && b.stock >= b.minThreshold) return -1;
        if (a.stock >= a.minThreshold && b.stock < b.minThreshold) return 1;
        return a.code.localeCompare(b.code);
      });
  }, [inventory, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>재고 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <Search className="mr-2 h-4 w-4" />
            <Input
              type="search"
              placeholder="제품 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </CardContent>
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">제품코드</TableHead>
              <TableHead>제품명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>현재고</TableHead>
              <TableHead>최소재고</TableHead>
              <TableHead>단위</TableHead>
              <TableHead>위치</TableHead>
              <TableHead className="w-[120px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    item.stock < 0 
                      ? 'text-red-600 font-bold' 
                      : item.stock < item.minStock 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                  }`}>
                    {item.stock}
                  </span>
                </TableCell>
                <TableCell>{item.minStock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
            {item.location ? (
              <Badge variant={getLocationVariant(item.location)}>
                {item.location}
              </Badge>
            ) : (user?.role === 'admin' || user?.role === 'super_admin') ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLocationAssign(item)}
                className="text-xs"
              >
                위치 지정
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs">
                위치 미지정
              </Badge>
            )}
          </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleHistoryView(item)}>
                        <History className="mr-2 h-4 w-4" />
                        이력 보기
                      </DropdownMenuItem>
                      {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <>
                          <DropdownMenuItem onClick={() => handleLocationChange(item)}>
                            <MapPin className="mr-2 h-4 w-4" />
                            위치 조정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStockAdjust(item)}>
                            <Settings className="mr-2 h-4 w-4" />
                            수량 조정
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={locationDialog.open} onOpenChange={(open) => setLocationDialog({ open, item: locationDialog.item })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>위치 지정</DialogTitle>
          </DialogHeader>

          {locationDialog.item && (
            <div className="space-y-4">
              <div>
                <Label>제품명</Label>
                <p className="text-sm text-muted-foreground">{locationDialog.item.name}</p>
              </div>

              <div className="space-y-2">
                <Label>구역 선택</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="구역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>세부구역 선택</Label>
                <Select value={selectedSubZone} onValueChange={setSelectedSubZone} disabled={!selectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="세부구역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubZones.map((subZone) => (
                      <SelectItem key={subZone} value={subZone}>
                        {subZone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>층수 선택</Label>
                <Select value={selectedFloor} onValueChange={setSelectedFloor} disabled={!selectedSubZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="층수를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFloors.map((floor) => (
                      <SelectItem key={floor} value={floor}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialog({ open: false, item: null })}>
              취소
            </Button>
            <Button onClick={assignLocation}>
              위치 지정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이력 조회 모달 */}
      <HistoryDialog 
        open={historyDialog.open}
        item={historyDialog.item}
        onClose={() => setHistoryDialog({ open: false, item: null })}
      />

      {/* 수량 조정 모달 */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ open, item: adjustDialog.item })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수량 조정</DialogTitle>
          </DialogHeader>

          {adjustDialog.item && (
            <div className="space-y-4">
              <div>
                <Label>제품명</Label>
                <p className="text-sm text-muted-foreground">{adjustDialog.item.name}</p>
                <p className="text-xs text-muted-foreground">현재 재고: {adjustDialog.item.stock}{adjustDialog.item.unit}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newStock">조정 후 재고</Label>
                <Input
                  id="newStock"
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="조정할 재고 수량을 입력하세요"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustReason">조정 사유</Label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="조정 사유를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="재고 실사">재고 실사</SelectItem>
                    <SelectItem value="분실">분실</SelectItem>
                    <SelectItem value="파손">파손</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAdjustDialog({ open: false, item: null });
                setNewStock('');
                setAdjustReason('');
              }}
            >
              취소
            </Button>
            <Button onClick={performStockAdjust} disabled={adjustInventoryItem.isPending}>
              {adjustInventoryItem.isPending ? '처리중...' : '조정하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>재고 항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.item && (
                <>
                  <strong>{deleteDialog.item.name}</strong>을(를) 완전히 삭제하시겠습니까?
                  <br />
                  현재 재고: {deleteDialog.item.stock}{deleteDialog.item.unit}
                  <br />
                  <span className="text-red-600 font-medium">이 작업은 되돌릴 수 없습니다.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, item: null })}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={performDelete}
              disabled={deleteInventoryItem.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteInventoryItem.isPending ? '삭제중...' : '삭제하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// 이력 조회 모달 컴포넌트
function HistoryDialog({ 
  open, 
  item, 
  onClose 
}: { 
  open: boolean; 
  item: InventoryItem | null; 
  onClose: () => void; 
}) {
  const { data: transactions = [] } = useTransactions(item?.code);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>재고 이력 조회</DialogTitle>
          {item && (
            <p className="text-sm text-muted-foreground">
              {item.name} ({item.code})
            </p>
          )}
        </DialogHeader>

        <div className="mt-4">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                총 {transactions.length}건의 이력
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>출발지</TableHead>
                    <TableHead>목적지</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>담당자</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type === 'inbound' ? 'default' :
                          transaction.type === 'outbound' ? 'destructive' :
                          transaction.type === 'move' ? 'secondary' : 'outline'
                        }>
                          {transaction.type === 'inbound' ? '입고' :
                           transaction.type === 'outbound' ? '출고' :
                           transaction.type === 'move' ? '이동' : 
                           transaction.type === 'adjustment' ? '조정' : transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.fromLocation || '-'}</TableCell>
                      <TableCell>{transaction.toLocation || '-'}</TableCell>
                      <TableCell>{transaction.reason || '-'}</TableCell>
                      <TableCell>{transaction.userId || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
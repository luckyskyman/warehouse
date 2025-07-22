import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useInventory, useWarehouseLayout } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
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
  const [locationDialog, setLocationDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null
  });
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSubZone, setSelectedSubZone] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');

  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const { toast } = useToast();

  const handleLocationAssign = (item: InventoryItem) => {
    setLocationDialog({ open: true, item });
    setSelectedZone('');
    setSelectedSubZone('');
    setSelectedFloor('');
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

      const response = await fetch(`/api/inventory/${locationDialog.item.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  // Get available zones, subzones, and floors
  const availableZones = Array.from(new Set(warehouseLayout.map(layout => layout.zoneName)));
  const availableSubZones = selectedZone 
    ? Array.from(new Set(warehouseLayout
        .filter(layout => layout.zoneName === selectedZone)
        .map(layout => layout.subZoneName)))
    : [];
  const availableFloors = (selectedZone && selectedSubZone)
    ? Array.from(new Set(warehouseLayout
        .filter(layout => layout.zoneName === selectedZone && layout.subZoneName === selectedSubZone)
        .map(layout => layout.floorLevel)))
    : [];

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(item => item.stock > 0) // 재고가 있는 아이템만 표시
      .filter(item =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.minStock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
            {item.location ? (
              <Badge variant={getLocationVariant(item.location)}>
                {item.location}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLocationAssign(item)}
                className="text-xs"
              >
                위치 지정
              </Button>
            )}
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
                        {floor}층
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
    </Card>
  );
}
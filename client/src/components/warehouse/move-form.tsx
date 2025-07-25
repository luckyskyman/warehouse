import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory, useCreateTransaction, useWarehouseLayout } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { MoveFormData } from '@/types/warehouse';

const moveSchema = z.object({
  code: z.string().min(1, '제품코드를 입력하세요'),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  zone: z.string().min(1, '구역을 선택하세요'),
  subZone: z.string().min(1, '세부구역을 선택하세요'),
  floor: z.string().min(1, '층수를 선택하세요'),
  reason: z.string().min(1, '이동 사유를 입력하세요'),
});

export function MoveForm() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSubZone, setSelectedSubZone] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);
  const [selectedCodeState, setSelectedCodeState] = useState('');
  const [searchValue, setSearchValue] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const createTransaction = useCreateTransaction();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MoveFormData>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      quantity: 1,
    }
  });

  const zones = Array.from(new Set(warehouseLayout.map(layout => layout.zoneName)));
  const subZones = warehouseLayout
    .filter(layout => layout.zoneName === selectedZone)
    .map(layout => layout.subZoneName);
  const floors = warehouseLayout
    .find(layout => layout.zoneName === selectedZone && layout.subZoneName === selectedSubZone)
    ?.floors || [];

  // 검색어에 따른 제품 필터링 및 정렬 (재고가 있는 제품만, 위치별 개별 표시)
  const filteredInventory = React.useMemo(() => {
    // 재고가 있는 제품만 필터링
    const stockedItems = inventory.filter(item => item.stock > 0);

    return stockedItems.filter(item => {
      if (!searchValue) return true;
      
      const searchLower = searchValue.toLowerCase();
      const codeString = String(item.code).toLowerCase();
      const nameString = item.name.toLowerCase();
      
      // 제품코드는 시작 부분 매칭 또는 포함 매칭, 품명은 포함 매칭
      return codeString.startsWith(searchLower) || 
             codeString.includes(searchLower) || 
             nameString.includes(searchLower);
    }).sort((a, b) => {
      if (!searchValue) {
        // 검색어가 없을 때는 제품코드순으로 정렬한 후 위치별 정렬
        if (a.code !== b.code) {
          return String(a.code).localeCompare(String(b.code));
        }
        return (a.location || '').localeCompare(b.location || '');
      }
      
      const searchLower = searchValue.toLowerCase();
      const aCodeString = String(a.code).toLowerCase();
      const bCodeString = String(b.code).toLowerCase();
      
      // 우선순위: 1) 시작 매칭 2) 완전 매칭 3) 포함 매칭
      const aStartsWithSearch = aCodeString.startsWith(searchLower);
      const bStartsWithSearch = bCodeString.startsWith(searchLower);
      
      if (aStartsWithSearch && !bStartsWithSearch) return -1;
      if (!aStartsWithSearch && bStartsWithSearch) return 1;
      
      return 0;
    });
  }, [inventory, searchValue]);

  // 특정 재고 항목 선택 시 자동으로 재고 아이템 설정
  const handleItemSelect = (itemId: number) => {
    // ID로 정확한 재고 항목 찾기
    const item = inventory.find(item => item.id === itemId);
    if (item) {
      setSelectedCodeState(item.code);
      setValue('code', item.code);
      setSelectedItem(item);
    }
    setCodeOpen(false);
    setSearchValue('');
  };

  const onSubmit = async (data: MoveFormData) => {
    if (!selectedItem) {
      toast({
        title: "오류",
        description: "제품을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (selectedItem.stock < data.quantity) {
      toast({
        title: "재고 부족",
        description: `현재고(${selectedItem.stock})가 이동수량(${data.quantity})보다 부족합니다.`,
        variant: "destructive",
      });
      return;
    }

    // 위치 형식 안전하게 생성
    let newLocation: string;
    try {
      const subZoneParts = data.subZone.split('-');
      const subZoneValue = subZoneParts.length > 1 ? subZoneParts[1] : data.subZone;
      newLocation = `${data.zone}-${subZoneValue}-${data.floor.replace('층', '')}`;
    } catch (error) {
      toast({
        title: "위치 형식 오류",
        description: "선택한 위치 정보에 문제가 있습니다. 다시 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedItem.location === newLocation) {
      toast({
        title: "동일한 위치",
        description: "현재 위치와 동일한 위치로는 이동할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        type: 'move',
        itemCode: data.code,
        itemName: selectedItem.name,
        quantity: data.quantity,
        fromLocation: selectedItem.location,
        toLocation: newLocation,
        reason: data.reason,
        userId: user?.id,
      });

      toast({
        title: "이동 완료",
        description: `${selectedItem.name} ${data.quantity}${selectedItem.unit}이(가) ${newLocation}으로 이동되었습니다.`,
      });

      reset();
      setSelectedItem(null);
      setSelectedZone('');
      setSelectedSubZone('');
      setSelectedCodeState('');
      setCodeOpen(false);
      setSearchValue('');
    } catch (error: any) {
      console.error('[클라이언트] 이동 처리 실패:', error);
      toast({
        title: "이동 실패",
        description: error?.message || "이동 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🔄 이동 관리
      </h2>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>제품 선택</Label>
                <Popover open={codeOpen} onOpenChange={setCodeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={codeOpen}
                      className="w-full justify-between"
                    >
                      {selectedCodeState
                        ? inventory.find((item) => item.code === selectedCodeState)?.code
                        : "제품코드 선택 또는 검색"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="제품코드 또는 품명 검색..." 
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>해당 제품을 찾을 수 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {filteredInventory.map((item) => (
                            <CommandItem
                              key={`${item.code}-${item.location || 'no-location'}-${item.id}`}
                              value={`${item.code}@${item.location || ''}`}
                              onSelect={() => handleItemSelect(item.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCodeState === item.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{item.code} - {item.name}</span>
                                <span className="text-sm text-gray-500">재고: {item.stock.toLocaleString()} {item.unit}</span>
                                {item.location && (
                                  <span className="text-xs text-blue-600">위치: {item.location}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">이동 수량 (ea)</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="이동할 수량"
                  max={selectedItem?.stock || 0}
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
              </div>
            </div>

            {selectedItem && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">현재 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">품명:</span>
                    <span className="ml-2 font-medium">{selectedItem.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">현재고:</span>
                    <span className="ml-2 font-medium">{selectedItem.stock} {selectedItem.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">현재 위치:</span>
                    <span className="ml-2 font-medium">{selectedItem.location || '미지정'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone">새 구역</Label>
                <Select
                  value={selectedZone}
                  onValueChange={(value) => {
                    setSelectedZone(value);
                    setSelectedSubZone('');
                    setValue('zone', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="구역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.zone && <p className="text-sm text-red-500">{errors.zone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subZone">새 세부구역</Label>
                <Select
                  value={selectedSubZone}
                  onValueChange={(value) => {
                    setSelectedSubZone(value);
                    setValue('subZone', value);
                  }}
                  disabled={!selectedZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="세부구역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {subZones.map(subZone => (
                      <SelectItem key={subZone} value={subZone}>{subZone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subZone && <p className="text-sm text-red-500">{errors.subZone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">새 층수</Label>
                <Select
                  onValueChange={(value) => setValue('floor', value)}
                  disabled={!selectedSubZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="층수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map(floor => (
                      <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.floor && <p className="text-sm text-red-500">{errors.floor.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moveDate">이동일</Label>
              <Input
                id="moveDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">이동 사유</Label>
              <Textarea
                id="reason"
                {...register('reason')}
                placeholder="이동 사유를 입력하세요"
                rows={3}
              />
              {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
            </div>

            <Button
              type="submit"
              className="btn-warehouse-success"
              disabled={createTransaction.isPending || !selectedItem}
            >
              {createTransaction.isPending ? '처리 중...' : '이동 처리'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

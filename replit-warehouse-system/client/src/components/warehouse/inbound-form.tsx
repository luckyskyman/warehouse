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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateInventoryItem, useCreateTransaction, useUpdateInventoryItem, useInventory, useWarehouseLayout } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { InboundFormData } from '@/types/warehouse';

const inboundSchema = z.object({
  code: z.string().min(1, '제품코드를 입력하세요'),
  name: z.string().min(1, '품명을 입력하세요'),
  category: z.string().min(1, '카테고리를 선택하세요'),
  manufacturer: z.string().optional(),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  minStock: z.number().min(0, '최소재고는 0 이상이어야 합니다'),
  unit: z.string().min(1, '단위를 선택하세요'),
  zone: z.string().min(1, '구역을 선택하세요'),
  subZone: z.string().min(1, '세부구역을 선택하세요'),
  floor: z.string().min(1, '층수를 선택하세요'),
  boxSize: z.number().min(1, '박스당 수량은 1 이상이어야 합니다').optional(),
  memo: z.string().optional(),
});

export function InboundForm() {
  const [unitType, setUnitType] = useState<'box' | 'ea'>('ea');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSubZone, setSelectedSubZone] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const createInventoryItem = useCreateInventoryItem();
  const updateInventoryItem = useUpdateInventoryItem();
  const createTransaction = useCreateTransaction();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InboundFormData>({
    resolver: zodResolver(inboundSchema),
    defaultValues: {
      quantity: 1,
      minStock: 0,
      unit: 'ea',
      boxSize: 1,
    }
  });

  const zones = Array.from(new Set(warehouseLayout.map(layout => layout.zoneName)));
  const subZones = warehouseLayout
    .filter(layout => layout.zoneName === selectedZone)
    .map(layout => layout.subZoneName);
  const floors = warehouseLayout
    .find(layout => layout.zoneName === selectedZone && layout.subZoneName === selectedSubZone)
    ?.floors || [];

  // 검색어에 따른 제품 필터링 및 정렬 (제품코드별 고유화)
  const filteredInventory = React.useMemo(() => {
    // 제품코드별로 고유화 (첫 번째 항목만 선택)
    const uniqueItems = inventory.reduce((acc, item) => {
      if (!acc.find(existing => existing.code === item.code)) {
        acc.push(item);
      }
      return acc;
    }, [] as typeof inventory);

    return uniqueItems.filter(item => {
      if (!searchValue) return true;

      const searchLower = searchValue.toLowerCase();
      const codeString = String(item.code).toLowerCase();
      const nameString = item.name.toLowerCase();

      // 제품코드는 시작 부분 매칭 또는 포함 매칭, 품명은 포함 매칭
      return codeString.startsWith(searchLower) || 
             codeString.includes(searchLower) || 
             nameString.includes(searchLower);
    }).sort((a, b) => {
      if (!searchValue) return 0;

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

  // 제품코드 선택 시 자동으로 품명 설정
  const handleCodeSelect = (code: string) => {
    setSelectedCode(code);
    setValue('code', code);

    // 기존 재고에서 해당 제품 찾기
    const existingItem = inventory.find(item => item.code === code);
    if (existingItem) {
      setValue('name', existingItem.name);
      setValue('category', existingItem.category);
      setValue('manufacturer', existingItem.manufacturer || '');
      setValue('unit', existingItem.unit);
      setValue('minStock', existingItem.minStock);
      setValue('boxSize', existingItem.boxSize || 1);
    }
    setCodeOpen(false);
    setSearchValue('');
  };

  const boxSize = watch('boxSize') || 1;
  const quantityBoxes = watch('quantity') || 0;

  const onSubmit = async (data: InboundFormData) => {
    try {
      // 필수 필드 검증
      if (!data.code?.trim()) {
        toast({
          title: "입고 실패",
          description: "제품코드를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      if (!data.name?.trim()) {
        toast({
          title: "입고 실패", 
          description: "품명을 입력해주세요.",
          variant: "destructive",
        });
        return;
      }

      if (!data.zone || !data.subZone || !data.floor) {
        toast({
          title: "입고 실패",
          description: "구역, 세부구역, 층수를 모두 선택해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 위치 정보 정확한 파싱
      let subZoneNumber;
      if (data.subZone.includes('-')) {
        const parts = data.subZone.split('-');
        subZoneNumber = parts.length > 1 ? parts[1] : parts[0];
      } else {
        subZoneNumber = data.subZone;
      }

      const location = `${data.zone}-${subZoneNumber}-${data.floor.replace('층', '')}`;
      const finalQuantity = unitType === 'box' ? data.quantity * boxSize : data.quantity;

      // 동일한 위치의 기존 재고 항목 찾기
      const existingItem = inventory.find(item => 
        item.code === data.code && item.location === location
      );

      if (existingItem) {
        // 기존 항목의 재고만 증가
        await updateInventoryItem.mutateAsync({
          code: data.code,
          updates: {
            stock: existingItem.stock + finalQuantity,
          }
        });

        // 기존 재고 업데이트 트랜잭션 생성
        await createTransaction.mutateAsync({
          type: 'inbound',
          itemCode: data.code,
          itemName: data.name,
          quantity: finalQuantity,
          toLocation: location,
          memo: data.memo || '',
          userId: user?.id || 1,
        });
      } else {
        // 다른 위치에 기존 재고가 있거나 완전히 새로운 제품인 경우 - 새 위치에 새로운 재고 항목 생성
        const newItemData = {
          code: data.code.trim(),
          name: data.name.trim(),
          category: data.category || '기타',
          manufacturer: data.manufacturer?.trim() || '',
          stock: finalQuantity,
          minStock: data.minStock || 0,
          unit: data.unit || 'ea',
          location: location,
          boxSize: data.boxSize || 1,
        };

        await createInventoryItem.mutateAsync(newItemData);

        // 신규 재고 입고 트랜잭션 생성
        await createTransaction.mutateAsync({
          type: 'inbound',
          itemCode: data.code,
          itemName: data.name,
          quantity: finalQuantity,
          toLocation: location,
          memo: data.memo || '',
          userId: user?.id || 1,
        });
      }

      toast({
        title: "입고 완료",
        description: `${data.name} ${finalQuantity}${data.unit}이(가) 입고되었습니다.`,
      });

      reset();
      setSelectedZone('');
      setSelectedSubZone('');
      setSelectedCode('');
      setCodeOpen(false);
      setSearchValue('');
    } catch (error) {
      toast({
        title: "입고 실패",
        description: "입고 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        📥 입고 관리
      </h2>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>제품코드</Label>
                <Popover open={codeOpen} onOpenChange={setCodeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={codeOpen}
                      className="w-full justify-between"
                    >
                      {selectedCode
                        ? inventory.find((item) => item.code === selectedCode)?.code
                        : "제품코드 선택 또는 직접 입력"}
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
                              key={item.code}
                              value={item.code}
                              onSelect={() => handleCodeSelect(item.code)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCode === item.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{item.code}</span>
                                <span className="text-sm text-gray-500">{item.name}</span>
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
                <Label htmlFor="name">품명</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="품명 입력"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="조립부품">조립부품</SelectItem>
                    <SelectItem value="토트가이드">토트가이드</SelectItem>
                    <SelectItem value="프레임">프레임</SelectItem>
                    <SelectItem value="트랙서포트">트랙서포트</SelectItem>
                    <SelectItem value="지그">지그</SelectItem>
                    <SelectItem value="전자제품">전자제품</SelectItem>
                    <SelectItem value="의류">의류</SelectItem>
                    <SelectItem value="식품">식품</SelectItem>
                    <SelectItem value="생활용품">생활용품</SelectItem>
                    <SelectItem value="산업자재">산업자재</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">제조사</Label>
                <Input
                  id="manufacturer"
                  {...register('manufacturer')}
                  placeholder="제조사 입력 (선택사항)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">단위</Label>
                <Select onValueChange={(value) => setValue('unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="단위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ea">개 (ea)</SelectItem>
                    <SelectItem value="box">박스 (box)</SelectItem>
                    <SelectItem value="set">세트 (set)</SelectItem>
                    <SelectItem value="roll">롤 (roll)</SelectItem>
                    <SelectItem value="kg">킬로그램 (kg)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">최소재고</Label>
                <Input
                  id="minStock"
                  type="number"
                  {...register('minStock', { valueAsNumber: true })}
                  placeholder="최소재고 입력"
                />
                {errors.minStock && <p className="text-sm text-red-500">{errors.minStock.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <Label>수량 입력 방식</Label>
              <RadioGroup
                value={unitType}
                onValueChange={(value: 'box' | 'ea') => setUnitType(value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="box" id="box" />
                  <Label htmlFor="box">박스로 입력</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ea" id="ea" />
                  <Label htmlFor="ea">낱개(EA)로 입력</Label>
                </div>
              </RadioGroup>

              {unitType === 'box' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="boxSize">박스당 수량 (ea)</Label>
                    <Input
                      id="boxSize"
                      type="number"
                      {...register('boxSize', { valueAsNumber: true })}
                      placeholder="박스당 수량"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">박스 수</Label>
                    <Input
                      id="quantity"
                      type="number"
                      {...register('quantity', { valueAsNumber: true })}
                      placeholder="박스 수 입력"
                    />
                    {quantityBoxes > 0 && boxSize > 0 && (
                      <p className="text-sm text-gray-600">
                        총 수량: {quantityBoxes * boxSize} ea
                      </p>
                    )}
                  </div>
                </div>
              )}

              {unitType === 'ea' && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">수량 (ea)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                    placeholder="수량 입력"
                  />
                </div>
              )}
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone">구역</Label>
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
                <Label htmlFor="subZone">세부구역</Label>
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
                <Label htmlFor="floor">층수</Label>
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
              <Label htmlFor="memo">메모</Label>
              <Textarea
                id="memo"
                {...register('memo')}
                placeholder="입고 관련 메모 (선택사항)"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="btn-warehouse-success"
              disabled={createInventoryItem.isPending || createTransaction.isPending}
            >
              {createInventoryItem.isPending || createTransaction.isPending ? '처리 중...' : '입고 등록'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
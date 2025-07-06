import { useState } from 'react';
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
import { useCreateInventoryItem, useCreateTransaction, useInventory, useWarehouseLayout } from '@/hooks/use-inventory';
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
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: inventory = [] } = useInventory();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const createInventoryItem = useCreateInventoryItem();
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

  const zones = [...new Set(warehouseLayout.map(layout => layout.zoneName))];
  const subZones = warehouseLayout
    .filter(layout => layout.zoneName === selectedZone)
    .map(layout => layout.subZoneName);
  const floors = warehouseLayout
    .find(layout => layout.zoneName === selectedZone && layout.subZoneName === selectedSubZone)
    ?.floors || [];

  const boxSize = watch('boxSize') || 1;
  const quantityBoxes = watch('quantity') || 0;

  const onSubmit = async (data: InboundFormData) => {
    try {
      const location = `${data.zone}-${data.subZone.split('-')[1]}-${data.floor.replace('층', '')}`;
      const finalQuantity = unitType === 'box' ? data.quantity * boxSize : data.quantity;

      // Check if item already exists
      const existingItem = inventory.find(item => item.code === data.code);
      
      if (existingItem) {
        // Create transaction for existing item
        await createTransaction.mutateAsync({
          type: 'inbound',
          itemCode: data.code,
          itemName: data.name,
          quantity: finalQuantity,
          toLocation: location,
          memo: data.memo,
          userId: user?.id,
        });
      } else {
        // Create new item
        await createInventoryItem.mutateAsync({
          code: data.code,
          name: data.name,
          category: data.category,
          manufacturer: data.manufacturer,
          stock: finalQuantity,
          minStock: data.minStock,
          unit: data.unit,
          location: location,
          boxSize: data.boxSize || 1,
        });

        // Create transaction for new item
        await createTransaction.mutateAsync({
          type: 'inbound',
          itemCode: data.code,
          itemName: data.name,
          quantity: finalQuantity,
          toLocation: location,
          memo: data.memo,
          userId: user?.id,
        });
      }

      toast({
        title: "입고 완료",
        description: `${data.name} ${finalQuantity}${data.unit}이(가) 입고되었습니다.`,
      });

      reset();
      setSelectedZone('');
      setSelectedSubZone('');
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
                <Label htmlFor="code">제품코드</Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="제품코드 입력"
                />
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

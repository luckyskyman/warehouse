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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInventory, useCreateTransaction, useExchangeQueue, useProcessExchangeQueueItem } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { OutboundFormData } from '@/types/warehouse';

const outboundSchema = z.object({
  code: z.string().min(1, '제품코드를 입력하세요'),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  reason: z.string().min(1, '출고 사유를 선택하세요'),
  memo: z.string().optional(),
});

export function OutboundForm() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: inventory = [] } = useInventory();
  const { data: exchangeQueue = [] } = useExchangeQueue();
  const createTransaction = useCreateTransaction();
  const processExchangeQueueItem = useProcessExchangeQueueItem();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<OutboundFormData>({
    resolver: zodResolver(outboundSchema),
    defaultValues: {
      quantity: 1,
      reason: '조립장 이동',
    }
  });

  const selectedCode = watch('code');

  const handleCodeChange = (code: string) => {
    const item = inventory.find(item => item.code === code);
    setSelectedItem(item);
    setValue('code', code);
  };

  const onSubmit = async (data: OutboundFormData) => {
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
        description: `현재고(${selectedItem.stock})가 출고수량(${data.quantity})보다 부족합니다.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        type: 'outbound',
        itemCode: data.code,
        itemName: selectedItem.name,
        quantity: data.quantity,
        fromLocation: selectedItem.location,
        reason: data.reason,
        memo: data.memo,
        userId: user?.id,
      });

      toast({
        title: "출고 완료",
        description: `${selectedItem.name} ${data.quantity}${selectedItem.unit}이(가) 출고되었습니다.`,
      });

      reset();
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: "출고 실패",
        description: "출고 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleProcessExchange = async (exchangeId: number) => {
    try {
      await processExchangeQueueItem.mutateAsync(exchangeId);
      toast({
        title: "교환 처리 완료",
        description: "교환 대기 품목이 처리되었습니다.",
      });
    } catch (error) {
      toast({
        title: "처리 실패",
        description: "교환 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="warehouse-content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          📤 출고 관리
        </h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="btn-warehouse-info">
              📦 교환 대기 목록 보기
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>📦 교환 대기 목록</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {exchangeQueue.length === 0 ? (
                <p className="text-center py-4 text-gray-500">교환 대기 품목이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="warehouse-table">
                    <thead>
                      <tr>
                        <th>출고일</th>
                        <th>제품코드</th>
                        <th>품명</th>
                        <th>수량</th>
                        <th>처리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchangeQueue.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.outboundDate).toLocaleDateString('ko-KR')}</td>
                          <td className="font-mono">{item.itemCode}</td>
                          <td>{item.itemName}</td>
                          <td>{item.quantity.toLocaleString()}</td>
                          <td>
                            <Button
                              size="sm"
                              className="btn-warehouse-success"
                              onClick={() => handleProcessExchange(item.id)}
                              disabled={processExchangeQueueItem.isPending}
                            >
                              처리 완료
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">제품 선택</Label>
                <Select onValueChange={handleCodeChange} value={selectedCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="제품 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(item => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.code} - {item.name} (재고: {item.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">출고 수량 (ea)</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="출고할 수량"
                  max={selectedItem?.stock || 0}
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
                {selectedItem && (
                  <p className="text-sm text-gray-600">
                    현재고: {selectedItem.stock.toLocaleString()} {selectedItem.unit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">출고 사유</Label>
                <Select onValueChange={(value) => setValue('reason', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="출고 사유 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="조립장 이동">조립장 이동</SelectItem>
                    <SelectItem value="출고 반환">출고 반환</SelectItem>
                    <SelectItem value="불량품 교환 출고">불량품 교환 출고</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="outDate">출고일</Label>
                <Input
                  id="outDate"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Textarea
                id="memo"
                {...register('memo')}
                placeholder="출고 관련 메모 (선택사항)"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="btn-warehouse-warning"
              disabled={createTransaction.isPending || !selectedItem}
            >
              {createTransaction.isPending ? '처리 중...' : '출고 처리'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

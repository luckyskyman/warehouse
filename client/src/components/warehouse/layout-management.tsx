import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useWarehouseLayout, useCreateWarehouseZone } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';

const layoutSchema = z.object({
  zoneName: z.string().min(1, '구역명을 입력하세요'),
  subZoneName: z.string().min(1, '세부구역명을 입력하세요'),
  floors: z.array(z.string()).min(1, '최소 1개 층을 선택하세요'),
});

interface LayoutFormData {
  zoneName: string;
  subZoneName: string;
  floors: string[];
}

export function LayoutManagement() {
  const [selectedFloors, setSelectedFloors] = useState<string[]>(['1층']);
  const { toast } = useToast();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const createWarehouseZone = useCreateWarehouseZone();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LayoutFormData>({
    resolver: zodResolver(layoutSchema),
    defaultValues: {
      floors: ['1층'],
    }
  });

  const availableFloors = ['1층', '2층', '3층', '4층', '5층'];

  const handleFloorToggle = (floor: string) => {
    const newFloors = selectedFloors.includes(floor)
      ? selectedFloors.filter(f => f !== floor)
      : [...selectedFloors, floor];
    
    setSelectedFloors(newFloors);
    setValue('floors', newFloors);
  };

  const onSubmit = async (data: LayoutFormData) => {
    try {
      await createWarehouseZone.mutateAsync({
        zoneName: data.zoneName,
        subZoneName: data.subZoneName,
        floors: data.floors,
      });

      toast({
        title: "구역 추가 완료",
        description: `${data.zoneName} - ${data.subZoneName}이(가) 추가되었습니다.`,
      });

      reset();
      setSelectedFloors(['1층']);
    } catch (error) {
      toast({
        title: "구역 추가 실패",
        description: "구역 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const groupedLayout = warehouseLayout.reduce((acc, layout) => {
    if (!acc[layout.zoneName]) {
      acc[layout.zoneName] = [];
    }
    acc[layout.zoneName].push(layout);
    return acc;
  }, {} as Record<string, typeof warehouseLayout>);

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🔧 창고 구조 관리
      </h2>

      {/* Add New Zone Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">새 구역 추가</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">구역명</Label>
                <Input
                  id="zoneName"
                  {...register('zoneName')}
                  placeholder="예: E구역"
                />
                {errors.zoneName && <p className="text-sm text-red-500">{errors.zoneName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subZoneName">세부구역명</Label>
                <Input
                  id="subZoneName"
                  {...register('subZoneName')}
                  placeholder="예: E-1"
                />
                {errors.subZoneName && <p className="text-sm text-red-500">{errors.subZoneName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>사용할 층수</Label>
              <div className="flex flex-wrap gap-2">
                {availableFloors.map((floor) => (
                  <Button
                    key={floor}
                    type="button"
                    variant={selectedFloors.includes(floor) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFloorToggle(floor)}
                    className={selectedFloors.includes(floor) ? "btn-warehouse-primary" : ""}
                  >
                    {floor}
                  </Button>
                ))}
              </div>
              {errors.floors && <p className="text-sm text-red-500">{errors.floors.message}</p>}
            </div>

            <Button
              type="submit"
              className="btn-warehouse-success"
              disabled={createWarehouseZone.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createWarehouseZone.isPending ? '추가 중...' : '구역 추가'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Layout Display */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">현재 창고 구조</h3>
        
        {Object.keys(groupedLayout).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            설정된 창고 구역이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(groupedLayout).map(([zoneName, layouts]) => (
              <Card key={zoneName}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{zoneName}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {layouts.map((layout) => (
                      <div key={layout.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{layout.subZoneName}</span>
                          <div className="text-sm text-gray-600">
                            층수: {layout.floors.join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

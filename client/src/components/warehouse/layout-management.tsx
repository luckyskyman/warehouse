import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, MapPin, Building, Layers, Package } from 'lucide-react';
import { useWarehouseLayout, useCreateWarehouseZone, useUpdateWarehouseZone, useDeleteWarehouseZone } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { WarehouseLayout } from '@/types/warehouse';
import { PermissionGuard } from '@/components/ui/permission-guard';

const layoutSchema = z.object({
  zoneName: z.string().min(1, '구역명을 입력하세요'),
  subZoneName: z.string().min(1, '세부구역명을 입력하세요'),
  floors: z.string().min(1, '층수를 입력하세요'),
});

type LayoutFormData = z.infer<typeof layoutSchema>;

export function LayoutManagement() {
  const [editingZone, setEditingZone] = useState<WarehouseLayout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: layout = [] } = useWarehouseLayout();
  const createZone = useCreateWarehouseZone();
  const updateZone = useUpdateWarehouseZone();
  const deleteZone = useDeleteWarehouseZone();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<LayoutFormData>({
    resolver: zodResolver(layoutSchema),
  });

  // 구역별로 그룹화
  const groupedLayout = React.useMemo(() => {
    const groups: { [key: string]: WarehouseLayout[] } = {};
    layout.forEach(zone => {
      if (!groups[zone.zoneName]) {
        groups[zone.zoneName] = [];
      }
      groups[zone.zoneName].push(zone);
    });
    return groups;
  }, [layout]);

  const onSubmit = async (data: LayoutFormData) => {
    try {
      const floorsArray = data.floors.split(',').map(f => f.trim()).filter(f => f);
      const zoneData = {
        zoneName: data.zoneName,
        subZoneName: data.subZoneName,
        floors: floorsArray,
      };

      if (editingZone) {
        // 편집 모드
        await updateZone.mutateAsync({
          id: editingZone.id,
          ...zoneData,
        });

        toast({
          title: "구역 수정 완료",
          description: `${data.zoneName}-${data.subZoneName}이(가) 수정되었습니다.`,
        });
      } else {
        // 새 생성 모드
        await createZone.mutateAsync(zoneData);

        toast({
          title: "구역 추가 완료",
          description: `${data.zoneName}-${data.subZoneName}이(가) 추가되었습니다.`,
        });
      }

      reset();
      setIsDialogOpen(false);
      setEditingZone(null);
    } catch (error) {
      toast({
        title: editingZone ? "구역 수정 실패" : "구역 추가 실패",
        description: editingZone ? "구역 수정 중 오류가 발생했습니다." : "구역 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (zone: WarehouseLayout) => {
    setEditingZone(zone);
    setValue('zoneName', zone.zoneName);
    setValue('subZoneName', zone.subZoneName);
    setValue('floors', zone.floors.join(', '));
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingZone(null);
    reset();
    setIsDialogOpen(true);
  };

  const handleDelete = async (zoneId: number, zoneName: string, subZoneName: string) => {
    try {
      await deleteZone.mutateAsync(zoneId);
      toast({
        title: "구역 삭제 완료",
        description: `${zoneName}-${subZoneName}이(가) 삭제되었습니다.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "구역 삭제 중 오류가 발생했습니다.";
      toast({
        title: "삭제 실패",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="warehouse-content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building className="w-6 h-6" />
          창고 구조 관리
        </h2>
        <PermissionGuard permission="canManageWarehouse">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="btn-warehouse-primary">
                <Plus className="w-4 h-4 mr-2" />
                새 구역 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? '구역 수정' : '새 구역 추가'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">메인 구역명</Label>
                <Input
                  id="zoneName"
                  {...register('zoneName')}
                  placeholder="예: A구역, B구역"
                />
                {errors.zoneName && (
                  <p className="text-sm text-red-500">{errors.zoneName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subZoneName">세부 구역명</Label>
                <Input
                  id="subZoneName"
                  {...register('subZoneName')}
                  placeholder="예: 1구역, 2구역"
                />
                {errors.subZoneName && (
                  <p className="text-sm text-red-500">{errors.subZoneName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floors">층 정보</Label>
                <Input
                  id="floors"
                  {...register('floors')}
                  placeholder="예: 1, 2, 3 (쉼표로 구분)"
                />
                {errors.floors && (
                  <p className="text-sm text-red-500">{errors.floors.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="btn-warehouse-primary">
                  {editingZone ? '수정' : '추가'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      {/* 창고 구조 시각화 */}
      <div className="grid gap-6">
        {Object.keys(groupedLayout).length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Package className="w-12 h-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-600">창고 구역이 없습니다</h3>
                <p className="text-gray-500 mt-2">첫 번째 창고 구역을 추가해보세요.</p>
              </div>
            </div>
          </Card>
        ) : (
          Object.entries(groupedLayout).map(([zoneName, zones]) => (
            <Card key={zoneName} className="overflow-hidden">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  {zoneName}
                  <Badge variant="secondary" className="ml-2">
                    {zones.length}개 세부구역
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{zone.subZoneName}</h4>
                          <p className="text-sm text-gray-600">
                            위치: {zone.zoneName}-{zone.subZoneName}
                          </p>
                        </div>
                        <PermissionGuard permission="canManageWarehouse" showViewerMessage={false}>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(zone)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>구역 삭제</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {zone.zoneName}-{zone.subZoneName}을(를) 삭제하시겠습니까?
                                    이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(zone.id, zone.zoneName, zone.subZoneName)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </PermissionGuard>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">층 정보:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {zone.floors.map((floor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {floor}층
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="text-xs text-gray-500">
                        생성일: {new Date(zone.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 창고 구조 요약 */}
      {Object.keys(groupedLayout).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              창고 구조 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(groupedLayout).length}
                </div>
                <div className="text-sm text-gray-600">메인 구역</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {layout.length}
                </div>
                <div className="text-sm text-gray-600">세부 구역</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  {layout.reduce((total, zone) => total + zone.floors.length, 0)}
                </div>
                <div className="text-sm text-gray-600">총 층수</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {layout.reduce((total, zone) => total + (zone.floors.length * 1), 0)}
                </div>
                <div className="text-sm text-gray-600">총 위치</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
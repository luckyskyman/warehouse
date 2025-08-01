import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_PERMISSIONS } from '@shared/permissions';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PermissionMatrixProps {
  className?: string;
}

interface PermissionInfo {
  key: string;
  name: string;
  category: string;
  description: string;
}

const PERMISSION_INFO: PermissionInfo[] = [
  // 시스템 관리
  { key: 'canResetData', name: '시스템 초기화', category: '시스템 관리', description: '모든 데이터 초기화' },
  { key: 'canRestoreData', name: '데이터 복원', category: '시스템 관리', description: '백업 데이터 복원' },
  { key: 'canManageUsers', name: '사용자 관리', category: '시스템 관리', description: '사용자 생성/수정/삭제' },
  { key: 'canManagePermissions', name: '권한 관리', category: '시스템 관리', description: '사용자 권한 설정' },
  
  // Excel 관리
  { key: 'canUploadBom', name: 'BOM 업로드', category: 'Excel 관리', description: 'BOM 파일 업로드' },
  { key: 'canUploadMaster', name: '마스터 업로드', category: 'Excel 관리', description: '제품 마스터 업로드' },
  { key: 'canUploadInventoryAdd', name: '재고 추가', category: 'Excel 관리', description: '재고 추가 업로드' },
  { key: 'canUploadInventorySync', name: '전체 동기화', category: 'Excel 관리', description: '재고 전체 동기화' },
  { key: 'canAccessExcelManagement', name: 'Excel 접근', category: 'Excel 관리', description: 'Excel 관리 탭 접근' },
  { key: 'canBackupData', name: '데이터 백업', category: 'Excel 관리', description: '데이터 백업 생성' },
  
  // 재고 관리
  { key: 'canManageInventory', name: '재고 관리', category: '재고 관리', description: '재고 수정/삭제' },
  { key: 'canProcessTransactions', name: '트랜잭션 처리', category: '재고 관리', description: '입출고 처리' },
  { key: 'canManageBom', name: 'BOM 관리', category: '재고 관리', description: 'BOM 설정 관리' },
  { key: 'canManageWarehouse', name: '창고 관리', category: '재고 관리', description: '창고 레이아웃 관리' },
  { key: 'canProcessExchange', name: '교환 처리', category: '재고 관리', description: '불량품 교환 처리' },
  { key: 'canManageLocation', name: '위치 관리', category: '재고 관리', description: '제품 위치 지정/변경' },
  
  // 다운로드
  { key: 'canDownloadInventory', name: '재고 다운로드', category: '다운로드', description: '재고 현황 다운로드' },
  { key: 'canDownloadTransactions', name: '트랜잭션 다운로드', category: '다운로드', description: '거래 이력 다운로드' },
  { key: 'canDownloadBom', name: 'BOM 다운로드', category: '다운로드', description: 'BOM 데이터 다운로드' },
  { key: 'canDownloadAll', name: '전체 다운로드', category: '다운로드', description: '모든 데이터 다운로드' },
  
  // 업무일지
  { key: 'canCreateDiary', name: '일지 작성', category: '업무일지', description: '업무일지 작성' },
  { key: 'canEditDiary', name: '일지 수정', category: '업무일지', description: '업무일지 수정' },
  { key: 'canDeleteDiary', name: '일지 삭제', category: '업무일지', description: '업무일지 삭제' },
  { key: 'canViewReports', name: '보고서 조회', category: '업무일지', description: '업무일지 보고서' },
];

const ROLES = ['super_admin', 'admin', 'manager', 'user', 'viewer'] as const;
const ROLE_NAMES = {
  super_admin: '최고관리자',
  admin: '일반관리자',
  manager: '부서관리자',
  user: '일반사용자',
  viewer: '조회전용'
};

const ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-green-100 text-green-800',
  user: 'bg-yellow-100 text-yellow-800',
  viewer: 'bg-gray-100 text-gray-800'
};

export function PermissionMatrix({ className }: PermissionMatrixProps) {
  const renderPermissionIcon = (hasPermission: boolean, isPartial?: boolean) => {
    if (isPartial) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return hasPermission ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    );
  };

  const groupedPermissions = PERMISSION_INFO.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, PermissionInfo[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span>📊 역할별 권한 매트릭스</span>
          </div>
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(role => (
            <Badge key={role} className={ROLE_COLORS[role]}>
              {ROLE_NAMES[role]}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-1">
                {category}
              </h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">권한</TableHead>
                      {ROLES.map(role => (
                        <TableHead key={role} className="text-center w-[100px]">
                          <Badge className={`${ROLE_COLORS[role]} text-xs`}>
                            {ROLE_NAMES[role]}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map(permission => (
                      <TableRow key={permission.key}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </TableCell>
                        {ROLES.map(role => {
                          const rolePermissions = ROLE_PERMISSIONS[role];
                          const hasPermission = rolePermissions?.[permission.key as keyof typeof rolePermissions];
                          return (
                            <TableCell key={role} className="text-center">
                              {renderPermissionIcon(Boolean(hasPermission))}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
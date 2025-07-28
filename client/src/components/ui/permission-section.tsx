import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { ROLE_PERMISSIONS } from '@shared/permissions';

interface PermissionToggleProps {
  permission: string;
  label: string;
  description: string;
  value: boolean;
  defaultValue: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

interface PermissionSectionProps {
  title: string;
  icon: string;
  permissions: PermissionToggleProps[];
  onResetToDefault: () => void;
  hasChanges: boolean;
}

function PermissionToggle({ 
  permission, 
  label, 
  description, 
  value, 
  defaultValue, 
  onChange, 
  disabled 
}: PermissionToggleProps) {
  const isModified = value !== defaultValue;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
      <div className="flex items-center gap-3 flex-1">
        <Switch
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${isModified ? 'text-blue-700' : 'text-gray-700'}`}>
              {label}
            </span>
            {isModified && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                수정됨
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            기본값: {defaultValue ? '활성화' : '비활성화'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PermissionSection({ 
  title, 
  icon, 
  permissions, 
  onResetToDefault, 
  hasChanges 
}: PermissionSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{icon}</span>
            <span>{title}</span>
          </CardTitle>
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToDefault}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              기본값으로
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {permissions.map((permission) => (
          <PermissionToggle key={permission.permission} {...permission} />
        ))}
      </CardContent>
    </Card>
  );
}

// 권한 정보 정의
export const PERMISSION_CATEGORIES = {
  system: {
    title: '시스템 관리',
    icon: '⚙️',
    permissions: [
      { key: 'canResetData', label: '시스템 초기화', description: '모든 데이터를 초기화합니다. 매우 위험한 기능입니다.' },
      { key: 'canRestoreData', label: '데이터 복원', description: '백업된 데이터를 복원합니다.' },
      { key: 'canManageUsers', label: '사용자 관리', description: '사용자를 생성, 수정, 삭제할 수 있습니다.' },
      { key: 'canManagePermissions', label: '권한 관리', description: '다른 사용자의 권한을 설정할 수 있습니다.' },
    ]
  },
  excel: {
    title: 'Excel 관리',
    icon: '📊',
    permissions: [
      { key: 'canUploadBom', label: 'BOM 업로드', description: 'BOM 파일을 업로드할 수 있습니다.' },
      { key: 'canUploadMaster', label: '마스터 업로드', description: '제품 마스터 데이터를 업로드할 수 있습니다.' },
      { key: 'canUploadInventoryAdd', label: '재고 추가', description: '재고 추가 데이터를 업로드할 수 있습니다.' },
      { key: 'canUploadInventorySync', label: '전체 동기화', description: '재고 전체를 동기화할 수 있습니다.' },
      { key: 'canAccessExcelManagement', label: 'Excel 관리 접근', description: 'Excel 관리 탭에 접근할 수 있습니다.' },
      { key: 'canBackupData', label: '데이터 백업', description: '데이터 백업을 생성할 수 있습니다.' },
    ]
  },
  inventory: {
    title: '재고 관리',
    icon: '🏪',
    permissions: [
      { key: 'canManageInventory', label: '재고 관리', description: '재고를 수정하고 삭제할 수 있습니다.' },
      { key: 'canProcessTransactions', label: '트랜잭션 처리', description: '입고, 출고 등의 트랜잭션을 처리할 수 있습니다.' },
      { key: 'canManageBom', label: 'BOM 관리', description: 'BOM 설정을 관리할 수 있습니다.' },
      { key: 'canManageWarehouse', label: '창고 관리', description: '창고 레이아웃을 관리할 수 있습니다.' },
      { key: 'canProcessExchange', label: '교환 처리', description: '불량품 교환을 처리할 수 있습니다.' },
      { key: 'canManageLocation', label: '위치 관리', description: '제품의 위치를 지정하고 변경할 수 있습니다.' },
    ]
  },
  download: {
    title: '다운로드',
    icon: '📥',
    permissions: [
      { key: 'canDownloadInventory', label: '재고 다운로드', description: '재고 현황을 다운로드할 수 있습니다.' },
      { key: 'canDownloadTransactions', label: '트랜잭션 다운로드', description: '거래 이력을 다운로드할 수 있습니다.' },
      { key: 'canDownloadBom', label: 'BOM 다운로드', description: 'BOM 데이터를 다운로드할 수 있습니다.' },
      { key: 'canDownloadAll', label: '전체 다운로드', description: '모든 데이터를 다운로드할 수 있습니다.' },
    ]
  },
  diary: {
    title: '업무일지',
    icon: '📋',
    permissions: [
      { key: 'canCreateDiary', label: '일지 작성', description: '업무일지를 작성할 수 있습니다.' },
      { key: 'canEditDiary', label: '일지 수정', description: '업무일지를 수정할 수 있습니다.' },
      { key: 'canDeleteDiary', label: '일지 삭제', description: '업무일지를 삭제할 수 있습니다.' },
      { key: 'canViewReports', label: '보고서 조회', description: '업무일지 보고서를 조회할 수 있습니다.' },
    ]
  }
};
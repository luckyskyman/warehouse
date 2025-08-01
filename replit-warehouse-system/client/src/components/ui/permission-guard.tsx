import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { AlertCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: 'canCreate' | 'canUpdate' | 'canDelete' | 'canManageInventory' | 'canProcessTransactions' | 'canManageBom' | 'canManageWarehouse' | 'canUploadFiles' | 'canDownloadData' | 'canRestoreData' | 'canProcessExchange' | 'canCreateDiary' | 'canEditDiary' | 'canDeleteDiary' | 'canViewReports' | 'canDownloadInventory' | 'canDownloadTransactions' | 'canDownloadBom' | 'canDownloadAll' | 'canManageLocation';
  permission?: 'canCreate' | 'canUpdate' | 'canDelete' | 'canManageInventory' | 'canProcessTransactions' | 'canManageBom' | 'canManageWarehouse' | 'canUploadFiles' | 'canDownloadData' | 'canRestoreData' | 'canProcessExchange' | 'canCreateDiary' | 'canEditDiary' | 'canDeleteDiary' | 'canViewReports' | 'canDownloadInventory' | 'canDownloadTransactions' | 'canDownloadBom' | 'canDownloadAll' | 'canManageLocation';
  fallback?: React.ReactNode;
  showViewerMessage?: boolean;
}

export function PermissionGuard({ 
  children, 
  requiredPermission,
  permission, 
  fallback, 
  showViewerMessage = true 
}: PermissionGuardProps) {
  const permissions = usePermissions();

  // Support both prop names for backward compatibility
  const permissionToCheck = requiredPermission || permission;
  
  if (!permissionToCheck || !permissions[permissionToCheck]) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showViewerMessage && permissions.isViewer) {
      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-700">
                    조회 전용 모드
                  </span>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    Viewer
                  </Badge>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  데이터 보호를 위해 수정 기능이 제한되어 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// 버튼이나 폼 요소를 비활성화하는 HOC
export function withPermissionDisabled<T extends { disabled?: boolean }>(
  Component: React.ComponentType<T>,
  permission: keyof ReturnType<typeof usePermissions>
) {
  return function PermissionDisabledComponent(props: T) {
    const permissions = usePermissions();
    const isDisabled = !permissions[permission] || props.disabled;

    return <Component {...props} disabled={isDisabled} />;
  };
}
import { useAuth } from './use-auth';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return {
    // 읽기 권한 (모든 사용자)
    canView: !!user,
    
    // 쓰기 권한 (Admin만)
    canCreate: isAdmin,
    canUpdate: isAdmin,
    canDelete: isAdmin,
    
    // 특정 기능 권한
    canManageInventory: isAdmin,
    canProcessTransactions: isAdmin,
    canManageBom: isAdmin,
    canManageWarehouse: isAdmin,
    canUploadFiles: isAdmin,
    canDownloadData: !!user, // Admin과 Viewer 모두 허용
    canRestoreData: isAdmin,
    canProcessExchange: isAdmin,
    
    // 사용자 정보
    user,
    isAdmin,
    isViewer,
  };
}
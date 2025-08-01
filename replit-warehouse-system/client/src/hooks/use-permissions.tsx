import { useAuth } from './use-auth';
import { getUserPermissions } from '@shared/permissions';
import type { User } from '@shared/schema';

export function usePermissions() {
  const { user } = useAuth();

  if (!user) {
    return {
      // 로그인하지 않은 사용자는 모든 권한 없음
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canManageInventory: false,
      canProcessTransactions: false,
      canManageBom: false,
      canManageWarehouse: false,
      canUploadFiles: false,
      canDownloadData: false,
      canRestoreData: false,
      canProcessExchange: false,
      canViewDiary: false,
      canCreateDiary: false,
      canEditDiary: false,
      canDeleteDiary: false,
      canViewReports: false,
      
      // Excel 세부 권한
      canUploadBom: false,
      canUploadMaster: false,
      canUploadInventoryAdd: false,
      canUploadInventorySync: false,
      canAccessExcelManagement: false,
      canBackupData: false,
      canResetData: false,
      canManageUsers: false,
      canManagePermissions: false,
      canDownloadInventory: false,
      canDownloadTransactions: false,
      canDownloadBom: false,
      canDownloadAll: false,
      canManageLocation: false,
      
      // 사용자 정보
      user: null,
      isAdmin: false,
      isViewer: false,
      isManager: false,
      isSuperAdmin: false,
      isLimitedViewer: false,
      
      // 작성자 기반 권한 체크 함수
      canEditDiaryItem: () => false,
      canDeleteDiaryItem: () => false,
    };
  }

  // 사용자별 실제 권한 가져오기 (타입 캐스팅)
  const permissions = getUserPermissions(user as any);
  
  const isAdmin = user.role === 'admin';
  const isViewer = user.role === 'viewer';
  const isManager = user.role === 'manager';
  const isSuperAdmin = user.role === 'super_admin';
  const isLimitedViewer = user.role === 'viewer' && !permissions.canAccessExcelManagement;

  return {
    // 기본 권한 (하위 호환성)
    canView: !!user,
    canCreate: permissions.canManageInventory,
    canUpdate: permissions.canManageInventory,
    canDelete: permissions.canManageInventory,

    // 특정 기능 권한 (기존 호환성)
    canManageInventory: permissions.canManageInventory,
    canProcessTransactions: permissions.canProcessTransactions,
    canManageBom: permissions.canManageBom,
    canManageWarehouse: permissions.canManageWarehouse,
    canUploadFiles: permissions.canUploadBom || permissions.canUploadMaster || permissions.canUploadInventoryAdd,
    canDownloadData: permissions.canDownloadInventory || permissions.canDownloadBom,
    canRestoreData: permissions.canRestoreData,
    canProcessExchange: permissions.canProcessExchange,

    // 업무일지 권한
    canViewDiary: permissions.canViewReports,
    canCreateDiary: permissions.canCreateDiary,
    canEditDiary: permissions.canEditDiary,
    canDeleteDiary: permissions.canDeleteDiary,
    canViewReports: permissions.canViewReports,

    // Excel 세부 권한
    canUploadBom: permissions.canUploadBom,
    canUploadMaster: permissions.canUploadMaster,
    canUploadInventoryAdd: permissions.canUploadInventoryAdd,
    canUploadInventorySync: permissions.canUploadInventorySync,
    canAccessExcelManagement: permissions.canAccessExcelManagement,
    canBackupData: permissions.canBackupData,
    canResetData: permissions.canResetData,
    canManageUsers: permissions.canManageUsers,
    canManagePermissions: permissions.canManagePermissions,
    canDownloadInventory: permissions.canDownloadInventory,
    canDownloadTransactions: permissions.canDownloadTransactions,
    canDownloadBom: permissions.canDownloadBom,
    canDownloadAll: permissions.canDownloadAll,
    canManageLocation: permissions.canManageLocation,

    // 작성자 기반 권한 체크 함수
    canEditDiaryItem: (diaryAuthorId: number) => {
      if (permissions.canDeleteDiary) return true; // Admin급은 모든 업무일지 수정 가능
      return user.id === diaryAuthorId; // 작성자 본인만 수정 가능
    },

    canDeleteDiaryItem: (diaryAuthorId: number) => {
      return permissions.canDeleteDiary; // Admin급만 삭제 가능
    },

    // 사용자 정보
    user,
    isAdmin,
    isViewer,
    isManager,
    isSuperAdmin,
    isLimitedViewer,
  };
}
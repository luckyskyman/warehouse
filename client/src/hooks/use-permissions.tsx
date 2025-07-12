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

    // 새로운 업무일지 권한 시스템
    canViewDiary: !!user, // 모든 사용자가 조회 가능 (부서별 필터링은 서버에서 처리)
    canCreateDiary: !!user, // 모든 사용자가 작성 가능
    canEditDiary: !!user, // 모든 사용자가 수정 가능 (본인 작성한 것만, 서버에서 검증)
    canDeleteDiary: isAdmin, // Admin만 삭제 가능
    canViewReports: !!user, // 모든 사용자가 보고서 조회 가능

    // 작성자 기반 권한 체크 함수
    canEditDiaryItem: (diaryAuthorId: number) => {
      if (isAdmin) return true; // Admin은 모든 업무일지 수정 가능
      return user?.id === diaryAuthorId; // 작성자 본인만 수정 가능
    },

    canDeleteDiaryItem: (diaryAuthorId: number) => {
      return isAdmin; // Admin만 삭제 가능
    },

    // 사용자 정보
    user,
    isAdmin,
    isViewer,
  };
}
import { type User } from './schema';

// 역할 계층 정의
export const ROLE_HIERARCHY = {
  'super_admin': 4,  // 최고 관리자 (시스템 전체)
  'admin': 3,        // 일반 관리자 (운영 관리)
  'manager': 2,      // 부서 관리자 (부서별 관리)
  'user': 1,         // 일반 사용자 (제한적 접근)
  'viewer': 0        // 조회 전용 (읽기만)
};

// 위험 기능 목록 (이중 검증 필요)
export const CRITICAL_PERMISSIONS = [
  'canResetData',           // 시스템 초기화
  'canUploadInventorySync', // 전체 동기화
  'canRestoreData',         // 데이터 복원
  'canManagePermissions'    // 권한 관리
];

// 역할별 기본 권한 템플릿
export const ROLE_PERMISSIONS = {
  super_admin: {
    // 시스템 관리 (위험 기능 포함)
    canResetData: true,
    canRestoreData: true,
    canManageUsers: true,
    canManagePermissions: true,
    
    // Excel 관리 (모든 기능)
    canUploadBom: true,
    canUploadMaster: true,
    canUploadInventoryAdd: true,
    canUploadInventorySync: true,
    canAccessExcelManagement: true,
    canBackupData: true,
    
    // 재고 관리 (모든 기능)
    canManageInventory: true,
    canProcessTransactions: true,
    canManageBom: true,
    canManageWarehouse: true,
    canProcessExchange: true,
    canManageLocation: true,
    
    // 다운로드 (모든 데이터)
    canDownloadInventory: true,
    canDownloadTransactions: true,
    canDownloadBom: true,
    canDownloadAll: true,
    
    // 업무일지 (모든 기능)
    canCreateDiary: true,
    canEditDiary: true,
    canDeleteDiary: true,
    canViewReports: true,
  },
  
  admin: {
    // 운영 관리 (제한적 위험 기능)
    canResetData: false,          // ❌ 시스템 초기화 금지
    canRestoreData: true,
    canManageUsers: true,
    canManagePermissions: false,  // ❌ 권한 관리는 super_admin만
    
    // Excel 관리 (대부분 기능)
    canUploadBom: true,
    canUploadMaster: true,
    canUploadInventoryAdd: true,
    canUploadInventorySync: true,
    canAccessExcelManagement: true,
    canBackupData: true,
    
    // 재고 관리 (모든 기능)
    canManageInventory: true,
    canProcessTransactions: true,
    canManageBom: true,
    canManageWarehouse: true,
    canProcessExchange: true,
    canManageLocation: true,
    
    // 다운로드 (모든 데이터)
    canDownloadInventory: true,
    canDownloadTransactions: true,
    canDownloadBom: true,
    canDownloadAll: true,
    
    // 업무일지 (삭제 제외)
    canCreateDiary: true,
    canEditDiary: true,
    canDeleteDiary: true,
    canViewReports: true,
  },
  
  manager: {
    // 부서 관리 (안전한 기능만)
    canResetData: false,
    canRestoreData: false,
    canManageUsers: false,
    canManagePermissions: false,
    
    // Excel 관리 (안전한 기능만)
    canUploadBom: true,
    canUploadMaster: true,
    canUploadInventoryAdd: true,
    canUploadInventorySync: false, // ❌ 전체 동기화 금지 
    canAccessExcelManagement: true,
    canBackupData: true,
    
    // 재고 관리 (기본 기능)
    canManageInventory: true,
    canProcessTransactions: true,
    canManageBom: true,
    canManageWarehouse: true,
    canProcessExchange: true,
    canManageLocation: true,
    
    // 다운로드 (부서 관련 데이터)
    canDownloadInventory: true,
    canDownloadTransactions: true,
    canDownloadBom: true,
    canDownloadAll: false,
    
    // 업무일지 (삭제 제외)
    canCreateDiary: true,
    canEditDiary: true,
    canDeleteDiary: false,
    canViewReports: true,
  },
  
  user: {
    // 일반 업무 (최소 필요 기능)
    canResetData: false,
    canRestoreData: false,
    canManageUsers: false,
    canManagePermissions: false,
    
    // Excel 관리 (매우 제한적)
    canUploadBom: false,
    canUploadMaster: false,
    canUploadInventoryAdd: true,   // 안전한 추가만
    canUploadInventorySync: false,
    canAccessExcelManagement: true, // 접근은 가능하지만 기능 제한
    canBackupData: false,
    
    // 재고 관리 (조회 중심)
    canManageInventory: false,
    canProcessTransactions: true,  // 기본 트랜잭션 처리
    canManageBom: false,
    canManageWarehouse: false,
    canProcessExchange: false,
    canManageLocation: false,  // 위치 변경 금지
    
    // 다운로드 (기본 조회용)
    canDownloadInventory: true,
    canDownloadTransactions: false, // 민감 정보 차단
    canDownloadBom: true,
    canDownloadAll: false,
    
    // 업무일지 (기본 기능)
    canCreateDiary: true,
    canEditDiary: true,
    canDeleteDiary: false,
    canViewReports: true,
  },
  
  viewer: {
    // 조회 전용 (모든 기능 차단)
    canResetData: false,
    canRestoreData: false,
    canManageUsers: false,
    canManagePermissions: false,
    
    // Excel 관리 (모든 업로드 금지)
    canUploadBom: false,
    canUploadMaster: false,
    canUploadInventoryAdd: false,
    canUploadInventorySync: false,
    canAccessExcelManagement: false, // Excel 관리 완전 차단
    canBackupData: false,
    
    // 재고 관리 (조회만)
    canManageInventory: false,
    canProcessTransactions: false,
    canManageBom: true,        // ✅ BOM 조회/확인은 허용
    canManageWarehouse: false,
    canProcessExchange: false,
    canManageLocation: false,  // 위치 변경 금지
    
    // 다운로드 (완전 차단 - 조회 전용)
    canDownloadInventory: false,
    canDownloadTransactions: false,
    canDownloadBom: false,
    canDownloadAll: false,
    
    // 업무일지 (조회만 허용)
    canCreateDiary: false,
    canEditDiary: false,
    canDeleteDiary: false,
    canViewReports: true,  // ✅ 보고서 조회는 허용
  }
};

// 사용자 권한 확인 함수 (개별 설정 우선)
export function getUserPermissions(user: User): Record<string, boolean> {
  // 1차: 역할별 기본 권한 가져오기
  const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.viewer;
  
  // 2차: 개별 사용자 권한으로 오버라이드 (개별 설정이 우선)
  const userPermissions = {
    ...rolePermissions,
    
    // 개별 사용자 설정이 null이 아닌 경우 우선 적용
    canUploadBom: user.canUploadBom !== null ? user.canUploadBom : rolePermissions.canUploadBom,
    canUploadMaster: user.canUploadMaster !== null ? user.canUploadMaster : rolePermissions.canUploadMaster,
    canUploadInventoryAdd: user.canUploadInventoryAdd !== null ? user.canUploadInventoryAdd : rolePermissions.canUploadInventoryAdd,
    canUploadInventorySync: user.canUploadInventorySync !== null ? user.canUploadInventorySync : rolePermissions.canUploadInventorySync,
    canAccessExcelManagement: user.canAccessExcelManagement !== null ? user.canAccessExcelManagement : rolePermissions.canAccessExcelManagement,
    canBackupData: user.canBackupData !== null ? user.canBackupData : rolePermissions.canBackupData,
    canRestoreData: user.canRestoreData !== null ? user.canRestoreData : rolePermissions.canRestoreData,
    canResetData: user.canResetData !== null ? user.canResetData : rolePermissions.canResetData,
    canManageUsers: user.canManageUsers !== null ? user.canManageUsers : rolePermissions.canManageUsers,
    canManagePermissions: user.canManagePermissions !== null ? user.canManagePermissions : rolePermissions.canManagePermissions,
    canDownloadInventory: user.canDownloadInventory !== null ? user.canDownloadInventory : rolePermissions.canDownloadInventory,
    canDownloadTransactions: user.canDownloadTransactions !== null ? user.canDownloadTransactions : rolePermissions.canDownloadTransactions,
    canDownloadBom: user.canDownloadBom !== null ? user.canDownloadBom : rolePermissions.canDownloadBom,
    canDownloadAll: user.canDownloadAll !== null ? user.canDownloadAll : rolePermissions.canDownloadAll,
    canManageInventory: user.canManageInventory !== null ? user.canManageInventory : rolePermissions.canManageInventory,
    canProcessTransactions: user.canProcessTransactions !== null ? user.canProcessTransactions : rolePermissions.canProcessTransactions,
    canManageBom: user.canManageBom !== null ? user.canManageBom : rolePermissions.canManageBom,
    canManageWarehouse: user.canManageWarehouse !== null ? user.canManageWarehouse : rolePermissions.canManageWarehouse,
    canProcessExchange: user.canProcessExchange !== null ? user.canProcessExchange : rolePermissions.canProcessExchange,
    canManageLocation: (user as any).canManageLocation !== null ? (user as any).canManageLocation : rolePermissions.canManageLocation,
    canCreateDiary: user.canCreateDiary !== null ? user.canCreateDiary : rolePermissions.canCreateDiary,
    canEditDiary: user.canEditDiary !== null ? user.canEditDiary : rolePermissions.canEditDiary,
    canDeleteDiary: user.canDeleteDiary !== null ? user.canDeleteDiary : rolePermissions.canDeleteDiary,
    canViewReports: user.canViewReports !== null ? user.canViewReports : rolePermissions.canViewReports,
  };
  
  return userPermissions;
}

// 권한 확인 함수
export function checkPermission(user: User, permission: string): boolean {
  const permissions = getUserPermissions(user);
  return permissions[permission] || false;
}

// 위험 기능 확인 함수 (이중 검증)
export function checkCriticalPermission(user: User, permission: string): boolean {
  // 1차: 일반 권한 확인
  if (!checkPermission(user, permission)) {
    return false;
  }
  
  // 2차: 위험 기능 추가 검증
  if (CRITICAL_PERMISSIONS.includes(permission)) {
    // Super Admin만 위험 기능 실행 가능
    return user.role === 'super_admin';
  }
  
  return true;
}

// 계정 생성 시 역할별 기본 권한 적용 함수
export function applyRolePermissions(role: string): Partial<User> {
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.viewer;
  
  return {
    canUploadBom: permissions.canUploadBom,
    canUploadMaster: permissions.canUploadMaster,
    canUploadInventoryAdd: permissions.canUploadInventoryAdd,
    canUploadInventorySync: permissions.canUploadInventorySync,
    canAccessExcelManagement: permissions.canAccessExcelManagement,
    canBackupData: permissions.canBackupData,
    canRestoreData: permissions.canRestoreData,
    canResetData: permissions.canResetData,
    canManageUsers: permissions.canManageUsers,
    canManagePermissions: permissions.canManagePermissions,
    canDownloadInventory: permissions.canDownloadInventory,
    canDownloadTransactions: permissions.canDownloadTransactions,
    canDownloadBom: permissions.canDownloadBom,
    canDownloadAll: permissions.canDownloadAll,
    canManageInventory: permissions.canManageInventory,
    canProcessTransactions: permissions.canProcessTransactions,
    canManageBom: permissions.canManageBom,
    canManageWarehouse: permissions.canManageWarehouse,
    canProcessExchange: permissions.canProcessExchange,
    canCreateDiary: permissions.canCreateDiary,
    canEditDiary: permissions.canEditDiary,
    canDeleteDiary: permissions.canDeleteDiary,
    canViewReports: permissions.canViewReports,
  };
}

// 권한 카테고리 정의
export const PERMISSION_CATEGORIES = {
  system: {
    title: '시스템 관리',
    icon: 'Settings',
    permissions: [
      { key: 'canResetData', label: '시스템 초기화', description: '모든 데이터를 초기화합니다 (매우 위험)' },
      { key: 'canRestoreData', label: '데이터 복원', description: '백업 데이터를 복원합니다' },
      { key: 'canManageUsers', label: '사용자 관리', description: '사용자 생성, 수정, 삭제 권한' },
      { key: 'canManagePermissions', label: '권한 관리', description: '사용자 권한 설정 및 관리' },
      { key: 'canBackupData', label: '데이터 백업', description: '시스템 데이터 백업 생성' }
    ]
  },
  excel: {
    title: 'Excel 관리',
    icon: 'FileSpreadsheet',
    permissions: [
      { key: 'canUploadBom', label: 'BOM 업로드', description: 'BOM 데이터 엑셀 업로드' },
      { key: 'canUploadMaster', label: '제품 마스터 업로드', description: '제품 마스터 데이터 업로드' },
      { key: 'canUploadInventoryAdd', label: '재고 추가/보충', description: '재고 추가 및 보충 업로드' },
      { key: 'canUploadInventorySync', label: '전체 동기화', description: '전체 재고 동기화 (위험)' },
      { key: 'canAccessExcelManagement', label: 'Excel 관리 페이지 접근', description: 'Excel 관리 페이지 접근 권한' }
    ]
  },
  inventory: {
    title: '재고 관리',
    icon: 'Package',
    permissions: [
      { key: 'canManageInventory', label: '재고 관리', description: '재고 항목 관리 권한' },
      { key: 'canProcessTransactions', label: '입출고 처리', description: '입출고 트랜잭션 처리' },
      { key: 'canManageBom', label: 'BOM 관리', description: 'BOM 데이터 관리' },
      { key: 'canManageWarehouse', label: '창고 관리', description: '창고 레이아웃 및 설정 관리' },
      { key: 'canProcessExchange', label: '불량품 교환', description: '불량품 교환 프로세스 관리' },
      { key: 'canManageLocation', label: '위치 관리', description: '창고 위치 정보 관리' }
    ]
  },
  download: {
    title: '다운로드',
    icon: 'Download',
    permissions: [
      { key: 'canDownloadInventory', label: '재고 현황', description: '재고 현황 데이터 다운로드' },
      { key: 'canDownloadTransactions', label: '트랜잭션 이력', description: '트랜잭션 이력 다운로드' },
      { key: 'canDownloadBom', label: 'BOM 데이터', description: 'BOM 데이터 다운로드' },
      { key: 'canDownloadAll', label: '전체 데이터', description: '모든 시스템 데이터 다운로드' }
    ]
  },
  diary: {
    title: '업무일지',
    icon: 'BookOpen',
    permissions: [
      { key: 'canCreateDiary', label: '업무일지 작성', description: '새로운 업무일지 작성' },
      { key: 'canEditDiary', label: '업무일지 수정', description: '기존 업무일지 수정' },
      { key: 'canDeleteDiary', label: '업무일지 삭제', description: '업무일지 삭제 권한' },
      { key: 'canViewReports', label: '리포트 조회', description: '업무일지 리포트 및 통계 조회' }
    ]
  }
};
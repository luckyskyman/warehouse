export interface User {
  id: number;
  username: string;
  role: string;
  department?: string;
  position?: string;
  isManager?: boolean;
  createdAt: string;
  
  // Excel 관리 권한
  canUploadBom?: boolean;
  canUploadMaster?: boolean;
  canUploadInventoryAdd?: boolean;
  canUploadInventorySync?: boolean;
  canAccessExcelManagement?: boolean;
  
  // 데이터 관리 권한
  canBackupData?: boolean;
  canRestoreData?: boolean;
  canResetData?: boolean;
  canManageUsers?: boolean;
  canManagePermissions?: boolean;
  
  // 다운로드 권한
  canDownloadInventory?: boolean;
  canDownloadTransactions?: boolean;
  canDownloadBom?: boolean;
  canDownloadAll?: boolean;
  
  // 재고 관리 권한
  canManageInventory?: boolean;
  canProcessTransactions?: boolean;
  canManageBom?: boolean;
  canManageWarehouse?: boolean;
  canProcessExchange?: boolean;
  
  // 업무일지 권한
  canCreateDiary?: boolean;
  canEditDiary?: boolean;
  canDeleteDiary?: boolean;
  canViewReports?: boolean;
}

export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  category: string;
  manufacturer?: string;
  stock: number;
  minStock: number;
  unit: string;
  location?: string;
  boxSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: number;
  type: "inbound" | "outbound" | "move" | "adjustment";
  itemCode: string;
  itemName: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason?: string;
  memo?: string;
  userId?: number;
  createdAt: Date;
}

export interface BomGuide {
  id: number;
  guideName: string;
  itemCode: string;
  requiredQuantity: number;
  createdAt: Date;
}

export interface BomCheckResult {
  code: string;
  name: string;
  needed: number;
  current: number;
  status: "ok" | "shortage";
}

export interface WarehouseLayout {
  id: number;
  zoneName: string;
  subZoneName: string;
  floors: string[];
  createdAt: Date;
}

export interface ExchangeQueue {
  id: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  outboundDate: Date;
  processed: boolean;
  createdAt: Date;
}

export interface InventoryStats {
  totalItems: number;
  totalStock: number;
  shortageItems: number;
  warehouseZones: number;
}

export interface WorkDiary {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "in_progress" | "completed" | "pending";
  workDate: Date;
  attachments?: any[];
  tags?: string[];
  authorId: number;
  assignedTo?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkDiaryComment {
  id: number;
  diaryId: number;
  content: string;
  authorId: number;
  createdAt: Date;
}

export interface WorkNotification {
  id: number;
  userId: number;
  diaryId: number;
  type: "new_diary" | "comment" | "mention" | "status_change";
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface WorkDiaryFormData {
  title: string;
  content: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "in_progress" | "completed" | "pending";
  workDate: Date;
  tags: string[];
  assignedTo: number[];
  visibility?: "private" | "department" | "public";
}

export type TabName = "bomCheck" | "inventory" | "inbound" | "outbound" | "move" | "warehouse" | "layout" | "excel" | "workDiary" | "users";

export interface InboundFormData {
  code: string;
  name: string;
  category: string;
  manufacturer?: string;
  quantity: number;
  minStock: number;
  unit: string;
  zone: string;
  subZone: string;
  floor: string;
  boxSize?: number;
  memo?: string;
}

export interface OutboundFormData {
  code: string;
  quantity: number;
  reason: string;
  memo?: string;
}

export interface MoveFormData {
  code: string;
  quantity: number;
  zone: string;
  subZone: string;
  floor: string;
  reason: string;
}

import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // 'super_admin', 'admin', 'manager', 'user', 'viewer'
  department: text("department"), // 부서명
  position: text("position"), // 직급
  isManager: boolean("is_manager").default(false), // 부서장 여부
  
  // Excel 관리 권한
  canUploadBom: boolean("can_upload_bom").default(false),
  canUploadMaster: boolean("can_upload_master").default(false),
  canUploadInventoryAdd: boolean("can_upload_inventory_add").default(false),
  canUploadInventorySync: boolean("can_upload_inventory_sync").default(false),
  canAccessExcelManagement: boolean("can_access_excel_management").default(false),
  
  // 데이터 관리 권한
  canBackupData: boolean("can_backup_data").default(false),
  canRestoreData: boolean("can_restore_data").default(false),
  canResetData: boolean("can_reset_data").default(false),
  canManageUsers: boolean("can_manage_users").default(false),
  canManagePermissions: boolean("can_manage_permissions").default(false),
  
  // 다운로드 권한
  canDownloadInventory: boolean("can_download_inventory").default(true),
  canDownloadTransactions: boolean("can_download_transactions").default(false),
  canDownloadBom: boolean("can_download_bom").default(true),
  canDownloadAll: boolean("can_download_all").default(false),
  
  // 재고 관리 권한
  canManageInventory: boolean("can_manage_inventory").default(false),
  canProcessTransactions: boolean("can_process_transactions").default(false),
  canManageBom: boolean("can_manage_bom").default(false),
  canManageWarehouse: boolean("can_manage_warehouse").default(false),
  canProcessExchange: boolean("can_process_exchange").default(false),
  canManageLocation: boolean("can_manage_location").default(false),
  
  // 업무일지 권한
  canCreateDiary: boolean("can_create_diary").default(true),
  canEditDiary: boolean("can_edit_diary").default(true),
  canDeleteDiary: boolean("can_delete_diary").default(false),
  canViewReports: boolean("can_view_reports").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  manufacturer: text("manufacturer"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  unit: text("unit").notNull().default("ea"),
  location: text("location"),
  boxSize: integer("box_size").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'inbound', 'outbound', 'move', 'adjustment'
  itemCode: text("item_code").notNull(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  reason: text("reason"),
  memo: text("memo"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bomGuides = pgTable("bom_guides", {
  id: serial("id").primaryKey(),
  guideName: text("guide_name").notNull(),
  itemCode: text("item_code").notNull(),
  requiredQuantity: integer("required_quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const warehouseLayout = pgTable("warehouse_layout", {
  id: serial("id").primaryKey(),
  zoneName: text("zone_name").notNull(),
  subZoneName: text("sub_zone_name").notNull(),
  floors: json("floors").notNull(), // Array of floor numbers
  createdAt: timestamp("created_at").defaultNow(),
});

export const exchangeQueue = pgTable("exchange_queue", {
  id: serial("id").primaryKey(),
  itemCode: text("item_code").notNull(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  outboundDate: timestamp("outbound_date").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workDiary = pgTable("work_diary", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // '입고', '출고', '재고조사', '설비점검', '기타'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  status: text("status").notNull().default("completed"), // 'in_progress', 'completed', 'pending'
  workDate: timestamp("work_date").notNull(),
  attachments: json("attachments"), // Array of file info
  tags: json("tags"), // Array of tags
  authorId: integer("author_id").notNull(),
  assignedTo: json("assigned_to"), // Array of user IDs
  visibility: text("visibility").notNull().default("department"), // 'private', 'department', 'public'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workDiaryComments = pgTable("work_diary_comments", {
  id: serial("id").primaryKey(),
  diaryId: integer("diary_id").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workNotifications = pgTable("work_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  diaryId: integer("diary_id").notNull(),
  type: text("type").notNull(), // 'new_diary', 'comment', 'mention', 'status_change'
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  department: true,
  position: true,
  isManager: true,
  canUploadBom: true,
  canUploadMaster: true,
  canUploadInventoryAdd: true,
  canUploadInventorySync: true,
  canAccessExcelManagement: true,
  canBackupData: true,
  canRestoreData: true,
  canResetData: true,
  canManageUsers: true,
  canManagePermissions: true,
  canDownloadInventory: true,
  canDownloadTransactions: true,
  canDownloadBom: true,
  canDownloadAll: true,
  canManageInventory: true,
  canProcessTransactions: true,
  canManageBom: true,
  canManageWarehouse: true,
  canProcessExchange: true,
  canManageLocation: true,
  canCreateDiary: true,
  canEditDiary: true,
  canDeleteDiary: true,
  canViewReports: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  code: true,
  name: true,
  category: true,
  manufacturer: true,
  stock: true,
  minStock: true,
  unit: true,
  location: true,
  boxSize: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  type: true,
  itemCode: true,
  itemName: true,
  quantity: true,
  fromLocation: true,
  toLocation: true,
  reason: true,
  memo: true,
  userId: true,
});

export const insertBomGuideSchema = createInsertSchema(bomGuides).pick({
  guideName: true,
  itemCode: true,
  requiredQuantity: true,
});

export const insertWarehouseLayoutSchema = createInsertSchema(warehouseLayout).pick({
  zoneName: true,
  subZoneName: true,
  floors: true,
});

export const insertExchangeQueueSchema = createInsertSchema(exchangeQueue).pick({
  itemCode: true,
  itemName: true,
  quantity: true,
  outboundDate: true,
});

export const insertWorkDiarySchema = createInsertSchema(workDiary).pick({
  title: true,
  content: true,
  category: true,
  priority: true,
  status: true,
  workDate: true,
  attachments: true,
  tags: true,
  authorId: true,
  assignedTo: true,
  visibility: true,
}).extend({
  workDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export const insertWorkDiaryCommentSchema = createInsertSchema(workDiaryComments).pick({
  diaryId: true,
  content: true,
  authorId: true,
});

export const insertWorkNotificationSchema = createInsertSchema(workNotifications).pick({
  userId: true,
  diaryId: true,
  type: true,
  message: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type BomGuide = typeof bomGuides.$inferSelect;
export type InsertBomGuide = z.infer<typeof insertBomGuideSchema>;

export type WarehouseLayout = typeof warehouseLayout.$inferSelect;
export type InsertWarehouseLayout = z.infer<typeof insertWarehouseLayoutSchema>;

export type ExchangeQueue = typeof exchangeQueue.$inferSelect;
export type InsertExchangeQueue = z.infer<typeof insertExchangeQueueSchema>;

export type WorkDiary = typeof workDiary.$inferSelect;
export type InsertWorkDiary = z.infer<typeof insertWorkDiarySchema>;

export type WorkDiaryComment = typeof workDiaryComments.$inferSelect;
export type InsertWorkDiaryComment = z.infer<typeof insertWorkDiaryCommentSchema>;

export type WorkNotification = typeof workNotifications.$inferSelect;
export type InsertWorkNotification = z.infer<typeof insertWorkNotificationSchema>;

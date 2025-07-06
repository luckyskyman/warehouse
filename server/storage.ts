import { 
  type User, type InsertUser, 
  type InventoryItem, type InsertInventoryItem,
  type Transaction, type InsertTransaction,
  type BomGuide, type InsertBomGuide,
  type WarehouseLayout, type InsertWarehouseLayout,
  type ExchangeQueue, type InsertExchangeQueue
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Inventory management
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(code: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(code: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(code: string): Promise<boolean>;

  // Transaction management
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByItemCode(itemCode: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // BOM management
  getBomGuides(): Promise<BomGuide[]>;
  getBomGuidesByName(guideName: string): Promise<BomGuide[]>;
  createBomGuide(bom: InsertBomGuide): Promise<BomGuide>;
  deleteBomGuidesByName(guideName: string): Promise<boolean>;

  // Warehouse layout
  getWarehouseLayout(): Promise<WarehouseLayout[]>;
  createWarehouseZone(layout: InsertWarehouseLayout): Promise<WarehouseLayout>;
  deleteWarehouseZone(id: number): Promise<boolean>;

  // Exchange queue
  getExchangeQueue(): Promise<ExchangeQueue[]>;
  createExchangeQueueItem(item: InsertExchangeQueue): Promise<ExchangeQueue>;
  processExchangeQueueItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventoryItems: Map<string, InventoryItem>;
  private transactions: Transaction[];
  private bomGuides: BomGuide[];
  private warehouseLayout: WarehouseLayout[];
  private exchangeQueue: ExchangeQueue[];
  private currentUserId: number;
  private currentItemId: number;
  private currentTransactionId: number;
  private currentBomId: number;
  private currentLayoutId: number;
  private currentExchangeId: number;

  constructor() {
    this.users = new Map();
    this.inventoryItems = new Map();
    this.transactions = [];
    this.bomGuides = [];
    this.warehouseLayout = [];
    this.exchangeQueue = [];
    this.currentUserId = 1;
    this.currentItemId = 1;
    this.currentTransactionId = 1;
    this.currentBomId = 1;
    this.currentLayoutId = 1;
    this.currentExchangeId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create default users
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "xormr",
      role: "admin",
      createdAt: new Date(),
    };
    const viewerUser: User = {
      id: this.currentUserId++,
      username: "viewer",
      password: "1124",
      role: "viewer",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
    this.users.set(viewerUser.id, viewerUser);

    // Create basic warehouse layout only
    const basicLayout: WarehouseLayout[] = [
      { id: this.currentLayoutId++, zoneName: "A구역", subZoneName: "A-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "A구역", subZoneName: "A-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "B구역", subZoneName: "B-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "B구역", subZoneName: "B-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "C구역", subZoneName: "C-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "C구역", subZoneName: "C-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "D구역", subZoneName: "D-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "D구역", subZoneName: "D-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
    ];
    this.warehouseLayout = basicLayout;

    // Initialize sample inventory items for BOM checking
    this.initializeSampleInventory();

    // Initialize BOM guides based on installation guides from OC documents
    this.initializeBomGuides();
  }

  private initializeBomGuides() {
    // BOM 데이터 초기화 - 빈 상태로 시작
    this.bomGuides = [];
  }

  private initializeSampleInventory() {
    // 재고현황 초기화 - 빈 상태로 시작
    // 실제 입고 프로세스를 통해 재고 추가 가능
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      createdAt: new Date(),
      ...insertUser,
    };
    this.users.set(user.id, user);
    return user;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItem(code: string): Promise<InventoryItem | undefined> {
    // 제품코드로 첫 번째 찾은 항목 반환 (하위호환성)
    return Array.from(this.inventoryItems.values()).find(item => item.code === code);
  }

  // 제품코드와 위치로 특정 재고 항목 찾기
  getInventoryItemByCodeAndLocation(code: string, location: string): InventoryItem | undefined {
    return Array.from(this.inventoryItems.values()).find(item => 
      item.code === code && item.location === location
    );
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const item: InventoryItem = {
      id: this.currentItemId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertItem,
    };
    
    // 각 입고마다 고유한 ID를 키로 사용 (항상 새로운 항목 생성)
    const key = `${item.id}`;
    this.inventoryItems.set(key, item);
    return item;
  }

  async updateInventoryItem(code: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    // 제품코드로 모든 위치의 재고 찾기
    const items = Array.from(this.inventoryItems.entries()).filter(([key, item]) => item.code === code);
    
    if (items.length === 0) return undefined;
    
    // 첫 번째 항목 업데이트 (하위호환성)
    const [key, item] = items[0];
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.inventoryItems.set(key, updatedItem);
    return updatedItem;
  }

  // 특정 위치의 재고 항목 업데이트 (ID로 찾아서 업데이트)
  async updateInventoryItemByLocation(code: string, location: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    // 해당 코드와 위치의 첫 번째 항목 찾기
    const itemEntry = Array.from(this.inventoryItems.entries()).find(([key, item]) => 
      item.code === code && item.location === location
    );
    
    if (!itemEntry) return undefined;
    
    const [key, item] = itemEntry;
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.inventoryItems.set(key, updatedItem);
    return updatedItem;
  }

  // ID로 특정 재고 항목 업데이트
  async updateInventoryItemById(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const key = `${id}`;
    const item = this.inventoryItems.get(key);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.inventoryItems.set(key, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(code: string): Promise<boolean> {
    return this.inventoryItems.delete(code);
  }

  async getTransactions(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async getTransactionsByItemCode(itemCode: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.itemCode === itemCode);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      createdAt: new Date(),
      ...insertTransaction,
    };
    this.transactions.push(transaction);
    return transaction;
  }

  async getBomGuides(): Promise<BomGuide[]> {
    return [...this.bomGuides];
  }

  async getBomGuidesByName(guideName: string): Promise<BomGuide[]> {
    return this.bomGuides.filter(bom => bom.guideName === guideName);
  }

  async createBomGuide(insertBom: InsertBomGuide): Promise<BomGuide> {
    const bom: BomGuide = {
      id: this.currentBomId++,
      createdAt: new Date(),
      ...insertBom,
    };
    this.bomGuides.push(bom);
    return bom;
  }

  async deleteBomGuidesByName(guideName: string): Promise<boolean> {
    const initialLength = this.bomGuides.length;
    this.bomGuides = this.bomGuides.filter(bom => bom.guideName !== guideName);
    return this.bomGuides.length < initialLength;
  }

  async getWarehouseLayout(): Promise<WarehouseLayout[]> {
    return [...this.warehouseLayout];
  }

  async createWarehouseZone(insertLayout: InsertWarehouseLayout): Promise<WarehouseLayout> {
    const layout: WarehouseLayout = {
      id: this.currentLayoutId++,
      createdAt: new Date(),
      ...insertLayout,
    };
    this.warehouseLayout.push(layout);
    return layout;
  }

  async deleteWarehouseZone(id: number): Promise<boolean> {
    const initialLength = this.warehouseLayout.length;
    this.warehouseLayout = this.warehouseLayout.filter(layout => layout.id !== id);
    return this.warehouseLayout.length < initialLength;
  }

  async getExchangeQueue(): Promise<ExchangeQueue[]> {
    return [...this.exchangeQueue];
  }

  async createExchangeQueueItem(insertItem: InsertExchangeQueue): Promise<ExchangeQueue> {
    const item: ExchangeQueue = {
      id: this.currentExchangeId++,
      createdAt: new Date(),
      ...insertItem,
    };
    this.exchangeQueue.push(item);
    return item;
  }

  async processExchangeQueueItem(id: number): Promise<boolean> {
    const item = this.exchangeQueue.find(item => item.id === id);
    if (!item) return false;
    
    item.processed = true;
    return true;
  }
}

export const storage = new MemStorage();
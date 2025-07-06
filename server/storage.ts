import { 
  users, inventoryItems, transactions, bomGuides, warehouseLayout, exchangeQueue,
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

    // Create sample inventory
    const sampleItems: InventoryItem[] = [
      {
        id: this.currentItemId++,
        code: "SP-300W",
        name: "300W 태양광 패널",
        category: "전자제품",
        manufacturer: "SolarTech",
        stock: 15,
        minStock: 10,
        unit: "ea",
        location: "A-1-1",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "SP-500W",
        name: "500W 태양광 패널",
        category: "전자제품",
        manufacturer: "SolarTech",
        stock: 18,
        minStock: 8,
        unit: "ea",
        location: "A-1-2",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "INV-5KW",
        name: "5KW 인버터",
        category: "전자제품",
        manufacturer: "PowerCorp",
        stock: 3,
        minStock: 2,
        unit: "ea",
        location: "B-1-1",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "INV-10KW",
        name: "10KW 인버터",
        category: "전자제품",
        manufacturer: "PowerCorp",
        stock: 1,
        minStock: 1,
        unit: "ea",
        location: "B-1-2",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "INV-50KW",
        name: "50KW 인버터",
        category: "전자제품",
        manufacturer: "PowerCorp",
        stock: 0,
        minStock: 1,
        unit: "ea",
        location: "B-2-1",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "CABLE-4MM",
        name: "4mm² DC 케이블",
        category: "산업자재",
        manufacturer: "CableCo",
        stock: 25,
        minStock: 20,
        unit: "roll",
        location: "C-1-1",
        boxSize: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "CABLE-6MM",
        name: "6mm² DC 케이블",
        category: "산업자재",
        manufacturer: "CableCo",
        stock: 80,
        minStock: 50,
        unit: "roll",
        location: "C-1-2",
        boxSize: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentItemId++,
        code: "CABLE-10MM",
        name: "10mm² DC 케이블",
        category: "산업자재",
        manufacturer: "CableCo",
        stock: 200,
        minStock: 100,
        unit: "roll",
        location: "C-2-1",
        boxSize: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleItems.forEach(item => {
      this.inventoryItems.set(item.code, item);
    });

    // Create sample BOM guides
    const sampleBomGuides: BomGuide[] = [
      { id: this.currentBomId++, guideName: "가정용 태양광 설치 가이드", itemCode: "SP-300W", requiredQuantity: 12, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "가정용 태양광 설치 가이드", itemCode: "INV-5KW", requiredQuantity: 1, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "가정용 태양광 설치 가이드", itemCode: "CABLE-4MM", requiredQuantity: 50, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "상업용 태양광 설치 가이드", itemCode: "SP-500W", requiredQuantity: 20, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "상업용 태양광 설치 가이드", itemCode: "INV-10KW", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "상업용 태양광 설치 가이드", itemCode: "CABLE-6MM", requiredQuantity: 100, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "산업용 태양광 설치 가이드", itemCode: "SP-500W", requiredQuantity: 100, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "산업용 태양광 설치 가이드", itemCode: "INV-50KW", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "산업용 태양광 설치 가이드", itemCode: "CABLE-10MM", requiredQuantity: 500, createdAt: new Date() },
    ];

    this.bomGuides = sampleBomGuides;

    // Create sample warehouse layout
    const sampleLayout: WarehouseLayout[] = [
      { id: this.currentLayoutId++, zoneName: "A구역", subZoneName: "A-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "A구역", subZoneName: "A-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "B구역", subZoneName: "B-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "B구역", subZoneName: "B-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "C구역", subZoneName: "C-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "C구역", subZoneName: "C-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "D구역", subZoneName: "D-1", floors: ["1층", "2층", "3층"], createdAt: new Date() },
      { id: this.currentLayoutId++, zoneName: "D구역", subZoneName: "D-2", floors: ["1층", "2층", "3층"], createdAt: new Date() },
    ];

    this.warehouseLayout = sampleLayout;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Inventory methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItem(code: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(code);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentItemId++;
    const item: InventoryItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inventoryItems.set(item.code, item);
    return item;
  }

  async updateInventoryItem(code: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(code);
    if (!item) return undefined;

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    this.inventoryItems.set(code, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(code: string): Promise<boolean> {
    return this.inventoryItems.delete(code);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return this.transactions;
  }

  async getTransactionsByItemCode(itemCode: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.itemCode === itemCode);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.push(transaction);
    return transaction;
  }

  // BOM methods
  async getBomGuides(): Promise<BomGuide[]> {
    return this.bomGuides;
  }

  async getBomGuidesByName(guideName: string): Promise<BomGuide[]> {
    return this.bomGuides.filter(bom => bom.guideName === guideName);
  }

  async createBomGuide(insertBom: InsertBomGuide): Promise<BomGuide> {
    const id = this.currentBomId++;
    const bom: BomGuide = {
      ...insertBom,
      id,
      createdAt: new Date(),
    };
    this.bomGuides.push(bom);
    return bom;
  }

  async deleteBomGuidesByName(guideName: string): Promise<boolean> {
    const initialLength = this.bomGuides.length;
    this.bomGuides = this.bomGuides.filter(bom => bom.guideName !== guideName);
    return this.bomGuides.length < initialLength;
  }

  // Warehouse layout methods
  async getWarehouseLayout(): Promise<WarehouseLayout[]> {
    return this.warehouseLayout;
  }

  async createWarehouseZone(insertLayout: InsertWarehouseLayout): Promise<WarehouseLayout> {
    const id = this.currentLayoutId++;
    const layout: WarehouseLayout = {
      ...insertLayout,
      id,
      createdAt: new Date(),
    };
    this.warehouseLayout.push(layout);
    return layout;
  }

  async deleteWarehouseZone(id: number): Promise<boolean> {
    const initialLength = this.warehouseLayout.length;
    this.warehouseLayout = this.warehouseLayout.filter(layout => layout.id !== id);
    return this.warehouseLayout.length < initialLength;
  }

  // Exchange queue methods
  async getExchangeQueue(): Promise<ExchangeQueue[]> {
    return this.exchangeQueue.filter(item => !item.processed);
  }

  async createExchangeQueueItem(insertItem: InsertExchangeQueue): Promise<ExchangeQueue> {
    const id = this.currentExchangeId++;
    const item: ExchangeQueue = {
      ...insertItem,
      id,
      processed: false,
      createdAt: new Date(),
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

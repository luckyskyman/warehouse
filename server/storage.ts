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
    const bomGuides: BomGuide[] = [
      // MK3-TS-2X-2Y-S (60016611) BOM items
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "30011554", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60010149", requiredQuantity: 10, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60010152", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60008595", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60011075", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60007659", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60008594", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "30015819", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60007657", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-2X-2Y-S (60016611)", itemCode: "60014483", requiredQuantity: 2, createdAt: new Date() },

      // MK3-TS-3X-3Y-S (60016595) BOM items
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "30011554", requiredQuantity: 18, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60010149", requiredQuantity: 22, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60010152", requiredQuantity: 3, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60008595", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60011075", requiredQuantity: 3, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60007659", requiredQuantity: 3, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60008594", requiredQuantity: 6, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "30015819", requiredQuantity: 18, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60007657", requiredQuantity: 3, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-3Y-S (60016595)", itemCode: "60014483", requiredQuantity: 3, createdAt: new Date() },

      // MK3-TS-4X-4Y-S (60016550) BOM items 
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "30011554", requiredQuantity: 28, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60010149", requiredQuantity: 32, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60010152", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60015814", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60008595", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60011059", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60011060", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60008594", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "30015819", requiredQuantity: 24, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-4Y-S (60016550)", itemCode: "60018450", requiredQuantity: 4, createdAt: new Date() },

      // MK3-TS-4X-3Y-S-O (60016558) BOM items
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "30011554", requiredQuantity: 29, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60010149", requiredQuantity: 39, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60010152", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60008595", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60011059", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60007659", requiredQuantity: 5, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60008594", requiredQuantity: 6, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "30015819", requiredQuantity: 28, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60007657", requiredQuantity: 7, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-4X-3Y-S-O (60016558)", itemCode: "60014483", requiredQuantity: 7, createdAt: new Date() },

      // MK3-TS-3X-4Y-S-O (60016574) BOM items
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "30011554", requiredQuantity: 30, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60010149", requiredQuantity: 38, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60010152", requiredQuantity: 5, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60008595", requiredQuantity: 6, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60011075", requiredQuantity: 5, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60011060", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60008594", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "30015819", requiredQuantity: 28, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60007657", requiredQuantity: 7, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3-TS-3X-4Y-S-O (60016574)", itemCode: "60014483", requiredQuantity: 7, createdAt: new Date() },

      // 기존 샘플 가이드들도 유지
      { id: this.currentBomId++, guideName: "MK3 Basic Grid Setup", itemCode: "60011059", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3 Basic Grid Setup", itemCode: "60007659", requiredQuantity: 6, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3 Basic Grid Setup", itemCode: "60008594", requiredQuantity: 12, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3 Basic Grid Setup", itemCode: "60010149", requiredQuantity: 24, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "MK3 Basic Grid Setup", itemCode: "30011554", requiredQuantity: 16, createdAt: new Date() },

      { id: this.currentBomId++, guideName: "Standard Frame Assembly", itemCode: "60011775", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "Standard Frame Assembly", itemCode: "60016181", requiredQuantity: 2, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "Standard Frame Assembly", itemCode: "60016278", requiredQuantity: 4, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "Standard Frame Assembly", itemCode: "60011464", requiredQuantity: 8, createdAt: new Date() },
      { id: this.currentBomId++, guideName: "Standard Frame Assembly", itemCode: "60014483", requiredQuantity: 6, createdAt: new Date() }
    ];

    this.bomGuides = bomGuides;
  }

  private initializeSampleInventory() {
    const sampleItems: InventoryItem[] = [
      // Track Support items
      {
        id: this.currentItemId++,
        code: "60011059",
        name: "MK3 GRID, TRACK SUPPORT, 4W, X",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 50,
        minStock: 10,
        unit: "개",
        location: "A구역-A-1-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60007659",
        name: "MK3 GRID, TRACK SUPPORT, 3W, Y",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 35,
        minStock: 10,
        unit: "개",
        location: "A구역-A-1-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60011075",
        name: "MK3 GRID, TRACK SUPPORT, 3W, X",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 25,
        minStock: 10,
        unit: "개",
        location: "A구역-A-1-3층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60011060",
        name: "MK3 GRID, TRACK SUPPORT, 4W, Y",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 40,
        minStock: 10,
        unit: "개",
        location: "A구역-A-2-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60007657",
        name: "MK3 GRID, TRACK SUPPORT, STUB",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 60,
        minStock: 15,
        unit: "개",
        location: "A구역-A-2-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Anti-Crush Blocks
      {
        id: this.currentItemId++,
        code: "60008594",
        name: "MK3 GRID, ANTI-CRUSH BLOCK 561",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 120,
        minStock: 20,
        unit: "개",
        location: "B구역-B-1-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60008595",
        name: "MK3 GRID, ANTI-CRUSH BLOCK 761",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 80,
        minStock: 20,
        unit: "개",
        location: "B구역-B-1-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Spreader Plates
      {
        id: this.currentItemId++,
        code: "60010149",
        name: "MK3 GRID, TS SPREADER PLATE, 1 HOLE",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 200,
        minStock: 30,
        unit: "개",
        location: "B구역-B-2-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60015814",
        name: "MK3 GRID, TS SPREADER PLATE, 2 HOLE",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 150,
        minStock: 25,
        unit: "개",
        location: "B구역-B-2-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Movement Joints
      {
        id: this.currentItemId++,
        code: "60010152",
        name: "MK3 GRID, MOVEMENT JOINT, SHELF TYPE",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 30,
        minStock: 8,
        unit: "개",
        location: "C구역-C-1-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60018450",
        name: "MK3 GRID, MOVEMENT JOINT, LATCH TYPE",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 25,
        minStock: 5,
        unit: "개",
        location: "C구역-C-1-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Fasteners
      {
        id: this.currentItemId++,
        code: "30011554",
        name: "SET - M12x40 EN 14399-3 HR8.8 K1 BOLT / M12 EN 14399-3 Hr10 K1 NUT / M12 EN 14399-6 K1 WASHER",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 500,
        minStock: 50,
        unit: "세트",
        location: "C구역-C-2-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "30015819",
        name: "STARLOCK WASHER, 12 DIA SHAFT, DIN 6799, OD MAX 25MM, T<3MM",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 800,
        minStock: 100,
        unit: "개",
        location: "C구역-C-2-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Connection items
      {
        id: this.currentItemId++,
        code: "60014483",
        name: "MK3 GRID, PERIMETER CONNECTION",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 45,
        minStock: 10,
        unit: "개",
        location: "D구역-D-1-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Frame components for Standard Frame Assembly
      {
        id: this.currentItemId++,
        code: "60011775",
        name: "MK3B GRID, FRAME, 1&8H, 3-4W, Y, FOOT TO TSP",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 20,
        minStock: 5,
        unit: "개",
        location: "D구역-D-1-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60016181",
        name: "MK3B, FRAME, BRACE INSERT, 1H, X, 2W",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 15,
        minStock: 5,
        unit: "개",
        location: "D구역-D-1-3층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60016278",
        name: "MK3B GRID, FRAME, 1H, 2W, X, FOOT BRACE TO TSP",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 25,
        minStock: 8,
        unit: "개",
        location: "D구역-D-2-1층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentItemId++,
        code: "60011464",
        name: "MK3 GRID, TOTE GUIDE, CHANNEL 1H VAR3",
        category: "산업자재",
        manufacturer: "Ocado",
        stock: 40,
        minStock: 10,
        unit: "개",
        location: "D구역-D-2-2층",
        boxSize: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add items to the Map
    for (const item of sampleItems) {
      this.inventoryItems.set(item.code, item);
    }
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
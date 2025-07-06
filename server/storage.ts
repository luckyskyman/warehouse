import { 
  users, inventoryItems, transactions, bomGuides, warehouseLayout, exchangeQueue,
  type User, type InsertUser, 
  type InventoryItem, type InsertInventoryItem,
  type Transaction, type InsertTransaction,
  type BomGuide, type InsertBomGuide,
  type WarehouseLayout, type InsertWarehouseLayout,
  type ExchangeQueue, type InsertExchangeQueue
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }

  async getInventoryItem(code: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.code, code));
    return item || undefined;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventoryItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateInventoryItem(code: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventoryItems)
      .set(updates)
      .where(eq(inventoryItems.code, code))
      .returning();
    return item || undefined;
  }

  async deleteInventoryItem(code: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.code, code));
    return result.rowCount > 0;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getTransactionsByItemCode(itemCode: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.itemCode, itemCode));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getBomGuides(): Promise<BomGuide[]> {
    return await db.select().from(bomGuides);
  }

  async getBomGuidesByName(guideName: string): Promise<BomGuide[]> {
    return await db.select().from(bomGuides).where(eq(bomGuides.guideName, guideName));
  }

  async createBomGuide(insertBom: InsertBomGuide): Promise<BomGuide> {
    const [bom] = await db
      .insert(bomGuides)
      .values(insertBom)
      .returning();
    return bom;
  }

  async deleteBomGuidesByName(guideName: string): Promise<boolean> {
    const result = await db.delete(bomGuides).where(eq(bomGuides.guideName, guideName));
    return result.rowCount > 0;
  }

  async getWarehouseLayout(): Promise<WarehouseLayout[]> {
    return await db.select().from(warehouseLayout);
  }

  async createWarehouseZone(insertLayout: InsertWarehouseLayout): Promise<WarehouseLayout> {
    const [layout] = await db
      .insert(warehouseLayout)
      .values(insertLayout)
      .returning();
    return layout;
  }

  async deleteWarehouseZone(id: number): Promise<boolean> {
    const result = await db.delete(warehouseLayout).where(eq(warehouseLayout.id, id));
    return result.rowCount > 0;
  }

  async getExchangeQueue(): Promise<ExchangeQueue[]> {
    return await db.select().from(exchangeQueue);
  }

  async createExchangeQueueItem(insertItem: InsertExchangeQueue): Promise<ExchangeQueue> {
    const [item] = await db
      .insert(exchangeQueue)
      .values(insertItem)
      .returning();
    return item;
  }

  async processExchangeQueueItem(id: number): Promise<boolean> {
    const [item] = await db
      .update(exchangeQueue)
      .set({ processed: true })
      .where(eq(exchangeQueue.id, id))
      .returning();
    return !!item;
  }
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

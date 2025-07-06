import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // 'admin' or 'viewer'
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
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

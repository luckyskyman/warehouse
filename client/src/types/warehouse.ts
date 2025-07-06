export interface User {
  id: number;
  username: string;
  role: "admin" | "viewer";
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

export type TabName = "bomCheck" | "inventory" | "inbound" | "outbound" | "move" | "warehouse" | "layout" | "excel";

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

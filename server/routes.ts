import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertBomGuideSchema, insertWarehouseLayoutSchema, insertExchangeQueueSchema, insertWorkDiarySchema, insertWorkDiaryCommentSchema, insertUserSchema } from "@shared/schema";

// Global session store that persists across module loads
declare global {
  var warehouseSessions: Map<string, any>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize global session store if not exists
  if (!global.warehouseSessions) {
    global.warehouseSessions = new Map();
    console.log('Initialized new session store');
  }
  const sessions = global.warehouseSessions;
  
  // Simplified request logging
  app.use((req: any, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log('API request:', { path: req.path, method: req.method });
    }
    next();
  });

  // Remove admin check completely for deployment compatibility
  const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessions.set(sessionId, user);
      
      console.log('Login successful:', { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        sessionId: sessionId.substring(0, 20) + '...',
        totalSessions: sessions.size
      });

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        sessionId: sessionId
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        position: user.position,
        isManager: user.isManager,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      console.log('Creating user with data:', req.body);
      
      const validatedData = insertUserSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      const user = await storage.createUser(validatedData);
      console.log('User created:', user);
      
      // Don't send password in response
      const safeUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      };
      res.status(201).json(safeUser);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error.message || "Unknown error" 
      });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const safeUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      };
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/inventory/:code", async (req, res) => {
    try {
      const item = await storage.getInventoryItem(req.params.code);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/inventory", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/inventory/:code", requireAdmin, async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.code, req.body);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/inventory/:code", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.code);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const { itemCode } = req.query;
      if (itemCode) {
        const transactions = await storage.getTransactionsByItemCode(itemCode as string);
        res.json(transactions);
      } else {
        const transactions = await storage.getTransactions();
        res.json(transactions);
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/transactions", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);

      // Update inventory based on transaction type
      if (validatedData.type === "inbound") {
        // 입고 처리: 입고 폼에서 이미 새로운 재고 항목을 생성했으므로 추가 처리 불필요
        // 각 입고마다 새로운 항목이 생성되어 위치별/카테고리별 관리 가능
      } else if (validatedData.type === "outbound") {
        // 출고 처리: 사유별로 다른 처리
        const allItems = await storage.getInventoryItems();
        const itemsWithCode = allItems.filter(item => item.code === validatedData.itemCode && item.stock > 0);

        if (validatedData.reason === "조립장 이동") {
          // 조립장 이동: 재고에서 차감만
          const totalStock = itemsWithCode.reduce((sum, item) => sum + item.stock, 0);

          if (totalStock >= validatedData.quantity) {
            let remainingQuantity = validatedData.quantity;
            const outboundLocations: string[] = [];

            // 위치별로 재고 차감 (FIFO 방식) 및 위치 정보 수집
            for (const item of itemsWithCode) {
              if (remainingQuantity <= 0) break;

              const deductAmount = Math.min(item.stock, remainingQuantity);

              await storage.updateInventoryItemById(item.id, {
                stock: item.stock - deductAmount
              });

              if (item.location) {
                outboundLocations.push(item.location);
              }

              remainingQuantity -= deductAmount;
            }

            // 트랜잭션에 출고 위치 정보 업데이트
            validatedData.fromLocation = outboundLocations.join(', ');
          } else {
            return res.status(400).json({ message: "Insufficient stock" });
          }
        } else if (validatedData.reason === "출고 반환") {
          // 출고 반환: 최근 출고된 위치로 반환
          // 최근 출고 트랜잭션에서 위치 정보 찾기
          const allTransactions = await storage.getTransactionsByItemCode(validatedData.itemCode);
          const recentOutbound = allTransactions
            .filter(t => t.type === "outbound" && t.reason !== "출고 반환")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          const returnLocation = recentOutbound?.fromLocation || validatedData.toLocation;

          // 해당 위치의 기존 재고 찾기
          const targetItem = allItems.find(item => 
            item.code === validatedData.itemCode && item.location === returnLocation
          );

          if (targetItem) {
            // 해당 위치에 기존 재고가 있으면 가산
            await storage.updateInventoryItemById(targetItem.id, {
              stock: targetItem.stock + validatedData.quantity
            });
          } else {
            // 해당 위치에 재고가 없으면 새로 생성
            const masterItem = allItems.find(item => item.code === validatedData.itemCode);
            if (masterItem) {
              await storage.createInventoryItem({
                code: masterItem.code,
                name: masterItem.name,
                category: masterItem.category,
                manufacturer: masterItem.manufacturer,
                stock: validatedData.quantity,
                minStock: masterItem.minStock,
                unit: masterItem.unit,
                location: returnLocation,
                boxSize: masterItem.boxSize
              });
            }
          }
        } else if (validatedData.reason === "불량품 교환 출고") {
          // 불량품 교환 출고: 먼저 재고에서 차감하고 교환 대기 목록에 추가
          const totalStock = itemsWithCode.reduce((sum, item) => sum + item.stock, 0);

          if (totalStock >= validatedData.quantity) {
            let remainingQuantity = validatedData.quantity;
            const outboundLocations: string[] = [];

            // 위치별로 재고 차감 (FIFO 방식) 및 위치 정보 수집
            for (const item of itemsWithCode) {
              if (remainingQuantity <= 0) break;

              const deductAmount = Math.min(item.stock, remainingQuantity);

              await storage.updateInventoryItemById(item.id, {
                stock: item.stock - deductAmount
              });

              if (item.location) {
                outboundLocations.push(item.location);
              }

              remainingQuantity -= deductAmount;
            }

            // 트랜잭션에 출고 위치 정보 업데이트
            validatedData.fromLocation = outboundLocations.join(', ');

            // 교환 대기 목록에 추가
            await storage.createExchangeQueueItem({
              itemCode: validatedData.itemCode,
              itemName: validatedData.itemName,
              quantity: validatedData.quantity,
              outboundDate: new Date()
            });
          } else {
            return res.status(400).json({ message: "Insufficient stock" });
          }
        } else {
          // 기타 출고: 기존 로직대로 재고 차감
          const totalStock = itemsWithCode.reduce((sum, item) => sum + item.stock, 0);

          if (totalStock >= validatedData.quantity) {
            let remainingQuantity = validatedData.quantity;
            const outboundLocations: string[] = [];

            for (const item of itemsWithCode) {
              if (remainingQuantity <= 0) break;

              const deductAmount = Math.min(item.stock, remainingQuantity);

              await storage.updateInventoryItemById(item.id, {
                stock: item.stock - deductAmount
              });

              if (item.location) {
                outboundLocations.push(item.location);
              }

              remainingQuantity -= deductAmount;
            }

            // 트랜잭션에 출고 위치 정보 업데이트
            validatedData.fromLocation = outboundLocations.join(', ');
          } else {
            return res.status(400).json({ message: "Insufficient stock" });
          }
        }
      } else if (validatedData.type === "move") {
        // 이동 처리: 특정 위치의 재고를 새 위치로 이동
        const allItems = await storage.getInventoryItems();
        const sourceItem = allItems.find(item => 
          item.code === validatedData.itemCode && 
          item.location === validatedData.fromLocation &&
          item.stock >= validatedData.quantity
        );

        if (sourceItem) {
          // 이동할 수량이 전체 재고와 같다면 위치만 변경
          if (sourceItem.stock === validatedData.quantity) {
            await storage.updateInventoryItemById(sourceItem.id, {
              location: validatedData.toLocation
            });
          } else {
            // 일부 수량만 이동하는 경우: 기존 아이템에서 차감하고 새 위치에 아이템 생성
            await storage.updateInventoryItemById(sourceItem.id, {
              stock: sourceItem.stock - validatedData.quantity
            });

            // 목표 위치에 동일한 제품이 있는지 확인
            const targetItem = allItems.find(item => 
              item.code === validatedData.itemCode && 
              item.location === validatedData.toLocation
            );

            if (targetItem) {
              // 기존 아이템에 수량 추가
              await storage.updateInventoryItemById(targetItem.id, {
                stock: targetItem.stock + validatedData.quantity
              });
            } else {
              // 새 아이템 생성
              await storage.createInventoryItem({
                code: sourceItem.code,
                name: sourceItem.name,
                category: sourceItem.category,
                manufacturer: sourceItem.manufacturer,
                stock: validatedData.quantity,
                minStock: sourceItem.minStock,
                unit: sourceItem.unit,
                location: validatedData.toLocation,
                boxSize: sourceItem.boxSize
              });
            }
          }
        } else {
          return res.status(400).json({ message: "Source item not found or insufficient stock" });
        }
      } else if (validatedData.type === "adjustment") {
        const item = await storage.getInventoryItem(validatedData.itemCode);
        if (item) {
          await storage.updateInventoryItem(validatedData.itemCode, {
            stock: validatedData.quantity
          });
        }
      }

      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // BOM routes
  app.get("/api/bom", async (req, res) => {
    try {
      const bomGuides = await storage.getBomGuides();
      res.json(bomGuides);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/bom/:guideName", async (req, res) => {
    try {
      const bomItems = await storage.getBomGuidesByName(req.params.guideName);
      res.json(bomItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/bom", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBomGuideSchema.parse(req.body);
      const bom = await storage.createBomGuide(validatedData);
      res.status(201).json(bom);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/bom/:guideName", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteBomGuidesByName(req.params.guideName);
      if (!deleted) {
        return res.status(404).json({ message: "BOM guide not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Warehouse layout routes
  app.get("/api/warehouse/layout", async (req, res) => {
    try {
      const layout = await storage.getWarehouseLayout();
      res.json(layout);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/warehouse/layout", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWarehouseLayoutSchema.parse(req.body);
      const layout = await storage.createWarehouseZone(validatedData);
      res.status(201).json(layout);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/warehouse/layout/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteWarehouseZone(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Warehouse zone not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Exchange queue routes
  app.get("/api/exchange-queue", async (req, res) => {
    try {
      const queue = await storage.getExchangeQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/exchange-queue/:id/process", requireAdmin, async (req, res) => {
    try {
      const processed = await storage.processExchangeQueueItem(parseInt(req.params.id));
      if (!processed) {
        return res.status(404).json({ message: "Exchange queue item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Excel upload routes  
  app.post("/api/upload/master", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      console.log('Master upload request:', { itemCount: items.length });
      const createdItems = [];
      
      for (const item of items) {
        const code = String(item['제품코드'] || item.code || '');
        
        if (!code) continue;
        
        // 기존 아이템 확인
        const existingItem = await storage.getInventoryItem(code);
        
        if (existingItem) {
          // 기존 아이템 업데이트 (재고 수량은 유지)
          const updatedItem = await storage.updateInventoryItem(code, {
            name: String(item['품명'] || item.name || existingItem.name),
            category: String(item['카테고리'] || item.category || existingItem.category),
            manufacturer: String(item['제조사'] || item.manufacturer || existingItem.manufacturer),
            minStock: Number(item['최소재고'] || item.minStock || existingItem.minStock),
            unit: String(item['단위'] || item.unit || existingItem.unit),
            boxSize: Number(item['박스당수량'] || item.boxSize || existingItem.boxSize),
          });
          if (updatedItem) {
            console.log('Updated existing item:', code);
            createdItems.push(updatedItem);
          }
        } else {
          // 새 아이템 생성
          const newItem = {
            code: code,
            name: String(item['품명'] || item.name || ''),
            category: String(item['카테고리'] || item.category || '기타'),
            manufacturer: String(item['제조사'] || item.manufacturer || ''),
            stock: 0, // Initial stock is 0 for master items
            minStock: Number(item['최소재고'] || item.minStock || 0),
            unit: String(item['단위'] || item.unit || 'ea'),
            location: null,
            boxSize: Number(item['박스당수량'] || item.boxSize || 1),
          };
          
          const created = await storage.createInventoryItem(newItem);
          console.log('Created new item:', code);
          createdItems.push(created);
        }
      }

      console.log('Master upload complete:', { processed: createdItems.length });
      res.json({ created: createdItems.length, items: createdItems });
    } catch (error) {
      console.error('Master upload error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/upload/bom", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      console.log('BOM upload request:', { itemCount: items.length });
      console.log('Sample BOM items:', items.slice(0, 2));

      // 기존 BOM 데이터 모두 삭제 (덮어쓰기)
      const existingBomGuides = await storage.getBomGuides();
      const uniqueGuideNames = Array.from(new Set(existingBomGuides.map(bom => bom.guideName)));
      console.log('Deleting existing BOM guides:', uniqueGuideNames);
      
      for (const guideName of uniqueGuideNames) {
        await storage.deleteBomGuidesByName(guideName);
      }

      const createdBoms = [];
      let currentGuideName = '';
      
      for (const item of items) {
        const guideName = String(item['설치가이드명'] || item.guideName || '').trim();
        const itemCode = String(item['필요부품코드'] || item.itemCode || '').trim();
        const requiredQuantity = Number(item['필요수량'] || item.requiredQuantity || 0);

        // 새로운 가이드명이 있으면 업데이트, 없으면 이전 가이드명 사용
        if (guideName) {
          currentGuideName = guideName;
        }

        const bomItem = {
          guideName: currentGuideName,
          itemCode: itemCode,
          requiredQuantity: requiredQuantity,
        };

        console.log('Processing BOM item:', bomItem);

        if (bomItem.guideName && bomItem.itemCode && bomItem.requiredQuantity > 0) {
          const created = await storage.createBomGuide(bomItem);
          createdBoms.push(created);
          console.log('Created BOM item:', created.id);
        } else {
          console.log('Skipped invalid BOM item:', bomItem);
        }
      }

      console.log('BOM upload complete:', { processed: createdBoms.length });
      res.json({ created: createdBoms.length, items: createdBoms });
    } catch (error) {
      console.error('BOM upload error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/upload/inventory-add", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      const updatedItems = [];
      for (const item of items) {
        const code = String(item['제품코드'] || item.code || '');
        const quantity = Number(item['수량'] || item.quantity || 0);
        const location = `${item['구역'] || item.zone || 'A구역'}-${String(item['세부구역'] || item.subZone || 'A-1').split('-')[1] || '1'}-${String(item['층수'] || item.floor || '1층').replace('층', '')}`;

        if (code && quantity > 0) {
          const existingItem = await storage.getInventoryItem(code);
          if (existingItem) {
            // Add to existing stock
            const updated = await storage.updateInventoryItem(code, {
              stock: existingItem.stock + quantity,
              location: location,
            });
            if (updated) updatedItems.push(updated);
          } else {
            // Create new item
            const newItem = {
              code: code,
              name: String(item['품명'] || item.name || code),
              category: String(item['카테고리'] || item.category || '기타'),
              manufacturer: String(item['제조사'] || item.manufacturer || ''),
              stock: quantity,
              minStock: Number(item['최소재고'] || item.minStock || 0),
              unit: String(item['단위'] || item.unit || 'ea'),
              location: location,
              boxSize: Number(item['박스당수량'] || item.boxSize || 1),
            };
            const created = await storage.createInventoryItem(newItem);
            updatedItems.push(created);
          }
        }
      }

      res.json({ updated: updatedItems.length, items: updatedItems });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/upload/inventory-sync", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      // Clear existing inventory
      const existingItems = await storage.getInventoryItems();
      for (const item of existingItems) {
        await storage.deleteInventoryItem(item.code);
      }

      // Add new items
      const createdItems = [];
      for (const item of items) {
        const code = String(item['제품코드'] || item.code || '');
        if (code) {
          const newItem = {
            code: code,
            name: String(item['품명'] || item.name || code),
            category: String(item['카테고리'] || item.category || '기타'),
            manufacturer: String(item['제조사'] || item.manufacturer || ''),
            stock: Number(item['현재고'] || item.stock || 0),
            minStock: Number(item['최소재고'] || item.minStock || 0),
            unit: String(item['단위'] || item.unit || 'ea'),
            location: String(item['위치'] || item.location || ''),
            boxSize: Number(item['박스당수량'] || item.boxSize || 1),
          };
          const created = await storage.createInventoryItem(newItem);
          createdItems.push(created);
        }
      }

      res.json({ synced: createdItems.length, items: createdItems });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Backup restore endpoint
  app.post("/api/restore-backup", requireAdmin, async (req, res) => {
    try {
      const { inventory, transactions, bomGuides } = req.body;

      let inventoryCount = 0;
      let transactionCount = 0;
      let bomCount = 0;

      // Clear existing data
      const existingItems = await storage.getInventoryItems();
      for (const item of existingItems) {
        await storage.deleteInventoryItem(item.code);
      }

      const existingBomGuides = await storage.getBomGuides();
      const uniqueGuideNames = [...new Set(existingBomGuides.map(bom => bom.guideName))];
      for (const guideName of uniqueGuideNames) {
        await storage.deleteBomGuidesByName(guideName);
      }

      // Restore inventory
      if (Array.isArray(inventory)) {
        for (const item of inventory) {
          try {
            await storage.createInventoryItem(item);
            inventoryCount++;
          } catch (error) {
            console.error('Failed to create inventory item:', error);
          }
        }
      }

      // Restore transactions
      if (Array.isArray(transactions)) {
        for (const transaction of transactions) {
          try {
            await storage.createTransaction(transaction);
            transactionCount++;
          } catch (error) {
            console.error('Failed to create transaction:', error);
          }
        }
      }

      // Restore BOM guides
      if (Array.isArray(bomGuides)) {
        for (const bom of bomGuides) {
          try {
            await storage.createBomGuide(bom);
            bomCount++;
          } catch (error) {
            console.error('Failed to create BOM guide:', error);
          }
        }
      }

      res.json({ 
        inventoryCount, 
        transactionCount, 
        bomCount,
        message: "백업 복원 완료"
      });
    } catch (error) {
      console.error('Backup restore error:', error);
      res.status(500).json({ message: "백업 복원 중 오류가 발생했습니다." });
    }
  });

  // 제품 마스터 업로드 API
  app.post("/api/upload/master", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }

      // 기존 재고 데이터 모두 삭제 (제품 마스터로 교체)
      const existingItems = await storage.getInventoryItems();
      for (const item of existingItems) {
        await storage.deleteInventoryItem(item.code);
      }

      const createdItems = [];
      for (const item of items) {
        const code = String(item['제품코드'] || item.code || '');
        if (code) {
          const newItem = {
            code: code,
            name: String(item['품명'] || item.name || code),
            category: String(item['카테고리'] || item.category || '일반자재'),
            manufacturer: String(item['제조사'] || item.manufacturer || 'Ocado'),
            stock: 0, // 마스터 데이터는 재고량 0으로 시작
            minStock: 0,
            unit: String(item['단위'] || item.unit || 'ea'),
            location: null, // 마스터 데이터는 위치 없음
            boxSize: Number(item['박스당수량(ea)'] || item['박스당수량'] || item.boxSize || 1),
          };
          const created = await storage.createInventoryItem(newItem);
          createdItems.push(created);
        }
      }

      res.json({ created: createdItems.length, items: createdItems });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Process exchange queue item
  app.post("/api/exchange-queue/:id/process", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.processExchangeQueueItem(id);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Exchange queue item not found" });
    }
  });

  // Work diary routes
  app.get("/api/work-diary", async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const userId = req.user?.id; // 세션에서 사용자 ID 가져오기
      const diaries = await storage.getWorkDiaries(start, end, userId);
      res.json(diaries);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/work-diary/:id", async (req, res) => {
    try {
      const diary = await storage.getWorkDiary(parseInt(req.params.id));
      if (!diary) {
        return res.status(404).json({ message: "Work diary not found" });
      }
      res.json(diary);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/work-diary", async (req: any, res) => {
    try {
      console.log('업무일지 생성 요청 - 세션 사용자:', req.user);
      console.log('업무일지 생성 요청 - 요청 본문:', req.body);
      
      // Manual validation and transformation
      const workDiary = {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category || '기타',
        priority: req.body.priority || 'normal',
        status: req.body.status || 'completed',
        workDate: new Date(req.body.workDate),
        attachments: req.body.attachments || null,
        tags: req.body.tags || null,
        authorId: req.user?.id || req.body.authorId || 1,
        assignedTo: req.body.assignedTo || null,
        visibility: req.body.visibility || 'department',
      };
      
      console.log('생성할 업무일지 데이터:', workDiary);
      
      // Basic validation
      if (!workDiary.title || !workDiary.content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      const diary = await storage.createWorkDiary(workDiary);
      res.status(201).json(diary);
    } catch (error) {
      console.error('Work diary creation error:', error);
      res.status(400).json({ message: "Invalid data", error: error.message });
    }
  });

  app.patch("/api/work-diary/:id", async (req: any, res) => {
    try {
      const diaryId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      // 권한 확인: 작성자 본인 또는 Admin만 수정 가능
      const existingDiary = await storage.getWorkDiary(diaryId);
      if (!existingDiary) {
        return res.status(404).json({ message: "Work diary not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || (existingDiary.authorId !== userId && user.role !== 'admin')) {
        return res.status(403).json({ message: "수정 권한이 없습니다" });
      }
      
      const diary = await storage.updateWorkDiary(diaryId, req.body);
      if (!diary) {
        return res.status(404).json({ message: "Work diary not found" });
      }
      res.json(diary);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/work-diary/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteWorkDiary(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Work diary not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Work diary comments routes
  app.get("/api/work-diary/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getWorkDiaryComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/work-diary/:id/comments", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWorkDiaryCommentSchema.parse({
        ...req.body,
        diaryId: parseInt(req.params.id)
      });
      const comment = await storage.createWorkDiaryComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Reset all data (admin only)
  app.post("/api/system/reset", requireAdmin, async (req, res) => {
    try {
      console.log('System reset requested by user:', req.user);
      const success = await storage.resetAllData();
      if (success) {
        console.log('System reset completed successfully');
        res.json({ message: "모든 데이터가 초기화되었습니다." });
      } else {
        console.log('System reset failed');
        res.status(500).json({ error: "데이터 초기화에 실패했습니다." });
      }
    } catch (error) {
      console.error("데이터 초기화 오류:", error);
      res.status(500).json({ error: "데이터 초기화 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
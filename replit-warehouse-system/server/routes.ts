import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertBomGuideSchema, insertWarehouseLayoutSchema, insertExchangeQueueSchema, insertWorkDiarySchema, insertWorkDiaryCommentSchema, insertUserSchema } from "@shared/schema";
import { parseLocation, validateLocation, generateWarehouseLayoutData } from "@shared/location-utils";

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

  // Session authentication middleware
  const authenticateUser = (req: any, res: Response, next: NextFunction) => {
    const sessionId = req.headers['authorization']?.replace('Bearer ', '') || 
                     req.headers['sessionid'] || 
                     req.headers['x-session-id'];
    
    if (sessionId && sessions.has(sessionId)) {
      req.user = sessions.get(sessionId);
      console.log('세션 인증 성공:', { userId: req.user.id, username: req.user.username });
    } else {
      console.log('세션 인증 실패 또는 세션 없음:', { sessionId, hasSession: sessionId ? sessions.has(sessionId) : false });
    }
    
    next();
  };

  // Apply authentication middleware to all API routes except login
  app.use('/api', (req: any, res, next) => {
    if (req.path === '/auth/login') {
      return next();
    }
    authenticateUser(req, res, next);
  });

  // Admin 권한 검증 (활성화)
  const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    
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
          role: user.role,
          department: user.department,
          position: user.position,
          isManager: user.isManager,
          // 권한 정보 포함
          canUploadBom: user.canUploadBom,
          canUploadMaster: user.canUploadMaster,
          canUploadInventoryAdd: user.canUploadInventoryAdd,
          canUploadInventorySync: user.canUploadInventorySync,
          canAccessExcelManagement: user.canAccessExcelManagement,
          canBackupData: user.canBackupData,
          canRestoreData: user.canRestoreData,
          canResetData: user.canResetData,
          canManageUsers: user.canManageUsers,
          canManagePermissions: user.canManagePermissions,
          canDownloadInventory: user.canDownloadInventory,
          canDownloadTransactions: user.canDownloadTransactions,
          canDownloadBom: user.canDownloadBom,
          canDownloadAll: user.canDownloadAll,
          canManageInventory: user.canManageInventory,
          canProcessTransactions: user.canProcessTransactions,
          canManageBom: user.canManageBom,
          canManageWarehouse: user.canManageWarehouse,
          canProcessExchange: user.canProcessExchange,
          canCreateDiary: user.canCreateDiary,
          canEditDiary: user.canEditDiary,
          canDeleteDiary: user.canDeleteDiary,
          canViewReports: user.canViewReports,
          canManageLocation: user.canManageLocation,
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
        createdAt: user.createdAt,
        // 권한 정보 포함
        canUploadBom: user.canUploadBom,
        canUploadMaster: user.canUploadMaster,
        canUploadInventoryAdd: user.canUploadInventoryAdd,
        canUploadInventorySync: user.canUploadInventorySync,
        canAccessExcelManagement: user.canAccessExcelManagement,
        canBackupData: user.canBackupData,
        canRestoreData: user.canRestoreData,
        canResetData: user.canResetData,
        canManageUsers: user.canManageUsers,
        canManagePermissions: user.canManagePermissions,
        canDownloadInventory: user.canDownloadInventory,
        canDownloadTransactions: user.canDownloadTransactions,
        canDownloadBom: user.canDownloadBom,
        canDownloadAll: user.canDownloadAll,
        canManageInventory: user.canManageInventory,
        canProcessTransactions: user.canProcessTransactions,
        canManageBom: user.canManageBom,
        canManageWarehouse: user.canManageWarehouse,
        canProcessExchange: user.canProcessExchange,
        canCreateDiary: user.canCreateDiary,
        canEditDiary: user.canEditDiary,
        canDeleteDiary: user.canDeleteDiary,
        canViewReports: user.canViewReports,
        canManageLocation: user.canManageLocation,
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
      
      // 역할별 기본 권한 적용
      const { applyRolePermissions } = await import('@shared/permissions');
      const rolePermissions = applyRolePermissions(validatedData.role || 'viewer');
      
      // 기본 권한과 사용자 지정 권한 병합
      const userDataWithPermissions = {
        ...validatedData,
        ...rolePermissions,
        // 사용자가 명시적으로 설정한 권한이 있다면 우선 적용
        ...(validatedData.canUploadBom !== undefined && { canUploadBom: validatedData.canUploadBom }),
        ...(validatedData.canUploadMaster !== undefined && { canUploadMaster: validatedData.canUploadMaster }),
        ...(validatedData.canUploadInventoryAdd !== undefined && { canUploadInventoryAdd: validatedData.canUploadInventoryAdd }),
        ...(validatedData.canUploadInventorySync !== undefined && { canUploadInventorySync: validatedData.canUploadInventorySync }),
        ...(validatedData.canAccessExcelManagement !== undefined && { canAccessExcelManagement: validatedData.canAccessExcelManagement }),
        ...(validatedData.canBackupData !== undefined && { canBackupData: validatedData.canBackupData }),
        ...(validatedData.canRestoreData !== undefined && { canRestoreData: validatedData.canRestoreData }),
        ...(validatedData.canResetData !== undefined && { canResetData: validatedData.canResetData }),
        ...(validatedData.canManageUsers !== undefined && { canManageUsers: validatedData.canManageUsers }),
        ...(validatedData.canManagePermissions !== undefined && { canManagePermissions: validatedData.canManagePermissions }),
        ...(validatedData.canDownloadInventory !== undefined && { canDownloadInventory: validatedData.canDownloadInventory }),
        ...(validatedData.canDownloadTransactions !== undefined && { canDownloadTransactions: validatedData.canDownloadTransactions }),
        ...(validatedData.canDownloadBom !== undefined && { canDownloadBom: validatedData.canDownloadBom }),
        ...(validatedData.canDownloadAll !== undefined && { canDownloadAll: validatedData.canDownloadAll }),
        ...(validatedData.canManageInventory !== undefined && { canManageInventory: validatedData.canManageInventory }),
        ...(validatedData.canProcessTransactions !== undefined && { canProcessTransactions: validatedData.canProcessTransactions }),
        ...(validatedData.canManageBom !== undefined && { canManageBom: validatedData.canManageBom }),
        ...(validatedData.canManageWarehouse !== undefined && { canManageWarehouse: validatedData.canManageWarehouse }),
        ...(validatedData.canProcessExchange !== undefined && { canProcessExchange: validatedData.canProcessExchange }),
        ...(validatedData.canCreateDiary !== undefined && { canCreateDiary: validatedData.canCreateDiary }),
        ...(validatedData.canEditDiary !== undefined && { canEditDiary: validatedData.canEditDiary }),
        ...(validatedData.canDeleteDiary !== undefined && { canDeleteDiary: validatedData.canDeleteDiary }),
        ...(validatedData.canViewReports !== undefined && { canViewReports: validatedData.canViewReports }),
      };
      
      console.log('User data with permissions:', userDataWithPermissions);
      
      const user = await storage.createUser(userDataWithPermissions);
      console.log('User created:', user);
      
      // Don't send password in response
      const safeUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        position: user.position,
        isManager: user.isManager,
        createdAt: user.createdAt,
        // 권한 정보도 포함 (관리용)
        canUploadBom: user.canUploadBom,
        canUploadMaster: user.canUploadMaster,
        canUploadInventoryAdd: user.canUploadInventoryAdd,
        canUploadInventorySync: user.canUploadInventorySync,
        canAccessExcelManagement: user.canAccessExcelManagement,
        canManageUsers: user.canManageUsers,
        canManagePermissions: user.canManagePermissions,
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

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // 비밀번호 필드 제거 (권한 수정 시 비밀번호 덮어쓰기 방지)
      if (updates.password === '' || updates.password === undefined) {
        delete updates.password;
      }
      
      console.log(`권한 업데이트 요청: 사용자 ID ${userId}`, updates);
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`권한 업데이트 완료: 사용자 ${user.username}`, {
        canManageBom: user.canManageBom,
        canViewReports: user.canViewReports
      });
      
      // 전체 사용자 정보 반환 (권한 포함)
      const safeUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        position: user.position,
        isManager: user.isManager,
        createdAt: user.createdAt,
        // 모든 권한 정보 포함
        canUploadBom: user.canUploadBom,
        canUploadMaster: user.canUploadMaster,
        canUploadInventoryAdd: user.canUploadInventoryAdd,
        canUploadInventorySync: user.canUploadInventorySync,
        canAccessExcelManagement: user.canAccessExcelManagement,
        canBackupData: user.canBackupData,
        canRestoreData: user.canRestoreData,
        canResetData: user.canResetData,
        canManageUsers: user.canManageUsers,
        canManagePermissions: user.canManagePermissions,
        canDownloadInventory: user.canDownloadInventory,
        canDownloadTransactions: user.canDownloadTransactions,
        canDownloadBom: user.canDownloadBom,
        canDownloadAll: user.canDownloadAll,
        canManageInventory: user.canManageInventory,
        canProcessTransactions: user.canProcessTransactions,
        canManageBom: user.canManageBom,
        canManageWarehouse: user.canManageWarehouse,
        canProcessExchange: user.canProcessExchange,
        canCreateDiary: user.canCreateDiary,
        canEditDiary: user.canEditDiary,
        canDeleteDiary: user.canDeleteDiary,
        canViewReports: user.canViewReports,
      };
      res.json(safeUser);
    } catch (error) {
      console.error('권한 업데이트 오류:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // 최고관리자(admin) 계정 삭제 방지
      const userToDelete = await storage.getUserById(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (userToDelete.username === 'admin' || userToDelete.role === 'super_admin') {
        return res.status(403).json({ 
          message: "🛡️ 절대관리자 계정은 시스템 보안을 위해 삭제할 수 없습니다." 
        });
      }
      
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
      console.log('Creating inventory item with data:', req.body);
      const validatedData = insertInventoryItemSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      // 동일한 제품코드의 기존 재고 확인 (위치 무관)
      const allItems = await storage.getInventoryItems();
      console.log('All items count:', allItems.length);
      console.log('Looking for code:', validatedData.code, 'new location:', validatedData.location);
      
      // 같은 제품코드의 기존 항목 찾기
      const existingItem = allItems.find(item => item.code === validatedData.code);
      
      console.log('Found existing item:', existingItem ? 'YES' : 'NO');
      if (existingItem) {
        console.log('Existing item details:', { id: existingItem.id, location: existingItem.location, stock: existingItem.stock });
      }

      if (existingItem) {
        // 기존 항목 업데이트 (수량 추가 및 위치 업데이트)
        console.log('Updating existing item with additional stock:', existingItem.stock + (validatedData.stock || 0));
        const updatedItem = await storage.updateInventoryItemById(existingItem.id, {
          stock: existingItem.stock + (validatedData.stock || 0),
          name: validatedData.name,
          category: validatedData.category,
          manufacturer: validatedData.manufacturer,
          unit: validatedData.unit,
          location: validatedData.location, // 위치도 업데이트
          minStock: validatedData.minStock,
          boxSize: validatedData.boxSize,
        });
        console.log('Updated item:', updatedItem);
        res.status(200).json(updatedItem);
      } else {
        // 새 항목 생성
        const item = await storage.createInventoryItem(validatedData);
        console.log('Created item:', item);
        res.status(201).json(item);
      }
    } catch (error: any) {
      console.error('Inventory item creation error:', error);
      if (error.errors) {
        // Zod validation error
        res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      } else {
        res.status(400).json({ 
          message: "Invalid data", 
          error: error.message || "Unknown error" 
        });
      }
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

  // 재고 위치 업데이트 API
  app.patch("/api/inventory/:code", requireAdmin, async (req, res) => {
    try {
      const { location } = req.body;
      const updated = await storage.updateInventoryItem(req.params.code, { location });
      if (!updated) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // 수량 조정 API
  app.patch("/api/inventory/:id/adjust", requireAdmin, async (req, res) => {
    try {
      const { newStock, reason } = req.body;
      const itemId = parseInt(req.params.id);

      if (typeof newStock !== 'number' || newStock < 0) {
        return res.status(400).json({ message: "Invalid stock amount" });
      }

      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }

      // 기존 재고 항목 찾기
      const item = await storage.getInventoryItemById(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const oldStock = item.stock;
      const stockDifference = newStock - oldStock;

      // 재고 업데이트
      await storage.updateInventoryItemById(itemId, { stock: newStock });

      // 조정 트랜잭션 생성
      await storage.createTransaction({
        type: 'adjustment',
        itemCode: item.code,
        itemName: item.name,
        quantity: Math.abs(stockDifference),
        reason: `재고 조정 (${reason}): ${oldStock} → ${newStock}`,
        toLocation: item.location,
        userId: (req as any).user?.id || 1
      });

      console.log(`재고 조정 완료: ${item.name} (${oldStock} → ${newStock}), 사유: ${reason}`);
      
      res.json({ 
        message: "Stock adjusted successfully",
        oldStock,
        newStock,
        difference: stockDifference
      });
    } catch (error) {
      console.error("재고 조정 오류:", error);
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
      console.log(`[트랜잭션 생성] 요청 데이터:`, req.body);
      const validatedData = insertTransactionSchema.parse(req.body);
      console.log(`[트랜잭션 생성] 검증된 데이터: 타입=${validatedData.type}, 사유=${validatedData.reason}, 제품=${validatedData.itemCode}`);
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
            console.log(`[불량품 교환 출고] 교환 대기 목록 생성 시작: ${validatedData.itemCode}, 수량: ${validatedData.quantity}`);
            const exchangeItem = await storage.createExchangeQueueItem({
              itemCode: validatedData.itemCode,
              itemName: validatedData.itemName,
              quantity: validatedData.quantity,
              outboundDate: new Date()
            });
            console.log(`[불량품 교환 출고] 교환 대기 목록 생성 완료: ID ${exchangeItem.id}`);
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
      console.error('[트랜잭션 생성] 오류:', error);
      const errorMessage = error instanceof Error ? error.message : "Invalid data";
      res.status(400).json({ message: errorMessage });
    }
  });

  // BOM routes
  app.get("/api/bom", async (req, res) => {
    try {
      // 세션 검증
      if (!req.user) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      // BOM 조회 권한 검증 (can_manage_bom 또는 can_view_reports 중 하나라도 있으면 목록 조회 가능)
      if (!req.user.canManageBom && !req.user.canViewReports) {
        return res.status(403).json({ message: "BOM 조회 권한이 없습니다." });
      }
      
      const bomGuides = await storage.getBomGuides();
      res.json(bomGuides);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/bom/:guideName", async (req, res) => {
    try {
      // 세션 검증
      if (!req.user) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
      
      // BOM 조회 권한 검증 (can_manage_bom 또는 can_view_reports 중 하나라도 있으면 상세 조회 가능)
      if (!req.user.canManageBom && !req.user.canViewReports) {
        return res.status(403).json({ message: "BOM 조회 권한이 없습니다." });
      }
      
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

  app.put("/api/warehouse/layout/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWarehouseLayoutSchema.parse(req.body);
      const layout = await storage.updateWarehouseZone(parseInt(req.params.id), validatedData);
      if (!layout) {
        return res.status(404).json({ message: "Warehouse zone not found" });
      }
      res.json(layout);
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
      
      const itemsToProcess = [];
      let skippedCount = 0;
      
      // 1. 데이터 전처리 및 검증
      for (const item of items) {
        const code = String(item['제품코드'] || item.code || '').trim();
        if (!code) {
          skippedCount++;
          console.log('Skipped item with empty code:', item);
          continue;
        }
        
        itemsToProcess.push({
          code: code,
          name: String(item['품명'] || item.name || ''),
          category: String(item['카테고리'] || item.category || '기타'),
          manufacturer: String(item['제조사'] || item.manufacturer || ''),
          stock: parseInt(item['현재고'] || item.stock) || 0,
          minStock: parseInt(item['최소재고'] || item.minStock) || 0,
          unit: String(item['단위'] || item.unit || 'ea'),
          location: String(item['위치'] || item.location || '').trim() || null,
          boxSize: parseInt(item['박스당수량'] || item.boxSize) || 1,
        });
      }
      
      // 2. 한 번만 기존 인벤토리 조회 후 캐시
      console.log('Loading existing inventory for comparison...');
      const existingItems = await storage.getInventoryItems();
      const existingItemsMap = new Map(existingItems.map(item => [item.code, item]));
      console.log('Existing inventory loaded:', existingItems.length, 'items');
      
      // 3. UPSERT 방식으로 처리 - 존재하면 업데이트, 없으면 생성
      const results = [];
      const batchSize = 50;
      let createdCount = 0;
      let updatedCount = 0;
      
      for (let i = 0; i < itemsToProcess.length; i += batchSize) {
        const batch = itemsToProcess.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(itemsToProcess.length/batchSize)} (${batch.length} items)`);
        
        // 배치 내에서 병렬 처리
        const batchResults = await Promise.all(
          batch.map(async (item) => {
            try {
              const existingItem = existingItemsMap.get(item.code);
              
              if (existingItem) {
                // 업데이트
                const updated = await storage.updateInventoryItem(item.code, {
                  name: item.name,
                  category: item.category,
                  manufacturer: item.manufacturer,
                  minStock: item.minStock,
                  unit: item.unit,
                  boxSize: item.boxSize,
                  // 재고와 위치는 기존 값 유지 (현재고 필드가 있을 때만 업데이트)
                  ...(item.stock !== 0 && { stock: item.stock }),
                  ...(item.location && { location: item.location }),
                });
                if (updated) {
                  return { success: true, item: updated, type: 'updated' };
                }
              } else {
                // 신규 생성
                const created = await storage.createInventoryItem(item);
                // 생성된 아이템을 캐시에 추가 (중복 방지)
                existingItemsMap.set(item.code, created);
                return { success: true, item: created, type: 'created' };
              }
              return { success: false, code: item.code, error: 'No result' };
            } catch (error) {
              console.error('Failed to process item:', item.code, (error as Error).message);
              
              // 생성 실패시 업데이트로 재시도
              if ((error as Error).message.includes('duplicate key') || (error as Error).message.includes('unique constraint')) {
                try {
                  const updated = await storage.updateInventoryItem(item.code, {
                    name: item.name,
                    category: item.category,
                    manufacturer: item.manufacturer,
                    minStock: item.minStock,
                    unit: item.unit,
                    boxSize: item.boxSize,
                  });
                  if (updated) {
                    console.log('Recovered by update:', item.code);
                    return { success: true, item: updated, type: 'recovered' };
                  }
                } catch (updateError) {
                  console.error('Failed to recover item:', item.code, (updateError as Error).message);
                }
              }
              return { success: false, code: item.code, error: (error as Error).message };
            }
          })
        );
        
        // 배치 결과 처리
        for (const result of batchResults) {
          if (result.success) {
            results.push(result.item);
            if (result.type === 'created' || result.type === 'recovered') {
              createdCount++;
            } else if (result.type === 'updated') {
              updatedCount++;
            }
          }
        }
        
        // 진행 상황 로그
        console.log(`Batch completed: ${results.length}/${itemsToProcess.length} processed (${createdCount} created, ${updatedCount} updated)`);
      }

      console.log('Master upload complete:', { 
        processed: results.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        totalInput: items.length
      });
      
      res.json({ 
        created: results.length, 
        items: results.slice(0, 10) // 응답 크기 제한
      });
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

      // 1. 기존 BOM 데이터 전체 삭제 (한 번에)
      const existingBomGuides = await storage.getBomGuides();
      const uniqueGuideNames = Array.from(new Set(existingBomGuides.map(bom => bom.guideName)));
      
      // 삭제 작업을 병렬 처리
      if (uniqueGuideNames.length > 0) {
        await Promise.all(uniqueGuideNames.map(guideName => 
          storage.deleteBomGuidesByName(guideName)
        ));
        console.log('Deleted existing BOM guides:', uniqueGuideNames.length);
      }

      // 2. 새로운 BOM 데이터 준비
      const validBomItems = [];
      let currentGuideName = '';
      
      for (const item of items) {
        const guideName = String(item['설치가이드명'] || item.guideName || '').trim();
        const itemCode = String(item['필요부품코드'] || item.itemCode || '').trim();
        const requiredQuantity = Number(item['필요수량'] || item.requiredQuantity || 0);

        if (guideName) {
          currentGuideName = guideName;
        }

        if (currentGuideName && itemCode && requiredQuantity > 0) {
          validBomItems.push({
            guideName: currentGuideName,
            itemCode: itemCode,
            requiredQuantity: requiredQuantity,
          });
        }
      }

      // 3. 새로운 BOM 데이터를 배치로 생성
      const createdBoms = [];
      const batchSize = 100;
      
      for (let i = 0; i < validBomItems.length; i += batchSize) {
        const batch = validBomItems.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(bomItem => 
            storage.createBomGuide(bomItem).catch(err => {
              console.error('Failed to create BOM item:', bomItem, err.message);
              return null;
            })
          )
        );
        createdBoms.push(...batchResults.filter(item => item !== null));
      }

      console.log('BOM upload complete:', { 
        processed: createdBoms.length,
        validItems: validBomItems.length 
      });
      
      res.json({ 
        created: createdBoms.length, 
        items: createdBoms.slice(0, 10) // 응답 크기 제한
      });
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
      console.log('Inventory sync upload started');
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        console.error('Items is not an array:', typeof items);
        return res.status(400).json({ message: "Items must be an array" });
      }

      console.log(`Processing ${items.length} items for full sync`);
      
      // Sample data validation
      if (items.length > 0) {
        const sampleItem = items[0];
        console.log('Sample item structure:', {
          keys: Object.keys(sampleItem),
          values: Object.values(sampleItem).slice(0, 3)
        });
      }

      // Clear existing inventory
      console.log('Clearing existing inventory...');
      const existingItems = await storage.getInventoryItems();
      console.log(`Found ${existingItems.length} existing items to delete`);
      
      for (const item of existingItems) {
        try {
          await storage.deleteInventoryItem(item.code);
        } catch (deleteError) {
          console.error(`Failed to delete item ${item.code}:`, deleteError.message);
        }
      }
      console.log('Existing inventory cleared');

      // 안전한 숫자 변환 함수
      const safeParseInt = (value: any, defaultValue: number = 0): number => {
        if (value === '' || value == null || value === undefined) return defaultValue;
        const parsed = parseInt(String(value).trim());
        return Number.isNaN(parsed) ? defaultValue : parsed;
      };

      // 제품코드 + 위치 조합으로 유일성 보장 (다중 위치 지원)
      const uniqueItems = new Map();
      const processWarnings = [];
      
      // 1단계: 모든 아이템 처리 (중복 제거 없이)
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const code = String(item['제품코드'] || item.code || '').trim();
        
        // 제품코드가 완전히 비어있는 경우만 스킵
        if (!code || code === '') {
          processWarnings.push(`Row ${i + 1}: Missing product code - skipped`);
          continue;
        }
        
        // 안전한 숫자 변환 (에러 시에도 기본값으로 처리)
        const stock = safeParseInt(item['현재고'] || item.stock, 0);
        const minStock = safeParseInt(item['최소재고'] || item.minStock, 0);
        const boxSize = safeParseInt(item['박스당수량'] || item.boxSize, 1);
        
        const location = String(item['위치'] || item.location || '').trim() || null;
        
        // 제품코드 + 위치 조합으로 고유 키 생성
        const uniqueKey = location ? `${code}_${location}` : `${code}_NO_LOCATION`;
        
        if (uniqueItems.has(uniqueKey)) {
          // 완전히 동일한 제품+위치 조합인 경우만 재고 합산
          const existing = uniqueItems.get(uniqueKey);
          existing.stock += stock;
          processWarnings.push(`Row ${i + 1}: Duplicate ${code} at ${location || 'NO_LOCATION'} - stock merged (${stock} added)`);
        } else {
          // 새로운 제품+위치 조합으로 등록
          uniqueItems.set(uniqueKey, {
            code: code,
            name: String(item['품명'] || item.name || code).trim(),
            category: String(item['카테고리'] || item.category || '기타').trim(),
            manufacturer: String(item['제조사'] || item.manufacturer || '').trim(),
            stock: stock,
            minStock: minStock,
            unit: String(item['단위'] || item.unit || 'ea').trim(),
            location: location,
            boxSize: boxSize,
            rowIndex: i + 1,
            uniqueKey: uniqueKey
          });
        }
      }

      console.log(`Processing ${uniqueItems.size} unique items (${processWarnings.length} warnings)`);
      
      // 2단계: 위치 정보 파싱 및 창고 구조 자동 생성
      const warehouseStructures = new Map(); // 중복 방지용
      const locationWarnings = [];
      
      for (const itemData of uniqueItems.values()) {
        if (itemData.location) {
          const parsed = parseLocation(itemData.location);
          itemData.parsedLocation = parsed;
          
          if (!parsed.isValid) {
            locationWarnings.push(`${itemData.code}: 위치 형식을 인식할 수 없음 "${itemData.location}"`);
          } else {
            // 창고 구조 데이터 수집
            const structureKey = `${parsed.zoneName}-${parsed.subZoneName}`;
            if (!warehouseStructures.has(structureKey)) {
              warehouseStructures.set(structureKey, {
                zoneName: parsed.zoneName,
                subZoneName: parsed.subZoneName,
                maxFloor: parsed.floor
              });
            } else {
              // 기존 구조에서 최대 층수 업데이트
              const existing = warehouseStructures.get(structureKey);
              existing.maxFloor = Math.max(existing.maxFloor, parsed.floor);
            }
          }
        }
      }
      
      // 창고 구조 자동 생성
      const createdStructures = [];
      for (const structureData of warehouseStructures.values()) {
        try {
          // 기존에 같은 구조가 있는지 확인
          const existingLayouts = await storage.getWarehouseLayout();
          const exists = existingLayouts.some(layout => 
            layout.zoneName === structureData.zoneName && 
            layout.subZoneName === structureData.subZoneName
          );
          
          if (!exists) {
            const floors = Array.from({ length: structureData.maxFloor }, (_, i) => i + 1);
            const newLayout = await storage.createWarehouseZone({
              zoneName: structureData.zoneName,
              subZoneName: structureData.subZoneName,
              floors: floors
            });
            createdStructures.push(newLayout);
            console.log(`자동 생성된 창고 구조: ${structureData.zoneName}구역-${structureData.subZoneName} (${structureData.maxFloor}층까지)`);
          }
        } catch (structureError) {
          console.error(`창고 구조 생성 실패 ${structureData.zoneName}-${structureData.subZoneName}:`, structureError.message);
        }
      }

      // 3단계: 모든 고유 아이템들 생성 (배치 처리로 성능 향상)
      const createdItems = [];
      const errors = [];
      let processedCount = 0;
      const batchSize = 50;
      
      const itemsArray = Array.from(uniqueItems.values());
      
      for (let i = 0; i < itemsArray.length; i += batchSize) {
        const batch = itemsArray.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(itemsArray.length/batchSize)} (${batch.length} items)`);
        
        // 배치 내에서 병렬 처리
        const batchResults = await Promise.all(
          batch.map(async (itemData) => {
            try {
              processedCount++;
              console.log(`Creating item ${processedCount}/${itemsArray.length}: ${itemData.code} at ${itemData.location || 'NO_LOCATION'} (stock: ${itemData.stock})`);
              
              const created = await storage.createInventoryItem({
                code: itemData.code,
                name: itemData.name,
                category: itemData.category,
                manufacturer: itemData.manufacturer,
                stock: itemData.stock,
                minStock: itemData.minStock,
                unit: itemData.unit,
                location: itemData.location,
                boxSize: itemData.boxSize,
              });
              
              return { success: true, item: created };
              
            } catch (itemError: any) {
              console.error(`Failed to create item ${itemData.code}:`, itemError.message);
              return { success: false, error: `${itemData.code}: ${itemError.message}` };
            }
          })
        );
        
        // 배치 결과 처리
        for (const result of batchResults) {
          if (result.success) {
            createdItems.push(result.item);
          } else {
            errors.push(result.error);
          }
        }
        
        console.log(`Batch completed: ${createdItems.length}/${itemsArray.length} created so far`);
      }

      console.log('Inventory sync complete:', { 
        inputItems: items.length,
        processedItems: uniqueItems.size,
        createdItems: createdItems.length,
        createdStructures: createdStructures.length,
        errors: errors.length,
        warnings: processWarnings.length,
        locationWarnings: locationWarnings.length
      });

      if (errors.length > 0) {
        console.log('Sync errors:', errors.slice(0, 10)); // Log first 10 errors
      }
      
      if (processWarnings.length > 0) {
        console.log('Process warnings:', processWarnings.slice(0, 10)); // Log first 10 warnings
      }

      res.json({ 
        synced: createdItems.length, 
        total: items.length,
        processed: uniqueItems.size,
        createdStructures: createdStructures.length,
        errors: errors.length,
        warnings: processWarnings.length,
        locationWarnings: locationWarnings.length,
        errorDetails: errors.slice(0, 5), // Return first 5 errors
        warningDetails: processWarnings.slice(0, 5), // Return first 5 warnings
        locationWarningDetails: locationWarnings.slice(0, 5), // Return first 5 location warnings
        structureDetails: createdStructures.map(s => `${s.zoneName}구역-${s.subZoneName}`)
      });
      
    } catch (error) {
      console.error('Inventory sync error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: "Server error", 
        error: error.message,
        details: error.stack?.split('\n').slice(0, 3).join('\n')
      });
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
      // 세션 인증이 실패한 경우 빈 배열 반환
      if (!req.user?.id) {
        console.log('[업무일지 조회] 인증되지 않은 사용자 - 빈 배열 반환');
        return res.json([]);
      }
      
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const userId = req.user.id; // 세션에서 사용자 ID 가져오기
      const diaries = await storage.getWorkDiaries(start, end, userId);
      res.json(diaries);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/work-diary/:id", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const diary = await storage.getWorkDiary(parseInt(req.params.id), userId);
      if (!diary) {
        return res.status(404).json({ message: "Work diary not found" });
      }
      
      // 상태 변경이 있었을 수 있으므로 최신 데이터로 다시 조회
      const updatedDiary = await storage.getWorkDiary(parseInt(req.params.id));
      res.json(updatedDiary || diary);
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
        status: 'pending', // 새 업무일지는 항상 대기중으로 시작
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

  // 업무일지 완료 처리
  app.post("/api/work-diary/:id/complete", async (req: any, res) => {
    try {
      const diaryId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }
      
      // 업무일지 조회 및 권한 확인
      const diary = await storage.getWorkDiary(diaryId);
      if (!diary) {
        return res.status(404).json({ message: "업무일지를 찾을 수 없습니다" });
      }
      
      // 이미 완료된 업무일지인지 확인
      if (diary.status === 'completed') {
        return res.json({ message: "이미 완료된 업무입니다", alreadyCompleted: true });
      }
      
      // 담당자 권한 확인
      if (!diary.assignedTo?.includes(userId)) {
        return res.status(403).json({ message: "업무 완료 권한이 없습니다" });
      }
      
      const success = await storage.updateWorkDiaryStatus(diaryId, 'completed', userId);
      if (!success) {
        return res.status(500).json({ message: "업무 완료 처리에 실패했습니다" });
      }
      
      res.json({ message: "업무가 완료 처리되었습니다" });
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

  // 알림 관련 API
  app.get("/api/notifications", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.json([]);
      }
      
      const notifications = await storage.getWorkNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/notifications/:id/read", async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "알림이 읽음 처리되었습니다" });
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

  // 현재 사용자 정보 조회 API
  app.get("/api/auth/me", async (req, res) => {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      return res.status(401).json({ message: "세션 ID가 필요합니다." });
    }
    
    try {
      const user = await storage.getUserBySession(sessionId);
      if (!user) {
        return res.status(401).json({ message: "유효하지 않은 세션입니다." });
      }
      
      res.json(user);
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
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
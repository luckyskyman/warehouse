import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertTransactionSchema, insertBomGuideSchema, insertWarehouseLayoutSchema, insertExchangeQueueSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
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

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/inventory/:code", async (req, res) => {
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

  app.delete("/api/inventory/:code", async (req, res) => {
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

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      // Update inventory based on transaction type
      if (validatedData.type === "inbound") {
        const item = await storage.getInventoryItem(validatedData.itemCode);
        if (item) {
          await storage.updateInventoryItem(validatedData.itemCode, {
            stock: item.stock + validatedData.quantity,
            location: validatedData.toLocation || item.location
          });
        }
      } else if (validatedData.type === "outbound") {
        const item = await storage.getInventoryItem(validatedData.itemCode);
        if (item && item.stock >= validatedData.quantity) {
          await storage.updateInventoryItem(validatedData.itemCode, {
            stock: item.stock - validatedData.quantity
          });
          
          // Add to exchange queue if it's a defective item exchange
          if (validatedData.reason === "불량품 교환 출고") {
            await storage.createExchangeQueueItem({
              itemCode: validatedData.itemCode,
              itemName: validatedData.itemName,
              quantity: validatedData.quantity,
              outboundDate: new Date()
            });
          }
        } else {
          return res.status(400).json({ message: "Insufficient stock" });
        }
      } else if (validatedData.type === "move") {
        const item = await storage.getInventoryItem(validatedData.itemCode);
        if (item) {
          await storage.updateInventoryItem(validatedData.itemCode, {
            location: validatedData.toLocation || item.location
          });
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

  app.post("/api/bom", async (req, res) => {
    try {
      const validatedData = insertBomGuideSchema.parse(req.body);
      const bom = await storage.createBomGuide(validatedData);
      res.status(201).json(bom);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/bom/:guideName", async (req, res) => {
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

  app.post("/api/warehouse/layout", async (req, res) => {
    try {
      const validatedData = insertWarehouseLayoutSchema.parse(req.body);
      const layout = await storage.createWarehouseZone(validatedData);
      res.status(201).json(layout);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/warehouse/layout/:id", async (req, res) => {
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

  app.post("/api/exchange-queue/:id/process", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}

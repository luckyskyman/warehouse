import { 
  type User, type InsertUser, 
  type InventoryItem, type InsertInventoryItem,
  type Transaction, type InsertTransaction,
  type BomGuide, type InsertBomGuide,
  type WarehouseLayout, type InsertWarehouseLayout,
  type ExchangeQueue, type InsertExchangeQueue,
  type WorkDiary, type InsertWorkDiary,
  type WorkDiaryComment, type InsertWorkDiaryComment,
  type WorkNotification, type InsertWorkNotification
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

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

  // Work diary
  getWorkDiaries(startDate?: Date, endDate?: Date): Promise<WorkDiary[]>;
  getWorkDiary(id: number): Promise<WorkDiary | undefined>;
  createWorkDiary(diary: InsertWorkDiary): Promise<WorkDiary>;
  updateWorkDiary(id: number, updates: Partial<WorkDiary>): Promise<WorkDiary | undefined>;
  deleteWorkDiary(id: number): Promise<boolean>;

  // Work diary comments
  getWorkDiaryComments(diaryId: number): Promise<WorkDiaryComment[]>;
  createWorkDiaryComment(comment: InsertWorkDiaryComment): Promise<WorkDiaryComment>;
  deleteWorkDiaryComment(id: number): Promise<boolean>;

  // Work notifications
  getWorkNotifications(userId: number): Promise<WorkNotification[]>;
  createWorkNotification(notification: InsertWorkNotification): Promise<WorkNotification>;
  markNotificationAsRead(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventoryItems: Map<string, InventoryItem>;
  private transactions: Transaction[];
  private bomGuides: BomGuide[];
  private warehouseLayout: WarehouseLayout[];
  private exchangeQueue: ExchangeQueue[];
  private workDiaries: WorkDiary[];
  private workDiaryComments: WorkDiaryComment[];
  private workNotifications: WorkNotification[];
  private currentUserId: number;
  private currentItemId: number;
  private currentTransactionId: number;
  private currentBomId: number;
  private currentLayoutId: number;
  private currentExchangeId: number;
  private currentWorkDiaryId: number;
  private currentCommentId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.inventoryItems = new Map();
    this.transactions = [];
    this.bomGuides = [];
    this.warehouseLayout = [];
    this.exchangeQueue = [];
    this.workDiaries = [];
    this.workDiaryComments = [];
    this.workNotifications = [];
    this.currentUserId = 1;
    this.currentItemId = 1;
    this.currentTransactionId = 1;
    this.currentBomId = 1;
    this.currentLayoutId = 1;
    this.currentExchangeId = 1;
    this.currentWorkDiaryId = 1;
    this.currentCommentId = 1;
    this.currentNotificationId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create default users
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "xormr",
      role: "admin",
      department: "관리부",
      position: "관리자",
      isManager: true,
      createdAt: new Date(),
    };
    const viewerUser: User = {
      id: this.currentUserId++,
      username: "viewer",
      password: "1124",
      role: "viewer",
      department: "창고부",
      position: "사원",
      isManager: false,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
    this.users.set(viewerUser.id, viewerUser);

    // 창고 레이아웃 초기화 - 빈 상태로 시작
    this.warehouseLayout = [];

    // 모든 데이터를 빈 상태로 초기화
    this.bomGuides = [];
    this.workDiaries = [];
    this.workDiaryComments = [];
    this.workNotifications = [];
    this.transactions = [];
    this.exchangeQueue = [];
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
    console.log('Creating user in storage with:', insertUser);
    
    // 중복 사용자명 체크
    const existingUser = await this.getUserByUsername(insertUser.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    const user: User = {
      id: this.currentUserId++,
      createdAt: new Date(),
      ...insertUser,
    };
    
    console.log('Created user object:', user);
    this.users.set(user.id, user);
    console.log('User added to storage, total users:', this.users.size);
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
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
    // 처리되지 않은 교환 대기 항목만 반환
    return this.exchangeQueue.filter(item => !item.processed);
  }

  async createExchangeQueueItem(insertItem: InsertExchangeQueue): Promise<ExchangeQueue> {
    const item: ExchangeQueue = {
      id: this.currentExchangeId++,
      createdAt: new Date(),
      processed: false,
      ...insertItem,
    };
    this.exchangeQueue.push(item);
    return item;
  }

  async processExchangeQueueItem(id: number): Promise<boolean> {
    const item = this.exchangeQueue.find(item => item.id === id);
    if (!item) return false;
    
    console.log(`교환 처리 시작: ${item.itemCode}, 수량: ${item.quantity}`);
    
    // 교환 처리 시 원래 불량품이 출고된 위치로 반환
    // 불량품 교환 출고 트랜잭션에서 위치 정보 찾기
    const allTransactions = this.transactions.filter(t => 
      t.itemCode === item.itemCode && 
      t.type === "outbound" && 
      t.reason === "불량품 교환 출고"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const originalOutbound = allTransactions[0];
    const returnLocation = originalOutbound?.fromLocation;
    
    console.log(`교환 처리 시작: ${item.itemCode}, 수량: ${item.quantity}, 반환 위치: ${returnLocation}`);
    
    const allItems = Array.from(this.inventoryItems.values());
    
    if (returnLocation) {
      // 원래 위치로 반환
      const targetItem = allItems.find(inventoryItem => 
        inventoryItem.code === item.itemCode && inventoryItem.location === returnLocation
      );
      
      if (targetItem) {
        // 해당 위치에 기존 재고가 있으면 가산
        console.log(`원래 위치 ${returnLocation}에 기존 재고: ${targetItem.stock}, 가산 후: ${targetItem.stock + item.quantity}`);
        await this.updateInventoryItemById(targetItem.id, {
          stock: targetItem.stock + item.quantity
        });
        console.log(`원래 위치로 재고 가산 완료`);
      } else {
        // 해당 위치에 재고가 없으면 새로 생성
        const masterItem = allItems.find(inventoryItem => inventoryItem.code === item.itemCode);
        if (masterItem) {
          await this.createInventoryItem({
            code: masterItem.code,
            name: masterItem.name,
            category: masterItem.category,
            manufacturer: masterItem.manufacturer,
            stock: item.quantity,
            minStock: masterItem.minStock,
            unit: masterItem.unit,
            location: returnLocation,
            boxSize: masterItem.boxSize
          });
          console.log(`원래 위치 ${returnLocation}에 새 재고 항목 생성 완료`);
        }
      }
    } else {
      // 위치 정보가 없으면 첫 번째 항목에 가산
      const itemsWithCode = allItems.filter(inventoryItem => 
        inventoryItem.code === item.itemCode
      );
      
      if (itemsWithCode.length > 0) {
        const firstItem = itemsWithCode[0];
        console.log(`위치 정보 없음, 첫 번째 항목에 가산: ${firstItem.stock + item.quantity}`);
        await this.updateInventoryItemById(firstItem.id, {
          stock: firstItem.stock + item.quantity
        });
        console.log(`재고 가산 완료`);
      }
    }
    
    // 트랜잭션 이력 생성 (불량품교환 새제품 입고)
    await this.createTransaction({
      type: 'inbound',
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      toLocation: returnLocation || '위치없음',
      reason: '불량품교환 새제품 입고',
      memo: `교환대기목록 ID: ${id}에서 처리됨`,
      userId: 1 // 시스템 처리
    });
    
    item.processed = true;
    console.log(`교환 처리 완료`);
    return true;
  }

  // Work diary methods
  async getWorkDiaries(startDate?: Date, endDate?: Date, userId?: number): Promise<WorkDiary[]> {
    let diaries = [...this.workDiaries];
    
    // 담당자 업무일지 상태 자동 업데이트 (pending → in_progress)
    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        for (const diary of diaries) {
          // 담당자가 대기중인 업무일지를 조회할 때 자동으로 진행중으로 변경
          const isAssignee = diary.assignedTo && Array.isArray(diary.assignedTo) 
            ? diary.assignedTo.includes(userId)
            : diary.assignedTo === userId;
            
          if (diary.status === 'pending' && isAssignee) {
            console.log(`[업무일지 목록 조회] ID:${diary.id} - 담당자 ${user.username}(${userId})가 조회하여 대기중 → 진행중으로 변경`);
            diary.status = 'in_progress';
            diary.updatedAt = new Date().toISOString();
            
            // 상태 변경 알림 생성
            await this.createWorkNotification({
              userId: diary.authorId,
              diaryId: diary.id,
              type: 'status_change',
              message: `${user.username}님이 업무를 확인했습니다.`
            });
          }
        }
      }
    }
    
    // 부서별 권한 필터링
    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        console.log(`[업무일지 필터링] 사용자 ${user.username}(ID: ${userId}, 부서: ${user.department})의 업무일지 조회`);
        
        diaries = diaries.filter(diary => {
          const author = this.users.get(diary.authorId);
          
          console.log(`[업무일지 필터링] 업무일지 ID: ${diary.id}, 작성자: ${author?.username}(ID: ${diary.authorId}), 담당자: ${diary.assignedTo}, 공개범위: ${diary.visibility}`);
          
          // Admin은 모든 업무일지 조회 가능
          if (user.role === 'admin') {
            console.log(`[업무일지 필터링] Admin 권한으로 조회 허용`);
            return true;
          }
          
          // Private: 작성자 + 담당자만 조회 가능
          if (diary.visibility === 'private') {
            const isAuthor = diary.authorId === userId;
            const isAssigned = diary.assignedTo && diary.assignedTo.includes(userId);
            console.log(`[업무일지 필터링] Private 모드 - 작성자여부: ${isAuthor}, 담당자여부: ${isAssigned}`);
            console.log(`[업무일지 필터링] Private 모드 디버그 - assignedTo: ${JSON.stringify(diary.assignedTo)}, userId: ${userId}, includes결과: ${diary.assignedTo?.includes(userId)}`);
            return isAuthor || isAssigned;
          }
          
          // Department: 같은 부서 멤버들만 조회 가능
          if (diary.visibility === 'department') {
            const isAuthor = diary.authorId === userId;
            const sameDepartment = user.department && author?.department === user.department;
            console.log(`[업무일지 필터링] Department 모드 - 작성자여부: ${isAuthor}, 같은부서여부: ${sameDepartment} (사용자부서: ${user.department}, 작성자부서: ${author?.department})`);
            return isAuthor || sameDepartment;
          }
          
          // Public: 모든 사용자 조회 가능
          console.log(`[업무일지 필터링] Public 모드 - 조회 허용`);
          return true;
        });
      }
    }
    
    if (startDate || endDate) {
      diaries = diaries.filter(diary => {
        const workDate = new Date(diary.workDate);
        if (startDate && workDate < startDate) return false;
        if (endDate && workDate > endDate) return false;
        return true;
      });
    }
    
    return diaries.sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
  }

  async getWorkDiary(id: number, userId?: number): Promise<WorkDiary | undefined> {
    const diary = this.workDiaries.find(diary => diary.id === id);
    if (!diary) return undefined;
    
    // userId가 없으면 그냥 반환
    if (!userId) return diary;

    // 담당자가 최초 조회 시 상태를 pending → in_progress로 변경
    const isAssignee = diary.assignedTo && Array.isArray(diary.assignedTo) 
      ? diary.assignedTo.includes(userId)
      : diary.assignedTo === userId;
      
    if (diary.status === 'pending' && isAssignee) {
      console.log(`[업무일지 상태] ID:${id} - 담당자 ${userId}가 최초 조회하여 대기중 → 진행중으로 변경`);
      diary.status = 'in_progress';
      diary.updatedAt = new Date().toISOString();
      
      // 상태 변경 알림 생성
      const user = this.users.get(userId);
      if (user) {
        await this.createWorkNotification({
          userId: diary.authorId,
          diaryId: diary.id,
          type: 'status_change',
          message: `${user.username}님이 업무를 확인했습니다.`
        });
      }
    }

    return diary;
  }

  // 업무일지 상태 변경 및 알림 생성
  async updateWorkDiaryStatus(diaryId: number, newStatus: 'pending' | 'in_progress' | 'completed', userId: number): Promise<boolean> {
    const diary = await this.updateWorkDiary(diaryId, { status: newStatus });
    if (!diary) return false;

    const user = this.users.get(userId);
    const author = this.users.get(diary.authorId);
    if (!user || !author) return false;

    // 상태 변경 알림을 작성자에게 전송 (자신이 작성한 것이 아닌 경우)
    if (diary.authorId !== userId) {
      let message = '';
      if (newStatus === 'in_progress') {
        message = `${user.username}님이 업무일지를 확인했습니다: ${diary.title}`;
      } else if (newStatus === 'completed') {
        message = `${user.username}님이 업무를 완료했습니다: ${diary.title}`;
      }

      if (message) {
        await this.createWorkNotification({
          userId: diary.authorId,
          diaryId: diary.id,
          type: 'status_change',
          message
        });
        console.log(`[상태 변경 알림] ${message}`);
      }
    }

    return true;
  }

  async createWorkDiary(insertDiary: InsertWorkDiary): Promise<WorkDiary> {
    const diary: WorkDiary = {
      id: this.currentWorkDiaryId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending', // 새 업무일지는 대기중 상태로 시작
      ...insertDiary,
    };
    this.workDiaries.push(diary);
    
    // 공개범위에 따른 자동 알림 생성
    await this.createNotificationsForWorkDiary(diary);
    
    return diary;
  }

  // 업무일지 공개범위별 알림 생성
  private async createNotificationsForWorkDiary(diary: WorkDiary): Promise<void> {
    const author = this.users.get(diary.authorId);
    if (!author) return;

    let targetUserIds: number[] = [];

    if (diary.visibility === 'private') {
      // Private: 지정된 담당자들만
      targetUserIds = diary.assignedTo || [];
    } else if (diary.visibility === 'department') {
      // Department: 같은 부서의 모든 사용자들
      const allUsers = Array.from(this.users.values());
      targetUserIds = allUsers
        .filter(user => user.department === author.department && user.id !== diary.authorId)
        .map(user => user.id);
    } else if (diary.visibility === 'public') {
      // Public: 모든 사용자들
      const allUsers = Array.from(this.users.values());
      targetUserIds = allUsers
        .filter(user => user.id !== diary.authorId)
        .map(user => user.id);
    }

    // 각 대상 사용자에게 알림 생성
    for (const userId of targetUserIds) {
      await this.createWorkNotification({
        userId,
        diaryId: diary.id,
        type: 'new_diary',
        message: `${author.username}님이 새로운 업무일지를 작성했습니다: ${diary.title}`
      });
    }

    console.log(`[업무일지 알림] ${diary.title} - ${targetUserIds.length}명에게 알림 생성 (공개범위: ${diary.visibility})`);
  }

  async updateWorkDiary(id: number, updates: Partial<WorkDiary>): Promise<WorkDiary | undefined> {
    const index = this.workDiaries.findIndex(diary => diary.id === id);
    if (index === -1) return undefined;
    
    this.workDiaries[index] = { 
      ...this.workDiaries[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.workDiaries[index];
  }

  async deleteWorkDiary(id: number): Promise<boolean> {
    const initialLength = this.workDiaries.length;
    this.workDiaries = this.workDiaries.filter(diary => diary.id !== id);
    // 관련 댓글도 삭제
    this.workDiaryComments = this.workDiaryComments.filter(comment => comment.diaryId !== id);
    return this.workDiaries.length < initialLength;
  }

  async getWorkDiaryComments(diaryId: number): Promise<WorkDiaryComment[]> {
    return this.workDiaryComments
      .filter(comment => comment.diaryId === diaryId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createWorkDiaryComment(insertComment: InsertWorkDiaryComment): Promise<WorkDiaryComment> {
    const comment: WorkDiaryComment = {
      id: this.currentCommentId++,
      createdAt: new Date(),
      ...insertComment,
    };
    this.workDiaryComments.push(comment);
    return comment;
  }

  async deleteWorkDiaryComment(id: number): Promise<boolean> {
    const initialLength = this.workDiaryComments.length;
    this.workDiaryComments = this.workDiaryComments.filter(comment => comment.id !== id);
    return this.workDiaryComments.length < initialLength;
  }

  async getWorkNotifications(userId: number): Promise<WorkNotification[]> {
    return this.workNotifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createWorkNotification(insertNotification: InsertWorkNotification): Promise<WorkNotification> {
    const notification: WorkNotification = {
      id: this.currentNotificationId++,
      read: false,
      createdAt: new Date(),
      ...insertNotification,
    };
    this.workNotifications.push(notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.workNotifications.find(n => n.id === id);
    if (!notification) return false;
    notification.read = true;
    return true;
  }

  // 데이터 초기화 기능
  async resetAllData(): Promise<boolean> {
    console.log('모든 데이터 초기화 시작...');
    
    // 모든 데이터 초기화
    this.inventoryItems.clear();
    this.transactions = [];
    this.bomGuides = [];
    this.exchangeQueue = [];
    this.workDiaries = [];
    this.workDiaryComments = [];
    this.workNotifications = [];
    
    // ID 카운터 초기화 (사용자와 레이아웃은 유지)
    this.currentItemId = 1;
    this.currentTransactionId = 1;
    this.currentBomId = 1;
    this.currentExchangeId = 1;
    this.currentWorkDiaryId = 1;
    this.currentCommentId = 1;
    this.currentNotificationId = 1;
    
    console.log('모든 데이터 초기화 완료');
    return true;
  }
}

export const storage = new MemStorage();
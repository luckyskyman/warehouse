import { useState, useMemo } from 'react';
import { Search, History, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInventory, useTransactions } from '@/hooks/use-inventory';
import { InventoryItem, Transaction } from '@/types/warehouse';

interface InventoryTableProps {
  onEditItem?: (item: InventoryItem) => void;
}

export function InventoryTable({ onEditItem }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { data: inventory = [] } = useInventory();
  const { data: allTransactions = [] } = useTransactions();

  // 선택된 아이템과 관련된 트랜잭션만 필터링
  const filteredTransactions = useMemo(() => {
    if (!selectedItem) return [];
    
    return allTransactions.filter(tx => {
      // 제품코드가 같고, 위치가 관련된 트랜잭션만 포함
      if (tx.itemCode !== selectedItem.code) return false;
      
      // 입고: toLocation이 선택된 아이템의 위치와 일치
      if (tx.type === 'inbound' && tx.toLocation === selectedItem.location) return true;
      
      // 출고: fromLocation이 선택된 아이템의 위치와 일치
      if (tx.type === 'outbound' && tx.fromLocation === selectedItem.location) return true;
      
      // 이동: fromLocation 또는 toLocation이 선택된 아이템의 위치와 일치
      if (tx.type === 'move' && (tx.fromLocation === selectedItem.location || tx.toLocation === selectedItem.location)) return true;
      
      // 조정: 위치 정보가 없는 경우 제품코드만으로 판단
      if (tx.type === 'adjustment') return true;
      
      return false;
    });
  }, [selectedItem, allTransactions]);

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(item => item.stock > 0) // 재고가 있는 제품만 표시
      .filter(item =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // 제품코드 순으로 정렬한 후 위치별로 정렬
        if (a.code !== b.code) {
          return a.code.localeCompare(b.code);
        }
        return (a.location || '').localeCompare(b.location || '');
      });
  }, [inventory, searchTerm]);

  // 제품코드별 총 재고량 계산
  const getTotalStockByCode = (code: string) => {
    return inventory
      .filter(item => item.code === code)
      .reduce((total, item) => total + item.stock, 0);
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.stock <= item.minStock) {
      return <span className="status-badge-out-of-stock">부족</span>;
    }
    return <span className="status-badge-in-stock">정상</span>;
  };

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        📦 재고 현황
      </h2>
      
      <div className="warehouse-search-container">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="제품코드, 품명, 카테고리, 제조사로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="warehouse-search-bar"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="warehouse-table">
          <thead>
            <tr>
              <th>제품코드</th>
              <th>품명</th>
              <th>카테고리</th>
              <th>제조사</th>
              <th>현재고</th>
              <th>총재고</th>
              <th>최소재고</th>
              <th>단위</th>
              <th>위치</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id}>
                <td className="font-mono font-medium">{item.code}</td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.manufacturer || '-'}</td>
                <td className="font-semibold">{item.stock.toLocaleString()}</td>
                <td className="font-semibold text-blue-600">{getTotalStockByCode(item.code).toLocaleString()}</td>
                <td>{item.minStock.toLocaleString()}</td>
                <td>{item.unit}</td>
                <td>{item.location || '-'}</td>
                <td>{getStatusBadge(item)}</td>
                <td>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>입출고 내역 - {selectedItem?.name || item.name}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {filteredTransactions.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">내역이 없습니다.</p>
                          ) : (
                            <div className="space-y-3">
                              {filteredTransactions.map((tx) => (
                                <div key={tx.id} className="border rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-semibold">
                                        {tx.type === 'inbound' ? '입고' : 
                                         tx.type === 'outbound' ? '출고' : 
                                         tx.type === 'move' ? '이동' : '조정'}
                                      </span>
                                      <span className="ml-2 text-gray-600">
                                        수량: {tx.quantity.toLocaleString()}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {new Date(tx.createdAt).toLocaleString('ko-KR')}
                                    </span>
                                  </div>
                                  
                                  {/* 위치 정보 표시 */}
                                  <div className="text-sm text-blue-600 mt-1">
                                    {tx.type === 'inbound' && tx.toLocation && (
                                      <span>→ {tx.toLocation} 입고</span>
                                    )}
                                    {tx.type === 'outbound' && tx.fromLocation && (
                                      <span>{tx.fromLocation} →</span>
                                    )}
                                    {tx.type === 'move' && (
                                      <span>{tx.fromLocation} → {tx.toLocation}</span>
                                    )}
                                  </div>
                                  
                                  {(tx.reason || tx.memo) && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {tx.reason || tx.memo}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {onEditItem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditItem(item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '재고 데이터가 없습니다.'}
        </div>
      )}
    </div>
  );
}

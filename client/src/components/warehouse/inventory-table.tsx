import { useState, useMemo } from 'react';
import { Search, History, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInventory, useTransactions } from '@/hooks/use-inventory';
import { InventoryItem } from '@/types/warehouse';

interface InventoryTableProps {
  onEditItem?: (item: InventoryItem) => void;
}

export function InventoryTable({ onEditItem }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState<string>('');
  const { data: inventory = [] } = useInventory();
  const { data: transactions = [] } = useTransactions(selectedItemCode);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

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
                          onClick={() => setSelectedItemCode(item.code)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>입출고 내역 - {item.name}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {transactions.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">내역이 없습니다.</p>
                          ) : (
                            <div className="space-y-3">
                              {transactions.map((tx) => (
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

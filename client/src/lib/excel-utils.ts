import * as XLSX from 'xlsx';
import { InventoryItem, Transaction, BomGuide } from '@/types/warehouse';

export const exportInventoryToExcel = (inventory: InventoryItem[]) => {
  const ws = XLSX.utils.json_to_sheet(
    inventory.map(item => ({
      '제품코드': item.code,
      '품명': item.name,
      '카테고리': item.category,
      '제조사': item.manufacturer || '',
      '현재고': item.stock,
      '최소재고': item.minStock,
      '단위': item.unit,
      '위치': item.location || '',
      '박스당수량': item.boxSize || 1,
    }))
  );
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "재고현황");
  XLSX.writeFile(wb, "재고현황.xlsx");
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const ws = XLSX.utils.json_to_sheet(
    transactions.map(tx => ({
      '일시': new Date(tx.createdAt).toLocaleString('ko-KR'),
      '유형': tx.type === 'inbound' ? '입고' : 
             tx.type === 'outbound' ? '출고' : 
             tx.type === 'move' ? '이동' : '조정',
      '제품코드': tx.itemCode,
      '품명': tx.itemName,
      '수량': tx.quantity,
      '출발지': tx.fromLocation || '',
      '목적지': tx.toLocation || '',
      '사유': tx.reason || '',
      '메모': tx.memo || '',
    }))
  );
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "입출고내역");
  XLSX.writeFile(wb, "입출고내역.xlsx");
};

export const exportBomToExcel = (bomGuides: BomGuide[]) => {
  const ws = XLSX.utils.json_to_sheet(
    bomGuides.map(bom => ({
      '설치가이드명': bom.guideName,
      '필요부품코드': bom.itemCode,
      '필요수량': bom.requiredQuantity,
    }))
  );
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BOM목록");
  XLSX.writeFile(wb, "BOM목록.xlsx");
};

export const exportBlankTemplate = () => {
  const ws = XLSX.utils.json_to_sheet([
    {
      '제품코드': 'SAMPLE-001',
      '품명': '샘플 제품',
      '카테고리': '전자제품',
      '제조사': '샘플회사',
      '수량': 10,
      '최소재고': 5,
      '단위': 'ea',
      '구역': 'A구역',
      '세부구역': 'A-1',
      '층수': '1층',
      '박스당수량': 1,
    }
  ]);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "입고템플릿");
  XLSX.writeFile(wb, "입고템플릿.xlsx");
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('Excel file read started for:', file.name);
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('Workbook sheets:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환 (빈 셀도 포함)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "",  // 빈 셀의 기본값
          raw: false   // 문자열로 변환
        });
        
        console.log('Parsed Excel data:', {
          rows: jsonData.length,
          columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
          sample: jsonData.slice(0, 2)
        });
        
        if (jsonData.length === 0) {
          throw new Error('엑셀 파일이 비어있거나 데이터가 없습니다.');
        }
        
        resolve(jsonData);
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      console.error('File reader error');
      reject(new Error('파일을 읽을 수 없습니다.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const backupAllData = (data: {
  inventory: InventoryItem[];
  transactions: Transaction[];
  bomGuides: BomGuide[];
  warehouseLayout: any[];
  exchangeQueue: any[];
}) => {
  const backup = {
    ...data,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `warehouse_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const parseBackupFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        resolve(backup);
      } catch (error) {
        reject(new Error('백업 파일이 올바르지 않습니다.'));
      }
    };
    
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsText(file);
  });
};

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
  XLSX.writeFile(wb, "재고현황(파일로전체동기화용).xlsx");
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
  XLSX.writeFile(wb, "입출고내역(분석전용).xlsx");
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
  XLSX.writeFile(wb, "BOM목록(분석전용).xlsx");
};

export const exportBlankTemplate = () => {
  // 재고 추가/보충용 템플릿 (샘플 데이터 포함)
  const addUpdateTemplate = [
    { '제품코드': '60011059', '품명': 'MK3 GRID, TRACK SUPPORT, 4W, X', '수량': 50, '위치': 'A구역-A-1-1층', '비고': '신규 입고' },
    { '제품코드': '60007658', '품명': 'MK3 GRID, TRACK SUPPORT, 2W, X', '수량': 100, '위치': 'A구역-A-1-2층', '비고': '재고 보충' },
    { '제품코드': '30011554', '품명': '볼트/너트/와셔 세트', '수량': 200, '위치': 'B구역-B-2-1층', '비고': '대량 입고' },
    { '제품코드': '60010149', '품명': 'TS 스프레더 플레이트, 구멍 1개', '수량': 75, '위치': 'C구역-C-1-1층', '비고': '추가 보충' },
    { '제품코드': '', '품명': '', '수량': '', '위치': '', '비고': '' },
    { '제품코드': '', '품명': '', '수량': '', '위치': '', '비고': '' },
    { '제품코드': '', '품명': '', '수량': '', '위치': '', '비고': '' }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(addUpdateTemplate);
  XLSX.utils.book_append_sheet(wb, ws, "재고추가보충템플릿");
  
  XLSX.writeFile(wb, "파일로재고추가보충_업로드템플릿.xlsx");
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

import * as XLSX from 'xlsx';
import { InventoryItem, Transaction, BomGuide } from '@/types/warehouse';

export const exportInventoryToExcel = (inventory: InventoryItem[]) => {
  // 실제 재고가 있는 아이템들만 필터링
  const stockedItems = inventory.filter(item => item.stock > 0);
  let dataToExport;
  
  if (stockedItems.length > 0) {
    dataToExport = stockedItems.map(item => ({
      '제품코드': item.code,
      '품명': item.name,
      '카테고리': item.category,
      '제조사': item.manufacturer || '',
      '현재고': item.stock,
      '최소재고': item.minStock,
      '단위': item.unit,
      '위치': item.location || '',
      '박스당수량': item.boxSize || 1,
    }));
  } else {
    // 샘플 데이터 (파일로전체동기화 템플릿용)
    dataToExport = [
      {
        '제품코드': '60011059',
        '품명': 'MK3 GRID, TRACK SUPPORT, 4W, X',
        '카테고리': '트랙서포트',
        '제조사': 'LOTTE',
        '현재고': 150,
        '최소재고': 20,
        '단위': 'ea',
        '위치': 'A구역-A-1-1층',
        '박스당수량': 75
      },
      {
        '제품코드': '60007658',
        '품명': 'MK3 GRID, TRACK SUPPORT, 2W, X',
        '카테고리': '트랙서포트',
        '제조사': 'LOTTE',
        '현재고': 200,
        '최소재고': 30,
        '단위': 'ea',
        '위치': 'A구역-A-1-2층',
        '박스당수량': 100
      },
      {
        '제품코드': '30011554',
        '품명': '볼트/너트/와셔 세트',
        '카테고리': '조립부품',
        '제조사': 'LOTTE',
        '현재고': 500,
        '최소재고': 50,
        '단위': 'ea',
        '위치': 'B구역-B-2-1층',
        '박스당수량': 50
      },
      {
        '제품코드': '60010149',
        '품명': 'TS 스프레더 플레이트, 구멍 1개',
        '카테고리': '플레이트',
        '제조사': 'LOTTE',
        '현재고': 80,
        '최소재고': 10,
        '단위': 'ea',
        '위치': 'C구역-C-1-1층',
        '박스당수량': 25
      },
      {
        '제품코드': '',
        '품명': '',
        '카테고리': '',
        '제조사': '',
        '현재고': '',
        '최소재고': '',
        '단위': '',
        '위치': '',
        '박스당수량': ''
      }
    ];
  }
  
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  
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

export const exportShortageItemsToExcel = (shortageItems: InventoryItem[]) => {
  const getUrgencyText = (item: InventoryItem) => {
    if (item.stock < 0) return '긴급';
    if (item.stock === 0) return '매우부족';
    if (item.stock < item.minStock * 0.5) return '부족';
    return '주의';
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  
  const dataToExport = shortageItems.map(item => {
    const shortageAmount = item.minStock - item.stock;
    const recommendedOrder = Math.max(shortageAmount, item.minStock);
    
    return {
      '긴급도': getUrgencyText(item),
      '제품코드': item.code,
      '제품명': item.name,
      '카테고리': item.category,
      '제조사': item.manufacturer || '',
      '현재고': item.stock,
      '최소재고': item.minStock,
      '부족량': shortageAmount,
      '위치': item.location || '미지정',
      '발주추천수량': recommendedOrder,
      '단위': item.unit,
      '박스당수량': item.boxSize || 1,
      '비고': item.stock < 0 ? '긴급발주필요' : item.stock === 0 ? '즉시발주' : '계획발주'
    };
  });

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  
  // 컬럼 너비 조정
  const colWidths = [
    { wch: 10 }, // 긴급도
    { wch: 15 }, // 제품코드
    { wch: 30 }, // 제품명
    { wch: 12 }, // 카테고리
    { wch: 10 }, // 제조사
    { wch: 10 }, // 현재고
    { wch: 10 }, // 최소재고
    { wch: 10 }, // 부족량
    { wch: 15 }, // 위치
    { wch: 12 }, // 발주추천수량
    { wch: 8 },  // 단위
    { wch: 12 }, // 박스당수량
    { wch: 12 }  // 비고
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "부족품목현황");
  XLSX.writeFile(wb, `부족품목_현황_${timestamp}.xlsx`);
};

export const exportBlankTemplate = () => {
  // 사용법 안내 시트
  const instructionTemplate = [
    { '시트명': '제품마스터', '필수항목': '제품코드', '선택항목': '품명, 카테고리, 제조사, 박스당수량, 단위, 최소재고', '주의사항': '제품코드는 반드시 입력해야 합니다' },
    { '시트명': '재고추가보충', '필수항목': '제품코드, 수량', '선택항목': '품명, 위치, 비고', '주의사항': '수량은 1 이상의 숫자여야 합니다' },
    { '시트명': 'BOM명세서', '필수항목': '필요부품코드, 필요수량', '선택항목': '설치가이드명', '주의사항': '병합된 셀 사용 가능, 설치가이드명은 첫 행에만 입력' },
    { '시트명': '재고전체동기화', '필수항목': '제품코드', '선택항목': '품명, 카테고리, 제조사, 현재고, 최소재고, 단위, 위치, 박스당수량', '주의사항': '기존 재고를 모두 삭제하고 새로 생성합니다' }
  ];

  // 재고 추가/보충용 템플릿 (일관된 컬럼 순서)
  const addUpdateTemplate = [
    { '제품코드': '60011059', '품명': 'MK3 GRID, TRACK SUPPORT, 4W, X', '수량': 50, '위치': 'A구역-A-1-1층', '비고': '신규 입고' },
    { '제품코드': '60007658', '품명': 'MK3 GRID, TRACK SUPPORT, 2W, X', '수량': 100, '위치': 'A구역-A-1-2층', '비고': '재고 보충' },
    { '제품코드': '30011554', '품명': '볼트/너트/와셔 세트', '수량': 200, '위치': 'B구역-B-2-1층', '비고': '대량 입고' },
    { '제품코드': '60010149', '품명': 'TS 스프레더 플레이트, 구멍 1개', '수량': 75, '위치': 'C구역-C-1-1층', '비고': '추가 보충' },
    { '제품코드': '', '품명': '', '수량': '', '위치': '', '비고': '' }
  ];

  // 제품 마스터용 템플릿 (일관된 컬럼 순서)
  const masterTemplate = [
    { '제품코드': '60011059', '품명': 'MK3 GRID, TRACK SUPPORT, 4W, X', '카테고리': '트랙서포트', '제조사': 'LOTTE', '박스당수량': 75, '단위': 'ea', '최소재고': 20 },
    { '제품코드': '60007658', '품명': 'MK3 GRID, TRACK SUPPORT, 2W, X', '카테고리': '트랙서포트', '제조사': 'LOTTE', '박스당수량': 100, '단위': 'ea', '최소재고': 30 },
    { '제품코드': '30011554', '품명': '볼트/너트/와셔 세트', '카테고리': '조립부품', '제조사': 'LOTTE', '박스당수량': 50, '단위': 'ea', '최소재고': 50 },
    { '제품코드': '', '품명': '', '카테고리': '', '제조사': '', '박스당수량': '', '단위': '', '최소재고': '' }
  ];

  // BOM 템플릿 (병합된 셀 사용법 예시)
  const bomTemplate = [
    { '설치가이드명': 'mk3-ts-2x-2y-s', '필요부품코드': '30011554', '필요수량': 8 },
    { '설치가이드명': '', '필요부품코드': '60010149', '필요수량': 4 },
    { '설치가이드명': '', '필요부품코드': '60010152', '필요수량': 4 },
    { '설치가이드명': 'mk3-ts-4x-3y-l', '필요부품코드': '30011554', '필요수량': 12 },
    { '설치가이드명': '', '필요부품코드': '60010149', '필요수량': 6 },
    { '설치가이드명': '', '필요부품코드': '', '필요수량': '' }
  ];

  // 재고 전체동기화용 템플릿
  const syncTemplate = [
    { '제품코드': '60011059', '품명': 'MK3 GRID, TRACK SUPPORT, 4W, X', '카테고리': '트랙서포트', '제조사': 'LOTTE', '현재고': 150, '최소재고': 20, '단위': 'ea', '위치': 'A구역-A-1-1층', '박스당수량': 75 },
    { '제품코드': '60007658', '품명': 'MK3 GRID, TRACK SUPPORT, 2W, X', '카테고리': '트랙서포트', '제조사': 'LOTTE', '현재고': 200, '최소재고': 30, '단위': 'ea', '위치': 'A구역-A-1-2층', '박스당수량': 100 },
    { '제품코드': '30011554', '품명': '볼트/너트/와셔 세트', '카테고리': '조립부품', '제조사': 'LOTTE', '현재고': 500, '최소재고': 50, '단위': 'ea', '위치': 'B구역-B-2-1층', '박스당수량': 50 },
    { '제품코드': '', '품명': '', '카테고리': '', '제조사': '', '현재고': '', '최소재고': '', '단위': '', '위치': '', '박스당수량': '' }
  ];

  const wb = XLSX.utils.book_new();
  
  // 여러 시트 생성 (일관된 순서)
  const ws0 = XLSX.utils.json_to_sheet(instructionTemplate);
  const ws1 = XLSX.utils.json_to_sheet(masterTemplate);
  const ws2 = XLSX.utils.json_to_sheet(addUpdateTemplate);
  const ws3 = XLSX.utils.json_to_sheet(bomTemplate);
  const ws4 = XLSX.utils.json_to_sheet(syncTemplate);
  
  XLSX.utils.book_append_sheet(wb, ws0, "📋사용법안내");
  XLSX.utils.book_append_sheet(wb, ws1, "제품마스터");
  XLSX.utils.book_append_sheet(wb, ws2, "재고추가보충");
  XLSX.utils.book_append_sheet(wb, ws3, "BOM명세서");
  XLSX.utils.book_append_sheet(wb, ws4, "재고전체동기화");
  
  XLSX.writeFile(wb, "창고관리_통합업로드템플릿_v2.0.xlsx");
};

// 데이터 검증 함수 - 강화된 검증과 상세한 오류 메시지
export const validateExcelData = (data: any[], type: 'master' | 'inventory' | 'bom'): { valid: any[], errors: string[] } => {
  const errors: string[] = [];
  const valid: any[] = [];
  const duplicateCheck = new Set<string>();

  data.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row number (starting from 2, accounting for header)
    
    // 완전히 빈 행 건너뛰기
    const hasAnyData = Object.values(row).some(value => 
      value !== null && value !== undefined && String(value).trim() !== ''
    );
    if (!hasAnyData) return;
    
    if (type === 'master') {
      const code = String(row['제품코드'] || '').trim();
      const name = String(row['품명'] || '').trim();
      const boxSize = Number(row['박스당수량'] || row['박스당수량(ea)'] || 1);
      
      // 필수 항목 검증
      if (!code) {
        errors.push(`${rowNumber}행: 제품코드가 누락되었습니다. (필수 항목)`);
        return;
      }
      
      // 중복 검증
      if (duplicateCheck.has(code)) {
        errors.push(`${rowNumber}행: 제품코드 '${code}'가 중복되었습니다.`);
        return;
      }
      duplicateCheck.add(code);
      
      // 박스당수량 검증
      if (isNaN(boxSize) || boxSize <= 0) {
        errors.push(`${rowNumber}행: 박스당수량은 1 이상의 숫자여야 합니다. (현재값: ${row['박스당수량'] || row['박스당수량(ea)'] || '없음'})`);
        return;
      }
      
      valid.push(row);
    }
    
    if (type === 'inventory') {
      const code = String(row['제품코드'] || '').trim();
      const quantity = Number(row['수량'] || 0);
      const location = String(row['위치'] || '').trim();
      
      // 필수 항목 검증
      if (!code) {
        errors.push(`${rowNumber}행: 제품코드가 누락되었습니다. (필수 항목)`);
        return;
      }
      
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`${rowNumber}행: 수량은 1 이상의 숫자여야 합니다. (현재값: ${row['수량'] || '없음'})`);
        return;
      }
      
      // 위치 형식 검증 (선택사항이지만 있으면 형식 확인)
      if (location && !location.includes('-')) {
        errors.push(`${rowNumber}행: 위치 형식이 올바르지 않습니다. (예: A구역-A-1-1층, 현재값: ${location})`);
        return;
      }
      
      valid.push(row);
    }
    
    if (type === 'bom') {
      const guideName = String(row['설치가이드명'] || '').trim();
      const itemCode = String(row['필요부품코드'] || '').trim();
      const quantity = Number(row['필요수량'] || 0);
      
      // 필수 항목 검증
      if (!itemCode) {
        errors.push(`${rowNumber}행: 필요부품코드가 누락되었습니다. (필수 항목)`);
        return;
      }
      
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`${rowNumber}행: 필요수량은 1 이상의 숫자여야 합니다. (현재값: ${row['필요수량'] || '없음'})`);
        return;
      }
      
      // 설치가이드명이 있는 행에서만 검증 (병합된 셀 고려)
      if (guideName && guideName.length < 2) {
        errors.push(`${rowNumber}행: 설치가이드명이 너무 짧습니다. (최소 2자 이상, 현재값: ${guideName})`);
        return;
      }
      
      valid.push(row);
    }
  });

  // 검증 결과 요약 메시지
  if (errors.length > 0) {
    errors.unshift(`총 ${errors.length}개의 오류가 발견되었습니다:`);
    errors.push(`\n수정 후 다시 업로드해주세요.`);
  }

  return { valid, errors };
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

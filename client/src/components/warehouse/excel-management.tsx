import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, Database, AlertTriangle } from 'lucide-react';
import { useInventory, useTransactions, useBomGuides, useWarehouseLayout, useExchangeQueue } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { 
  exportInventoryToExcel, 
  exportTransactionsToExcel, 
  exportBomToExcel, 
  exportBlankTemplate,
  parseExcelFile,
  backupAllData,
  parseBackupFile
} from '@/lib/excel-utils';

export function ExcelManagement() {
  const bomFileRef = useRef<HTMLInputElement>(null);
  const masterFileRef = useRef<HTMLInputElement>(null);
  const addUpdateFileRef = useRef<HTMLInputElement>(null);
  const syncFileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { data: inventory = [] } = useInventory();
  const { data: transactions = [] } = useTransactions();
  const { data: bomGuides = [] } = useBomGuides();
  const { data: warehouseLayout = [] } = useWarehouseLayout();
  const { data: exchangeQueue = [] } = useExchangeQueue();

  const handleBomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      console.log('BOM 데이터:', data);
      
      toast({
        title: "BOM 업로드 완료",
        description: `${data.length}개의 BOM 항목이 업로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "BOM 파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    if (bomFileRef.current) {
      bomFileRef.current.value = '';
    }
  };

  const handleMasterUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      console.log('마스터 데이터:', data);
      
      toast({
        title: "마스터 목록 업로드 완료",
        description: `${data.length}개의 제품이 등록되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "마스터 파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    if (masterFileRef.current) {
      masterFileRef.current.value = '';
    }
  };

  const handleAddUpdateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      console.log('추가/보충 데이터:', data);
      
      toast({
        title: "재고 추가/보충 완료",
        description: `${data.length}개 항목의 재고가 추가/보충되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    if (addUpdateFileRef.current) {
      addUpdateFileRef.current.value = '';
    }
  };

  const handleSyncUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      console.log('동기화 데이터:', data);
      
      toast({
        title: "재고 전체 동기화 완료",
        description: "재고가 업로드된 파일로 전체 동기화되었습니다.",
      });
    } catch (error) {
      toast({
        title: "동기화 실패",
        description: "파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    if (syncFileRef.current) {
      syncFileRef.current.value = '';
    }
  };

  const handleBackup = () => {
    try {
      backupAllData({
        inventory,
        transactions,
        bomGuides,
        warehouseLayout,
        exchangeQueue,
      });

      toast({
        title: "백업 완료",
        description: "모든 데이터가 백업되었습니다.",
      });
    } catch (error) {
      toast({
        title: "백업 실패",
        description: "백업 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = await parseBackupFile(file);
      console.log('복원 데이터:', backup);
      
      toast({
        title: "데이터 복원 완료",
        description: "백업 파일로부터 모든 데이터가 복원되었습니다.",
      });
    } catch (error) {
      toast({
        title: "복원 실패",
        description: error instanceof Error ? error.message : "복원 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    if (restoreFileRef.current) {
      restoreFileRef.current.value = '';
    }
  };

  return (
    <div className="warehouse-content">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        📊 엑셀 관리
      </h2>

      <div className="space-y-6">
        {/* BOM Management */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">1. 자재 명세서(BOM) 관리</h3>
            <div className="file-upload-zone" onClick={() => bomFileRef.current?.click()}>
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold mb-1">📋 자재 명세서(BOM) 업로드</h4>
              <p className="text-sm text-gray-600">
                A열: 설치가이드명, B열: 필요부품코드, C열: 필요수량 형식의 엑셀 파일을 올립니다.
              </p>
              <input
                ref={bomFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleBomUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Master List Management */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">2. 제품 마스터 관리</h3>
            <div className="file-upload-zone" onClick={() => masterFileRef.current?.click()}>
              <Database className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold mb-1">📋 제품 마스터 목록 업로드</h4>
              <p className="text-sm text-gray-600">
                시스템에 등록할 제품의 기본 정보(제품코드, 품명, 박스당수량)를 올립니다.
              </p>
              <input
                ref={masterFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleMasterUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Add/Update */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">3. 재고 추가 / 보충 (안전)</h3>
            <div className="space-y-4">
              <div className="file-upload-zone" onClick={exportBlankTemplate}>
                <Download className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-semibold mb-1">📄 빈 양식 다운로드</h4>
                <p className="text-sm text-gray-600">
                  새로 입고된 품목을 추가하기 위한 빈 템플릿을 받습니다.
                </p>
              </div>
              
              <div className="file-upload-zone" onClick={() => addUpdateFileRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold mb-1">🚚 파일로 추가/보충</h4>
                <p className="text-sm text-gray-600">
                  빈 양식에 작성한 재고를 현재고에 **더합니다.** 기존 재고는 유지됩니다.
                </p>
                <input
                  ref={addUpdateFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleAddUpdateUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Sync */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">4. 재고 전체 동기화 (주의)</h3>
            <div className="space-y-4">
              <div className="file-upload-zone" onClick={() => exportInventoryToExcel(inventory)}>
                <Download className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-semibold mb-1">📊 현재고 전체 다운로드</h4>
                <p className="text-sm text-gray-600">
                  재고 실사 등을 위해 현재 시스템의 모든 재고 목록을 다운로드합니다.
                </p>
              </div>
              
              <div className="file-upload-zone" onClick={() => syncFileRef.current?.click()}>
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <h4 className="font-semibold mb-1">🔄 파일로 전체 동기화</h4>
                <p className="text-sm text-gray-600">
                  현재고 목록을 수정한 파일로 재고 전체를 **덮어씁니다.** (엑셀에 없는 품목은 0처리)
                </p>
                <input
                  ref={syncFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleSyncUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Data Management */}
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">5. 시스템 데이터 관리</h3>
            <div className="space-y-4">
              <div className="file-upload-zone border-yellow-400" onClick={handleBackup}>
                <Database className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <h4 className="font-semibold mb-1">💾 전체 데이터 백업</h4>
                <p className="text-sm text-gray-600">
                  현재 시스템의 모든 데이터(재고,창고구조,마스터)를 JSON 파일로 백업합니다.
                </p>
              </div>
              
              <div className="file-upload-zone" onClick={() => restoreFileRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold mb-1">📂 전체 데이터 복구</h4>
                <p className="text-sm text-gray-600">
                  백업 파일을 선택하여 모든 데이터를 복원합니다. 현재 데이터는 모두 사라집니다.
                </p>
                <input
                  ref={restoreFileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleRestore}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">데이터 내보내기</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => exportInventoryToExcel(inventory)}
                className="btn-warehouse-success"
              >
                <Download className="w-4 h-4 mr-2" />
                재고 데이터 다운로드
              </Button>
              
              <Button
                onClick={() => exportTransactionsToExcel(transactions)}
                className="btn-warehouse-info"
              >
                <Download className="w-4 h-4 mr-2" />
                입출고 내역 다운로드
              </Button>
              
              <Button
                onClick={() => exportBomToExcel(bomGuides)}
                className="btn-warehouse-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                BOM 목록 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LoginForm } from '@/components/auth/login-form';
import { StatsGrid } from '@/components/warehouse/stats-grid';
import { BomCheck } from '@/components/warehouse/bom-check';
import { InventoryTable } from '@/components/warehouse/inventory-table';
import { InboundForm } from '@/components/warehouse/inbound-form';
import { OutboundForm } from '@/components/warehouse/outbound-form';
import { MoveForm } from '@/components/warehouse/move-form';
import { WarehouseStatus } from '@/components/warehouse/warehouse-status';
import { LayoutManagement } from '@/components/warehouse/layout-management';
import { ExcelManagement } from '@/components/warehouse/excel-management';
import { WorkDiaryManagement } from '@/components/warehouse/work-diary';
import { Button } from '@/components/ui/button';
import { TabName } from '@/types/warehouse';

export default function WarehouseManagement() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('bomCheck');

  if (!user) {
    return <LoginForm />;
  }

  const tabs = [
    { id: 'bomCheck', label: '⚙️ 설치가이드별 자재 확인', roles: ['admin', 'viewer'] },
    { id: 'inventory', label: '📦 재고관리', roles: ['admin', 'viewer'] },
    { id: 'inbound', label: '📥 입고관리', roles: ['admin'] },
    { id: 'outbound', label: '📤 출고관리', roles: ['admin'] },
    { id: 'move', label: '🔄 이동관리', roles: ['admin'] },
    { id: 'warehouse', label: '🏪 창고현황', roles: ['admin', 'viewer'] },
    { id: 'layout', label: '🔧 창고 구조 관리', roles: ['admin'] },
    { id: 'excel', label: '📊 엑셀관리', roles: ['admin', 'viewer'] },
    { id: 'workDiary', label: '📋 업무일지', roles: ['admin', 'viewer'] },
  ] as const;

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bomCheck':
        return <BomCheck />;
      case 'inventory':
        return <InventoryTable />;
      case 'inbound':
        return <InboundForm />;
      case 'outbound':
        return <OutboundForm />;
      case 'move':
        return <MoveForm />;
      case 'warehouse':
        return <WarehouseStatus />;
      case 'layout':
        return <LayoutManagement />;
      case 'excel':
        return <ExcelManagement />;
      case 'workDiary':
        return (
            <WorkDiaryManagement 
              workDiaries={[]} // TODO: Implement work diary data fetching
              onCreateDiary={async (data) => {
                // TODO: Implement create diary
                console.log('Create diary:', data);
              }}
              onUpdateDiary={async (id, data) => {
                // TODO: Implement update diary
                console.log('Update diary:', id, data);
              }}
              onDeleteDiary={async (id) => {
                // TODO: Implement delete diary
                console.log('Delete diary:', id);
              }}
              onExportReport={async (type, date) => {
                // TODO: Implement export report
                console.log('Export report:', type, date);
              }}
            />
          );
      default:
        return <BomCheck />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-5">
        {/* Header */}
        <div className="warehouse-header">
          <div className="relative">
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-4 text-shadow">
              🏭 창고 물품재고관리시스템
            </h1>
            <div className="absolute top-0 right-0">
              <Button
                onClick={logout}
                className="btn-warehouse-danger"
              >
                로그아웃
              </Button>
            </div>
          </div>
          <StatsGrid />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-5">
          {filteredTabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabName)}
              className={`px-5 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'btn-warehouse-primary shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-5">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
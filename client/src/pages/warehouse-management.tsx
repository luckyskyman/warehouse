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
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export default function WarehouseManagement() {
  const { user, logout, sessionId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('bomCheck');
  const { toast } = useToast();

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

  const { data: bomGuides = [] } = useQuery({
    queryKey: ['bomGuides'],
    queryFn: async () => {
      const response = await fetch('/api/bom', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.json();
    }
  });

  const { data: workDiaries = [], refetch: refetchWorkDiaries } = useQuery({
    queryKey: ['workDiaries'],
    queryFn: async () => {
      const response = await fetch('/api/work-diary', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.json();
    }
  });

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
            workDiaries={workDiaries}
            onCreateDiary={handleCreateWorkDiary}
            onUpdateDiary={handleUpdateWorkDiary}
            onDeleteDiary={handleDeleteWorkDiary}
            onExportReport={handleExportWorkDiaryReport}
          />
        );
      default:
        return <BomCheck />;
    }
  };

  const handleLayoutDeleteZone = async (id: number) => {
    try {
      const response = await fetch(`/api/warehouse/layout/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete zone');
      }

      refetchLayout();
      toast({ title: "구역이 삭제되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류가 발생했습니다.", 
        description: "구역 삭제에 실패했습니다.",
        variant: "destructive" 
      });
    }
  };

  // Work diary handlers
  const handleCreateWorkDiary = async (data: any) => {
    try {
      const response = await fetch('/api/work-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          ...data,
          authorId: user?.id || 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create work diary');
      }

      refetchWorkDiaries();
      toast({ title: "업무일지가 작성되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류가 발생했습니다.", 
        description: "업무일지 작성에 실패했습니다.",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateWorkDiary = async (id: number, data: any) => {
    try {
      const response = await fetch(`/api/work-diary/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update work diary');
      }

      refetchWorkDiaries();
      toast({ title: "업무일지가 수정되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류가 발생했습니다.", 
        description: "업무일지 수정에 실패했습니다.",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteWorkDiary = async (id: number) => {
    try {
      const response = await fetch(`/api/work-diary/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete work diary');
      }

      refetchWorkDiaries();
      toast({ title: "업무일지가 삭제되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류가 발생했습니다.", 
        description: "업무일지 삭제에 실패했습니다.",
        variant: "destructive" 
      });
    }
  };

  const handleExportWorkDiaryReport = async (type: 'daily' | 'monthly' | 'yearly', date: Date) => {
    try {
      // 보고서 생성 로직 (추후 구현)
      toast({ title: `${type === 'daily' ? '일별' : type === 'monthly' ? '월별' : '년별'} 보고서 생성 중...` });
    } catch (error) {
      toast({ 
        title: "오류가 발생했습니다.", 
        description: "보고서 생성에 실패했습니다.",
        variant: "destructive" 
      });
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
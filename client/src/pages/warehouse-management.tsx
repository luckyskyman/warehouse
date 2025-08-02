import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { LoginForm } from '@/components/auth/login-form';
import { StatsGrid } from '@/components/warehouse/stats-grid';
import { BomCheck } from '@/components/warehouse/bom-check';
import { InventoryTable } from '@/components/warehouse/inventory-table';
import { InboundForm } from '@/components/warehouse/inbound-form';
import { OutboundForm } from '@/components/warehouse/outbound-form';
import { MoveForm } from '@/components/warehouse/move-form';
import { WarehouseStatusEnhanced } from '@/components/warehouse/warehouse-status-enhanced';
import { LayoutManagement } from '@/components/warehouse/layout-management';
import { ExcelManagement } from '@/components/warehouse/excel-management';
import { WorkDiaryManagement } from '@/components/warehouse/work-diary';
import UserManagement from '@/pages/user-management';
import FileManagement from '@/pages/file-management';
import { Button } from '@/components/ui/button';
import { TabName } from '@/types/warehouse';
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';

// 사용자 드롭다운 컴포넌트
const UserDropdown = () => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/90 hover:bg-white border-gray-300 shadow-sm max-w-48"
        >
          <User className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{user.username}</span>
          {user.isManager && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
              부서장
            </span>
          )}
          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{user.username}</p>
            {user.isManager && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                부서장
              </span>
            )}
          </div>
          <div className="mt-1 space-y-1">
            {user.department && (
              <p className="text-xs text-gray-500">📍 {user.department}</p>
            )}
            {user.position && (
              <p className="text-xs text-gray-500">💼 {user.position}</p>
            )}
            <p className="text-xs text-gray-500">
              🔑 {user.role === 'admin' ? '관리자' : '일반사용자'}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function WarehouseManagement() {
  const { user, logout, sessionId } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<TabName>('bomCheck');
  const { toast } = useToast();

  const { data: bomGuides = [] } = useQuery({
    queryKey: ['bomGuides'],
    queryFn: async () => {
      const response = await fetch('/api/bom', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      return response.json();
    },
    enabled: !!user && !!sessionId
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
    },
    enabled: !!user && !!sessionId
  });



  if (!user) {
    return <LoginForm />;
  }





  const tabs = [
    { 
      id: 'bomCheck', 
      label: '⚙️ 설치가이드별 자재 확인', 
      permission: () => permissions.canManageBom || permissions.canViewReports 
    },
    { 
      id: 'inventory', 
      label: '📦 재고관리', 
      permission: () => permissions.canManageInventory 
    },
    { 
      id: 'inbound', 
      label: '📥 입고관리', 
      permission: () => permissions.canProcessTransactions 
    },
    { 
      id: 'outbound', 
      label: '📤 출고관리', 
      permission: () => permissions.canProcessTransactions 
    },
    { 
      id: 'move', 
      label: '🔄 이동관리', 
      permission: () => permissions.canManageLocation 
    },
    { 
      id: 'warehouse', 
      label: '🏪 창고현황', 
      permission: () => permissions.canManageInventory || permissions.canViewReports 
    },
    { 
      id: 'layout', 
      label: '🔧 창고 구조 관리', 
      permission: () => permissions.canManageWarehouse 
    },
    { 
      id: 'excel', 
      label: '📊 엑셀관리', 
      permission: () => permissions.canAccessExcelManagement 
    },
    { 
      id: 'workDiary', 
      label: '📋 업무일지', 
      permission: () => permissions.canCreateDiary || permissions.canEditDiary || permissions.canViewReports 
    },
    { 
      id: 'users', 
      label: '👥 사용자 관리', 
      permission: () => permissions.canManageUsers 
    },
    { 
      id: 'files', 
      label: '📁 파일 관리', 
      permission: () => permissions.canManageUsers 
    },
  ] as const;

  const filteredTabs = tabs.filter(tab => tab.permission());

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
        return <WarehouseStatusEnhanced />;
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
      case 'users':
        return permissions.canManageUsers ? <UserManagement /> : null;
      case 'files':
        return permissions.canManageUsers ? <FileManagement /> : null;
      default:
        return <BomCheck />;
    }
  };



  // Work diary handlers
  const handleCreateWorkDiary = async (data: any) => {
    try {
      const response = await fetch('/api/work-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
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
          'x-session-id': sessionId || ''
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
          'x-session-id': sessionId || ''
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
      toast({ title: `${type === 'daily' ? '일별' : type === 'monthly' ? '월별' : '년별'} 보고서 생성 중...` });
      
      // 날짜 범위 계산
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (type === 'daily') {
        // 일별: 선택된 날짜 하루
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (type === 'monthly') {
        // 월별: 선택된 날짜가 속한 월 전체
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
      } else if (type === 'yearly') {
        // 년별: 선택된 날짜가 속한 년 전체
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
      }
      
      // 해당 기간의 업무일지 필터링
      const filteredDiaries = workDiaries.filter(diary => {
        const diaryDate = new Date(diary.workDate);
        return diaryDate >= startDate && diaryDate <= endDate;
      });
      
      if (filteredDiaries.length === 0) {
        toast({ 
          title: "보고서 생성 완료", 
          description: "해당 기간에 업무일지가 없습니다.",
          variant: "destructive" 
        });
        return;
      }
      
      // 엑셀 파일 생성
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // 사용자 정보 가져오기 (작성자 정보를 위해)
      const usersResponse = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      const allUsers = await usersResponse.json();
      const userMap = allUsers.reduce((acc: any, user: any) => {
        acc[user.id] = user.username;
        return acc;
      }, {});

      // 보고서 데이터 준비
      const reportData = filteredDiaries.map(diary => ({
        '날짜': new Date(diary.workDate).toLocaleDateString('ko-KR'),
        '제목': diary.title,
        '카테고리': diary.category,
        '우선순위': diary.priority === 'low' ? '낮음' : 
                   diary.priority === 'normal' ? '보통' : 
                   diary.priority === 'high' ? '높음' : '긴급',
        '상태': diary.status === 'pending' ? '대기중' : 
                diary.status === 'in_progress' ? '진행중' : '완료',
        '작성자': userMap[diary.authorId] || '알 수 없음',
        '내용': diary.content,
        '태그': diary.tags ? diary.tags.join(', ') : '',
        '작성일': new Date(diary.createdAt).toLocaleDateString('ko-KR')
      }));
      
      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      
      // 열 너비 설정
      const columnWidths = [
        { wch: 12 }, // 날짜
        { wch: 30 }, // 제목
        { wch: 10 }, // 카테고리
        { wch: 10 }, // 우선순위
        { wch: 10 }, // 상태
        { wch: 12 }, // 작성자
        { wch: 50 }, // 내용
        { wch: 20 }, // 태그
        { wch: 12 }  // 작성일
      ];
      worksheet['!cols'] = columnWidths;
      
      // 워크북에 워크시트 추가
      const sheetName = `${type === 'daily' ? '일별' : type === 'monthly' ? '월별' : '년별'}_업무일지`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // 파일명 생성
      const dateStr = date.toISOString().split('T')[0];
      const fileName = `업무일지_${type === 'daily' ? '일별' : type === 'monthly' ? '월별' : '년별'}_${dateStr}.xlsx`;
      
      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);
      
      toast({ 
        title: "보고서 생성 완료", 
        description: `${filteredDiaries.length}개의 업무일지가 포함된 보고서가 다운로드되었습니다.`
      });
      
    } catch (error) {
      console.error('보고서 생성 오류:', error);
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
              🏭 창고 물품 재고 관리시스템
            </h1>
            <div className="absolute top-0 right-0 flex items-center gap-3">
              <NotificationBell />
              <UserDropdown />
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
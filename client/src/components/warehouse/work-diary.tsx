import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, FileText, PlusCircle, Download, User, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/ui/permission-guard';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { useCompleteWorkDiary } from '@/hooks/use-notifications';
import { queryClient } from '@/lib/queryClient';
import type { WorkDiary, WorkDiaryFormData } from '@/types/warehouse';

interface WorkDiaryProps {
  workDiaries: WorkDiary[];
  onCreateDiary: (data: WorkDiaryFormData) => void;
  onUpdateDiary: (id: number, data: Partial<WorkDiary>) => void;
  onDeleteDiary: (id: number) => void;
  onExportReport: (type: 'daily' | 'monthly' | 'yearly', date: Date) => void;
}

export function WorkDiaryManagement({ 
  workDiaries, 
  onCreateDiary, 
  onUpdateDiary, 
  onDeleteDiary,
  onExportReport 
}: WorkDiaryProps) {
  const { toast } = useToast();
  const { user, sessionId } = useAuth();
  const permissions = usePermissions();
  const completeWorkDiary = useCompleteWorkDiary();

  // 사용자 목록 가져오기
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      if (!response.ok) {
        // 권한이 없으면 현재 사용자만 반환
        return user ? [user] : [];
      }
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
    enabled: !!user && !!sessionId
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<WorkDiary | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [completedDiaries, setCompletedDiaries] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<WorkDiaryFormData>({
    title: '',
    content: '',
    category: '기타',
    priority: 'normal',
    status: 'completed',
    workDate: new Date(),
    tags: [],
    assignedTo: [],
    visibility: 'department'
  });

  const categories = ['입고', '출고', '재고조사', '설비점검', '청소', '안전점검', '기타'];
  const priorities = [
    { value: 'low', label: '낮음', color: 'bg-green-100 text-green-800' },
    { value: 'normal', label: '보통', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: '높음', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'urgent', label: '긴급', color: 'bg-red-100 text-red-800' }
  ];

  const statusOptions = [
    { value: 'pending', label: '대기중', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: '진행중', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: '완료', color: 'bg-green-100 text-green-800' }
  ];

  const filteredDiaries = workDiaries.filter(diary => {
    if (filterCategory !== 'all' && diary.category !== filterCategory) return false;
    
    const diaryDate = new Date(diary.workDate);
    const today = new Date();
    
    // 날짜 범위 필터링
    if (dateRange === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      const diaryDateStr = diaryDate.toISOString().split('T')[0];
      if (diaryDateStr !== todayStr) return false;
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      if (diaryDate < weekAgo) return false;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      if (diaryDate < monthAgo) return false;
    } else if (dateRange === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        if (diaryDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (diaryDate > end) return false;
      }
    }
    
    // 개별 날짜 필터링 (기존 기능 유지)
    if (filterDate) {
      const diaryDateStr = diaryDate.toISOString().split('T')[0];
      if (!diaryDateStr.startsWith(filterDate)) return false;
    }
    
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedDiary) {
        await onUpdateDiary(selectedDiary.id, formData);
        toast({ title: "업무일지가 수정되었습니다." });
        // 수정 후에는 폼을 닫습니다
        setIsFormOpen(false);
        setSelectedDiary(null);
      } else {
        await onCreateDiary(formData);
        toast({ title: "업무일지가 작성되었습니다." });
        // 새로 작성 시에는 폼을 열어둔 채로 내용만 초기화합니다
        setSelectedDiary(null);
      }

      // 폼 데이터 초기화
      setFormData({
        title: '',
        content: '',
        category: '기타',
        priority: 'normal',
        status: 'completed',
        workDate: new Date(),
        tags: [],
        assignedTo: [],
        visibility: 'department'
      });
    } catch (error) {
      toast({ 
        title: "오류가 발생했습니다.", 
        description: "업무일지 저장에 실패했습니다.",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (diary: WorkDiary) => {
    setSelectedDiary(diary);
    setFormData({
      title: diary.title,
      content: diary.content,
      category: diary.category,
      priority: diary.priority,
      status: diary.status,
      workDate: new Date(diary.workDate),
      tags: diary.tags || [],
      assignedTo: diary.assignedTo || [],
      visibility: diary.visibility || 'department'
    });
    setIsFormOpen(true);
  };

  const handleCompleteWork = async (diaryId: number) => {
    console.log('완료 버튼 클릭 - diaryId:', diaryId);
    
    // 즉시 UI 업데이트
    setCompletedDiaries(prev => new Set(prev).add(diaryId));
    
    try {
      await completeWorkDiary.mutateAsync(diaryId);
      toast({
        title: "업무 완료 처리",
        description: "업무가 완료 처리되었습니다."
      });
    } catch (error) {
      console.error('업무 완료 처리 오류:', error);
      // 오류 시 롤백
      setCompletedDiaries(prev => {
        const newSet = new Set(prev);
        newSet.delete(diaryId);
        return newSet;
      });
      toast({
        title: "오류가 발생했습니다.",
        description: "업무 완료 처리에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const getPriorityStyle = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusStyle = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📋 업무일지</h2>
          <p className="text-gray-600">일별 업무 내용 및 특이사항을 기록합니다.</p>
        </div>

        <div className="flex gap-2">
          {/* 보고서 다운로드 */}
          <PermissionGuard permission="canViewReports">
            <Select onValueChange={(type) => {
              const today = new Date();
              onExportReport(type as 'daily' | 'monthly' | 'yearly', today);
            }}>
              <SelectTrigger className="w-40">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="보고서 출력" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">일별 보고서</SelectItem>
                <SelectItem value="monthly">월별 보고서</SelectItem>
                <SelectItem value="yearly">년별 보고서</SelectItem>
              </SelectContent>
            </Select>
          </PermissionGuard>

          <PermissionGuard permission="canCreateDiary">
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              업무일지 작성
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>날짜 범위</Label>
                <Select value={dateRange} onValueChange={(value) => {
                  setDateRange(value as any);
                  if (value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                  if (value !== 'all') {
                    setFilterDate('');
                  }
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="today">오늘</SelectItem>
                    <SelectItem value="week">최근 7일</SelectItem>
                    <SelectItem value="month">최근 30일</SelectItem>
                    <SelectItem value="custom">사용자 정의</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>시작 날짜</Label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>종료 날짜</Label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </>
              )}

              {dateRange === 'all' && (
                <div className="space-y-2">
                  <Label>특정 날짜</Label>
                  <Input 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-40"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterCategory('all');
                  setFilterDate('');
                  setDateRange('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                필터 초기화
              </Button>
            </div>
            
            {/* 빠른 날짜 선택 버튼 */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={dateRange === 'today' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setDateRange('today');
                  setFilterDate('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                오늘
              </Button>
              <Button 
                variant={dateRange === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setDateRange('week');
                  setFilterDate('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                이번 주
              </Button>
              <Button 
                variant={dateRange === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setDateRange('month');
                  setFilterDate('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                이번 달
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = yesterday.toISOString().split('T')[0];
                  setFilterDate(yesterdayStr);
                  setDateRange('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                어제
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 필터 결과 표시 */}
      {(dateRange !== 'all' || filterCategory !== 'all' || filterDate) && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <span className="font-medium">필터 적용됨:</span>
            {filterCategory !== 'all' && (
              <Badge variant="outline">카테고리: {filterCategory}</Badge>
            )}
            {dateRange === 'today' && (
              <Badge variant="outline">오늘</Badge>
            )}
            {dateRange === 'week' && (
              <Badge variant="outline">최근 7일</Badge>
            )}
            {dateRange === 'month' && (
              <Badge variant="outline">최근 30일</Badge>
            )}
            {dateRange === 'custom' && (startDate || endDate) && (
              <Badge variant="outline">
                {startDate && endDate 
                  ? `${startDate} ~ ${endDate}`
                  : startDate 
                    ? `${startDate} 이후`
                    : `${endDate} 이전`
                }
              </Badge>
            )}
            {filterDate && (
              <Badge variant="outline">날짜: {filterDate}</Badge>
            )}
            <span className="ml-2 text-blue-600">
              {filteredDiaries.length}개 결과 표시
            </span>
          </div>
        </div>
      )}

      {/* Work Diary Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedDiary ? '업무일지 수정' : '업무일지 작성'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="업무 제목을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workDate">업무 날짜</Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={formData.workDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, workDate: new Date(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">우선순위</Label>
                  <Select value={formData.priority || 'normal'} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">상태</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">업무 내용</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="업무 내용, 특이사항, 문제점 등을 상세히 기록하세요"
                  className="min-h-32"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">담당자 지정</Label>
                  <Select value={formData.assignedTo.length > 0 ? formData.assignedTo[0].toString() : "none"} onValueChange={(value) => {
                    const userId = value !== "none" ? [parseInt(value)] : [];
                    setFormData({ ...formData, assignedTo: userId });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="담당자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">담당자 없음</SelectItem>
                      {Array.isArray(users) && users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} ({user.role === 'admin' ? '관리자' : '일반사용자'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                  <Input
                    id="tags"
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                      setFormData({ ...formData, tags });
                    }}
                    placeholder="예: 긴급, 점검필요, 안전"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">공개 범위</Label>
                  <Select value={formData.visibility || 'department'} onValueChange={(value) => {
                    setFormData({ ...formData, visibility: value as any });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="공개 범위를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">개인용 (본인 + 담당자만 조회)</SelectItem>
                      <SelectItem value="department">부서용 (같은 부서만 조회)</SelectItem>
                      <SelectItem value="public">전체 공개 (모든 사용자 조회)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsFormOpen(false);
                    setSelectedDiary(null);
                  }}
                >
                  취소
                </Button>
                <Button type="submit">
                  {selectedDiary ? '수정' : '작성'} 완료
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Work Diary List */}
      <div className="space-y-4">
        {filteredDiaries.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">작성된 업무일지가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          filteredDiaries.map((diary) => (
            <Card key={diary.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{diary.title}</h3>
                      <Badge variant="outline">{diary.category}</Badge>
                      <Badge className={getPriorityStyle(diary.priority)}>
                        {priorities.find(p => p.value === diary.priority)?.label}
                      </Badge>
                      <Badge className={getStatusStyle(completedDiaries.has(diary.id) ? 'completed' : diary.status)}>
                        {statusOptions.find(s => s.value === (completedDiaries.has(diary.id) ? 'completed' : diary.status))?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(diary.workDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        작성자: {users.find((u: any) => u.id === diary.authorId)?.username || '알 수 없음'}
                      </div>
                      {diary.assignedTo && diary.assignedTo.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          담당자: {diary.assignedTo.map((id: number) => 
                            users.find((u: any) => u.id === id)?.username || `ID:${id}`
                          ).join(', ')}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(diary.createdAt)}
                      </div>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap">{diary.content}</p>

                    {diary.tags && diary.tags.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {diary.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {/* 완료 처리 버튼 - 담당자에게만 표시 */}
                    {diary.assignedTo?.includes(user?.id || 0) && (
                      <>
                        {diary.status !== 'completed' && !completedDiaries.has(diary.id) ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleCompleteWork(diary.id)}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all duration-200"
                            disabled={completeWorkDiary.isPending}
                          >
                            {completeWorkDiary.isPending ? (
                              <>
                                <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                처리중...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                완료
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled
                            className="text-green-600 border-green-600 bg-green-50 transition-all duration-200"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                            완료됨
                          </Button>
                        )}
                      </>
                    )}

                    {permissions.canEditDiaryItem(diary.authorId) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(diary)}
                      >
                        수정
                      </Button>
                    )}

                    {permissions.canDeleteDiaryItem(diary.authorId) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (confirm('이 업무일지를 삭제하시겠습니까?')) {
                            onDeleteDiary(diary.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
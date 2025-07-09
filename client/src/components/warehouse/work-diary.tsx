import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, FileText, PlusCircle, Download, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/ui/permission-guard';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<WorkDiary | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [formData, setFormData] = useState<WorkDiaryFormData>({
    title: '',
    content: '',
    category: '기타',
    priority: 'normal',
    status: 'completed',
    workDate: new Date(),
    tags: [],
    assignedTo: []
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
    if (filterDate && !diary.workDate.toISOString().startsWith(filterDate)) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedDiary) {
        await onUpdateDiary(selectedDiary.id, formData);
        toast({ title: "업무일지가 수정되었습니다." });
      } else {
        await onCreateDiary(formData);
        toast({ title: "업무일지가 작성되었습니다." });
      }

      setIsFormOpen(false);
      setSelectedDiary(null);
      setFormData({
        title: '',
        content: '',
        category: '기타',
        priority: 'normal',
        status: 'completed',
        workDate: new Date(),
        tags: [],
        assignedTo: []
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
      assignedTo: diary.assignedTo || []
    });
    setIsFormOpen(true);
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
          <div className="flex gap-4 items-end">
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
              <Label>날짜</Label>
              <Input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-40"
              />
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilterCategory('all');
                setFilterDate('');
              }}
            >
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <Select value={formData.assignedTo[0] !== undefined ? formData.assignedTo[0] : 0} onValueChange={(value) => {
                    const userId = value !== undefined && value !== 0 ? [parseInt(value as string)] : [];
                    setFormData({ ...formData, assignedTo: userId });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="담당자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={0}>담당자 없음</SelectItem>
                      <SelectItem value={1}>관리자 (admin)</SelectItem>
                      <SelectItem value={2}>조회자 (viewer)</SelectItem>
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
                      <Badge className={getStatusStyle(diary.status)}>
                        {statusOptions.find(s => s.value === diary.status)?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(diary.workDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        작성자 ID: {diary.authorId}
                      </div>
                      {diary.assignedTo && diary.assignedTo.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          담당자 ID: {diary.assignedTo.join(', ')}
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
                    <PermissionGuard permission="canEditDiary">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(diary)}
                      >
                        수정
                      </Button>
                    </PermissionGuard>

                    <PermissionGuard permission="canDeleteDiary">
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
                    </PermissionGuard>
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
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Trash2, Download, Eye, Calendar, HardDrive, Image, Zap, Search, RefreshCw, Archive, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  category: 'evidence' | 'temp' | 'bom' | 'master' | 'sync' | 'backup';
  uploadDate: string;
  url: string;
}

const FileManagement = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [autoCleanupSettings, setAutoCleanupSettings] = useState({
    maxAgeInDays: 30,
    maxSizeInMB: 100,
    dryRun: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sessionId } = useAuth();

  // 파일 목록 조회
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['/api/files'],
    queryFn: async () => {
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('파일 목록을 불러올 수 없습니다.');
      return response.json();
    }
  });

  // 파일 삭제 뮤테이션
  const deleteFilesMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        body: JSON.stringify({ fileIds })
      });
      if (!response.ok) throw new Error('파일 삭제에 실패했습니다.');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      setSelectedFiles([]);
      toast({
        title: "삭제 완료",
        description: `${data.deletedCount}개 파일이 삭제되었습니다.`,
      });
    },
    onError: (error) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 자동 정리 뮤테이션
  const autoCleanupMutation = useMutation({
    mutationFn: async (options: any) => {
      const response = await fetch('/api/files/auto-cleanup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId || ''
        },
        body: JSON.stringify(options)
      });
      if (!response.ok) throw new Error('자동 정리에 실패했습니다.');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: data.dryRun ? "자동 정리 미리보기 완료" : "자동 정리 완료",
        description: `${data.deletedFiles.length}개 파일, ${formatFileSize(data.savedSpace)} 절약`,
      });
    },
    onError: (error) => {
      toast({
        title: "자동 정리 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 파일 시스템 상태 조회
  const { data: fileSystemStatus } = useQuery({
    queryKey: ['/api/files/status'],
    queryFn: async () => {
      const response = await fetch('/api/files/status', {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      if (!response.ok) throw new Error('파일 시스템 상태 조회 실패');
      return response.json();
    },
    enabled: !!sessionId
  });

  // 중복 파일 조회
  const { data: duplicateFiles } = useQuery({
    queryKey: ['/api/files/duplicates'],
    queryFn: async () => {
      const response = await fetch('/api/files/duplicates', {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      if (!response.ok) throw new Error('중복 파일 검색 실패');
      return response.json();
    },
    enabled: !!sessionId
  });

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  // 파일 카테고리별 필터링
  const getFilesByCategory = (category: string) => {
    return files.filter((file: FileItem) => file.category === category);
  };

  // 파일 선택/해제
  const toggleFileSelection = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId]);
    } else {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    }
  };

  // 스마트 선택 - 30일 이상 된 파일
  const selectOldFiles = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldFiles = getFilesByCategory('evidence')
      .filter(file => new Date(file.uploadDate) < thirtyDaysAgo)
      .map(file => file.id);
      
    setSelectedFiles(oldFiles);
    
    toast({
      title: `${oldFiles.length}개 파일 선택됨`,
      description: "30일 이전 업로드된 파일들입니다.",
    });
  };

  // 스마트 선택 - 1MB 이상 파일
  const selectLargeFiles = () => {
    const largeFiles = getFilesByCategory('evidence')
      .filter(file => file.size > 1024 * 1024)
      .map(file => file.id);
      
    setSelectedFiles(largeFiles);
    
    toast({
      title: `${largeFiles.length}개 대용량 파일 선택됨`,
      description: "1MB 이상 파일들입니다.",
    });
  };

  // 파일 다운로드
  const downloadFile = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 선택된 파일 삭제
  const handleDeleteSelected = () => {
    if (selectedFiles.length === 0) return;
    setDeleteDialogOpen(true);
  };

  // 삭제 확인
  const confirmDelete = () => {
    deleteFilesMutation.mutate(selectedFiles);
    setDeleteDialogOpen(false);
  };

  // 자동 정리 실행
  const handleAutoCleanup = () => {
    autoCleanupMutation.mutate({
      ...autoCleanupSettings,
      categories: ['evidence', 'temp']
    });
  };

  const categories = {
    overview: { label: '시스템 개요', description: '파일 시스템 전체 상태를 확인합니다.' },
    evidence: { label: '증거자료 (수동 관리)', description: '직접 선택해서 삭제할 수 있습니다.' },
    automation: { label: '자동화 관리', description: '자동 정리 및 중복 파일 관리를 설정합니다.' },
    temp: { label: '임시 파일', description: '1일 후 자동 삭제됩니다.' },
    bom: { label: 'BOM 파일', description: '최신 1개만 유지됩니다.' },
    master: { label: '제품마스터', description: '최신 1개만 유지됩니다.' },
    sync: { label: '재고동기화', description: '최근 3개 버전을 유지합니다.' },
    backup: { label: '백업 파일', description: '90일 후 자동 삭제됩니다.' }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">파일 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">파일 관리 센터</h1>
        <p className="text-muted-foreground">
          프로젝트 파일들을 카테고리별로 관리하고 불필요한 파일들을 정리할 수 있습니다.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          {Object.entries(categories).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="text-sm">
              {category.label.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(categories).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  {category.label}
                </CardTitle>
                <CardDescription>
                  {category.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {categoryKey === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">전체 파일</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{fileSystemStatus?.totalFiles || 0}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">전체 용량</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatFileSize(fileSystemStatus?.totalSize || 0)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">중복 파일</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{duplicateFiles?.duplicates?.length || 0}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">절약 가능</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatFileSize(duplicateFiles?.totalSize || 0)}</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>카테고리별 분포</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {fileSystemStatus?.categoryBreakdown && Object.entries(fileSystemStatus.categoryBreakdown).map(([category, data]: [string, any]) => (
                            <div key={category} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">{category}</Badge>
                                <span className="text-sm text-muted-foreground">{data.count}개 파일</span>
                              </div>
                              <div className="text-sm font-medium">{formatFileSize(data.size)}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {categoryKey === 'automation' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          자동 정리 설정
                        </CardTitle>
                        <CardDescription>
                          파일을 자동으로 정리하는 조건을 설정합니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="maxAge">최대 보관 기간 (일)</Label>
                            <Input
                              id="maxAge"
                              type="number"
                              value={autoCleanupSettings.maxAgeInDays}
                              onChange={(e) => setAutoCleanupSettings({
                                ...autoCleanupSettings,
                                maxAgeInDays: parseInt(e.target.value) || 30
                              })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="maxSize">최대 파일 크기 (MB)</Label>
                            <Input
                              id="maxSize"
                              type="number"
                              value={autoCleanupSettings.maxSizeInMB}
                              onChange={(e) => setAutoCleanupSettings({
                                ...autoCleanupSettings,
                                maxSizeInMB: parseInt(e.target.value) || 100
                              })}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="dryRun"
                              checked={autoCleanupSettings.dryRun}
                              onCheckedChange={(checked) => setAutoCleanupSettings({
                                ...autoCleanupSettings,
                                dryRun: !!checked
                              })}
                            />
                            <Label htmlFor="dryRun">미리보기 모드 (실제 삭제하지 않음)</Label>
                          </div>
                        </div>

                        <Button 
                          onClick={handleAutoCleanup}
                          disabled={autoCleanupMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {autoCleanupSettings.dryRun ? '미리보기 실행' : '자동 정리 실행'}
                        </Button>
                      </CardContent>
                    </Card>

                    {duplicateFiles?.duplicates && duplicateFiles.duplicates.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            중복 파일 감지
                          </CardTitle>
                          <CardDescription>
                            {duplicateFiles.duplicates.length}개의 중복 가능 파일이 발견되었습니다. 
                            {formatFileSize(duplicateFiles.totalSize)} 절약 가능
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {duplicateFiles.duplicates.slice(0, 10).map((file: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm truncate">{file.name}</span>
                                <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                              </div>
                            ))}
                            {duplicateFiles.duplicates.length > 10 && (
                              <div className="text-sm text-muted-foreground text-center">
                                ... 및 {duplicateFiles.duplicates.length - 10}개 추가 파일
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {categoryKey === 'evidence' && (
                  <div className="flex gap-4 mb-4">
                    <Button 
                      variant="outline" 
                      onClick={selectOldFiles}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      30일 이전 파일 선택
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={selectLargeFiles}
                      className="flex items-center gap-2"
                    >
                      <HardDrive className="h-4 w-4" />
                      대용량 파일 선택 (1MB+)
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      disabled={selectedFiles.length === 0 || deleteFilesMutation.isPending}
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      선택된 파일 삭제 ({selectedFiles.length})
                    </Button>
                  </div>
                )}

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {categoryKey === 'evidence' && <TableHead className="w-12">선택</TableHead>}
                        <TableHead>파일명</TableHead>
                        <TableHead>크기</TableHead>
                        <TableHead>업로드 날짜</TableHead>
                        <TableHead>미리보기</TableHead>
                        <TableHead>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {getFilesByCategory(categoryKey).map((file: FileItem) => (
                        <TableRow key={file.id}>
                          {categoryKey === 'evidence' && (
                            <TableCell>
                              <Checkbox 
                                checked={selectedFiles.includes(file.id)}
                                onCheckedChange={(checked) => toggleFileSelection(file.id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                          
                          <TableCell className="font-medium">
                            {file.originalName}
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {file.type.split('/')[1]?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          
                          <TableCell>{formatDate(file.uploadDate)}</TableCell>
                          
                          <TableCell>
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={file.url} 
                                alt={file.originalName}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                <Image className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadFile(file)}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                다운로드
                              </Button>
                              
                              {categoryKey === 'evidence' && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFiles([file.id]);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  삭제
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {getFilesByCategory(categoryKey).length === 0 && (
                        <TableRow>
                          <TableCell 
                            colSpan={categoryKey === 'evidence' ? 6 : 5} 
                            className="text-center py-8 text-muted-foreground"
                          >
                            이 카테고리에는 파일이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파일 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              선택된 {selectedFiles.length}개 파일을 삭제하시겠습니까?
              <br />
              삭제된 파일은 30일간 휴지통에 보관되며, 이후 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileManagement;
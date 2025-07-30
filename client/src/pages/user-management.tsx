import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Plus, Edit, Trash2, Shield, Settings, Info, RotateCcw } from 'lucide-react';
import type { User as UserType } from "@/types/warehouse";
import { ROLE_PERMISSIONS, PERMISSION_CATEGORIES } from "@shared/permissions";

// 역할별 표시 이름과 색상
const ROLE_CONFIG = {
  super_admin: { label: '최고관리자', color: 'bg-red-100 text-red-800 border-red-200' },
  admin: { label: '일반관리자', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  manager: { label: '부서관리자', color: 'bg-green-100 text-green-800 border-green-200' },
  user: { label: '일반사용자', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  viewer: { label: '조회전용', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

// 권한 매트릭스 컴포넌트
function PermissionMatrix() {
  const roles = Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>;
  const categories = Object.entries(PERMISSION_CATEGORIES);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          역할별 권한 매트릭스
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {categories.map(([categoryKey, category]) => (
            <div key={categoryKey} className="mb-6">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                {category.icon && <category.icon className="h-4 w-4" />}
                {category.title}
              </h4>
              <div className="grid grid-cols-6 gap-2 text-xs">
                <div className="font-medium">권한</div>
                {roles.map(role => (
                  <div key={role} className="font-medium text-center">
                    {ROLE_CONFIG[role].label}
                  </div>
                ))}
                
                {category.permissions.map(permission => (
                  <React.Fragment key={permission.key}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-left flex items-center gap-1">
                            {permission.label}
                            <Info className="h-3 w-3 text-gray-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{permission.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {roles.map(role => (
                      <div key={`${role}-${permission.key}`} className="text-center">
                        {ROLE_PERMISSIONS[role]?.[permission.key as keyof typeof ROLE_PERMISSIONS[typeof role]] ? (
                          <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                        ) : (
                          <span className="text-gray-300">✗</span>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// 권한 설정 컴포넌트
interface PermissionSettingsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onPermissionChange: (permission: string, value: boolean) => void;
  onResetPermissions: () => void;
}

function PermissionSettings({ formData, setFormData, onPermissionChange, onResetPermissions }: PermissionSettingsProps) {
  const categories = Object.entries(PERMISSION_CATEGORIES);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">세부 권한 설정</h4>
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={onResetPermissions}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          기본 권한으로 초기화
        </Button>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="space-y-6 pr-4">
          {categories.map(([categoryKey, category]) => {
            const permissions = category.permissions.map(perm => {
              const roleDefaults = ROLE_PERMISSIONS[formData.role as keyof typeof ROLE_PERMISSIONS] || {};
              const defaultValue = Boolean(roleDefaults[perm.key as keyof typeof roleDefaults]);
              const currentValue = Boolean(formData[perm.key as keyof typeof formData]);
              
              return {
                permission: perm.key,
                label: perm.label,
                description: perm.description,
                value: currentValue,
                defaultValue: defaultValue,
                isModified: currentValue !== defaultValue,
              };
            });
            
            const hasChanges = permissions.some(p => p.isModified);
            
            return (
              <Card key={categoryKey} className={hasChanges ? 'border-blue-200 bg-blue-50/30' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* TODO: Add proper icon component */}
                      {category.title}
                      {hasChanges && (
                        <Badge variant="outline" className="text-xs">
                          수정됨
                        </Badge>
                      )}
                    </div>
                    {hasChanges && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const roleDefaults = ROLE_PERMISSIONS[formData.role as keyof typeof ROLE_PERMISSIONS] || {};
                          const updates: any = {};
                          category.permissions.forEach(perm => {
                            updates[perm.key] = Boolean(roleDefaults[perm.key as keyof typeof roleDefaults]);
                          });
                          setFormData((prev: any) => ({ ...prev, ...updates }));
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {permissions.map(({ permission, label, description, value, isModified }) => (
                      <div key={permission} className="flex items-center justify-between space-x-3">
                        <div className="flex-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex items-center gap-2 ${isModified ? 'text-blue-700 font-medium' : ''}`}>
                                  <span className="text-sm">{label}</span>
                                  {isModified && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      변경
                                    </Badge>
                                  )}
                                  <Info className="h-3 w-3 text-gray-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => onPermissionChange(permission, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// 사용자 관리 훅들
function useUsers() {
  return useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const sessionId = localStorage.getItem('warehouse_session');
      const response = await fetch('/api/users', {
        headers: {
          'x-session-id': sessionId || ''
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다');
        }
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });
}

function useCreateUser() {
  return useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
}

function useUpdateUser() {
  return useMutation({
    mutationFn: async (userData: any) => {
      console.log('API 요청 데이터:', userData);
      return apiRequest('PUT', `/api/users/${userData.id}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
}

function useDeleteUser() {
  return useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
}

export default function UserManagement() {
  const { user } = useAuth();
  const { data: users = [], isLoading, error } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">사용자 관리 기능을 사용하려면 먼저 로그인해 주세요.</p>
            <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700">
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);

  // 폼 데이터 타입 정의
  interface FormData {
    username: string;
    password: string;
    name: string;
    department: string;
    position: string;
    role: keyof typeof ROLE_PERMISSIONS;
    isManager: boolean;
    [key: string]: any; // 동적 권한 필드들
  }

  // 사용자 생성 폼 데이터
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    name: '',
    department: '',
    position: '',
    role: 'user',
    isManager: false,
    // 권한 필드들은 기본값으로 설정됨
    ...Object.fromEntries(
      Object.values(PERMISSION_CATEGORIES).flatMap((category: any) => 
        category.permissions.map((perm: any) => [perm.key, false])
      )
    )
  });

  // 권한 변경 핸들러
  const handlePermissionChange = (permission: string, value: boolean) => {
    console.log(`권한 변경 핸들러: ${permission} = ${value}`);
    setFormData(prev => {
      const updated = { ...prev, [permission]: value };
      console.log('업데이트된 formData:', updated);
      return updated;
    });
  };

  // 기본 권한으로 초기화
  const resetPermissions = () => {
    const roleDefaults = ROLE_PERMISSIONS[formData.role] || {};
    const booleanDefaults = Object.fromEntries(
      Object.entries(roleDefaults).map(([key, value]) => [key, Boolean(value)])
    );
    setFormData(prev => ({ ...prev, ...booleanDefaults }));
  };

  // 역할 변경 시 기본 권한 적용
  const handleRoleChange = (role: string) => {
    const newFormData = { ...formData, role: role as keyof typeof ROLE_PERMISSIONS };
    const roleDefaults = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || {};
    const booleanDefaults = Object.fromEntries(
      Object.entries(roleDefaults).map(([key, value]) => [key, Boolean(value)])
    );
    setFormData({ ...newFormData, ...booleanDefaults });
  };

  // 사용자 생성
  const handleCreateUser = async () => {
    try {
      await createUserMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        username: '',
        password: '',
        name: '',
        department: '',
        position: '',
        role: 'user',
        isManager: false,
        ...Object.fromEntries(
          Object.values(PERMISSION_CATEGORIES).flatMap((category: any) => 
            category.permissions.map((perm: any) => [perm.key, false])
          )
        )
      });
    } catch (error) {
      console.error('사용자 생성 실패:', error);
    }
  };

  // 사용자 수정
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      // 권한 필드만 추출하여 전송
      const permissionFields = Object.fromEntries(
        Object.values(PERMISSION_CATEGORIES).flatMap((category: any) => 
          category.permissions.map((perm: any) => [perm.key, Boolean(formData[perm.key as keyof typeof formData])])
        )
      );
      
      const updateData = {
        id: editingUser.id,
        username: formData.username,
        name: formData.name,
        department: formData.department,
        position: formData.position,
        role: formData.role,
        isManager: Boolean(formData.isManager),
        ...permissionFields
      };
      
      console.log('권한 업데이트 전송 데이터:', updateData);
      
      await updateUserMutation.mutateAsync(updateData);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('사용자 수정 실패:', error);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) return;
    
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
    }
  };

  // 편집 시작
  const startEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: (user as any).name || user.username,
      department: user.department || '',
      position: user.position || '',
      role: user.role as keyof typeof ROLE_PERMISSIONS,
      isManager: user.isManager || false,
      // 모든 권한 필드 설정 - Boolean 변환으로 일관성 확보
      ...Object.fromEntries(
        Object.values(PERMISSION_CATEGORIES).flatMap((category: any) => 
          category.permissions.map((perm: any) => [perm.key, Boolean((user as any)[perm.key])])
        )
      )
    });
    setIsEditDialogOpen(true);
  };

  // 검색 필터링
  const filteredUsers = users.filter((user: any) => {
    if (!searchTerm || searchTerm.trim() === '') return true;
    
    try {
      const search = searchTerm.toLowerCase();
      return (user.username || '').toLowerCase().includes(search) ||
             (user.role || '').toLowerCase().includes(search) ||
             (user.department || '').toLowerCase().includes(search) ||
             (user.position || '').toLowerCase().includes(search) ||
             ((user as any).name || '').toLowerCase().includes(search);
    } catch (error) {
      console.error('Search filter error:', error);
      return true; // 에러 발생 시 모든 사용자 표시
    }
  });

  if (isLoading) {
    return <div>사용자 목록을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPermissionMatrix(!showPermissionMatrix)}
          >
            <Settings className="h-4 w-4 mr-2" />
            권한 매트릭스 {showPermissionMatrix ? '숨기기' : '보기'}
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                사용자 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>새 사용자 추가</DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 pr-4">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">사용자명</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="사용자명을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">비밀번호</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="비밀번호를 입력하세요"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">이름</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">역할</Label>
                      <Select value={formData.role} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                            <SelectItem key={role} value={role}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">부서</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="부서를 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">직급</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="직급을 입력하세요"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isManager"
                      checked={formData.isManager}
                      onCheckedChange={(checked) => setFormData({ ...formData, isManager: !!checked })}
                    />
                    <Label htmlFor="isManager">부서장 권한</Label>
                  </div>

                  <Separator />

                  {/* 권한 설정 */}
                  <PermissionSettings
                    formData={formData}
                    setFormData={setFormData}
                    onPermissionChange={handlePermissionChange}
                    onResetPermissions={resetPermissions}
                  />
                </div>
              </ScrollArea>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "생성 중..." : "생성"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 권한 매트릭스 */}
      {showPermissionMatrix && <PermissionMatrix />}

      {/* 검색 필터 */}
      <div className="mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="사용자명 또는 역할로 검색..."
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value || '')}
              className="max-w-sm"
            />
          </div>
          <div className="text-sm text-gray-600">
            전체 {users.length}명 중 {filteredUsers.length}명 표시
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>사용자명</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>직급</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{(user as any).name || user.username}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge className={ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]?.color}>
                      {ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.position || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>사용자 수정</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              {/* 기본 정보 (편집용) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-username">사용자명</Label>
                  <Input
                    id="edit-username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="사용자명을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">새 비밀번호 (선택사항)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="새 비밀번호 (변경 시에만 입력)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">이름</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">역할</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                        <SelectItem key={role} value={role}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">부서</Label>
                  <Input
                    id="edit-department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="부서를 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-position">직급</Label>
                  <Input
                    id="edit-position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="직급을 입력하세요"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isManager"
                  checked={formData.isManager}
                  onCheckedChange={(checked) => setFormData({ ...formData, isManager: !!checked })}
                />
                <Label htmlFor="edit-isManager">부서장 권한</Label>
              </div>

              <Separator />

              {/* 권한 설정 */}
              <PermissionSettings
                formData={formData}
                setFormData={setFormData}
                onPermissionChange={handlePermissionChange}
                onResetPermissions={resetPermissions}
              />
            </div>
          </ScrollArea>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "수정 중..." : "수정"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
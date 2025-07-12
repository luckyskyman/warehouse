import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Edit2, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

interface CreateUserData {
  username: string;
  password: string;
  role: string;
  department?: string;
  position?: string;
  isManager?: boolean;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CreateUserData>({
    username: "",
    password: "",
    role: "viewer",
    department: "",
    position: "",
    isManager: false
  });

  // Get all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin"
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "사용자 생성 완료",
        description: "새 사용자가 성공적으로 생성되었습니다.",
      });
      setIsCreateDialogOpen(false);
      setFormData({ username: "", password: "", role: "viewer", department: "", position: "", isManager: false });
    },
    onError: (error) => {
      toast({
        title: "사용자 생성 실패",
        description: error instanceof Error ? error.message : "사용자 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<User> }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "사용자 수정 완료",
        description: "사용자 정보가 성공적으로 수정되었습니다.",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "사용자 수정 실패",
        description: error instanceof Error ? error.message : "사용자 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "사용자 삭제 완료",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "사용자 삭제 실패",
        description: error instanceof Error ? error.message : "사용자 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  if (user?.role !== "admin") {
    return (
      <div className="warehouse-content">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold">관리자 권한이 필요합니다</h2>
          <p className="mt-2 text-sm text-gray-600">
            사용자 관리 기능은 관리자만 사용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateUser = () => {
    if (!formData.username || !formData.password) {
      toast({
        title: "입력 오류",
        description: "사용자명과 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const updates: Partial<User> = {
      username: formData.username,
      role: formData.role
    };

    if (formData.password) {
      updates.password = formData.password;
    }

    updateUserMutation.mutate({ id: selectedUser.id, updates });
  };

  const handleDeleteUser = (userId: number) => {
    if (userId === user?.id) {
      toast({
        title: "삭제 불가",
        description: "본인 계정은 삭제할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // 사용자 검색 필터링
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="destructive">관리자</Badge>
    ) : (
      <Badge variant="secondary">일반사용자</Badge>
    );
  };

  return (
    <div className="warehouse-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            사용자 관리
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            시스템 사용자 계정을 관리합니다
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 사용자 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 사용자 생성</DialogTitle>
              <DialogDescription>
                새로운 사용자 계정을 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">사용자명</Label>
                <Input
                  id="username"
                  type="text"
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
              <div>
                <Label htmlFor="role">역할</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">일반사용자</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">부서</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department || ""}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="부서명을 입력하세요 (예: 창고부, 관리부)"
                />
              </div>
              <div>
                <Label htmlFor="position">직급</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position || ""}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="직급을 입력하세요 (예: 사원, 과장, 부장)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={formData.isManager || false}
                  onChange={(e) => setFormData({ ...formData, isManager: e.target.checked })}
                />
                <Label htmlFor="isManager">부서장 권한</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "생성 중..." : "생성"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 필터 */}
      <div className="mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="사용자명 또는 역할로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="text-sm text-gray-600">
            전체 {users.length}명 중 {filteredUsers.length}명 표시
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            현재 시스템에 등록된 사용자 목록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자명</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === user?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
            <DialogDescription>
              사용자 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">사용자명</Label>
              <Input
                id="edit-username"
                type="text"
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
                placeholder="새 비밀번호를 입력하세요 (변경시에만)"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">역할</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="역할을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">일반사용자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "수정 중..." : "수정"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
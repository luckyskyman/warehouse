import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface MobileFilterOptions {
  searchTerm: string;
  category: string;
  priority: string;
  status: string;
  authorId: string;
}

interface MobileFiltersProps {
  onFiltersChange: (filters: MobileFilterOptions) => void;
  categories?: string[];
  priorities?: string[];
  statuses?: string[];
  authors?: Array<{ id: number; username: string }>;
  type?: 'workDiary' | 'transaction';
}

const DEFAULT_FILTERS: MobileFilterOptions = {
  searchTerm: "",
  category: "",
  priority: "",
  status: "",
  authorId: "",
};

export default function MobileFilters({
  onFiltersChange,
  categories = [],
  priorities = [],
  statuses = [],
  authors = [],
  type = 'workDiary'
}: MobileFiltersProps) {
  const [filters, setFilters] = useState<MobileFilterOptions>(DEFAULT_FILTERS);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const updateFilters = (newFilters: Partial<MobileFilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category) count++;
    if (filters.priority) count++;
    if (filters.status) count++;
    if (filters.authorId) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  if (!isMobile) {
    return null; // Desktop에서는 AdvancedFilters를 사용
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="검색어 입력"
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-9"
          />
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>필터 옵션</SheetTitle>
              <SheetDescription>
                원하는 조건으로 데이터를 필터링하세요.
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">카테고리</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => updateFilters({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority (for work diary) */}
              {type === 'workDiary' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">우선순위</label>
                  <Select
                    value={filters.priority}
                    onValueChange={(value) => updateFilters({ priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="우선순위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      {priorities.map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {priority === 'low' ? '낮음' : 
                           priority === 'normal' ? '보통' : 
                           priority === 'high' ? '높음' : '긴급'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">상태</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilters({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {type === 'workDiary' ? (
                          status === 'completed' ? '완료' :
                          status === 'in_progress' ? '진행중' : '대기중'
                        ) : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author */}
              <div>
                <label className="text-sm font-medium mb-2 block">작성자</label>
                <Select
                  value={filters.authorId}
                  onValueChange={(value) => updateFilters({ authorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="작성자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {authors.map(author => (
                      <SelectItem key={author.id} value={author.id.toString()}>
                        {author.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  <X className="h-4 w-4 mr-2" />
                  초기화
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  적용
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="text-xs">
              카테고리: {filters.category}
              <button
                onClick={() => updateFilters({ category: "" })}
                className="ml-1 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="text-xs">
              우선순위: {filters.priority === 'low' ? '낮음' : 
                        filters.priority === 'normal' ? '보통' : 
                        filters.priority === 'high' ? '높음' : '긴급'}
              <button
                onClick={() => updateFilters({ priority: "" })}
                className="ml-1 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              상태: {type === 'workDiary' ? (
                filters.status === 'completed' ? '완료' :
                filters.status === 'in_progress' ? '진행중' : '대기중'
              ) : filters.status}
              <button
                onClick={() => updateFilters({ status: "" })}
                className="ml-1 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.authorId && (
            <Badge variant="secondary" className="text-xs">
              작성자: {authors.find(a => a.id.toString() === filters.authorId)?.username}
              <button
                onClick={() => updateFilters({ authorId: "" })}
                className="ml-1 hover:bg-gray-200 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Search, Save, Star } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface FilterOptions {
  searchTerm: string;
  category: string;
  priority: string;
  status: string;
  authorId: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterOptions;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  categories?: string[];
  priorities?: string[];
  statuses?: string[];
  authors?: Array<{ id: number; username: string }>;
  type?: 'workDiary' | 'transaction';
}

const DEFAULT_FILTERS: FilterOptions = {
  searchTerm: "",
  category: "",
  priority: "",
  status: "",
  authorId: "",
  dateRange: {
    start: null,
    end: null
  }
};

export default function AdvancedFilters({
  onFiltersChange,
  categories = [],
  priorities = [],
  statuses = [],
  authors = [],
  type = 'workDiary'
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const { toast } = useToast();

  // Load saved presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem(`filter-presets-${type}`);
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, [type]);

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    localStorage.setItem(`filter-presets-${type}`, JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "프리셋 이름 오류",
        description: "프리셋 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters }
    };

    const updatedPresets = [...presets, newPreset];
    savePresets(updatedPresets);
    setPresetName("");
    setShowPresetInput(false);
    
    toast({
      title: "프리셋 저장됨",
      description: `"${presetName}" 프리셋이 저장되었습니다.`,
    });
  };

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    onFiltersChange(preset.filters);
    
    toast({
      title: "프리셋 로드됨",
      description: `"${preset.name}" 프리셋이 적용되었습니다.`,
    });
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    savePresets(updatedPresets);
    
    toast({
      title: "프리셋 삭제됨",
      description: "프리셋이 삭제되었습니다.",
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category) count++;
    if (filters.priority) count++;
    if (filters.status) count++;
    if (filters.authorId) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            고급 필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}개 활성
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "접기" : "펼치기"}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search Term */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">검색어</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="제목, 내용 검색"
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">카테고리</Label>
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
                <Label htmlFor="priority">우선순위</Label>
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
              <Label htmlFor="status">상태</Label>
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
              <Label htmlFor="author">작성자</Label>
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

            {/* Date Range */}
            <div>
              <Label>날짜 범위</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start ? 
                        format(filters.dateRange.start, "yyyy-MM-dd") : "시작일"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start}
                      onSelect={(date) => updateFilters({
                        dateRange: { ...filters.dateRange, start: date }
                      })}
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end ? 
                        format(filters.dateRange.end, "yyyy-MM-dd") : "종료일"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end}
                      onSelect={(date) => updateFilters({
                        dateRange: { ...filters.dateRange, end: date }
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                <X className="h-4 w-4 mr-2" />
                초기화
              </Button>
              
              {!showPresetInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresetInput(true)}
                  disabled={activeFilterCount === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  프리셋 저장
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="프리셋 이름"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="w-32"
                  />
                  <Button size="sm" onClick={savePreset}>
                    저장
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPresetInput(false);
                      setPresetName("");
                    }}
                  >
                    취소
                  </Button>
                </div>
              )}
            </div>

            {/* Filter Presets */}
            <div className="flex items-center gap-2">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPreset(preset)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    {preset.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePreset(preset.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
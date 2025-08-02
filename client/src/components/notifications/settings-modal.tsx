import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Volume2, VolumeX, Bell, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { useVoiceNotifications } from '@/hooks/use-voice-notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  lowStockEnabled: boolean;
  outOfStockEnabled: boolean;
  overstockEnabled: boolean;
  showOnMobile: boolean;
  soundEnabled: boolean;
  autoRefreshInterval: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  lowStockEnabled: true,
  outOfStockEnabled: true,
  overstockEnabled: false,
  showOnMobile: true,
  soundEnabled: true,
  autoRefreshInterval: 300,
};

interface SettingsModalProps {
  children: React.ReactNode;
}

export function SettingsModal({ children }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [inventorySettings, setInventorySettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>('voice');
  const [userHasChangedTab, setUserHasChangedTab] = useState(false);
  const { settings: voiceSettings, updateSettings: updateVoiceSettings } = useVoiceNotifications();
  const { toast } = useToast();

  // 로컬스토리지에서 재고 알림 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('inventory-notification-settings');
    if (savedSettings) {
      try {
        setInventorySettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('재고 알림 설정 로드 실패:', error);
      }
    }
  }, []);

  // 모달이 처음 열릴 때만 스마트 탭 선택 (사용자가 수동으로 탭을 변경하지 않은 경우에만)
  useEffect(() => {
    if (open && !userHasChangedTab) {
      const hasInventoryIssues = !inventorySettings.lowStockEnabled && 
                                 !inventorySettings.outOfStockEnabled && 
                                 !inventorySettings.overstockEnabled;
      
      if (hasInventoryIssues) {
        setActiveTab('inventory');
      } else {
        setActiveTab('voice');
      }
    }
  }, [open]);

  // 모달이 닫힐 때 사용자 탭 변경 상태 리셋
  useEffect(() => {
    if (!open) {
      setUserHasChangedTab(false);
    }
  }, [open]);

  const saveInventorySettings = (newSettings: NotificationSettings) => {
    localStorage.setItem('inventory-notification-settings', JSON.stringify(newSettings));
    setInventorySettings(newSettings);
    toast({
      title: "설정 저장됨",
      description: "재고 알림 설정이 성공적으로 저장되었습니다.",
    });
  };

  const resetToDefaults = () => {
    // 재고 알림 기본값 복원
    setInventorySettings(DEFAULT_SETTINGS);
    localStorage.setItem('inventory-notification-settings', JSON.stringify(DEFAULT_SETTINGS));
    
    // 음성 알림 기본값 복원
    updateVoiceSettings({ enabled: true, detailed: true });
    
    toast({
      title: "기본 설정 복원",
      description: "모든 알림 설정이 기본값으로 복원되었습니다.",
    });
  };

  const enableAllAlerts = () => {
    const allEnabledSettings = {
      ...inventorySettings,
      lowStockEnabled: true,
      outOfStockEnabled: true,
      overstockEnabled: true,
      soundEnabled: true,
      showOnMobile: true,
    };
    saveInventorySettings(allEnabledSettings);
    updateVoiceSettings({ enabled: true, detailed: true });
    
    toast({
      title: "모든 알림 활성화",
      description: "모든 알림이 활성화되었습니다.",
    });
  };

  const testNotifications = () => {
    // 음성 알림 테스트
    if (voiceSettings.enabled) {
      const utterance = new SpeechSynthesisUtterance("알림 테스트입니다. 음성 알림이 정상적으로 작동하고 있습니다.");
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
    
    // 토스트 알림 테스트
    toast({
      title: "알림 테스트",
      description: "재고 부족 알림 테스트입니다.",
      variant: "destructive",
    });
  };

  const getInventorySettingsStatus = () => {
    const enabledCount = [
      inventorySettings.lowStockEnabled,
      inventorySettings.outOfStockEnabled,
      inventorySettings.overstockEnabled
    ].filter(Boolean).length;

    if (enabledCount === 0) {
      return { status: 'critical', text: '모든 재고 알림 비활성화', color: 'bg-red-500' };
    } else if (enabledCount < 3) {
      return { status: 'warning', text: `${enabledCount}/3 활성화`, color: 'bg-yellow-500' };
    } else {
      return { status: 'good', text: '모든 알림 활성화', color: 'bg-green-500' };
    }
  };

  const inventoryStatus = getInventorySettingsStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            알림 설정
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
          setUserHasChangedTab(true);
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              {voiceSettings.enabled ? (
                <Volume2 className="h-4 w-4 text-green-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
              음성 알림
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${inventoryStatus.color}`} />
              재고 알림
              {inventoryStatus.status === 'critical' && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  문제
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              시스템
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">음성 알림 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-enabled">음성 알림 활성화</Label>
                  <Switch
                    id="voice-enabled"
                    checked={voiceSettings.enabled}
                    onCheckedChange={(checked) => updateVoiceSettings({ enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-detailed">상세 음성 (작성자 포함)</Label>
                  <Switch
                    id="voice-detailed"
                    checked={voiceSettings.detailed}
                    onCheckedChange={(checked) => updateVoiceSettings({ detailed: checked })}
                    disabled={!voiceSettings.enabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  재고 알림 설정
                  <Badge variant={inventoryStatus.status === 'critical' ? 'destructive' : 'secondary'}>
                    {inventoryStatus.text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="low-stock">재고 부족 경고</Label>
                  <Switch
                    id="low-stock"
                    checked={inventorySettings.lowStockEnabled}
                    onCheckedChange={(checked) => 
                      saveInventorySettings({ ...inventorySettings, lowStockEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="out-of-stock">재고 부족 알림</Label>
                  <Switch
                    id="out-of-stock"
                    checked={inventorySettings.outOfStockEnabled}
                    onCheckedChange={(checked) => 
                      saveInventorySettings({ ...inventorySettings, outOfStockEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="overstock">재고 과다 알림</Label>
                  <Switch
                    id="overstock"
                    checked={inventorySettings.overstockEnabled}
                    onCheckedChange={(checked) => 
                      saveInventorySettings({ ...inventorySettings, overstockEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">알림 소리</Label>
                  <Switch
                    id="sound"
                    checked={inventorySettings.soundEnabled}
                    onCheckedChange={(checked) => 
                      saveInventorySettings({ ...inventorySettings, soundEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile">모바일에서 표시</Label>
                  <Switch
                    id="mobile"
                    checked={inventorySettings.showOnMobile}
                    onCheckedChange={(checked) => 
                      saveInventorySettings({ ...inventorySettings, showOnMobile: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">시스템 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={enableAllAlerts}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4" />
                    모든 알림 활성화
                  </Button>
                  <Button
                    onClick={resetToDefaults}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4" />
                    기본 설정 복원
                  </Button>
                  <Button
                    onClick={testNotifications}
                    className="flex items-center gap-2"
                    variant="secondary"
                  >
                    <Bell className="h-4 w-4" />
                    알림 테스트
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
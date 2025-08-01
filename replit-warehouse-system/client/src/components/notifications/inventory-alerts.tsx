import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, Package, X, Settings } from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  itemCode: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
}

interface NotificationSettings {
  lowStockEnabled: boolean;
  outOfStockEnabled: boolean;
  overstockEnabled: boolean;
  showOnMobile: boolean;
  soundEnabled: boolean;
  autoRefreshInterval: number; // in seconds
}

const DEFAULT_SETTINGS: NotificationSettings = {
  lowStockEnabled: true,
  outOfStockEnabled: true,
  overstockEnabled: false,
  showOnMobile: true,
  soundEnabled: true,
  autoRefreshInterval: 300, // 5 minutes
};

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const { data: inventory = [] } = useInventory();
  const { toast } = useToast();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('inventory-notification-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: NotificationSettings) => {
    localStorage.setItem('inventory-notification-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  // Generate alerts based on current inventory
  const generateAlerts = () => {
    const newAlerts: InventoryAlert[] = [];
    
    inventory.forEach(item => {
      const alertId = `${item.code}-${item.location || 'default'}`;
      
      // Check for low stock
      if (settings.lowStockEnabled && item.stock <= item.minStock && item.stock > 0) {
        newAlerts.push({
          id: alertId + '-low',
          type: 'low_stock',
          itemCode: item.code,
          itemName: item.name,
          currentStock: item.stock,
          minStock: item.minStock,
          severity: item.stock <= item.minStock * 0.5 ? 'high' : 'medium',
          createdAt: new Date(),
          acknowledged: false
        });
      }
      
      // Check for out of stock
      if (settings.outOfStockEnabled && item.stock === 0) {
        newAlerts.push({
          id: alertId + '-out',
          type: 'out_of_stock',
          itemCode: item.code,
          itemName: item.name,
          currentStock: item.stock,
          minStock: item.minStock,
          severity: 'critical',
          createdAt: new Date(),
          acknowledged: false
        });
      }
      
      // Check for overstock (if maxStock is defined)
      const maxStock = item.minStock * 10; // Assume maxStock is 10x minStock
      if (settings.overstockEnabled && item.stock > maxStock) {
        newAlerts.push({
          id: alertId + '-over',
          type: 'overstock',
          itemCode: item.code,
          itemName: item.name,
          currentStock: item.stock,
          minStock: item.minStock,
          maxStock,
          severity: 'low',
          createdAt: new Date(),
          acknowledged: false
        });
      }
    });
    
    // Only add new alerts (not already acknowledged)
    const existingAlertIds = alerts.map(a => a.id);
    const filteredNewAlerts = newAlerts.filter(alert => !existingAlertIds.includes(alert.id));
    
    if (filteredNewAlerts.length > 0) {
      setAlerts(prev => [...prev, ...filteredNewAlerts]);
      
      // Show toast notification for new alerts
      if (filteredNewAlerts.some(a => a.severity === 'critical')) {
        toast({
          title: "긴급 재고 알림",
          description: `${filteredNewAlerts.filter(a => a.severity === 'critical').length}개 품목이 재고 부족입니다.`,
          variant: "destructive",
        });
      }
      
      // Play sound if enabled
      if (settings.soundEnabled && filteredNewAlerts.length > 0) {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    }
    
    setLastCheck(new Date());
  };

  // Auto-refresh alerts
  useEffect(() => {
    const interval = setInterval(() => {
      generateAlerts();
    }, settings.autoRefreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [inventory, settings.autoRefreshInterval, settings.lowStockEnabled, settings.outOfStockEnabled, settings.overstockEnabled]);

  // Initial alert generation
  useEffect(() => {
    if (inventory.length > 0) {
      generateAlerts();
    }
  }, [inventory.length]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'low_stock':
        return <Package className="h-4 w-4 text-yellow-500" />;
      case 'overstock':
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return '재고 부족';
      case 'low_stock':
        return '재고 부족 경고';
      case 'overstock':
        return '재고 과다';
      default:
        return '알림';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      {unacknowledgedAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>{unacknowledgedAlerts.length}개의 재고 알림</strong>이 있습니다.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllAlerts}
                >
                  모두 지우기
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="low-stock">재고 부족 경고</Label>
              <Switch
                id="low-stock"
                checked={settings.lowStockEnabled}
                onCheckedChange={(checked) => saveSettings({ ...settings, lowStockEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="out-of-stock">재고 부족 알림</Label>
              <Switch
                id="out-of-stock"
                checked={settings.outOfStockEnabled}
                onCheckedChange={(checked) => saveSettings({ ...settings, outOfStockEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="overstock">재고 과다 알림</Label>
              <Switch
                id="overstock"
                checked={settings.overstockEnabled}
                onCheckedChange={(checked) => saveSettings({ ...settings, overstockEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound">알림 소리</Label>
              <Switch
                id="sound"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => saveSettings({ ...settings, soundEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mobile">모바일에서 표시</Label>
              <Switch
                id="mobile"
                checked={settings.showOnMobile}
                onCheckedChange={(checked) => saveSettings({ ...settings, showOnMobile: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              활성 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unacknowledgedAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.itemName}</div>
                      <div className="text-sm text-gray-600">
                        {alert.type === 'out_of_stock' ? '재고 없음' :
                         alert.type === 'low_stock' ? `현재 ${alert.currentStock}개 (최소 ${alert.minStock}개)` :
                         `현재 ${alert.currentStock}개 (최대 ${alert.maxStock}개)`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity === 'critical' ? '긴급' :
                       alert.severity === 'high' ? '높음' :
                       alert.severity === 'medium' ? '보통' : '낮음'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      확인
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              확인된 알림 ({acknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {acknowledgedAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 border rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.itemName}</div>
                      <div className="text-sm text-gray-500">
                        {alert.type === 'out_of_stock' ? '재고 없음' :
                         alert.type === 'low_stock' ? `현재 ${alert.currentStock}개` :
                         `현재 ${alert.currentStock}개`}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Check Info */}
      <div className="text-sm text-gray-500 text-center">
        마지막 확인: {lastCheck.toLocaleString()}
      </div>
    </div>
  );
}
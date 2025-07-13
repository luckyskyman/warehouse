import React, { useEffect, useState } from 'react';
import { Bell, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useNotifications, useMarkNotificationRead, type WorkNotification } from '@/hooks/use-notifications';
import { useVoiceNotifications } from '@/hooks/use-voice-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function NotificationBell() {
  const { data: notifications = [], refetch } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const { settings, updateSettings, announceNewDiary, announceStatusChange } = useVoiceNotifications();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // 새 알림 감지 및 음성 재생
  useEffect(() => {
    const currentCount = notifications.length;
    const unreadCount = notifications.filter((n: WorkNotification) => !n.read).length;
    
    // 새로운 알림이 생겼을 때만 음성 재생
    if (currentCount > lastNotificationCount && lastNotificationCount > 0) {
      const newNotifications = notifications.slice(0, currentCount - lastNotificationCount);
      
      for (const notification of newNotifications) {
        if (notification.type === 'new_diary') {
          // 메시지에서 작성자 이름 추출 (예: "김은영과장님이 새로운 업무일지를 작성했습니다")
          const authorMatch = notification.message.match(/^(.+?)님이/);
          const authorName = authorMatch ? authorMatch[1] : undefined;
          announceNewDiary(authorName);
        } else if (notification.type === 'status_change') {
          // 상태 변경 알림 처리
          const statusMatch = notification.message.match(/^(.+?)님이 업무를/);
          const username = statusMatch ? statusMatch[1] : '';
          if (notification.message.includes('완료했습니다')) {
            announceStatusChange(username, 'completed');
          } else if (notification.message.includes('확인했습니다')) {
            announceStatusChange(username, 'in_progress');
          }
        }
      }
    }
    
    setLastNotificationCount(currentCount);
  }, [notifications.length, lastNotificationCount, announceNewDiary, announceStatusChange]);

  const unreadCount = notifications.filter((n: WorkNotification) => !n.read).length;

  const handleNotificationClick = async (notification: WorkNotification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    // 해당 업무일지로 이동하는 로직 추가 가능
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          알림
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              className="h-6 w-6 p-0"
            >
              {settings.enabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* 음성 설정 */}
        <DropdownMenuCheckboxItem
          checked={settings.enabled}
          onCheckedChange={(checked) => updateSettings({ enabled: checked })}
        >
          음성 알림 켜기
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.detailed}
          onCheckedChange={(checked) => updateSettings({ detailed: checked })}
          disabled={!settings.enabled}
        >
          상세 음성 (작성자 포함)
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />

        {/* 알림 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              새로운 알림이 없습니다
            </div>
          ) : (
            notifications.slice(0, 10).map((notification: WorkNotification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="text-sm font-medium line-clamp-2">
                  {notification.message}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: ko
                  })}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import React, { useEffect, useState } from 'react';
import { Bell, Settings, Volume2, VolumeX, BellRing } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';

export function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications = [], refetch } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const { settings, updateSettings, announceNewDiary, announceStatusChange } = useVoiceNotifications();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // 디버깅: 컴포넌트 렌더링 확인
  console.log('NotificationBell 렌더링:', { user: !!user, notifications: notifications?.length });

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
      // 알림 처리 후 자동으로 캐시가 새로고침됨 - 별도 처리 불필요
    }
    // 해당 업무일지로 이동하는 로직 추가 가능
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 rounded-full p-2"
          title="알림 및 설정"
        >
          {/* 알림이 있을 때는 BellRing, 없을 때는 Bell 아이콘 */}
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
          
          {/* 읽지 않은 알림 개수 배지 - 항상 표시 가능하도록 개선 */}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-lg animate-bounce"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}

          {/* 음성 알림이 켜져있을 때 작은 표시점 */}
          {settings.enabled && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <DropdownMenuLabel className="flex items-center justify-between py-3 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">알림 센터</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={settings.enabled ? "음성 알림 끄기" : "음성 알림 켜기"}
            >
              {settings.enabled ? (
                <Volume2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
        </DropdownMenuLabel>
        
        {/* 음성 설정 섹션 - 항상 표시하고 활성화 */}
        <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-2">음성 알림 설정</div>
          <DropdownMenuCheckboxItem
            checked={settings.enabled}
            onCheckedChange={(checked) => {
              console.log('음성 알림 설정 변경:', checked);
              updateSettings({ enabled: checked });
            }}
            className="text-sm py-2"
          >
            <div className="flex items-center gap-2">
              {settings.enabled ? (
                <Volume2 className="h-4 w-4 text-green-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
              음성 알림 활성화
            </div>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={settings.detailed}
            onCheckedChange={(checked) => {
              console.log('상세 음성 설정 변경:', checked);
              updateSettings({ detailed: checked });
            }}
            disabled={!settings.enabled}
            className={`text-sm py-2 ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Settings className={`h-4 w-4 ${!settings.enabled ? 'text-gray-300' : 'text-gray-600'}`} />
              <span className={!settings.enabled ? 'text-gray-400' : 'text-gray-900'}>
                상세 음성 (작성자 포함)
              </span>
            </div>
          </DropdownMenuCheckboxItem>
        </div>

        {/* 알림 목록 - 항상 접근 가능 */}
        <div className="max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-2">최근 알림</div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center">
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">새로운 알림이 없습니다</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {user ? "알림 설정은 위에서 변경할 수 있습니다" : "로그인 후 알림을 받아보세요"}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.slice(0, 10).map((notification: WorkNotification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-3 cursor-pointer rounded-lg transition-colors ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="text-sm font-medium line-clamp-2 flex-1">
                        {notification.message}
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
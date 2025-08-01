import { useEffect, useState } from 'react';

interface VoiceSettings {
  enabled: boolean;
  detailed: boolean; // true: 상세 음성, false: 간단 음성
}

export function useVoiceNotifications() {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('voice_notification_settings');
    return saved ? JSON.parse(saved) : { enabled: true, detailed: false };
  });

  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('voice_notification_settings', JSON.stringify(updated));
  };

  const speak = (message: string) => {
    if (!settings.enabled) return;
    
    // 브라우저 지원 확인
    if (!window.speechSynthesis) {
      console.warn('음성 합성이 지원되지 않는 브라우저입니다.');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9; // 말하는 속도
      utterance.volume = 0.7; // 볼륨
      utterance.pitch = 1.0; // 음높이
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('음성 재생 오류:', error);
    }
  };

  const announceNewDiary = (authorName?: string) => {
    if (settings.detailed && authorName) {
      speak(`${authorName}님이 작성한 업무일지가 도착했습니다`);
    } else {
      speak('업무일지가 도착했습니다');
    }
  };

  const announceStatusChange = (username: string, status: string) => {
    if (status === 'completed') {
      speak(`${username}님이 업무를 완료했습니다`);
    } else if (status === 'in_progress') {
      speak(`${username}님이 업무일지를 확인했습니다`);
    }
  };

  return {
    settings,
    updateSettings,
    speak,
    announceNewDiary,
    announceStatusChange,
  };
}
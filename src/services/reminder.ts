import api from './api';

export interface ReminderSettings {
  id?: string;
  babyId?: string | null;
  enabled: boolean;
  intervalHours: number;
  intervalMinutes: number;
  reminderMethod: 'vibrate' | 'sound' | 'both';
  ringtone: string;
}

export const reminderService = {
  // 获取提醒设置
  getSettings: async (babyId?: string): Promise<ReminderSettings> => {
    return await api.get<any, ReminderSettings>('/reminder', {
      params: { babyId },
    });
  },

  // 保存提醒设置
  saveSettings: async (settings: Partial<ReminderSettings>): Promise<ReminderSettings> => {
    return await api.post<any, ReminderSettings>('/reminder', settings);
  },
};

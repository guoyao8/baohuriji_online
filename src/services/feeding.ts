import api from './api';
import { FeedingRecord, Baby, DailyStats, TrendData } from '@/types';

export const feedingService = {
  // 喂养记录
  createRecord: async (data: Partial<FeedingRecord>): Promise<FeedingRecord> => {
    return await api.post<any, FeedingRecord>('/feeding-records', data);
  },

  getRecords: async (params?: {
    babyId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<FeedingRecord[]> => {
    return await api.get<any, FeedingRecord[]>('/feeding-records', { params });
  },

  updateRecord: async (id: string, data: Partial<FeedingRecord>): Promise<FeedingRecord> => {
    return await api.put<any, FeedingRecord>(`/feeding-records/${id}`, data);
  },

  deleteRecord: async (id: string): Promise<void> => {
    return await api.delete(`/feeding-records/${id}`);
  },

  // 宝宝档案
  getBabies: async (): Promise<Baby[]> => {
    return await api.get<any, Baby[]>('/babies');
  },

  createBaby: async (data: Partial<Baby>): Promise<Baby> => {
    return await api.post<any, Baby>('/babies', data);
  },

  updateBaby: async (id: string, data: Partial<Baby>): Promise<Baby> => {
    return await api.put<any, Baby>(`/babies/${id}`, data);
  },

  deleteBaby: async (id: string): Promise<void> => {
    return await api.delete(`/babies/${id}`);
  },

  // 统计
  getDailyStats: async (date: string, babyId?: string): Promise<DailyStats[]> => {
    return await api.get<any, DailyStats[]>('/stats/daily', {
      params: { date, babyId },
    });
  },

  getTrend: async (params: {
    startDate: string;
    endDate: string;
    babyIds?: string[];
    groupBy?: 'hour' | 'day';
  }): Promise<TrendData[]> => {
    return await api.get<any, TrendData[]>('/stats/trend', { params });
  },
};

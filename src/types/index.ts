export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Family {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: 'admin' | 'member';
  nickname: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeedingType = 'breast' | 'formula' | 'solid';

export interface FeedingRecord {
  id: string;
  babyId: string;
  familyId: string;
  recordedBy: string;
  recordedByName?: string;
  feedingType: FeedingType;
  amount?: number;
  unit?: 'ml' | '斤' | 'g';
  duration?: number; // 秒
  feedingTime: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderSettings {
  id: string;
  familyId: string;
  babyId?: string; // null表示统一设置
  enabled: boolean;
  intervalHours: number;
  intervalMinutes: number;
  reminderMethod: 'vibrate' | 'sound' | 'both';
  ringtone: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyStats {
  babyId: string;
  babyName: string;
  totalAmount: number; // ml
  totalFeedings: number;
  lastFeedingTime?: string;
  feedingsByType: {
    breast: number;
    formula: number;
    solid: number;
  };
}

export interface TrendData {
  hour?: number;
  date?: string;
  babies: {
    babyId: string;
    babyName: string;
    babyGender: 'male' | 'female';
    amount: number;
  }[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  inviteCode?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

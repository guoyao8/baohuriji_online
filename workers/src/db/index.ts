import { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  DATABASE_URL: string;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  JWT_SECRET: string;
}

// 数据库辅助函数
export class Database {
  constructor(private db: D1Database) {}

  // 执行查询并返回所有结果
  async all<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as T[];
  }

  // 执行查询并返回第一个结果
  async get<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const result = await this.db.prepare(query).bind(...params).first();
    return result as T | null;
  }

  // 执行插入/更新/删除操作
  async run(query: string, params: any[] = []): Promise<D1Result> {
    return await this.db.prepare(query).bind(...params).run();
  }

  // 批量执行操作
  async batch(statements: { query: string; params: any[] }[]): Promise<D1Result[]> {
    const prepared = statements.map(({ query, params }) => 
      this.db.prepare(query).bind(...params)
    );
    return await this.db.batch(prepared);
  }

  // 生成 UUID
  generateId(): string {
    return crypto.randomUUID();
  }

  // 获取当前时间戳（秒）
  now(): number {
    return Math.floor(Date.now() / 1000);
  }
}

// 数据库模型类型定义
export interface User {
  id: string;
  username: string;
  password: string;
  avatar_url: string | null;
  created_at: number;
  updated_at: number;
}

export interface Family {
  id: string;
  name: string | null;
  invite_code: string | null;
  created_by: string;
  created_at: number;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  nickname: string;
  joined_at: number;
}

export interface Baby {
  id: string;
  family_id: string;
  name: string;
  gender: string;
  birth_date: number;
  avatar_url: string | null;
  created_at: number;
  updated_at: number;
}

export interface FeedingRecord {
  id: string;
  baby_id: string;
  family_id: string;
  recorded_by: string;
  feeding_type: string;
  amount: number | null;
  unit: string | null;
  duration: number | null;
  feeding_time: number;
  note: string | null;
  created_at: number;
  updated_at: number;
}

export interface ReminderSettings {
  id: string;
  family_id: string;
  baby_id: string | null;
  enabled: number;
  interval_hours: number;
  interval_minutes: number;
  reminder_method: string;
  ringtone: string;
  created_at: number;
  updated_at: number;
}

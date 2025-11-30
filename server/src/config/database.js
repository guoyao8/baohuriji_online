import { PrismaClient } from '@prisma/client';
import supabase from './supabase.js';

// 为 Serverless 环境优化的 Prisma 配置
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 全局单例模式，避免在 Serverless 中创建过多连接
let cachedPrisma = global.prisma;

if (!cachedPrisma) {
  cachedPrisma = global.prisma = prisma;
}

// 导出数据库客户端（优先使用 Supabase，降级到 Prisma）
export const db = {
  // 标识当前使用的客户端类型
  type: supabase ? 'supabase' : 'prisma',
  // 原始客户端
  client: supabase || cachedPrisma,
  // Supabase 客户端
  supabase,
  // Prisma 客户端
  prisma: cachedPrisma,
};

export default cachedPrisma;

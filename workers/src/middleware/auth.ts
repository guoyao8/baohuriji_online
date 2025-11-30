import { Context, Next } from 'hono';
import { Env } from '../db/index';
import { extractToken, verifyToken } from '../utils/auth';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const token = extractToken(c.req.header('authorization'));

  if (!token) {
    return c.json({ error: '缺少授权令牌' }, 401);
  }

  const secret = c.env.JWT_SECRET || 'your-secret-key';
  const decoded = verifyToken(token, secret);

  if (!decoded) {
    return c.json({ error: '无效或过期的令牌' }, 401);
  }

  // 将用户信息保存到上下文中
  c.set('userId', decoded.userId);

  await next();
}

// 用于路由中获取当前用户 ID
export function getCurrentUserId(c: Context<{ Bindings: Env }>): string {
  return c.get('userId');
}

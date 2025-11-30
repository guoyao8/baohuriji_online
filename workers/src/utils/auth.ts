import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// 验证密码
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成 JWT token
export function generateToken(userId: string, secret: string): string {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    secret,
    { expiresIn: '30d' }
  );
}

// 验证 JWT token
export function verifyToken(token: string, secret: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// 从 Authorization header 中提取 token
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

// 生成邀请码
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

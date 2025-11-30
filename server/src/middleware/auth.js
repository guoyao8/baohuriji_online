import { verifyToken } from '../utils/auth.js';
import prisma from '../config/database.js';
import supabase from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    let user = null;

    // 使用 Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('User')
        .select('id, username, avatarUrl, createdAt')
        .eq('id', decoded.userId)
        .single();

      if (error || !data) {
        return res.status(401).json({ error: '用户不存在' });
      }
      user = data;
    } else if (prisma) {
      // 使用 Prisma
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, avatarUrl: true, createdAt: true },
      });

      if (!user) {
        return res.status(401).json({ error: '用户不存在' });
      }
    } else {
      return res.status(500).json({ error: '数据库未配置' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: '认证失败' });
  }
};

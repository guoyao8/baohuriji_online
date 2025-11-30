import { Hono } from 'hono';
import { Env, Database } from '../db/index';
import { authMiddleware, getCurrentUserId } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use(authMiddleware);

// 获取喂养统计
app.get('/feeding', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId, babyId, days = '7' } = c.req.query();

    if (!familyId) {
      return c.json({ error: '缺少 familyId' }, 400);
    }

    const db = new Database(c.env.DB);

    // 验证权限
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限访问此数据' }, 403);
    }

    const daySeconds = parseInt(days) * 24 * 60 * 60;
    const startTime = db.now() - daySeconds;

    let query = `
      SELECT feeding_type, COUNT(*) as count, COALESCE(AVG(amount), 0) as avg_amount
      FROM feeding_records
      WHERE family_id = ? AND feeding_time >= ?
    `;
    const params: any[] = [familyId, startTime];

    if (babyId) {
      query += ' AND baby_id = ?';
      params.push(babyId);
    }

    query += ' GROUP BY feeding_type';

    const stats = await db.all(query, params);

    return c.json({ period: `${days}天`, stats });
  } catch (error) {
    console.error('获取喂养统计错误:', error);
    return c.json({ error: '获取喂养统计失败' }, 500);
  }
});

// 获取宝宝每日喂养次数
app.get('/daily', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId, babyId, days = '7' } = c.req.query();

    if (!familyId || !babyId) {
      return c.json({ error: '缺少 familyId 或 babyId' }, 400);
    }

    const db = new Database(c.env.DB);

    // 验证权限
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限访问此数据' }, 403);
    }

    const daySeconds = parseInt(days) * 24 * 60 * 60;
    const startTime = db.now() - daySeconds;

    const daily = await db.all(
      `SELECT DATE(feeding_time, 'unixepoch') as date, COUNT(*) as count
       FROM feeding_records
       WHERE family_id = ? AND baby_id = ? AND feeding_time >= ?
       GROUP BY DATE(feeding_time, 'unixepoch')
       ORDER BY date DESC`,
      [familyId, babyId, startTime]
    );

    return c.json({ daily });
  } catch (error) {
    console.error('获取每日统计错误:', error);
    return c.json({ error: '获取每日统计失败' }, 500);
  }
});

export default app;

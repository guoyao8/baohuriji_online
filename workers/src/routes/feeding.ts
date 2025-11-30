import { Hono } from 'hono';
import { Env, Database, FeedingRecord } from '../db/index';
import { authMiddleware, getCurrentUserId } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use(authMiddleware);

// 获取喂养记录列表
app.get('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId, babyId, limit = '50', offset = '0' } = c.req.query();

    const db = new Database(c.env.DB);

    // 验证权限
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限访问此家庭' }, 403);
    }

    let query = 'SELECT * FROM feeding_records WHERE family_id = ?';
    const params: any[] = [familyId];

    if (babyId) {
      query += ' AND baby_id = ?';
      params.push(babyId);
    }

    query += ' ORDER BY feeding_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const records = await db.all<FeedingRecord>(query, params);

    return c.json(records);
  } catch (error) {
    console.error('获取喂养记录列表错误:', error);
    return c.json({ error: '获取喂养记录列表失败' }, 500);
  }
});

// 创建喂养记录
app.post('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId, babyId, feedingType, amount, unit, duration, feedingTime, note } = await c.req.json();

    if (!familyId || !babyId || !feedingType || !feedingTime) {
      return c.json({ error: '缺少必要字段' }, 400);
    }

    const db = new Database(c.env.DB);

    // 验证权限
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限添加记录' }, 403);
    }

    // 创建记录
    const recordId = db.generateId();
    const now = db.now();
    const recordTime = Math.floor(new Date(feedingTime).getTime() / 1000);

    await db.run(
      `INSERT INTO feeding_records (
        id, baby_id, family_id, recorded_by, feeding_type, amount, unit, 
        duration, feeding_time, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId, babyId, familyId, userId, feedingType, amount || null, unit || null,
        duration || null, recordTime, note || null, now, now
      ]
    );

    const record = await db.get<FeedingRecord>(
      'SELECT * FROM feeding_records WHERE id = ?',
      [recordId]
    );

    return c.json({ message: '喂养记录创建成功', record }, 201);
  } catch (error) {
    console.error('创建喂养记录错误:', error);
    return c.json({ error: '创建喂养记录失败' }, 500);
  }
});

// 更新喂养记录
app.put('/:recordId', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const recordId = c.req.param('recordId');
    const { feedingType, amount, unit, duration, feedingTime, note } = await c.req.json();

    const db = new Database(c.env.DB);

    const record = await db.get<FeedingRecord>(
      'SELECT * FROM feeding_records WHERE id = ?',
      [recordId]
    );

    if (!record) {
      return c.json({ error: '记录不存在' }, 404);
    }

    // 验证权限（只有记录创建者可以修改）
    if (record.recorded_by !== userId) {
      return c.json({ error: '无权限修改此记录' }, 403);
    }

    const now = db.now();
    const newFeedingTime = feedingTime 
      ? Math.floor(new Date(feedingTime).getTime() / 1000)
      : record.feeding_time;

    await db.run(
      `UPDATE feeding_records SET 
        feeding_type = ?, amount = ?, unit = ?, duration = ?, 
        feeding_time = ?, note = ?, updated_at = ? 
       WHERE id = ?`,
      [
        feedingType || record.feeding_type,
        amount !== undefined ? amount : record.amount,
        unit || record.unit,
        duration !== undefined ? duration : record.duration,
        newFeedingTime,
        note !== undefined ? note : record.note,
        now,
        recordId
      ]
    );

    const updated = await db.get<FeedingRecord>(
      'SELECT * FROM feeding_records WHERE id = ?',
      [recordId]
    );

    return c.json({ message: '喂养记录更新成功', record: updated });
  } catch (error) {
    console.error('更新喂养记录错误:', error);
    return c.json({ error: '更新喂养记录失败' }, 500);
  }
});

// 删除喂养记录
app.delete('/:recordId', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const recordId = c.req.param('recordId');

    const db = new Database(c.env.DB);

    const record = await db.get<FeedingRecord>(
      'SELECT * FROM feeding_records WHERE id = ?',
      [recordId]
    );

    if (!record) {
      return c.json({ error: '记录不存在' }, 404);
    }

    // 验证权限
    if (record.recorded_by !== userId) {
      return c.json({ error: '无权限删除此记录' }, 403);
    }

    await db.run('DELETE FROM feeding_records WHERE id = ?', [recordId]);

    return c.json({ message: '喂养记录删除成功' });
  } catch (error) {
    console.error('删除喂养记录错误:', error);
    return c.json({ error: '删除喂养记录失败' }, 500);
  }
});

export default app;

import { Hono } from 'hono';
import { Env, Database, ReminderSettings } from '../db/index';
import { authMiddleware, getCurrentUserId } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use(authMiddleware);

// 获取提醒设置
app.get('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId } = c.req.query();

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
      return c.json({ error: '无权限访问此家庭' }, 403);
    }

    const settings = await db.all<ReminderSettings>(
      'SELECT * FROM reminder_settings WHERE family_id = ?',
      [familyId]
    );

    return c.json(settings);
  } catch (error) {
    console.error('获取提醒设置错误:', error);
    return c.json({ error: '获取提醒设置失败' }, 500);
  }
});

// 创建或更新提醒设置
app.post('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId, babyId, enabled, intervalHours, intervalMinutes, reminderMethod, ringtone } = await c.req.json();

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
      return c.json({ error: '无权限修改此家庭的设置' }, 403);
    }

    // 检查是否已存在
    const existing = await db.get<ReminderSettings>(
      'SELECT * FROM reminder_settings WHERE family_id = ? AND baby_id = ?',
      [familyId, babyId || null]
    );

    const now = db.now();

    if (existing) {
      // 更新
      await db.run(
        `UPDATE reminder_settings SET 
          enabled = ?, interval_hours = ?, interval_minutes = ?, 
          reminder_method = ?, ringtone = ?, updated_at = ? 
         WHERE id = ?`,
        [
          enabled !== undefined ? enabled : existing.enabled,
          intervalHours || existing.interval_hours,
          intervalMinutes !== undefined ? intervalMinutes : existing.interval_minutes,
          reminderMethod || existing.reminder_method,
          ringtone || existing.ringtone,
          now,
          existing.id
        ]
      );
    } else {
      // 创建
      const settingId = db.generateId();
      await db.run(
        `INSERT INTO reminder_settings (
          id, family_id, baby_id, enabled, interval_hours, interval_minutes, 
          reminder_method, ringtone, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settingId,
          familyId,
          babyId || null,
          enabled !== undefined ? enabled : true,
          intervalHours || 3,
          intervalMinutes || 0,
          reminderMethod || 'both',
          ringtone || 'default',
          now,
          now
        ]
      );
    }

    const setting = await db.get<ReminderSettings>(
      'SELECT * FROM reminder_settings WHERE family_id = ? AND baby_id = ?',
      [familyId, babyId || null]
    );

    return c.json({ message: '提醒设置已保存', setting });
  } catch (error) {
    console.error('保存提醒设置错误:', error);
    return c.json({ error: '保存提醒设置失败' }, 500);
  }
});

export default app;

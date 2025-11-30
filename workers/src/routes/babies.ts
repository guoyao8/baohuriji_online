import { Hono } from 'hono';
import { Env, Database, Baby } from '../db/index';
import { authMiddleware, getCurrentUserId } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use(authMiddleware);

// 获取家庭的所有宝宝
app.get('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const familyId = c.req.query('familyId');

    if (!familyId) {
      return c.json({ error: '缺少 familyId' }, 400);
    }

    const db = new Database(c.env.DB);

    // 验证用户是否属于该家庭
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限访问此家庭' }, 403);
    }

    // 获取宝宝列表
    const babies = await db.all<Baby>(
      'SELECT * FROM babies WHERE family_id = ? ORDER BY created_at DESC',
      [familyId]
    );

    return c.json(babies);
  } catch (error) {
    console.error('获取宝宝列表错误:', error);
    return c.json({ error: '获取宝宝列表失败' }, 500);
  }
});

// 创建宝宝
app.post('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { familyId, name, gender, birthDate } = await c.req.json();

    if (!familyId || !name || !gender || !birthDate) {
      return c.json({ error: '缺少必要字段' }, 400);
    }

    const db = new Database(c.env.DB);

    // 验证用户是否属于该家庭
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限添加宝宝' }, 403);
    }

    // 创建宝宝
    const babyId = db.generateId();
    const now = db.now();

    await db.run(
      `INSERT INTO babies (id, family_id, name, gender, birth_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [babyId, familyId, name, gender, Math.floor(new Date(birthDate).getTime() / 1000), now, now]
    );

    const baby = await db.get<Baby>(
      'SELECT * FROM babies WHERE id = ?',
      [babyId]
    );

    return c.json({ message: '宝宝创建成功', baby }, 201);
  } catch (error) {
    console.error('创建宝宝错误:', error);
    return c.json({ error: '创建宝宝失败' }, 500);
  }
});

// 更新宝宝
app.put('/:babyId', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const babyId = c.req.param('babyId');
    const { name, gender, birthDate, avatarUrl } = await c.req.json();

    const db = new Database(c.env.DB);

    // 获取宝宝信息
    const baby = await db.get<Baby>(
      'SELECT * FROM babies WHERE id = ?',
      [babyId]
    );

    if (!baby) {
      return c.json({ error: '宝宝不存在' }, 404);
    }

    // 验证用户是否属于该家庭
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [baby.family_id, userId]
    );

    if (!member) {
      return c.json({ error: '无权限编辑此宝宝' }, 403);
    }

    // 更新宝宝
    const now = db.now();
    const newBirthDate = birthDate ? Math.floor(new Date(birthDate).getTime() / 1000) : baby.birth_date;

    await db.run(
      `UPDATE babies SET name = ?, gender = ?, birth_date = ?, avatar_url = ?, updated_at = ?
       WHERE id = ?`,
      [name || baby.name, gender || baby.gender, newBirthDate, avatarUrl || baby.avatar_url, now, babyId]
    );

    const updatedBaby = await db.get<Baby>(
      'SELECT * FROM babies WHERE id = ?',
      [babyId]
    );

    return c.json({ message: '宝宝更新成功', baby: updatedBaby });
  } catch (error) {
    console.error('更新宝宝错误:', error);
    return c.json({ error: '更新宝宝失败' }, 500);
  }
});

// 删除宝宝
app.delete('/:babyId', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const babyId = c.req.param('babyId');

    const db = new Database(c.env.DB);

    // 获取宝宝信息
    const baby = await db.get<Baby>(
      'SELECT * FROM babies WHERE id = ?',
      [babyId]
    );

    if (!baby) {
      return c.json({ error: '宝宝不存在' }, 404);
    }

    // 验证用户是否属于该家庭
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [baby.family_id, userId]
    );

    if (!member) {
      return c.json({ error: '无权限删除此宝宝' }, 403);
    }

    // 删除宝宝（级联删除相关记录）
    await db.run('DELETE FROM babies WHERE id = ?', [babyId]);

    return c.json({ message: '宝宝删除成功' });
  } catch (error) {
    console.error('删除宝宝错误:', error);
    return c.json({ error: '删除宝宝失败' }, 500);
  }
});

export default app;

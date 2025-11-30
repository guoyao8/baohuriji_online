import { Hono } from 'hono';
import { Env, Database, Family, FamilyMember } from '../db/index';
import { authMiddleware, getCurrentUserId } from '../middleware/auth';
import { generateInviteCode } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

app.use(authMiddleware);

// 获取用户的所有家庭
app.get('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const db = new Database(c.env.DB);

    const families = await db.all<Family>(
      `SELECT f.* FROM families f
       INNER JOIN family_members fm ON f.id = fm.family_id
       WHERE fm.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return c.json(families);
  } catch (error) {
    console.error('获取家庭列表错误:', error);
    return c.json({ error: '获取家庭列表失败' }, 500);
  }
});

// 创建家庭
app.post('/', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { name } = await c.req.json();

    const db = new Database(c.env.DB);

    // 创建家庭
    const familyId = db.generateId();
    const now = db.now();
    const inviteCode = generateInviteCode();

    await db.run(
      `INSERT INTO families (id, name, invite_code, created_by, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [familyId, name || null, inviteCode, userId, now]
    );

    // 添加创建者为家庭成员
    const memberId = db.generateId();
    await db.run(
      `INSERT INTO family_members (id, family_id, user_id, role, nickname, joined_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [memberId, familyId, userId, 'admin', name || '家长', now]
    );

    const family = await db.get<Family>(
      'SELECT * FROM families WHERE id = ?',
      [familyId]
    );

    return c.json({ message: '家庭创建成功', family }, 201);
  } catch (error) {
    console.error('创建家庭错误:', error);
    return c.json({ error: '创建家庭失败' }, 500);
  }
});

// 获取家庭成员
app.get('/:familyId/members', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const familyId = c.req.param('familyId');

    const db = new Database(c.env.DB);

    // 验证权限
    const member = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );

    if (!member) {
      return c.json({ error: '无权限访问此家庭' }, 403);
    }

    const members = await db.all<FamilyMember>(
      'SELECT * FROM family_members WHERE family_id = ?',
      [familyId]
    );

    return c.json(members);
  } catch (error) {
    console.error('获取家庭成员错误:', error);
    return c.json({ error: '获取家庭成员失败' }, 500);
  }
});

// 加入家庭（通过邀请码）
app.post('/join', async (c) => {
  try {
    const userId = getCurrentUserId(c);
    const { inviteCode, nickname } = await c.req.json();

    if (!inviteCode || !nickname) {
      return c.json({ error: '邀请码和昵称不能为空' }, 400);
    }

    const db = new Database(c.env.DB);

    // 查找家庭
    const family = await db.get<Family>(
      'SELECT * FROM families WHERE invite_code = ?',
      [inviteCode]
    );

    if (!family) {
      return c.json({ error: '邀请码无效' }, 404);
    }

    // 检查是否已经是成员
    const existing = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [family.id, userId]
    );

    if (existing) {
      return c.json({ error: '您已经是该家庭的成员' }, 400);
    }

    // 添加成员
    const memberId = db.generateId();
    const now = db.now();

    await db.run(
      `INSERT INTO family_members (id, family_id, user_id, role, nickname, joined_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [memberId, family.id, userId, 'member', nickname, now]
    );

    return c.json({ message: '成功加入家庭', family });
  } catch (error) {
    console.error('加入家庭错误:', error);
    return c.json({ error: '加入家庭失败' }, 500);
  }
});

export default app;

import { Hono } from 'hono';
import { Env, Database, User } from '../db/index';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

const app = new Hono<{ Bindings: Env }>();

// 注册
app.post('/register', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400);
    }

    const db = new Database(c.env.DB);
    
    // 检查用户是否已存在
    const existingUser = await db.get<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return c.json({ error: '用户名已存在' }, 400);
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const userId = db.generateId();
    await db.run(
      'INSERT INTO users (id, username, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [userId, username, hashedPassword, db.now(), db.now()]
    );

    // 生成 token
    const secret = c.env.JWT_SECRET || 'your-secret-key';
    const token = generateToken(userId, secret);

    return c.json({
      message: '注册成功',
      user: { id: userId, username },
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    return c.json({ error: '注册失败' }, 500);
  }
});

// 登录
app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400);
    }

    const db = new Database(c.env.DB);
    
    // 查找用户
    const user = await db.get<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 验证密码
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 生成 token
    const secret = c.env.JWT_SECRET || 'your-secret-key';
    const token = generateToken(user.id, secret);

    return c.json({
      message: '登录成功',
      user: { id: user.id, username: user.username },
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    return c.json({ error: '登录失败' }, 500);
  }
});

// 获取当前用户信息
app.get('/me', async (c) => {
  try {
    const userId = c.get('userId');
    const db = new Database(c.env.DB);

    const user = await db.get<User>(
      'SELECT id, username, avatar_url, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return c.json({ error: '获取用户信息失败' }, 500);
  }
});

// 修改密码
app.post('/change-password', async (c) => {
  try {
    const userId = c.get('userId');
    const { oldPassword, newPassword } = await c.req.json();

    if (!oldPassword || !newPassword) {
      return c.json({ error: '旧密码和新密码不能为空' }, 400);
    }

    const db = new Database(c.env.DB);

    // 获取用户信息
    const user = await db.get<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }

    // 验证旧密码
    const passwordMatch = await comparePassword(oldPassword, user.password);
    if (!passwordMatch) {
      return c.json({ error: '旧密码不正确' }, 401);
    }

    // 哈希新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [hashedPassword, db.now(), userId]
    );

    return c.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    return c.json({ error: '修改密码失败' }, 500);
  }
});

export default app;

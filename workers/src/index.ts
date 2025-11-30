import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { Env } from './db/index';

// 路由导入
import authRoutes from './routes/auth';
import babiesRoutes from './routes/babies';
import feedingRoutes from './routes/feeding';
import statsRoutes from './routes/stats';
import familyRoutes from './routes/family';
import reminderRoutes from './routes/reminder';

const app = new Hono<{ Bindings: Env }>();

// CORS 中间件
app.use('*', corsMiddleware(process.env.ALLOWED_ORIGINS || 'http://localhost:5173'));

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.route('/api/auth', authRoutes);
app.route('/api/babies', babiesRoutes);
app.route('/api/feeding', feedingRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/family', familyRoutes);
app.route('/api/reminder', reminderRoutes);

// 404 处理
app.notFound((c) => {
  return c.json({ error: '路由不存在' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: '服务器错误' }, 500);
});

export default app;

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import babyRoutes from './routes/babies.js';
import feedingRecordRoutes from './routes/feedingRecords.js';
import statsRoutes from './routes/stats.js';
import familyRoutes from './routes/family.js';
import reminderRoutes from './routes/reminder.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制以支持Base64图片
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // /api/users/me
app.use('/api/babies', babyRoutes);
app.use('/api/feeding-records', feedingRecordRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/reminder', reminderRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '宝贝日记API运行正常' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// Vercel Serverless Functions 不需要 listen
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 允许的源: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  });
}

// 导出 app 供 Vercel 使用
export default app;

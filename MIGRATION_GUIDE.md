# SQLPub + Cloudflare Workers + GitHub Pages 部署指南

本指南说明如何将项目从原始部署方案迁移到 SQLPub + Cloudflare Workers + GitHub Pages。

## 架构概述

```
GitHub Pages (前端静态页面)
        ↓
   React + Vite
        ↓
   HTTP 请求
        ↓
Cloudflare Workers (API)
        ↓
    Hono 框架
        ↓
SQLPub (D1 数据库)
```

## 快速开始

### 1. 前置条件

- Node.js 18+
- Cloudflare 账户 (https://dash.cloudflare.com)
- GitHub 账户

### 2. 安装依赖

```bash
# 安装全局依赖
npm install

# 安装 Workers 依赖
cd workers
npm install
cd ..
```

### 3. 配置 Cloudflare 账户

#### 3.1 获取 API 令牌

1. 登录 Cloudflare Dashboard
2. 进入 Account Settings → API Tokens
3. 创建新令牌，选择 "Edit Cloudflare Workers" 模板
4. 复制令牌备用

#### 3.2 获取 Account ID

在 Dashboard 右下角可以找到账户 ID

#### 3.3 创建 D1 数据库

```bash
cd workers
npm run db:create
```

### 4. 配置文件

#### 4.1 Workers 配置 (workers/wrangler.toml)

```toml
name = "baohuriji-api"
main = "src/index.ts"
compatibility_date = "2024-11-30"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "baohuriji"
database_id = "YOUR_D1_DATABASE_ID"  # 替换为实际 ID

[env.production.vars]
ALLOWED_ORIGINS = "https://YOUR_USERNAME.github.io"
JWT_SECRET = "your-secret-key"

[env.development]
vars = { ENVIRONMENT = "development", ALLOWED_ORIGINS = "http://localhost:5173" }
```

#### 4.2 GitHub Actions 配置 (.github/workflows/deploy.yml)

修改以下内容:

```yaml
# 前端 API 地址
VITE_API_BASE_URL: https://api.baohuriji.workers.dev/api

# GitHub Pages 自定义域名（可选）
cname: YOUR_CUSTOM_DOMAIN
```

#### 4.3 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets:

- `CLOUDFLARE_API_TOKEN`: 从 Cloudflare 获取
- `CLOUDFLARE_ACCOUNT_ID`: 从 Cloudflare 获取  
- `WORKERS_JWT_SECRET`: JWT 密钥 (自定义)

## 本地开发

### 运行前端

```bash
npm run dev
# 访问 http://localhost:5173
```

### 运行 Workers API

```bash
./test-workers.sh
# 或手动运行:
cd workers && npm run dev
# 访问 http://localhost:8787
# 健康检查: http://localhost:8787/health
```

### 应用迁移数据库

```bash
cd workers
npm run db:migrate:local
```

## 部署

### 手动部署 Workers

```bash
cd workers

# 设置环境变量
export CLOUDFLARE_API_TOKEN=your-token
export CLOUDFLARE_ACCOUNT_ID=your-account-id

# 部署
npm run deploy
```

### 自动部署前端

只需 push 到 main 分支，GitHub Actions 会自动:
1. 构建前端
2. 部署到 GitHub Pages
3. 部署 Workers API

```bash
git add .
git commit -m "Deploy update"
git push origin main
```

## API 端点

### 认证 API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 宝宝管理 API
- `GET /api/babies?familyId=XXX` - 获取宝宝列表
- `POST /api/babies` - 创建宝宝
- `PUT /api/babies/:babyId` - 更新宝宝信息
- `DELETE /api/babies/:babyId` - 删除宝宝

### 喂养记录 API
- `GET /api/feeding?familyId=XXX&babyId=XXX` - 获取喂养记录
- `POST /api/feeding` - 添加喂养记录
- `PUT /api/feeding/:recordId` - 更新喂养记录
- `DELETE /api/feeding/:recordId` - 删除喂养记录

### 统计 API
- `GET /api/stats/feeding?familyId=XXX&days=7` - 喂养统计
- `GET /api/stats/daily?familyId=XXX&babyId=XXX&days=7` - 每日统计

### 家庭管理 API
- `GET /api/family` - 获取用户家庭列表
- `POST /api/family` - 创建家庭
- `GET /api/family/:familyId/members` - 获取家庭成员
- `POST /api/family/join` - 通过邀请码加入家庭

### 提醒设置 API
- `GET /api/reminder?familyId=XXX` - 获取提醒设置
- `POST /api/reminder` - 创建/更新提醒设置

## 数据库迁移

### 从 PostgreSQL 迁移到 SQLite (D1)

数据库 schema 已在 `workers/migrations/0001_initial_schema.sql` 中定义。

应用迁移:

```bash
cd workers
npm run db:migrate
```

## 故障排除

### Workers 部署失败

```bash
# 检查配置
cat workers/wrangler.toml

# 检查日志
npm run tail

# 清除缓存重新部署
rm -rf dist
npm run deploy
```

### GitHub Pages 部署失败

1. 检查 GitHub Actions 日志
2. 确认 `VITE_API_BASE_URL` 环境变量正确
3. 检查仓库设置中的 Pages 部署来源

### API 401 错误

- 检查 JWT_SECRET 在 Workers 和前端是否一致
- 确认 token 未过期（有效期 30 天）
- 清除浏览器本地存储的 token

### CORS 错误

修改 `workers/wrangler.toml` 中的 `ALLOWED_ORIGINS`:

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://YOUR_USERNAME.github.io,https://yourdomain.com"
```

## 成本估算

- **GitHub Pages**: 免费
- **Cloudflare Workers**: 免费级别 (10 万请求/天)
- **Cloudflare D1**: 免费级别 (10 GB 存储)

## 性能优化

1. **CDN 加速**: Cloudflare Workers 自动利用全球 CDN
2. **数据库缓存**: 考虑使用 Cloudflare KV 缓存热数据
3. **代码分割**: 前端已配置 Vite 代码分割
4. **预加载**: 配置 `vite.config.ts` 中的预加载规则

## 常见命令

```bash
# 本地开发
npm run dev                 # 启动前端
./test-workers.sh          # 启动 Workers

# 构建
npm run build              # 构建前端
cd workers && npm run build # 构建 Workers

# 部署
cd workers && npm run deploy # 部署 Workers
git push origin main       # 自动部署前端

# 数据库
cd workers && npm run db:create       # 创建数据库
cd workers && npm run db:migrate      # 应用迁移
cd workers && npm run db:migrate:local # 本地迁移

# 监控
cd workers && npm run tail  # 查看实时日志
```

## 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架文档](https://hono.dev/)
- [GitHub Pages 部署](https://docs.github.com/en/pages)
- [Vite 构建文档](https://vitejs.dev/)

## 支持

遇到问题? 检查:

1. `.github/workflows/deploy.yml` 中的构建日志
2. Cloudflare Dashboard 中的 Workers 日志
3. Workers 本地日志: `npm run tail`
4. 环境变量是否正确设置

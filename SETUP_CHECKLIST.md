# SQLPub + Cloudflare Workers + GitHub Pages 部署清单

## ✅ 已完成的工作

### 1. Cloudflare Workers 项目结构
- ✅ `workers/` 目录及配置
- ✅ `workers/wrangler.toml` - Workers 主配置
- ✅ `workers/package.json` - Workers 依赖
- ✅ `workers/tsconfig.json` - TypeScript 配置

### 2. SQLPub (D1) 数据库
- ✅ `workers/migrations/0001_initial_schema.sql` - 完整 schema
- ✅ 所有表: users, families, family_members, babies, feeding_records, reminder_settings
- ✅ 索引和外键约束

### 3. API 实现 (Hono 框架)
- ✅ `workers/src/db/index.ts` - 数据库抽象层
- ✅ `workers/src/utils/auth.ts` - JWT & 密码加密
- ✅ `workers/src/middleware/` - CORS 和认证中间件
- ✅ `workers/src/routes/` - 所有 API 路由:
  - ✅ 认证 (auth.ts)
  - ✅ 宝宝管理 (babies.ts)
  - ✅ 喂养记录 (feeding.ts)
  - ✅ 统计 (stats.ts)
  - ✅ 家庭管理 (family.ts)
  - ✅ 提醒设置 (reminder.ts)

### 4. 前端更新
- ✅ 更新 `src/services/api.ts` - API 端口从 3000 改为 8787
- ✅ 添加 `.env.example` - 环境配置模板

### 5. 自动化部署
- ✅ `.github/workflows/deploy.yml` - GitHub Actions 配置
- ✅ 前端自动构建和部署到 GitHub Pages
- ✅ Workers 自动部署到 Cloudflare

### 6. 脚本和文档
- ✅ `migrate-deploy.sh` - 自动化迁移脚本
- ✅ `test-workers.sh` - 本地测试脚本
- ✅ `MIGRATION_GUIDE.md` - 详细迁移指南

---

## 🔧 需要手动配置的事项

### 步骤 1: Cloudflare 账户配置

```bash
# 1. 登录 Cloudflare Dashboard: https://dash.cloudflare.com
# 2. 复制 Account ID (右下角)
# 3. 创建 API Token:
#    - Account Settings → API Tokens
#    - 选择 "Edit Cloudflare Workers" 模板
#    - 复制 Token

# 4. 设置本地环境变量 (仅开发时)
export CLOUDFLARE_API_TOKEN=your-token
export CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### 步骤 2: 修改配置文件

#### 修改 `workers/wrangler.toml`

```toml
# 替换 YOUR_D1_DATABASE_ID
[[d1_databases]]
database_id = "YOUR_D1_DATABASE_ID"

# 替换 GitHub Pages 地址
[env.production.vars]
ALLOWED_ORIGINS = "https://YOUR_USERNAME.github.io"
```

#### 修改 `.github/workflows/deploy.yml`

```yaml
# 将 YOUR_CUSTOM_DOMAIN 替换为你的域名（可选）
cname: YOUR_CUSTOM_DOMAIN

# 将 api.baohuriji.workers.dev 替换为你的 Workers 域名
VITE_API_BASE_URL: https://YOUR_WORKERS_DOMAIN/api
```

### 步骤 3: GitHub Secrets 配置

在 GitHub 仓库设置中添加:

1. `Settings` → `Secrets and variables` → `Actions`
2. 新增以下 Secrets:

| Secret 名称 | 值 |
|------------|-----|
| `CLOUDFLARE_API_TOKEN` | 从 Cloudflare 获取 |
| `CLOUDFLARE_ACCOUNT_ID` | 从 Cloudflare 获取 |
| `WORKERS_JWT_SECRET` | 自定义密钥（例如: `your-super-secret-key-123`） |

### 步骤 4: 创建 D1 数据库

```bash
cd workers

# 方法 1: 通过脚本
npm run db:create

# 方法 2: 通过 Cloudflare CLI
wrangler d1 create baohuriji
```

复制返回的 `database_id` 到 `wrangler.toml`

### 步骤 5: 应用数据库迁移

```bash
cd workers

# 生产环境
npm run db:migrate

# 本地测试
npm run db:migrate:local
```

---

## 🚀 快速部署流程

### 本地测试

```bash
# 1. 启动前端开发服务器
npm run dev
# 访问 http://localhost:5173

# 2. 另一个终端启动 Workers
./test-workers.sh
# 访问 http://localhost:8787/health
```

### 部署到生产环境

```bash
# 1. 首次部署 Workers
cd workers
npm run deploy

# 2. 提交代码并推送
git add .
git commit -m "Deploy SQLPub + Workers + GitHub Pages"
git push origin main

# GitHub Actions 会自动:
# - 构建前端
# - 部署到 GitHub Pages
# - 部署 Workers API
```

---

## 📋 关键信息表

| 组件 | 地址 | 说明 |
|------|------|------|
| 前端 | `https://YOUR_USERNAME.github.io` | React + Vite |
| API | `https://YOUR_WORKERS_DOMAIN` | Hono + Cloudflare Workers |
| 数据库 | SQLPub (D1) | Cloudflare 托管 SQLite |

---

## 🔍 常见问题排查

### 问题: Workers 部署失败

```bash
# 检查配置
cat workers/wrangler.toml

# 查看日志
npm run tail

# 重新部署
npm run deploy
```

### 问题: GitHub Pages 显示 404

1. 检查仓库 Settings → Pages
2. 确认部署来源是 "GitHub Actions"
3. 检查 Actions 日志中的构建输出

### 问题: API 请求失败 (CORS/401)

```bash
# 检查 API 端点
curl -i http://localhost:8787/health

# 检查 Workers 日志
npm run tail

# 检查前端 console 日志
```

### 问题: 数据库迁移失败

```bash
# 检查数据库连接
npm run db:execute

# 查看迁移历史
ls workers/migrations/

# 重新应用迁移
npm run db:migrate
```

---

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Hono 框架文档](https://hono.dev/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)

---

## ✨ 完成标志

当以下条件都满足时，迁移成功完成:

- ✅ GitHub Pages 可以访问前端
- ✅ Workers API 可以响应 `/health` 请求
- ✅ 前端可以成功注册和登录
- ✅ 可以创建宝宝、记录喂养、查看统计

---

## 后续优化

- [ ] 配置自定义域名
- [ ] 设置 Cloudflare KV 缓存
- [ ] 添加 CDN 缓存头
- [ ] 实现 API 速率限制
- [ ] 添加错误监控 (Sentry 等)
- [ ] 实现数据备份策略

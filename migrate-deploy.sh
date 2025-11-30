#!/bin/bash
set -e

echo "🚀 宝贝日记 - 迁移部署脚本"
echo "=================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 安装根目录依赖
echo "📦 安装前端依赖..."
npm install

# 安装 Workers 依赖
echo "📦 安装 Workers 依赖..."
cd workers
npm install
cd ..

# 验证 Cloudflare 账户配置
echo "🔑 检查 Cloudflare 配置..."
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  未设置 CLOUDFLARE_API_TOKEN"
    echo "请设置环境变量:"
    echo "  export CLOUDFLARE_API_TOKEN=your-api-token"
    echo "  export CLOUDFLARE_ACCOUNT_ID=your-account-id"
fi

# 构建前端
echo "🔨 构建前端..."
npm run build

# 验证 Workers 配置
echo "⚙️  验证 Workers 配置..."
if [ -f "workers/.env.local" ]; then
    echo "✅ Workers 环境文件已存在"
else
    echo "⚠️  创建 workers/.env.local..."
    cat > workers/.env.local << 'EOF'
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=your-database-url
ENVIRONMENT=development
EOF
fi

echo ""
echo "✨ 迁移准备完成！"
echo ""
echo "📋 后续步骤:"
echo "1. 修改 workers/wrangler.toml 中的 database_id"
echo "2. 设置 Cloudflare 环境变量: CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID"
echo "3. 修改 .github/workflows/deploy.yml 中的域名配置"
echo "4. 运行 'cd workers && npm run deploy' 部署 Workers API"
echo "5. 运行 'git push' 自动部署前端到 GitHub Pages"
echo ""

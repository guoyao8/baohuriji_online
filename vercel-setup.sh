#!/bin/bash

# 宝贝日记 - Vercel + Supabase 一键部署脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  宝贝日记 - Vercel 部署助手${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# 检查 Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ 请先安装 Git${NC}"
    exit 1
fi

# 1. 收集 Supabase 信息
echo -e "${YELLOW}[1/4] 配置 Supabase 数据库${NC}"
echo -e "请先在 supabase.com 创建项目并获取数据库连接字符串\n"
read -p "请输入 Supabase 数据库连接字符串: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}✗ 数据库连接字符串不能为空${NC}"
    exit 1
fi

# 生成随机 JWT Secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-random-secret-$(date +%s)")

# 保存到 .env
cd server
cat > .env <<EOF
DATABASE_URL="$DATABASE_URL"
JWT_SECRET="$JWT_SECRET"
NODE_ENV="production"
CORS_ORIGIN="*"
EOF

echo -e "${GREEN}✓ 环境变量配置完成${NC}\n"

# 2. 安装依赖并运行迁移
echo -e "${YELLOW}[2/4] 安装依赖并初始化数据库${NC}"
npm install
npx prisma generate
npx prisma migrate deploy
echo -e "${GREEN}✓ 数据库初始化完成${NC}\n"

cd ..

# 3. Git 设置
echo -e "${YELLOW}[3/4] 准备 Git 仓库${NC}"
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✓ Git 仓库已初始化${NC}"
else
    echo -e "${GREEN}✓ Git 仓库已存在${NC}"
fi

git add .
git commit -m "配置 Vercel + Supabase 部署" || echo "没有新的更改"
echo -e "${GREEN}✓ 代码已提交${NC}\n"

# 4. 部署指引
echo -e "${YELLOW}[4/4] 部署到 Vercel${NC}\n"
echo -e "${BLUE}接下来请按照以下步骤操作：${NC}\n"
echo -e "1. 访问 ${GREEN}https://github.com${NC} 创建新仓库"
echo -e "2. 推送代码到 GitHub："
echo -e "   ${YELLOW}git remote add origin https://github.com/你的用户名/baohuriji.git${NC}"
echo -e "   ${YELLOW}git branch -M main${NC}"
echo -e "   ${YELLOW}git push -u origin main${NC}\n"
echo -e "3. 访问 ${GREEN}https://vercel.com${NC} 导入项目"
echo -e "4. 配置以下环境变量："
echo -e "   ${YELLOW}DATABASE_URL${NC} = $DATABASE_URL"
echo -e "   ${YELLOW}JWT_SECRET${NC} = $JWT_SECRET"
echo -e "   ${YELLOW}NODE_ENV${NC} = production"
echo -e "   ${YELLOW}CORS_ORIGIN${NC} = *\n"
echo -e "5. 点击 ${GREEN}Deploy${NC} 完成部署\n"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  准备工作完成！${NC}"
echo -e "${GREEN}=====================================${NC}\n"

echo -e "${BLUE}提示：${NC}你的 JWT_SECRET 已保存在 server/.env 中"
echo -e "在 Vercel 配置环境变量时需要用到\n"

#!/bin/bash

# 宝贝日记 - 一键部署脚本
# 使用方法: ./deploy.sh [环境]
# 环境选项: dev, staging, production

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  宝贝日记 - 部署脚本${NC}"
echo -e "${GREEN}=====================================${NC}"

# 检查参数
ENV=${1:-production}
echo -e "${YELLOW}部署环境: ${ENV}${NC}"

# 1. 检查依赖
echo -e "\n${YELLOW}[1/6] 检查依赖...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}需要安装 Node.js${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}需要安装 npm${NC}" >&2; exit 1; }
echo -e "${GREEN}✓ 依赖检查通过${NC}"

# 2. 安装前端依赖
echo -e "\n${YELLOW}[2/6] 安装前端依赖...${NC}"
npm install
echo -e "${GREEN}✓ 前端依赖安装完成${NC}"

# 3. 构建前端
echo -e "\n${YELLOW}[3/6] 构建前端...${NC}"
if [ "$ENV" = "production" ]; then
    npm run build
else
    npm run build -- --mode $ENV
fi
echo -e "${GREEN}✓ 前端构建完成${NC}"

# 4. 安装后端依赖
echo -e "\n${YELLOW}[4/6] 安装后端依赖...${NC}"
cd server
npm install
echo -e "${GREEN}✓ 后端依赖安装完成${NC}"

# 5. 运行数据库迁移
echo -e "\n${YELLOW}[5/6] 运行数据库迁移...${NC}"
npm run prisma:migrate
echo -e "${GREEN}✓ 数据库迁移完成${NC}"

# 6. 启动服务
echo -e "\n${YELLOW}[6/6] 启动服务...${NC}"
if command -v pm2 >/dev/null 2>&1; then
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✓ 服务已通过 PM2 启动${NC}"
else
    echo -e "${YELLOW}未安装 PM2，使用普通模式启动...${NC}"
    npm start &
    echo -e "${GREEN}✓ 服务已启动${NC}"
fi

cd ..

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "${YELLOW}前端构建产物: ./dist${NC}"
echo -e "${YELLOW}后端服务: http://localhost:3000${NC}"
echo -e "\n${YELLOW}提示: 请确保已配置正确的环境变量${NC}"

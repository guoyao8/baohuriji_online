#!/bin/bash

# 宝贝日记 - 部署前检查脚本
# 使用方法: ./check-deployment.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  宝贝日记 - 部署前检查${NC}"
echo -e "${BLUE}=====================================${NC}\n"

ERRORS=0
WARNINGS=0

# 检查 Node.js
echo -e "${YELLOW}[1/10] 检查 Node.js...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js 已安装: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js 未安装${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 检查 npm
echo -e "\n${YELLOW}[2/10] 检查 npm...${NC}"
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm 已安装: ${NPM_VERSION}${NC}"
else
    echo -e "${RED}✗ npm 未安装${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 检查前端依赖
echo -e "\n${YELLOW}[3/10] 检查前端依赖...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ 前端依赖已安装${NC}"
else
    echo -e "${YELLOW}⚠ 前端依赖未安装，运行: npm install${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 检查后端依赖
echo -e "\n${YELLOW}[4/10] 检查后端依赖...${NC}"
if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✓ 后端依赖已安装${NC}"
else
    echo -e "${YELLOW}⚠ 后端依赖未安装，运行: cd server && npm install${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 检查环境变量文件
echo -e "\n${YELLOW}[5/10] 检查环境变量文件...${NC}"
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓ 后端环境变量文件存在${NC}"
    
    # 检查关键环境变量
    if grep -q "JWT_SECRET=\"your-super-secret" server/.env; then
        echo -e "${RED}✗ JWT_SECRET 未修改，请设置安全的密钥！${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ JWT_SECRET 已配置${NC}"
    fi
    
    if grep -q "DATABASE_URL" server/.env; then
        echo -e "${GREEN}✓ DATABASE_URL 已配置${NC}"
    else
        echo -e "${RED}✗ DATABASE_URL 未配置${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ 后端环境变量文件不存在，运行: cp server/.env.example server/.env${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 检查数据库连接
echo -e "\n${YELLOW}[6/10] 检查数据库...${NC}"
if command -v psql >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL 客户端已安装${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL 客户端未安装（如使用云数据库可忽略）${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 检查 Prisma
echo -e "\n${YELLOW}[7/10] 检查 Prisma...${NC}"
if [ -d "server/node_modules/@prisma" ]; then
    echo -e "${GREEN}✓ Prisma 已安装${NC}"
    if [ -d "server/node_modules/.prisma/client" ]; then
        echo -e "${GREEN}✓ Prisma Client 已生成${NC}"
    else
        echo -e "${YELLOW}⚠ Prisma Client 未生成，运行: cd server && npx prisma generate${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Prisma 未安装${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 检查构建配置
echo -e "\n${YELLOW}[8/10] 检查构建配置...${NC}"
if [ -f "vite.config.ts" ]; then
    echo -e "${GREEN}✓ Vite 配置文件存在${NC}"
else
    echo -e "${RED}✗ Vite 配置文件缺失${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓ TypeScript 配置文件存在${NC}"
else
    echo -e "${RED}✗ TypeScript 配置文件缺失${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 检查部署配置文件
echo -e "\n${YELLOW}[9/10] 检查部署配置文件...${NC}"
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓ Vercel 配置文件存在${NC}"
fi
if [ -f "netlify.toml" ]; then
    echo -e "${GREEN}✓ Netlify 配置文件存在${NC}"
fi
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓ Docker Compose 配置文件存在${NC}"
fi
if [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}✓ Capacitor 配置文件存在${NC}"
fi

# 检查生产环境变量
echo -e "\n${YELLOW}[10/10] 检查生产环境变量...${NC}"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ 生产环境变量文件存在${NC}"
    if grep -q "yourdomain.com" .env.production; then
        echo -e "${YELLOW}⚠ 请修改 .env.production 中的域名为实际域名${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠ 生产环境变量文件不存在（可选）${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 总结
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}  检查完成${NC}"
echo -e "${BLUE}=====================================${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过！可以开始部署。${NC}\n"
    echo -e "${BLUE}建议的部署步骤：${NC}"
    echo -e "1. 本地测试：npm run dev"
    echo -e "2. 构建项目：npm run build"
    echo -e "3. 选择部署方式："
    echo -e "   - Vercel：npm run deploy:vercel"
    echo -e "   - Docker：docker-compose up -d"
    echo -e "   - APP：npm run cap:add:android"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ 有 ${WARNINGS} 个警告，建议修复后再部署。${NC}"
    exit 0
else
    echo -e "${RED}✗ 发现 ${ERRORS} 个错误和 ${WARNINGS} 个警告，请先修复错误。${NC}"
    exit 1
fi

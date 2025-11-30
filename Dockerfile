# 多阶段构建 - 前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# 安装前端依赖
RUN npm ci

# 复制前端源码
COPY src ./src
COPY public ./public
COPY index.html ./

# 构建前端
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# 后端运行环境
FROM node:18-alpine

WORKDIR /app

# 安装 PM2
RUN npm install -g pm2

# 复制后端代码
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/src ./src
COPY server/prisma ./prisma
COPY server/ecosystem.config.js ./

# 生成 Prisma Client
RUN npx prisma generate

# 复制构建好的前端文件（可选，如果要在同一个容器中提供前端）
COPY --from=frontend-builder /app/dist ./public

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

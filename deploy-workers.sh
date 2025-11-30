#!/bin/bash

# Cloudflare Workers 部署脚本

set -e

echo "🚀 部署 Cloudflare Workers API"
echo "=================================="

# 检查环境变量
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ 错误: 未设置 CLOUDFLARE_API_TOKEN"
    echo ""
    echo "请设置环境变量:"
    echo "  export CLOUDFLARE_API_TOKEN=your-api-token"
    echo "  export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ 错误: 未设置 CLOUDFLARE_ACCOUNT_ID"
    echo ""
    echo "请设置环境变量:"
    echo "  export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    exit 1
fi

echo "✅ 环境变量已设置"
echo ""

# 进入 workers 目录
cd workers

# 安装依赖
echo "📦 安装依赖..."
npm install

# 部署
echo "🔨 部署 Workers..."
npm run deploy

echo ""
echo "✅ 部署完成！"
echo ""
echo "API 地址: https://baohuriji-api.workers.dev"
echo ""

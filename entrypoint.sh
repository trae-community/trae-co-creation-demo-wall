#!/bin/sh
set -e

if [ "${RUN_DB_INIT:-true}" = "true" ]; then
  echo "========================================"
  echo "🔧 数据库初始化服务启动"
  echo "========================================"
  
  echo "等待数据库连接就绪..."
  until node -e "require('net').createConnection({host:'db',port:5432}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" 2>/dev/null; do
    sleep 1
  done
  echo "✅ 数据库连接成功！\n"

  echo "步骤 1/2: 运行数据库迁移 (prisma db push)..."
  # 禁止破坏性变更：不使用 --accept-data-loss，schema 中的删列/改类型会导致迁移失败并阻断部署，需人工确认后处理
  node node_modules/prisma/build/index.js db push
  echo "✅ 数据库迁移完成！\n"

  echo "步骤 2/2: 初始化种子数据 (npm run seed)..."
  echo "💡 提示：首次部署会创建角色、字典、root用户等基础数据"
  echo "💡 更新部署会使用 upsert 操作，不会重复创建已有数据\n"
  
  # 执行 seed.ts 并捕获退出码
  if node node_modules/tsx/dist/cli.mjs prisma/seed.ts; then
    echo "✅ 种子数据初始化完成！\n"
  else
    echo "⚠️  种子数据初始化失败或已存在旧数据（不影响服务启动）"
    echo "ℹ️  如需手动初始化，请运行: npm run db:seed"
  fi
  
  echo "========================================"
  echo "✅ 数据库初始化完成"
  echo "========================================\n"
fi

if [ "${START_SERVER:-true}" != "true" ]; then
  echo "Initialization completed, exiting without starting server."
  exit 0
fi

echo "Starting application..."
exec node server.js

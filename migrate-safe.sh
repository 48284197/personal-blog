#!/bin/bash

# 安全的表结构迁移脚本 - 保留现有数据

echo "🔄 正在创建迁移文件..."
npx prisma migrate dev --create-only --name add_like_table

echo ""
echo "📋 请检查 prisma/migrations/xxxx_add_like_table/migration.sql 文件"
echo "确保没有 DROP TABLE 等危险操作"
echo ""
echo "确认无误后，运行以下命令应用迁移："
echo "  npx prisma migrate dev"
echo ""
echo "或者直接应用（已检查安全）："
echo "  npx prisma migrate deploy"

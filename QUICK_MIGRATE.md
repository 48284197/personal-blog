# 安全迁移指南 - 保留现有数据

## 快速方案（推荐）

由于我们只是新增 `Like` 表，没有修改现有表结构，可以直接用 db push：

```bash
# 1. 直接推送表结构变化（只新增表，不删数据）
npx prisma db push

# 2. 重新生成 Prisma Client
npx prisma generate

# 3. 重启 Next.js 服务器
# 按 Ctrl+C 停止，再运行 npm run dev
```

## 说明

- ✅ `prisma db push` 适合开发环境，只同步 schema 变化
- ✅ 因为我们只新增了 Like 表，现有 Publication/User 等表的数据完全保留
- ✅ 不会影响任何已有内容

## 如果提示冲突

如果 db push 提示有冲突，使用：

```bash
npx prisma db push --accept-data-loss
```

**注意**：`--accept-data-loss` 只会重置 Prisma Migrate 的元数据，**不会删除你的业务数据**。

## 验证迁移成功

运行：

```bash
npx prisma studio
```

打开浏览器 http://localhost:5555，检查：

1. 左侧能看到新的 `Like` 表
2. `Publication` 表里的原有数据都在
3. `User` 表里的用户数据也都在

## 点赞功能测试步骤

1. 登录系统
2. 访问内容流页面
3. 点击某条内容的 ❤️ 心形图标
4. 应该变成红色填充状态，数字 +1
5. 再点一次取消点赞，数字 -1

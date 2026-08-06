# 毛球

基于 TanStack Start、TanStack Router、Vite、React、Tailwind CSS 和 Prisma 的宠物社区。

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认运行在 <http://localhost:3000>。

## 检查与构建

```bash
npm run typecheck
npm run build
npm start
```

`npm run build` 会先生成 Prisma Client，再通过 Vite 和 Nitro 输出 Node.js 服务到 `.output/`。

## 路由结构

- 页面和 API 路由位于 `app/`，遵循 TanStack Router 文件路由约定。
- 根布局为 `app/__root.tsx`。
- 生成的类型安全路由树为 `routeTree.gen.ts`。
- Router 工厂位于 `router.tsx`，Vite/TanStack Start 配置位于 `vite.config.ts`。

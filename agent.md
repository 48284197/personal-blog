# Personal Blog - 项目概览

## 项目简介
这是一个基于 Next.js 16 构建的个人博客系统，使用 App Router 架构，支持文章发布、标签分类、深色模式等功能。

## 技术栈

### 核心框架
- **Next.js 16.1.6** - React 框架，使用 App Router
- **React 19.2.3** - UI 库
- **TypeScript 5** - 类型安全

### 数据库
- **Prisma 5.22.0** - ORM 工具
- **PostgreSQL** - 数据库

### 样式与 UI
- **Tailwind CSS v4** - 原子化 CSS 框架
- **shadcn/ui** - 组件库（基于 Radix UI）
- **lucide-react** - 图标库
- **class-variance-authority** - 类名变体管理
- **clsx + tailwind-merge** - 类名合并工具

### 工具库
- **dayjs** - 日期处理
- **zod** - 数据验证

## 项目结构

```
personal-blog/
├── app/                    # Next.js App Router 页面
│   ├── about/             # 关于页面
│   │   └── page.tsx
│   ├── posts/             # 文章相关页面
│   │   ├── [slug]/       # 文章详情页
│   │   │   └── page.tsx
│   │   └── page.tsx      # 文章列表页
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── lib/                   # 工具函数
│   ├── prisma.ts         # Prisma 客户端实例
│   └── utils.ts          # 工具函数
├── prisma/               # 数据库配置
│   └── schema.prisma     # 数据模型定义
├── public/               # 静态资源
└── package.json          # 项目配置
```

## 数据模型

### Post（文章）
- `id`: 唯一标识符（cuid）
- `title`: 文章标题
- `slug`: URL 友好的唯一标识
- `content`: 文章内容（HTML）
- `excerpt`: 摘要（可选）
- `coverImage`: 封面图 URL（可选）
- `published`: 是否发布
- `createdAt`: 创建时间
- `updatedAt`: 更新时间
- `publishedAt`: 发布时间（可选）
- `tags`: 关联的标签
- `categories`: 关联的分类

### Tag（标签）
- `id`: 唯一标识符
- `name`: 标签名称（唯一）
- `slug`: URL 友好的唯一标识
- `createdAt`: 创建时间
- `posts`: 关联的文章

### Category（分类）
- `id`: 唯一标识符
- `name`: 分类名称（唯一）
- `slug`: URL 友好的唯一标识
- `createdAt`: 创建时间
- `posts`: 关联的文章

## 页面功能

### 首页 (`/`)
- 展示已发布的文章卡片（网格布局）
- 显示文章封面、标题、摘要、分类、标签、发布时间
- 支持响应式设计（1/2/3 列）

### 文章列表页 (`/posts`)
- 展示所有已发布文章（列表布局）
- 显示文章标题、摘要、分类、标签、发布时间

### 文章详情页 (`/posts/[slug]`)
- 展示文章完整内容
- 显示封面图、分类、标签、发布时间
- 支持返回首页

### 关于页 (`/about`)
- 个人介绍页面

## 设计风格

- **配色方案**: zinc 色系（中性灰）
- **背景**: 渐变背景（浅色/深色模式）
- **导航栏**: 固定顶部，玻璃态效果（backdrop-blur）
- **卡片**: 圆角（rounded-2xl），阴影，边框
- **深色模式**: 完整支持
- **响应式**: 移动端优先

## 开发命令

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 数据库操作

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 到数据库
npx prisma db push

# 打开 Prisma Studio
npx prisma studio
```

## 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 组件使用 Server Components（默认）
- 数据库查询在 Server Components 中进行
- 使用 Prisma 类型定义确保类型安全

## 重要提示

1. **环境变量**: 需要配置 `DATABASE_URL`（PostgreSQL 连接字符串）
2. **Prisma Client**: 使用 `lib/prisma.ts` 中的单例实例
3. **日期格式**: 使用 dayjs，统一格式为 `YYYY-MM-DD` 或 `YYYY年MM月DD日`
4. **图片存储**: 目前使用外部 URL，可扩展为云存储
5. **内容格式**: 文章内容存储为 HTML，使用 `dangerouslySetInnerHTML` 渲染

## 常见任务

### 添加新文章
在数据库中插入 Post 记录，设置 `published: true` 和 `publishedAt`

### 修改样式
使用 Tailwind CSS 类名，遵循 zinc 色系和现有设计模式

### 添加新页面
在 `app/` 目录下创建新文件夹和 `page.tsx` 文件

### 修改数据模型
编辑 `prisma/schema.prisma`，然后运行 `npx prisma db push`

# 发布内容 API 对接指南

## 概述

发布内容功能已完全对接到数据库，使用 Prisma ORM 和 PostgreSQL。

## 系统架构

### 1. 前端发布流程 (`components/content-composer.tsx`)

```
用户填写表单 → 上传文件到 OSS → 调用 /api/feed POST → 数据入库 → 刷新内容流
```

### 2. 后端 API 端点

**POST /api/feed** - 发布内容

#### 请求体 (Request Body)

```json
{
  "channel": "dialogue",           // 可选: dialogue | discussion | co-create | knowledge
  "topic": "AI 如何帮助品牌内容创作",
  "title": "新内容标题",
  "summary": "内容正文",
  "mediaType": "image",            // text | image | video | music
  "mediaOrientation": "horizontal", // 可选: horizontal | vertical (仅视频)
  "mediaLabel": "话题名称",        // 可选
  "mediaDetail": "内容摘要",       // 可选
  "mediaImages": [                 // 可选: 图片URL数组
    "https://xuxiweii.s3.bitiful.net/uploads/..."
  ],
  "mediaSrc": "https://...",       // 可选: 视频URL
  "mediaAudio": "https://...",     // 可选: 音频URL
  "mediaDuration": "03:00",        // 可选: 音频时长
  "tags": ["AI", "内容创作"]       // 可选: 标签数组
}
```

#### 响应 (Response)

**成功 (201 Created)**
```json
{
  "item": {
    "id": "clx...",
    "channel": "dialogue",
    "topic": "AI 如何帮助品牌内容创作",
    "title": "新内容标题",
    "summary": "内容正文",
    "author": "用户名",
    "mediaType": "image",
    "mediaImages": ["https://..."],
    "tags": ["AI", "内容创作"],
    "likes": 0,
    "comments": 0,
    "saves": 0,
    "publishedAt": "2026-04-16T10:30:00Z"
  }
}
```

**失败 (400/500)**
```json
{
  "message": "错误描述"
}
```

### 3. 数据库表结构

**Publication 表** (发布内容表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 (CUID) |
| channel | String | 频道: dialogue/discussion/co-create/knowledge |
| topic | String | 话题 |
| title | String | 标题 |
| summary | Text | 摘要/正文 |
| content | Text | 完整内容 |
| mediaType | Enum | 媒体类型: TEXT/IMAGE/AUDIO/FILE |
| mediaKind | String | 媒体种类: text/image/video/music |
| mediaOrientation | String | 媒体方向: horizontal/vertical |
| mediaLabel | String | 媒体标签 |
| mediaDetail | String | 媒体详情 |
| mediaImages | Json | 图片URL数组 |
| mediaSrc | String | 视频URL |
| mediaAudio | String | 音频URL |
| mediaDuration | String | 音频时长 |
| authorName | String | 作者名称 |
| authorAvatar | String | 作者头像 |
| authorId | String | 作者ID (关联 User 表) |
| tags | String[] | 标签数组 |
| likes | Int | 点赞数 |
| comments | Int | 评论数 |
| publishedAt | DateTime | 发布时间 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

## 工作流程详解

### 1. 文件上传流程

**POST /api/upload**

```
前端选择文件 → 验证文件大小/类型 → 上传到 S3 OSS → 返回 URL
```

**请求**
```
FormData:
- files: File[] (支持多文件)
```

**响应**
```json
{
  "files": [
    {
      "url": "https://xuxiweii.s3.bitiful.net/uploads/1713268800000-abc123-image.png",
      "name": "image.png",
      "type": "image/png",
      "size": 1024000
    }
  ]
}
```

### 2. 内容发布流程

**步骤 1: 用户填写表单**
- 话题、标题、正文
- 选择内容形式 (文字/图片/视频)
- 上传媒体文件

**步骤 2: 前端验证**
- 检查必填字段
- 验证媒体文件是否上传

**步骤 3: 上传媒体文件**
- 调用 `/api/upload` 上传文件到 OSS
- 获取文件 URL

**步骤 4: 发布内容**
- 调用 `/api/feed POST` 发送内容数据
- 后端验证数据
- 保存到数据库

**步骤 5: 更新 UI**
- 关闭发布 dialog
- 刷新内容流显示新发布的内容

## 环境变量配置

```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/database"

# AWS S3/OSS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=xuxiweii
AWS_S3_DOMAIN=https://xuxiweii.s3.bitiful.net
```

## 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|--------|
| 文件超过大小限制 | 文件 > 100MB | 压缩文件或分割上传 |
| 文件类型不支持 | 上传了不支持的格式 | 检查 accept 参数 |
| 发布失败 | 数据库连接问题 | 检查 DATABASE_URL |
| 上传失败 | OSS 凭证错误 | 检查 AWS 环境变量 |

## 测试

### 使用 curl 测试发布接口

```bash
curl -X POST http://localhost:3000/api/feed \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "测试话题",
    "title": "测试标题",
    "summary": "测试内容",
    "mediaType": "text",
    "tags": ["测试"]
  }'
```

### 使用 curl 测试上传接口

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "files=@/path/to/image.png"
```

## 调试

### 启用日志

在 `app/api/feed/route.ts` 中添加日志：

```typescript
console.log('Received payload:', body)
console.log('Creating feed item:', parsed.data)
```

### 检查数据库

```bash
# 连接数据库
psql $DATABASE_URL

# 查询最新发布的内容
SELECT id, title, author_name, created_at FROM "Publication" ORDER BY created_at DESC LIMIT 10;
```

## 常见问题

### Q: 发布后内容没有出现在列表中？
A: 检查以下几点：
1. 检查浏览器控制台是否有错误
2. 检查网络请求是否成功 (状态码 201)
3. 检查数据库是否有新记录
4. 尝试刷新页面

### Q: 上传文件失败？
A: 检查以下几点：
1. 文件大小是否超过 100MB
2. 文件类型是否被支持
3. AWS 凭证是否正确
4. 网络连接是否正常

### Q: 如何修改发布的内容？
A: 当前版本不支持编辑，需要添加 PUT /api/feed/:id 接口

## 后续改进

- [ ] 支持编辑已发布的内容
- [ ] 支持删除内容
- [ ] 支持内容草稿保存
- [ ] 支持定时发布
- [ ] 支持内容预览
- [ ] 支持富文本编辑

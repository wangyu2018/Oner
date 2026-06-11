# Oner — 轻量备忘

记录此刻，轻如空气。

一个自托管的全栈个人备忘录和任务管理应用，支持 PWA、移动端优化、AI智能助手、密码保险库和 Docker 部署。

> **当前版本：V1.2** — 首页双模式布局 + 图谱星链风格 + 全局输入统一入口

## V1.2 更新日志

### 🖥️ 首页布局双模式
- 新增「合并一页」模式：工作台与笔记详情在同一页面，shimmer 骨架屏动效过渡到 fade-in 展示
- 新增「分两页」模式：首页仅展示工作台与欢迎导航，笔记详情独立为 `/notes` 路由页面
- 布局选项添加 Windows Aero Snap 风格视觉预览（Win+↑ 最大化 / Win+←→ 并排分屏）
- 在「我的」设置页新增「首页布局」tab，支持切换并持久化至后端

### 📋 待办与笔记体验
- TodoList 新增「明日待办」toggle 开关，开启后展示全部分类明日任务（不限工作分类）
- 今日待办头部显示明日待办数量，支持快速切换展示/隐藏

### 🌌 关联图谱
- 升级为 Obsidian StarLink 星链风格：力导向图 + 动态节点 + 语义连线
- 无极画布支持缩放和平移，语义关联强度可视化

### 🤖 全局 AI 与输入体验
- 全局输入框两层结构重构：标题输入 + 内容输入分层
- AI 洞察弹窗：一键触发智能分析，联动分类筛选
- 全局快捷输入支持 AI 润色、实时预览、备忘/待办切换
- 归档分类支持，笔记归档后仍可访问

### 🎨 UI 精修
- 全局浮动 AI 输入框统一入口（FloatingQuickEntry）
- 泳道视图多项交互优化
- 登录注册页品牌化视觉增强
- 主题配色系统深色模式完善

---

## V1.1 更新日志

### 🎨 主题配色系统 v2（Indigo-500）
- 默认强调色从 Blue-500 (`#3b82f6`) 升级为 Indigo-500 (`#6366f1`)
- 新增完整 CSS 变量体系：neutral 色阶、surface/border/text/semantic/shadow 系列
- 深色主题独立设计（非简单反转）：深色版 accent 色阶更亮，表面色/边框色/文字色全部独立定义
- 保留 `useCustomTheme.js` 动态主题切换兼容性

### 🏊 泳道视图精修
- 所有 inline style 色值替换为 CSS 变量引用（40+ 处硬编码颜色移除）
- 列头：渐变背景 + dot glow 光晕 + count badge
- LaneLabel：左侧 4px 彩色边框 + 22px 圆角图标 + 4px 进度条 + 折叠按钮
- LaneCell：drop-hover 渐变背景 + 虚线边框动画 + 32px 空图标
- SwimlaneCard：hover 边框变紫 + 阴影上浮 + active 缩小动画 + 删除按钮圆角 6px
- Badge：urgent/high 渐变背景 + done-state 绿色删除线 + 透明度 0.55

### 🏠 首页下半部分重设计
- 状态筛选栏：`status-filter-bar` + `status-pill` 容器化药丸设计，带计数 badge + SVG 图标
- 区域标题行：`section-header` + 三态 `view-toggle`（网格/列表/泳道）
- 桌面端分类侧边栏：`category-sidebar` 按分类展示笔记数量
- 卡片全新设计：`note-card` + `status-*` 触发 `::before` 顶部 hover 色带、`status-badge` pill、`priority-dot` 圆点、`card-actions` hover 显示、`card-tags`/`card-updated` footer
- 空状态：渐变背景圆角图标 + 品牌色渐变 CTA 按钮

### 🔧 其他调整
- CommandBar 布局修复：header 添加 `justify-between` 确保左右布局正确
- 移除多余快捷录入栏
- CardWall 改用 `notes-grid` CSS class

---

## 设计文档

以下设计文档位于 [`产品规划/`](产品规划/) 目录，是 UI/UX 设计的权威参考：

| 文件 | 说明 |
|------|------|
| [`Oner-主题配色系统-浅色深色双主题设计.html`](产品规划/Oner-主题配色系统-浅色深色双主题设计.html) | Indigo-500 双主题配色系统：完整 accent 色阶、语义色、表面色、深色主题独立设计 |
| [`Oner-泳道视图UI精装修复版.html`](产品规划/Oner-泳道视图UI精装修复版.html) | 泳道视图 UI 精修：水平泳道×垂直状态列矩阵布局、状态筛选栏、分类标签栏、拖拽交互 |
| [`Oner-首页下半部分UI重设计方案.html`](产品规划/Oner-首页下半部分UI重设计方案.html) | 首页下半部分重设计：状态筛选栏、区域标题栏、卡片网格、列表/网格/紧凑视图切换 |
| [`Oner-超级看板-合并设计方案.html`](产品规划/Oner-超级看板-合并设计方案.html) | 超级看板：Command Bar + Today Focus Strip + 泳道式看板矩阵 |
| [`Oner-AI洞察三大子页面设计方案.html`](产品规划/Oner-AI洞察三大子页面设计方案.html) | AI 洞察三大子页面：到期提醒、本周概览、智能关联，共享 AI 设计语言 |
| [`Oner-备忘功能-智能关联与思维链设计方案.html`](产品规划/Oner-备忘功能-智能关联与思维链设计方案.html) | 智能关联（语义关联评分）、思维链视图（树状结构）、分类管理 |
| [`Oner-思维链V2-精品重设计方案.html`](产品规划/Oner-思维链V2-精品重设计方案.html) | 思维链 V2：SVG 贝塞尔曲线连线、时间轴 rail、分支/汇合可视化 |
| [`Oner-UI优化-12个方案概念图.html`](产品规划/Oner-UI优化-12个方案概念图.html) | 12 个 UI 优化方案全景概览概念图 |
| [`Oner-UI优化-Top3概念图.html`](产品规划/Oner-UI优化-Top3概念图.html) | Top 3 精选方案（Home Today Workspace 概念图） |

---

## 功能特性

### AI 智能助手
- **笔记AI面板**：打开笔记即可拆解任务、推荐行动、扩展内容、自由问答
- **全局AI对话**：独立对话页，选择分类带入上下文，流式逐字回复
- **分类总结**：一键总结某分类下所有笔记的关键信息和趋势
- **多模型支持**：DeepSeek / MiMo / OpenAI / 自定义OpenAI兼容API
- **在线配置**：设置页配置提供商、API Key、模型，测试连接
- **API Key加密**：AES-256-GCM加密存储，安全可靠

### 笔记与任务管理
- **Markdown 编辑器**：实时预览，支持完整 Markdown 语法
- **状态流转**：备忘 → 待办 → 进行中 → 已完成 → 已归档
- **优先级**：低、普通、高、紧急四级
- **截止日期**：过期检测，每日/明日提醒
- **重复任务**：每日、工作日、每周、每两周、每月、每年，完成后自动创建下一周期
- **子任务**：层级关系，进度条显示
- **标签系统**：内容中 `#标签` 自动提取
- **分类管理**：自定义分类 + 颜色标记
- **看板视图**：4列拖拽看板，支持合并子任务、提升子任务
- **撤销删除**：5 秒窗口内可撤销

### 全局搜索与命令面板
- **全文搜索**：FTS5 引擎，支持中文子串匹配
- **命令面板**：`Cmd/Ctrl+K` 唤起，Spotlight 风格
- **自然语言解析**：识别"今天"、"待办"、"紧急"等关键词自动创建笔记
- **语音输入**：Web Speech API 中文语音转文字

### 密码保险库
- **AES-256-GCM 加密**存储
- **PIN 双因素认证**：独立 PIN 保护保险库访问
- 分类筛选、搜索、一键复制

### 文件附件
- 单文件最大 10MB
- 关联到具体笔记
- 上传/下载/删除

### 用户系统
- 注册/登录（用户名或邮箱）
- 多端同步，最多 5 个设备
- 设备管理：查看/踢出设备
- 个人资料编辑

### 移动端优化
- **底部导航栏**：首页 / AI / 看板 / 密码 / 我的
- **FAB 悬浮按钮**：一键创建笔记
- **滑动切换**：状态标签页左右滑动
- **全屏编辑器**：移动端自动全屏
- **触摸优化**：44px 最小触摸目标，消除 300ms 延迟

### PWA 支持
- iPhone/Android "添加到主屏幕" 像原生 App 运行
- Service Worker 缓存静态资源
- 离线可访问已缓存页面

### 桌面应用
- Electron 原生应用（Windows/macOS/Linux）
- 系统托盘 + 全局快捷键

### 其他
- 深色/浅色模式，自动跟随系统
- 自定义主题色和壁纸
- 自定义键盘快捷键
- 数据备份导出 ZIP
- Docker + Nginx 部署
- 首页布局双模式（合并/分页），可自定义切换

## 快速开始

### 开发模式

```bash
# 终端 1 - 后端
cd backend
npm install
npm start

# 终端 2 - 前端
cd frontend
npm install
npm run dev
```

浏览器访问 http://localhost:5173

### Docker 部署

```bash
cp .env.example .env
# 编辑 .env，设置 JWT_SECRET（必填）
docker-compose up -d --build
```

浏览器访问 http://localhost:8080

### 飞牛 NAS 部署

1. SSH 登录 NAS
```bash
ssh 用户名@NAS内网IP
```

2. 克隆项目
```bash
cd /vol1/docker
git clone https://github.com/wangyu2018/Oner.git
cd Oner
```

3. 创建配置
```bash
cp .env.example .env
vi .env
```
修改 `JWT_SECRET` 为一个随机长字符串，`APP_PORT` 改为你想要的端口（默认 8080）。

4. 构建启动
```bash
docker-compose up -d --build
```

5. 查看状态
```bash
docker-compose ps
docker-compose logs -f
```

看到 `Server running on port 3000` 即成功。

6. 访问
- 局域网：`http://NAS内网IP:8080`
- 远程：在飞牛管理后台开启 fnConnect 远程访问

7. iPhone 添加到主屏幕
- Safari 打开地址 → 注册登录 → 分享按钮 → "添加到主屏幕"

### 日常维护

```bash
# 更新代码
git pull origin main
docker-compose up -d --build

# 查看日志
docker-compose logs -f backend

# 重启
docker-compose restart

# 停止
docker-compose down
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, Vite 6, TailwindCSS 3, React Router 6, @dnd-kit, Lucide React |
| 后端 | Node.js 20, Express 4, node:sqlite (原生), bcryptjs, jsonwebtoken, multer |
| 桌面端 | Electron 28, electron-builder |
| 部署 | Docker Compose, Nginx 反向代理 |
| 搜索 | SQLite FTS5 (trigram tokenizer, 支持中文) |
| 加密 | AES-256-GCM (密码保险库) |

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 注销 |
| GET | /api/auth/me | 当前用户 |
| GET | /api/auth/sessions | 设备列表 |
| DELETE | /api/auth/sessions/:id | 踢出设备 |
| PUT | /api/auth/profile | 更新资料 |
| POST | /api/auth/verify-vault-pin | 验证保险库 PIN |

### 笔记
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notes | 列表（支持 tag/status/priority/sort/cursor/limit） |
| POST | /api/notes | 创建 |
| GET | /api/notes/:id | 详情 |
| PUT | /api/notes/:id | 更新（支持版本冲突检测） |
| DELETE | /api/notes/:id | 软删除 |
| POST | /api/notes/:id/subtasks | 创建子任务 |
| GET | /api/notes/:id/subtasks | 子任务列表 |

### 搜索、分类、密码、文件、设置、提醒
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/search?q=&category=&include_passwords= | 全文搜索 |
| GET/POST/PUT/DELETE | /api/categories/* | 分类 CRUD |
| GET/POST/PUT/DELETE | /api/passwords/* | 密码保险库 CRUD |
| GET/POST/DELETE | /api/files/* | 文件附件 |
| GET/PUT | /api/settings | 用户设置 |
| GET | /api/reminders | 待办提醒 |

### AI 智能助手
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ai/chat | AI对话（支持SSE流式） |
| POST | /api/ai/analyze | 笔记分析（拆解/推荐/扩展） |
| POST | /api/ai/summarize | 分类总结 |
| GET | /api/ai/conversations | 对话历史列表 |
| GET | /api/ai/conversations/:id | 对话详情 |
| DELETE | /api/ai/conversations/:id | 删除对话 |
| GET | /api/ai/providers | 支持的AI提供商列表 |
| POST | /api/ai/test | 测试AI连接 |

### 备份
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/backup/export | 导出 ZIP |
| GET | /api/backup/download-db | 下载数据库（仅开发环境） |

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| JWT_SECRET | 是 | - | JWT 签名密钥 |
| PASSWORD_VAULT_KEY | 否 | JWT_SECRET | 密码保险库加密密钥 |
| PORT | 否 | 3000 | 后端端口 |
| DB_PATH | 否 | /data/oner.db | 数据库路径 |
| APP_PORT | 否 | 8080 | Nginx 对外端口 |
| NODE_ENV | 否 | production | 运行环境 |

## 目录结构

```
oner/
├── backend/
│   ├── src/
│   │   ├── db/          # 数据库（迁移、helpers）
│   │   ├── middleware/   # 认证中间件
│   │   ├── routes/       # API 路由（auth/notes/search/passwords/files/settings/backup/ai）
│   │   └── utils/        # 工具（crypto、aiProvider）
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # UI 组件（NoteEditor/SmartCardGrid/SwimlaneBoard/TodayFocus/CommandBar/FloatingQuickEntry...）
│   │   ├── hooks/        # 自定义 Hooks（useNotes/useAuth/usePasswords/useShortcuts/useCustomTheme...）
│   │   ├── pages/        # 页面（Home/BoardPage/NotesPage/Profile/PasswordVault/AIChat/MindChainPage...）
│   │   ├── utils/        # 工具（api、tags、keywordMatcher）
│   │   └── styles/       # 全局样式
│   ├── public/
│   │   ├── manifest.json  # PWA 配置
│   │   ├── sw.js          # Service Worker
│   │   └── icons/         # 应用图标
│   └── package.json
├── electron/              # Electron 桌面应用
├── nginx/nginx.conf       # Nginx 配置
├── docker-compose.yml     # Docker 编排
├── .env.example           # 环境变量模板
└── README.md
```

## 许可证

MIT

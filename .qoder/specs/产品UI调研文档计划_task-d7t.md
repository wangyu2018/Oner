# Oner 产品 UI 调研文档计划

## 目标
为产品经理制作一份可直接用于 UI 调研的参考文档，包含：
1. 产品当前所有页面的功能与交互
2. 产品核心亮点与差异化
3. 页面流程图与用户操作路径

## 文档结构

### 1. 产品概述
- 产品定位：AI原生 · 隐私优先 · 自托管个人知识管理
- 核心价值主张
- 技术栈一览（React 18 + Vite 6 + TailwindCSS 3 / Node.js + Express + SQLite / PWA / Docker）

### 2. 产品核心亮点（差异化卖点）
- **AI 多模型接入**：支持 DeepSeek、OpenAI、Ollama(本地)、LM Studio(本地)、MiMo、自定义
- **自然语言智能输入**：输入"明天紧急买牛奶"自动识别日期+优先级+关键词
- **全局浮动输入框**：任意页面的随手记录入口，支持拖拽和 Pin 固定
- **AI 自动分类**：创建笔记时 AI 自动匹配最佳分类
- **AI 对话与分析**：全文上下文感知的 AI 助手，支持笔记拆解、分类总结
- **密码保险库**：AES-256-GCM 加密 + PIN 双因素认证
- **看板拖拽**：4列看板（备忘→待办→进行中→已完成）支持 @dnd-kit 拖拽
- **隐私优先**：100% 自托管，支持 Ollama/LM Studio 本地模型，数据零泄露
- **PWA 离线可用**：Service Worker + 离线缓存，"添加到主屏幕"像原生 App
- **FTS5 中文搜索**：全文搜索引擎，支持中文子串匹配
- **Electron 桌面应用**：系统托盘 + 全局快捷键

### 3. 页面详细说明（共 8 个页面）

#### 3.1 首页 (Home.jsx) — 笔记列表/卡片墙
- **布局**：顶部 Toolbar + 桌面端 CardWall(卡片网格) / 移动端 SwipeStatusTabs(滑动标签)
- **核心功能**：
  - 笔记卡片墙展示（标题+内容预览+状态+优先级+标签+截止日期）
  - Toolbar 状态筛选（全部/备忘/待办/进行中/已完成）
  - 标签筛选（点击标签高亮）
  - 点击卡片打开编辑器
  - 删除笔记（5秒撤销窗口）
  - 移动端 FAB 悬浮创建按钮
  - 过期提醒浮层
- **UI 元素**：Toolbar、CardWall、NoteEditor(弹窗)、EmptyState、UndoToast、ReminderOverlay、SwipeStatusTabs

#### 3.2 看板页 (BoardPage.jsx) — 4列拖拽看板
- **布局**：Toolbar + 4列（备忘/待办/进行中/已完成）+ 子任务/归档列
- **核心功能**：
  - @dnd-kit 跨列拖拽（改变笔记状态）
  - 列内排序、子任务排序
  - 合并子任务到父任务（拖拽到卡片上松手）
  - 归档/恢复
  - 子任务列表展开/收起
  - 分类管理（新建/编辑/删除分类）
  - 右键操作菜单
- **UI 元素**：KanbanColumn、SortableNoteCard、DragOverlay、PriorityBadge、CategoryBadge、RecurrenceBadge

#### 3.3 笔记详情/编辑 (ViewNote.jsx + NoteEditor 组件)
- **布局**：全屏查看页 + 弹窗编辑器
- **核心功能**：
  - Markdown 渲染查看 + 编辑切换
  - 全功能编辑器：标题、内容(textarea)、状态、优先级、截止日期、重复规则、分类选择
  - 标签自动提取（#标签 语法）
  - 文件附件上传/下载
  - 子任务管理（增删改、进度条）
  - AI 分析（拆解子任务、行动建议、内容扩写）
- **UI 元素**：MarkdownRenderer(react-markdown)、StatusSelector、PrioritySelector、RecurrenceSelector、CategorySelector、FileAttachments、SubtaskList、TagChip

#### 3.4 登录/注册 (Login.jsx / Register.jsx)
- **布局**：居中卡片 + Logo + 表单
- **核心功能**：
  - 用户名/邮箱 + 密码登录
  - 注册（用户名+邮箱+密码+确认密码）
  - 密码显示/隐藏切换
  - Loading spinner + 错误提示
  - 登录后跳转到来源页面

#### 3.5 用户中心 (Profile.jsx)
- **布局**：左侧导航(侧边栏/移动端顶部滚动) + 右侧内容区，8个Tab
- **页面 Tab**：
  - 个人资料（用户名不可改、邮箱、头像URL）
  - 修改密码（当前密码+新密码+确认密码）
  - **AI设置**（提供商选择→DeepSeek/MiMo/OpenAI/Ollama/LM Studio/自定义，API Key，模型名，Base URL，测试连接，保存）
  - **快捷键**（命令面板/Cmd+K、语音/Cmd+Shift+V、新建笔记/Cmd+Shift+N，可自定义录制）
  - **密码库PIN**（设置/更新/清除 PIN 二次认证）
  - **密码设置**（全局搜索包含密码 开关）
  - **外观**（自定义主题色 + 壁纸）
  - **设备管理**（查看/踢出已登录设备）

#### 3.6 密码保险库 (PasswordVault.jsx)
- **布局**：PIN验证屏 + 密码列表 + 新增/编辑表单
- **核心功能**：
  - PIN 双因素认证（sessionStorage 暂存）
  - AES-256-GCM 加密存储
  - 密码 CRUD（标题、网址、用户名、密码、备注、分类）
  - 分类筛选 + 搜索
  - 一键复制（用户名/密码/URL）
  - 显示/隐藏密码
  - 分类管理

#### 3.7 AI 对话页 (AIChat.jsx)
- **布局**：左侧对话列表 + 右侧对话区，移动端可折叠
- **核心功能**：
  - SSE 流式对话（逐字输出）
  - 对话管理（新建/切换/删除）
  - 分类上下文（指定分类让 AI 了解该分类下的笔记）
  - Markdown 渲染回复
  - 对话记录持久化（保存到数据库）

### 4. 全局组件与交互

#### 4.1 顶部工具栏 (Toolbar.jsx)
- Logo + 状态筛选按钮 + 操作按钮(SyncStatus/Backup/view toggle/ThemeToggle/Electron设置) + 头像菜单
- 状态筛选：全部/备忘/待办/进行中/已完成
- 头像菜单：用户中心/密码备忘/退出登录

#### 4.2 全局浮动输入框 (FloatingQuickEntry.jsx) ⭐ 核心特色
- `position: fixed` 浮动容器，拖拽手柄 + Pin 固定
- Pointer Events 统一鼠标+触摸拖拽
- AI 模式切换（Sparkles 图标）
- 支持自然语言关键词匹配（日期、状态、优先级、分类、提醒）
- 搜索蒙版（FTS5 实时搜索）
- 语音输入
- 位置/Pin状态/AI模式持久化 localStorage

#### 4.3 命令面板 (CommandPalette.jsx)
- Cmd/Ctrl+K 全局唤起
- FTS5 全文搜索（跨笔记+密码）
- Spotlight 风格，键盘导航

#### 4.4 移动端底部导航 (BottomNav.jsx)
- 5个Tab：首页/AI/看板/密码/我的
- 活跃态高亮，移动端专属

#### 4.5 语音输入 (VoiceInput.jsx)
- Web Speech API 中文语音识别
- 录音→转文字→创建笔记

### 5. 页面流程图
- 未登录 → Login/Register → 首页
- 首页 → 点击卡片 → 查看/编辑笔记
- 首页 → 浮动输入框 → 快速创建/搜索
- 首页/看板 ↔ 视图切换
- 底部导航：首页/AI/看板/密码/个人
- 全局 Cmd+K 搜索

### 6. UI 现状总结
- 当前 UI 风格：TailwindCSS 基础样式，毛玻璃 Toolbar，蓝色调 accent
- 已有 UI 优化方案（Oner-UI-Optimization-Plan.md，12个任务，预估30h）
- 主要待优化项：Design Token 系统、原子组件库、NoteCard 重设计、动画增强、响应式完善

## 交付物
输出为 `D:\AI牛逼\oner\docs\product-ui-research.md` 文件

## 文件路径参考
- 页面文件：`frontend/src/pages/*.jsx`
- 组件文件：`frontend/src/components/*.jsx`
- Hook 文件：`frontend/src/hooks/*.js`
- 后端路由：`backend/src/routes/*.js`
- 设计文档：`ONER-PRODUCT-DESIGN.md` (1933行，完整产品设计)
- UI 优化计划：`Oner/Oner-UI-Optimization-Plan.md` (2087行)

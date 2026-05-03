# Oner — 轻量备忘

记录此刻，轻如空气。

## 功能特性

### 核心功能
- **Markdown 编辑器**：支持 Markdown 语法编写
- **标签系统**：使用 #标签 组织笔记
- **暗色/亮色模式**：自动跟随系统偏好
- **PWA 支持**：可安装为桌面/移动应用
- **自动保存**：草稿自动保存到本地
- **撤销删除**：5 秒窗口内可撤销删除
- **数据备份**：导出 ZIP 或下载数据库

### 用户系统（新增）
- **用户注册/登录**：支持用户名/邮箱登录
- **多端同步**：最多 5 个设备同时在线
- **设备管理**：查看和踢出登录设备
- **个人资料**：修改邮箱、头像、密码

### 备忘状态（新增）
- **状态管理**：备忘、待办、进行中、已完成、已归档
- **优先级**：低、普通、高、紧急四级优先级
- **截止日期**：设置截止日期，显示过期状态
- **状态筛选**：按状态筛选笔记

### 桌面应用（新增）
- **Electron 桌面版**：Windows/macOS/Linux 原生应用
- **系统托盘**：最小化到托盘，快速访问
- **全局快捷键**：Ctrl+Shift+O 显示/隐藏，Ctrl+Shift+N 新建备忘

## 快速开始

### 开发模式

**Windows：**
```bash
# 启动 Web 版
start-dev.bat

# 启动桌面版
start-electron-dev.bat
```

**Linux/Mac：**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**手动启动：**
```bash
# 终端 1 - 后端
cd backend
npm install
npm start

# 终端 2 - 前端
cd frontend
npm install
npm run dev

# 终端 3 - Electron（可选）
cd electron
npm install
npm run dev
```

浏览器访问 http://localhost:5173

### Docker 部署

```bash
docker compose up --build
```

浏览器访问 http://localhost:8080

### 构建桌面应用

```bash
# Windows 安装程序
build-electron.bat

# 或手动构建
cd electron
npm install
npm run build:win
```

构建完成后，安装程序位于 `electron/dist/` 目录。

## 快捷键说明

### 全局快捷键（桌面版）
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+O` | 显示/隐藏主窗口 |
| `Ctrl+Shift+N` | 快速新建备忘 |

### 应用内快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建备忘 |
| `Ctrl+S` | 保存备忘 |
| `Esc` | 关闭编辑器 |

## API 接口

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 注销登录 |
| GET | /api/auth/me | 获取用户信息 |
| GET | /api/auth/sessions | 获取设备列表 |
| DELETE | /api/auth/sessions/:id | 踢出设备 |
| PUT | /api/auth/profile | 更新资料 |

### 笔记接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notes | 获取笔记列表 |
| POST | /api/notes | 创建笔记 |
| GET | /api/notes/:id | 获取笔记 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |

### 查询参数
- `tag` - 按标签筛选
- `status` - 按状态筛选（note/todo/in_progress/done/archived）
- `priority` - 按优先级筛选（low/normal/high/urgent）
- `sort` - 排序字段（created_at/updated_at/due_date/priority）
- `order` - 排序方向（asc/desc）
- `cursor` - 游标分页
- `limit` - 每页数量

### 备份接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/backup/export | 导出 ZIP |
| GET | /api/backup/download-db | 下载数据库 |

## 技术栈

### 前端
- React 18
- Vite 6
- TailwindCSS 3
- React Router 6
- react-markdown
- Lucide React

### 后端
- Node.js 20
- Express 4
- sql.js (SQLite)
- bcryptjs (密码加密)
- jsonwebtoken (JWT 认证)

### 桌面应用
- Electron 28
- electron-builder

### 部署
- Docker + Nginx 反向代理

## 环境变量

复制 `.env.example` 为 `.env` 并修改：

```env
PORT=3000                    # 后端端口
DB_PATH=/data/oner.db        # 数据库路径
APP_PORT=8080                # 应用端口（Docker）
JWT_SECRET=your-secret-key   # JWT 密钥
```

## 目录结构

```
oner/
├── backend/           # 后端服务
├── frontend/          # 前端应用
├── electron/          # Electron 桌面应用
├── nginx/             # Nginx 配置
├── docker-compose.yml # Docker 编排
├── start-dev.bat      # Windows 开发启动
├── start-electron-dev.bat  # 桌面版开发启动
├── build-electron.bat      # 桌面版构建
└── README.md
```

## 许可证

MIT

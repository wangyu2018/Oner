# Oner Plugins

> Oner 插件目录 — 所有功能模块以插件形式存在

## 📁 目录结构

```
plugins/
├── _shared/                       # 共享 SDK（所有插件可引用）
│   ├── package.json               # @oner/plugin-sdk
│   ├── index.js                   # 入口导出
│   ├── constants.js               # 常量（事件、Slot、权限、字典）
│   ├── utils/                     # 工具函数
│   │   ├── date.js                # 日期格式化
│   │   ├── string.js              # 字符串处理
│   │   ├── dict-recognition.js    # 字典识别（核心能力）
│   │   ├── chain-builder.js       # 思维链构建
│   │   └── api-client.js          # API 客户端
│   └── components/                # 共享 UI 组件
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Card.jsx
│       ├── Modal.jsx
│       ├── Badge.jsx
│       ├── EmptyState.jsx
│       ├── Skeleton.jsx
│       ├── Toast.jsx
│       └── FloatingBall.jsx
│
├── oner-plugin-core-notes/        # 📝 核心笔记（不可卸载）
│   ├── plugin.json                # 插件声明
│   ├── README.md                  # 插件文档
│   ├── frontend/
│   │   ├── index.jsx              # 前端入口（activate/deactivate）
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   ├── backend/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── migrations/
│   │   └── hooks/
│   └── assets/
│       └── preview/
│
├── oner-plugin-memo/              # 🧠 智能备忘（可选）
│   ├── plugin.json
│   ├── README.md
│   └── ... 同上结构
│
├── oner-plugin-ai/                # 🤖 AI 助手（可选）
│   └── ...
│
└── oner-plugin-password/          # 🔐 密码库（可选）
    └── ...
```

## 🔌 插件清单

| 插件 ID | 名称 | 类型 | 必需 | 说明 |
|---------|------|------|------|------|
| `oner.plugin.core-notes` | 核心笔记 | Core | ✅ | 笔记 CRUD、分类、标签、视图切换 |
| `oner.plugin.memo` | 智能备忘 | Optional | ❌ | 字典识别、思维链、智能关联 |
| `oner.plugin.ai` | AI 助手 | Optional | ❌ | 对话、洞察、总结、生成 |
| `oner.plugin.password` | 密码库 | Optional | ❌ | 加密存储、密码生成 |

## 🚀 快速开始 — 创建新插件

```bash
# 1. 复制模板
cp -r plugins/oner-plugin-memo plugins/oner-plugin-myplugin

# 2. 修改 plugin.json
#    - id
#    - name
#    - dependencies
#    - routes / sidebar / commands

# 3. 实现 frontend/index.jsx 的 activate / deactivate

# 4. 重启开发服务器（Vite 会自动发现新插件）
pnpm dev
```

## 🛠 内核入口

| 端 | 文件 | 作用 |
|----|------|------|
| 前端 | `frontend/src/kernel/PluginManager.js` | 扫描、激活、停用、API 代理 |
| 后端 | `backend/kernel/PluginManager.js` | 注册路由、执行迁移、事件总线 |

## 📜 插件开发规范

### 1. 插件声明（plugin.json）

```json
{
  "id": "oner.plugin.xxx",            // 必须以 oner.plugin. 开头
  "name": "显示名",
  "version": "1.0.0",
  "type": "core" | "optional",
  "required": true | false,
  "dependencies": [{ "id": "oner.plugin.core-notes", "version": ">=1.0.0" }],
  "permissions": ["notes:read", "notes:write"],
  "frontend": {
    "entry": "./frontend/index.jsx",
    "routes": [{ "path": "/xxx", "component": "./frontend/pages/Xxx.jsx" }],
    "sidebar": [{ "id": "xxx", "label": "Xxx", "icon": "Icon", "path": "/xxx", "slot": "sidebar.main" }],
    "commands": [{ "id": "xxx.do", "title": "Do Xxx", "shortcut": "Ctrl+X" }],
    "floatingBubbles": []
  },
  "backend": {
    "entry": "./backend/index.js",
    "routes": [{ "path": "/api/xxx", "file": "./backend/routes/xxx.js" }],
    "migrations": ["./backend/migrations/001_xxx.sql"]
  }
}
```

### 2. 插件前端入口模板

```jsx
export default {
  async activate(ctx) {
    // 1. 注册路由
    ctx.kernel.router.addRoute({ path: '/xxx', component: XxxPage });
    
    // 2. 注册侧边栏
    ctx.kernel.shell.addSidebarItem({ id: 'xxx', label: 'Xxx', icon: 'Icon', path: '/xxx' });
    
    // 3. 暴露 API
    ctx.api.xxx = { /* ... */ };
  },
  async deactivate(ctx) {
    ctx.kernel.router.removeRoute('/xxx');
    ctx.kernel.shell.removeSidebarItem('xxx');
  }
};
```

### 3. 权限申请

插件只能访问 `permissions` 中声明的资源。内核会在 activate 时检查。

## 🧪 调试

```js
// 在浏览器控制台
window.__pluginManager.list();    // 查看已激活插件
window.__pluginManager.deactivate('oner.plugin.ai');  // 停用某个插件
window.__pluginManager.hotReload('oner.plugin.ai');   // 热加载
```

## 📚 相关文档

- 📄 `产品规划/Oner-插件化架构V2-动态预览市场+零停机加载.html` — 完整架构设计
- 📄 `产品规划/Oner-项目重构PRD-完整版-2026-06-13.md` — 项目重构 PRD

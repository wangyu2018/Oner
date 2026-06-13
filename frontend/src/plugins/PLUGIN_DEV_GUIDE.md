# 插件开发指南

## 目录结构

每个插件是一个独立目录，位于 `frontend/src/plugins/` 下，结构如下：

```
oner-plugin-<name>/
├── plugin.json          # 插件清单（必需）
└── frontend/
    └── index.jsx        # 插件入口（必需）
```

### plugin.json 规范

```json
{
  "id": "oner.plugin.<name>",
  "name": "插件显示名称",
  "version": "1.0.0",
  "description": "插件功能描述",
  "author": "作者",
  "dependencies": []
}
```

### frontend/index.jsx 规范

插件入口必须默认导出一个函数，该函数接收 `ctx`（PluginContext）对象：

```jsx
export default function myPlugin(ctx) {
  // 插件初始化逻辑
}
```

---

## PluginManager API

| 方法 | 说明 |
|------|------|
| `register(manifest, module)` | 注册插件（加载清单和入口模块） |
| `activate(pluginId)` | 激活指定插件 |
| `deactivate(pluginId)` | 停用指定插件 |
| `activateAll(ids[])` | 批量激活插件（按顺序） |
| `getPluginList()` | 获取所有插件状态列表 |
| `isActive(pluginId)` | 检查插件是否活跃 |

---

## PluginContext API

插件 `activate` 时收到的 `ctx` 对象提供以下能力：

### ctx.router — 动态路由注册

```jsx
ctx.router.register('/notes', NotesPage);
ctx.router.register('/notes/:id', NoteDetailPage);
```

### ctx.shell — UI Shell 扩展

```jsx
// 添加侧边栏项
ctx.shell.addSidebarItem({
  id: 'notes',
  label: '笔记',
  icon: '📝',
  path: '/notes',
  priority: 10,
});

// 添加浮动操作按钮
ctx.shell.addFloatingAction({
  id: 'quick-note',
  label: '快速笔记',
  icon: '✏️',
  action: () => { /* 打开快速笔记 */ },
});
```

### ctx.commandbar — 命令面板注册

```jsx
ctx.commandbar.register('notes.create', {
  title: '新建笔记',
  category: '笔记',
  icon: '📝',
  action: () => { /* 处理命令 */ },
});
```

### ctx.eventBus — 事件总线通信

```jsx
// 监听事件
ctx.eventBus.on('note:created', (note) => {
  console.log('笔记已创建:', note);
});

// 触发事件
ctx.eventBus.emit('custom:event', { data: 'hello' });
```

### ctx.api — API 命名空间注册

```jsx
ctx.api.register('notes', {
  list: async (params) => { /* ... */ },
  create: async (data) => { /* ... */ },
});
```

---

## 完整示例：番茄钟插件

### 1. 创建目录结构

```
oner-plugin-pomodoro/
├── plugin.json
└── frontend/
    └── index.jsx
```

### 2. plugin.json

```json
{
  "id": "oner.plugin.pomodoro",
  "name": "番茄钟",
  "version": "1.0.0",
  "description": "专注计时器，支持 25 分钟工作 + 5 分钟休息",
  "author": "开发者",
  "dependencies": []
}
```

### 3. frontend/index.jsx

```jsx
import React, { useState, useEffect } from 'react';

function PomodoroTimer() {
  const [time, setTime] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('work'); // work | break

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          // 切换阶段
          if (phase === 'work') {
            setPhase('break');
            return 5 * 60;
          } else {
            setPhase('work');
            return 25 * 60;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  const mins = Math.floor(time / 60);
  const secs = time % 60;

  return (
    <div style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 'bold' }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 14, color: '#666' }}>
        {phase === 'work' ? '🍅 工作中' : '☕ 休息中'}
      </div>
      <button onClick={() => setRunning(!running)}>
        {running ? '暂停' : '开始'}
      </button>
    </div>
  );
}

export default function pomodoroPlugin(ctx) {
  // 注册路由
  ctx.router.register('/pomodoro', PomodoroTimer);

  // 添加侧边栏入口
  ctx.shell.addSidebarItem({
    id: 'pomodoro',
    label: '番茄钟',
    icon: '🍅',
    path: '/pomodoro',
    priority: 50,
  });

  // 注册命令
  ctx.commandbar.register('pomodoro.start', {
    title: '开始番茄钟',
    category: '工具',
    icon: '🍅',
    action: () => {
      window.location.hash = '#/pomodoro';
    },
  });
}
```

---

## 注册到系统

在 `frontend/src/plugins/usePluginManager.js` 的 `loadPlugins` 函数中：

### 1. 添加模块导入

```js
const pluginModules = [
  // ... 已有插件
  {
    manifest: () => import('./oner-plugin-pomodoro/plugin.json'),
    module: () => import('./oner-plugin-pomodoro/frontend/index.jsx'),
  },
];
```

### 2. 添加激活顺序

```js
const pluginIds = [
  // ... 已有插件
  'oner.plugin.pomodoro',
];
```

---

## 生命周期

```
注册 (register) → 激活 (activate) → 活跃 (active)
                                      ↓ 停用 (deactivate)
                   注册 (registered) ← 停用完成
```

- **注册**：加载 plugin.json 和入口模块，注册到 PluginManager
- **激活**：执行插件入口函数，传入 ctx，插件注册路由/UI/命令
- **停用**：清除插件注册的路由、UI 元素、命令，恢复初始状态
- **持久化**：停用的插件 ID 存储在 `localStorage('oner_disabled_plugins')`，刷新后不会自动激活

---

## Profile 中的插件信息

在 `frontend/src/pages/Profile.jsx` 的 `PLUGIN_INFO` 对象中为新插件添加描述和功能标签：

```js
const PLUGIN_INFO = {
  // ... 已有插件
  'oner.plugin.pomodoro': {
    desc: '专注计时器，支持 25 分钟工作 + 5 分钟休息循环',
    features: ['番茄工作法', '专注计时', '休息提醒'],
    routes: ['/pomodoro (番茄钟)'],
    icon: '🍅',
    tagClass: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
};
```

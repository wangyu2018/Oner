# @oner/plugin-core-notes

> Oner 核心笔记插件 — 不可卸载，提供笔记基础能力

## 📦 模块信息

| 项目 | 值 |
|------|-----|
| 插件 ID | `oner.plugin.core-notes` |
| 版本 | 1.0.0 |
| 类型 | Core（核心） |
| 必需 | ✅ 是 |
| 分类 | core |

## 🎯 功能范围

- ✅ 笔记 CRUD（创建/读取/更新/删除）
- ✅ 分类管理（树形结构）
- ✅ 标签系统
- ✅ 状态流转（备忘/待办/进行中/已完成）
- ✅ 优先级、截止日期、提醒
- ✅ 全文搜索
- ✅ 网格/列表/泳道三种视图
- ✅ 拖拽排序（基于 dnd-kit）
- ✅ 快捷键支持

## 🔌 暴露 API（供其他插件调用）

```js
// 在其他插件中通过 ctx 访问
const notes = await ctx.plugins['oner.plugin.core-notes'].api.notes.list({
  status: 'todo',
  categoryId: 1
});

const note = await ctx.plugins['oner.plugin.core-notes'].api.notes.create({
  title: '新笔记',
  content: '...',
  tags: ['重要']
});
```

## 📂 目录结构

```
oner-plugin-core-notes/
├── plugin.json              # 插件声明（必读）
├── README.md                # 本文件
├── frontend/
│   ├── index.jsx            # 前端入口
│   ├── pages/
│   │   ├── NotesPage.jsx    # 笔记主页（视图切换、筛选、排序）
│   │   └── NoteEditor.jsx   # 笔记编辑器
│   ├── components/
│   │   ├── NoteCard.jsx     # 笔记卡片
│   │   ├── StatusFilter.jsx # 状态筛选栏
│   │   ├── CategoryTree.jsx # 分类树
│   │   ├── SwimlaneBoard.jsx# 泳道看板
│   │   ├── CardWall.jsx     # 网格视图
│   │   └── ListView.jsx     # 列表视图
│   ├── hooks/
│   │   ├── useNotes.js      # 笔记数据 hook
│   │   ├── useCategories.js # 分类数据 hook
│   │   └── useKeyboard.js   # 快捷键 hook
│   └── hooks/
│       ├── activate.js
│       └── deactivate.js
├── backend/
│   ├── index.js             # 后端入口
│   ├── routes/
│   │   ├── notes.js         # 笔记 API
│   │   ├── categories.js    # 分类 API
│   │   └── tags.js          # 标签 API
│   ├── services/
│   │   └── noteService.js   # 业务逻辑层
│   ├── migrations/
│   │   ├── 001_create_notes_table.sql
│   │   ├── 002_create_categories_table.sql
│   │   └── 003_create_tags_table.sql
│   └── hooks/
│       ├── install.js
│       └── uninstall.js
└── assets/
    ├── icon.svg             # 插件图标
    └── preview/
        ├── preview-mobile.png
        ├── preview-tablet.png
        └── preview-desktop.png
```

## 🔄 数据库 Schema

### `notes` 表

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'memo',     -- memo | todo | in_progress | done
  priority TEXT DEFAULT 'medium',  -- low | medium | high | urgent
  category_id INTEGER,
  parent_id INTEGER,               -- 支持父子层级
  due_date DATETIME,
  reminder_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### `categories` 表

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🧪 单元测试

```bash
pnpm --filter @oner/plugin-core-notes test
```

## 📜 变更日志

- **1.0.0** (2026-06-13) — 初版发布，从原 Oner 笔记功能迁移而来

## 🤝 依赖关系

- 被依赖：`oner-plugin-ai`、`oner-plugin-memo`、`oner-plugin-password` 等所有插件

## ⚠️ 注意事项

- 此插件**不可禁用/卸载**，是 Oner 的核心模块
- 修改此插件的数据库 schema 必须通过迁移文件
- 公开的 API 必须保持向后兼容

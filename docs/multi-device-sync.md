# Oner 多端同步实现方案

## 概述

Oner 的多端同步基于 **中心化服务器 + 轮询机制** 实现，用户在不同设备上登录同一账号，通过服务器同步数据。

## 当前实现

### 架构图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  设备 A     │     │  设备 B     │     │  设备 C     │
│  (浏览器)   │     │  (桌面版)   │     │  (手机)     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    HTTP 请求      │    HTTP 请求      │    HTTP 请求
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   服务器    │
                    │  (Express)  │
                    │             │
                    │  ┌───────┐  │
                    │  │SQLite │  │
                    │  │ 数据库 │  │
                    │  └───────┘  │
                    └─────────────┘
```

### 同步机制

1. **Token 认证**
   - 用户登录后获得 JWT Token（有效期 7 天）
   - 每个设备独立 Token，存储在 localStorage
   - 所有 API 请求携带 Token

2. **数据隔离**
   - 每条笔记绑定 `user_id`
   - 用户只能访问自己的数据
   - 设备间通过服务器同步

3. **轮询同步**
   - 前端每 30 秒请求一次笔记列表
   - 对比本地数据，更新变化的部分
   - 适用于当前的简单场景

### 当前代码实现

```javascript
// 前端轮询逻辑（useNotes.js）
useEffect(() => {
  fetchNotes(activeTag, activeStatus);
  
  // 每 30 秒刷新
  const interval = setInterval(() => {
    fetchNotes(activeTag, activeStatus);
  }, 30000);
  
  return () => clearInterval(interval);
}, [fetchNotes, activeTag, activeStatus]);
```

## 进阶方案（可选）

### 方案一：WebSocket 实时推送

```javascript
// 后端
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  const user = verifyToken(token);
  
  if (!user) {
    ws.close();
    return;
  }
  
  // 存储连接
  ws.userId = user.id;
  
  // 笔记变更时推送
  ws.on('message', (data) => {
    const { type, payload } = JSON.parse(data);
    
    if (type === 'note_updated') {
      // 广播给同一用户的其他设备
      wss.clients.forEach(client => {
        if (client.userId === user.id && client !== ws) {
          client.send(JSON.stringify({ type: 'note_updated', payload }));
        }
      });
    }
  });
});

// 前端
const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  if (type === 'note_updated') {
    // 更新本地数据
    updateNoteInState(payload);
  }
};
```

### 方案二：冲突检测与解决

```javascript
// 笔记添加版本号
CREATE TABLE notes (
  ...,
  version INTEGER DEFAULT 1,
  updated_at TEXT
);

// 更新时检测冲突
router.put('/notes/:id', (req, res) => {
  const { version, ...updates } = req.body;
  const existing = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
  
  if (existing.version !== version) {
    return res.status(409).json({
      success: false,
      error: '数据已被其他设备修改，请刷新后重试',
      conflict: {
        server: existing,
        client: { version, ...updates }
      }
    });
  }
  
  // 更新成功，版本号 +1
  runQuery('UPDATE notes SET ..., version = version + 1 WHERE id = ?', [id]);
});
```

### 方案三：离线优先 + 增量同步

```javascript
// 本地 IndexedDB 存储
const db = await openDB('oner', 1, {
  upgrade(db) {
    db.createObjectStore('notes', { keyPath: 'id' });
    db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
  },
});

// 离线操作记录
async function saveNoteOffline(note) {
  await db.put('notes', note);
  await db.add('sync_queue', {
    type: 'update',
    noteId: note.id,
    timestamp: Date.now(),
  });
}

// 恢复在线后同步
async function syncWhenOnline() {
  const queue = await db.getAll('sync_queue');
  
  for (const item of queue) {
    try {
      await api.notes.update(item.noteId, item.data);
      await db.delete('sync_queue', item.id);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }
}

window.addEventListener('online', syncWhenOnline);
```

## 数据流程图

### 正常同步流程

```
设备 A                    服务器                    设备 B
   │                        │                        │
   │  1. 创建笔记           │                        │
   │  POST /api/notes       │                        │
   │───────────────────────>│                        │
   │                        │  保存到数据库           │
   │  2. 返回成功           │                        │
   │<───────────────────────│                        │
   │                        │                        │
   │                        │  3. 轮询获取笔记        │
   │                        │  GET /api/notes        │
   │                        │<───────────────────────│
   │                        │  4. 返回笔记列表        │
   │                        │───────────────────────>│
   │                        │                        │
   │                        │  5. 显示新笔记          │
```

### 冲突处理流程

```
设备 A                    服务器                    设备 B
   │                        │                        │
   │  1. 获取笔记 v1        │                        │
   │<───────────────────────│                        │
   │                        │                        │
   │  2. 获取笔记 v1        │                        │
   │                        │<───────────────────────│
   │                        │                        │
   │  3. 更新笔记 v1→v2     │                        │
   │───────────────────────>│                        │
   │  4. 成功，返回 v2      │                        │
   │<───────────────────────│                        │
   │                        │                        │
   │                        │  5. 更新笔记 v1→v2     │
   │                        │<───────────────────────│
   │                        │  6. 冲突！v1 ≠ v1      │
   │                        │───────────────────────>│
   │                        │                        │
   │                        │  7. 提示用户刷新        │
```

## 最佳实践

### 1. 减少同步频率
- 使用防抖，避免频繁请求
- 只在数据变化时同步

### 2. 乐观更新
- 先更新 UI，再同步服务器
- 失败时回滚

### 3. 冲突预防
- 编辑时锁定笔记
- 或使用 OT/CRDT 算法

### 4. 离线支持
- Service Worker 缓存
- IndexedDB 本地存储
- 恢复在线后自动同步

## 总结

当前实现的轮询方案适合：
- 个人使用
- 设备数量少
- 数据变更不频繁

如需更好的同步体验，可以考虑：
1. WebSocket 实时推送（减少延迟）
2. 版本号冲突检测（避免覆盖）
3. 离线优先架构（断网可用）

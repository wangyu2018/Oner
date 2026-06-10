# Oner 产品设计文档 v2.0
## AI原生 · 隐私优先 · 自托管个人知识管理中心

> **文档版本**: v2.0  
> **创建日期**: 2026-06-08  
> **设计目标**: 基于市场调研与竞品分析，重新定义Oner的产品定位与核心功能架构  
> **设计原则**: AI原生架构、隐私优先、本地优先、开放标准、用户体验至上

---

## 📋 目录

1. [产品定位与愿景](#1-产品定位与愿景)
2. [市场分析与竞品对比](#2-市场分析与竞品对比)
3. [核心用户画像与场景](#3-核心用户画像与场景)
4. [产品架构设计](#4-产品架构设计)
5. [核心功能详细设计](#5-核心功能详细设计)
6. [AI能力架构设计](#6-ai能力架构设计)
7. [数据模型与存储设计](#7-数据模型与存储设计)
8. [技术架构升级方案](#8-技术架构升级方案)
9. [用户体验设计](#9-用户体验设计)
10. [路线图与优先级](#10-路线图与优先级)

---

## 1. 产品定位与愿景

### 1.1 核心价值主张

**Oner = 你的第二大脑，完全属于你**

Oner 是一个 **AI原生、隐私优先、自托管** 的个人知识管理平台，致力于解决现代知识工作者的核心痛点：

| 痛点 | Oner的解决方案 |
|------|---------------|
| **数据被绑架** | 100%自托管，数据在你手里，标准格式（Markdown/SQLite） |
| **AI能力缺失或依赖云端** | AI原生架构，支持本地模型（Ollama/LM Studio），数据零泄露 |
| **订阅疲劳** | 一次性自建成本，无月费，完全拥有 |
| **工具孤岛** | MCP协议支持，成为AI工作流的活跃节点 |
| **离线能力弱** | PWA + Service Worker，真正的离线优先体验 |

### 1.2 产品定位矩阵

```
          高协作能力
              |
    Notion    |    Confluence
              |
--------------+-------------- 低隐私/云端依赖
              |
   Oner ←你在这里 |
              |
    Obsidian  |    Logseq
              |
          高隐私/本地优先
```

**Oner的独特位置**：
- ✅ **隐私优先**（像Obsidian）= 数据主权归用户
- ✅ **AI原生**（像Mem.ai）= AI从底层设计，非后期叠加
- ✅ **自托管**（像SiYuan）= 零订阅成本，完全可控
- ✅ **开放标准**（Markdown + MCP）= 无厂商锁定，可与其他工具打通

### 1.3 愿景声明

> **"让每个人拥有完全属于自己的第二大脑——AI驱动、隐私无忧、随时可及。"**

---

## 2. 市场分析与竞品对比

### 2.1 2025-2026 笔记软件市场趋势

#### 趋势1：本地优先架构崛起
- **驱动力**：用户对云端依赖的反思、订阅疲劳、隐私担忧
- **代表产品**：Obsidian、Logseq、SiYuan、LocArk
- **市场空白**：本地优先 + AI原生 的组合几乎不存在

#### 趋势2：AI从"附加功能"到"原生架构"
- **现状**：Notion AI、Obsidian插件都是后期叠加，非原生设计
- **未来**：AI原生架构（Mem.ai、KnowMine）从底层为AI设计
- **机会**：Oner可以从第一天就按AI原生架构设计

#### 趋势3：MCP协议成为AI时代的标准接口
- **MCP（Model Context Protocol）**：Anthropic推出的AI工具调用标准
- **意义**：知识库不再是孤岛，而是AI Agent可访问的活节点
- **现状**：KnowMine是唯一支持MCP的PKM工具（但非自托管）
- **机会**：Oner可以成为全球首个支持MCP的自托管PKM

#### 趋势4：开放标准对抗厂商锁定
- **痛点**：Notion（专有格式）、SiYuan（.sy格式）都难以迁移
- **需求**：标准Markdown、标准API、标准协议
- **机会**：Oner坚持开放标准，降低用户迁移成本

### 2.2 核心竞品深度对比

#### 竞品矩阵（10维度评估）

| 维度 | Oner (目标) | Notion | Obsidian | SiYuan思源 | Logseq | Mem.ai | KnowMine |
|------|-------------|--------|-----------|------------|--------|--------|----------|
| **部署方式** | ✅ 自托管 | ❌ SaaS | ❌ 本地文件 | ✅ 自托管 | ❌ 本地文件 | ❌ SaaS | ❌ SaaS |
| **数据格式** | ✅ Markdown | ❌ 专有 | ✅ Markdown | ⚠️ .sy(JSON) | ✅ Markdown/org | ❌ 专有 | ❌ 专有 |
| **离线能力** | ✅ PWA+SW | ⚠️ 部分 | ✅ 完全 | ✅ 完全 | ✅ 完全 | ❌ 需联网 | ❌ 需联网 |
| **AI架构** | ✅ 原生 | ⚠️ 附加 | ❌ 插件 | ⚠️ 附加 | ❌ 基础 | ✅ 原生 | ✅ 原生 |
| **本地AI** | ✅ Ollama | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MCP支持** | 🚧 规划中 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ 已支持 |
| **协作能力** | ❌ (个人) | ✅ 强 | ❌ 弱 | ❌ 弱 | ❌ 弱 | ❌ | ❌ |
| **成本** | 💰 服务器 | 💰💰 订阅 | 💰 免费+同步 | 💰 免费+增值 | 💰 免费 | 💰💰 订阅 | 💰 免费起步 |
| **移动端** | ✅ PWA | ✅ App | ⚠️ 套壳 | ✅ App | ⚠️ 套壳 | ✅ App | ✅ App |
| **开源** | 🚧 规划中 | ❌ | ❌ 核心闭源 | ✅ 完全开源 | ✅ 开源 | ❌ | ❌ |

#### 竞品核心优劣势分析

**Notion**
- ✅ 优势：协作能力极强、生态丰富、模板市场
- ❌ 劣势：纯SaaS无离线、数据不在本地、订阅贵（$10/月+）、AI需付费

**Obsidian**
- ✅ 优势：本地Markdown、插件生态、知识图谱、完全离线
- ❌ 劣势：AI依赖插件体验差、同步需付费、学习曲线陡、无协作

**SiYuan思源**
- ✅ 优势：开源、自托管、块级编辑、移动端好
- ❌ 劣势：**.sy格式锁定**（非标准Markdown）、协作弱、AI附加

**Mem.ai**
- ✅ 优势：AI原生、自动整理、对话式交互
- ❌ 劣势：纯SaaS、数据不在本地、订阅制

**KnowMine**
- ✅ 优势：AI原生、MCP支持、语义搜索
- ❌ 劣势：纯SaaS、新产品不成熟、无协作

### 2.3 Oner的差异化竞争策略

#### 策略1：三重定位，打造独特价值
```
隐私优先（Obsidian） + AI原生（Mem.ai） + 自托管（SiYuan） = Oner
```

#### 策略2：占领"MCP+自托管"空白市场
- **全球首个支持MCP的自托管PKM**（规划Q3 2026）
- 让Claude/ChatGPT等AI直接读取用户本地知识库
- 用户知识不再孤岛，成为AI工作流的一部分

#### 策略3：坚持开放标准，对抗厂商锁定
- **存储格式**：标准Markdown（非.sy非专有格式）
- **API标准**：RESTful + MCP协议
- **数据导出**：一键导出标准格式，零迁移成本

---

## 3. 核心用户画像与场景

### 3.1 主要用户群体

#### 用户群体A：知识工作者（核心目标）
**人群特征**：
- 年龄：25-40岁
- 职业：程序员、产品经理、研究者、咨询师
- 痛点：信息爆炸、知识碎片化、担心隐私泄露
- 需求：个人知识管理、快速检索、AI辅助整理

**典型场景**：
1. **日常记录**：会议笔记、想法捕捉、待办管理
2. **知识整理**：阅读笔记、学习总结、项目文档
3. **AI辅助**：让AI总结本周笔记、拆解复杂任务、回答知识库问题

#### 用户群体B：隐私敏感用户（重要差异化）
**人群特征**：
- 年龄：30-50岁
- 职业：律师、医生、财务人员、企业高管
- 痛点：客户数据/商业机密不能上传云端
- 需求：完全本地、可审计、数据不出门

**典型场景**：
1. **敏感信息管理**：客户资料、合同要点、案件笔记
2. **离线工作**：无网络环境下全功能使用
3. **数据掌控**：自主备份、自主迁移、无厂商锁定

#### 用户群体C：技术极客（早期采用者）
**人群特征**：
- 年龄：20-35岁
- 职业：开发者、运维、安全研究员
- 痛点：现有工具不够灵活、想要DIY、关注开源
- 需求：API访问、插件系统、自托管、可魔改

**典型场景**：
1. **自建部署**：NAS/VPS上部署，定制域名、SSL
2. **API集成**：与自有系统打通（如CRM、Wiki）
3. **插件开发**：编写自定义插件扩展功能

### 3.2 用户旅程地图

```
发现 → 试用 → 部署 → 日常使用 → 深度依赖 → 推荐他人
 │      │      │        │          │          │
 │      │      │        │          │          │
 └──────┴──────┴────────┴──────────┴──────────┘
 关键触点：
 1. 发现：GitHub Trending / 技术博客 / 知乎推荐
 2. 试用：Docker一键部署（5分钟内可用）
 3. 部署：自定义域名、HTTPS、备份策略
 4. 日常：快速记录、AI整理、跨设备同步
 5. 深度：MCP接入、插件生态、工作流整合
 6. 推荐：开源社区、技术分享、案例传播
```

---

## 4. 产品架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ PWA Web  │  │ Electron │  │ Mobile   │  │ AI Floating│  │
│  │ (React)  │  │ Desktop  │  │ (PWA)    │  │ Input     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│          │              │             │              │       │
│          └──────────────┴─────────────┴──────────────┘       │
│                        统一API调用层                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API / SSE / WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                    应用层 (Application)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Note Service│  │  AI Service  │  │ Sync Service │    │
│  │  (笔记管理)   │  │  (AI引擎)    │  │  (同步引擎)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Task Service │  │ Vault Service│  │ MCP Server   │    │
│  │ (任务管理)    │  │ (密码保险库) │  │ (MCP协议)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    数据层 (Data)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ SQLite   │  │ Markdown  │  │ Vector DB│  │  File FS │  │
│  │ (元数据)  │  │ (笔记内容)│  │ (向量索引)│  │ (附件)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 核心设计原则

#### 原则1：AI原生架构（AI-First Architecture）
```
传统架构：Notes → UI → (附加) AI功能
Oner架构：Notes ← AI Core → UI (AI是核心，不是附加)
```

**具体体现**：
- AI不是"功能模块"，而是"基础能力层"
- 所有笔记操作都可被AI感知和增强
- AI可以主动整理、分类、关联笔记（非用户触发）

#### 原则2：本地优先（Local-First）
```
云端架构：App → API → Cloud DB (必须联网)
Oner架构：App → Local DB → (可选) Sync to Cloud (可离线)
```

**具体体现**：
- PWA Service Worker缓存所有静态资源
- IndexedDB存储笔记副本，支持离线编辑
- 在线时后台同步，冲突自动合并

#### 原则3：开放标准（Open Standards）
```
厂商锁定：专有格式 → 难以导出 → 被迫继续使用
Oner策略：标准Markdown → 一键导出 → 零成本迁移
```

**具体体现**：
- 笔记内容存储为标准Markdown文件
- 元数据用SQLite（可SQL查询）
- API遵循RESTful标准
- 未来支持MCP协议

### 4.3 技术栈升级建议

#### 当前技术栈（保持稳定）
```yaml
前端:
  - React 18 + Vite 6 + TailwindCSS 3
  - @dnd-kit (拖拽)
  - PWA (manifest + SW)

后端:
  - Node.js 20 + Express 4
  - node:sqlite (原生SQLite)
  - Multer (文件上传)

部署:
  - Docker + docker-compose
  - Nginx (反向代理)
```

#### 建议新增技术栈（增强能力）

**1. 向量数据库（支持语义搜索）**
```yaml
方案A: SQLite Vector Extension (推荐)
  - 优势: 无需额外服务，SQLite原生支持
  - 用例: 全文搜索 + 语义搜索统一

方案B: ChromaDB / Qdrant (本地部署)
  - 优势: 专业向量数据库，性能更强
  - 用例: 大规模笔记的语义检索
```

**2. 实时同步引擎（多端同步）**
```yaml
方案: Yjs + WebRTC (P2P同步)
  - 优势: 无中心服务器，真正P2P
  - 用例: 手机-电脑无云服务直接同步

备选: WebSocket + SQLite (传统CS架构)
  - 优势: 实现简单，适合自托管场景
  - 用例: 多设备通过自建服务器同步
```

**3. MCP Server实现（AI生态接入）**
```yaml
技术: TypeScript + MCP SDK
  - 官方SDK: @modelcontextprotocol/sdk
  - 协议: stdio / HTTP transport
  - 能力: resources (笔记) + tools (操作)
```

---

## 5. 核心功能详细设计

### 5.1 笔记管理（Notes Management）

#### 5.1.1 笔记模型设计

**当前设计（简化版）**：
```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  title TEXT,
  content TEXT, -- Markdown
  category_id INTEGER,
  status TEXT, -- 'memo' | 'todo' | 'in_progress' | 'done'
  priority INTEGER, -- 1-4
  due_date TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

**升级设计（AI原生版）**：
```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  uuid TEXT UNIQUE NOT NULL, -- 全局唯一ID（同步用）
  title TEXT,
  content TEXT, -- Markdown原文
  content_html TEXT, -- 渲染后的HTML（缓存）
  category_id INTEGER,
  status TEXT CHECK(status IN ('memo','todo','in_progress','done','archived')),
  priority INTEGER CHECK(priority BETWEEN 1 AND 4),
  due_date TEXT,
  is_recurring BOOLEAN DEFAULT 0,
  recurring_rule TEXT, -- RRULE格式
  parent_id INTEGER, -- 子任务关联
  sort_order INTEGER DEFAULT 0, -- 手动排序
  
  -- AI相关字段
  ai_summary TEXT, -- AI生成的摘要
  ai_tags TEXT, -- AI自动打的标签（JSON数组）
  ai_embedding BLOB, -- 向量嵌入（用于语义搜索）
  ai_last_analyzed TEXT, -- 最后AI分析时间
  
  -- 同步相关字段
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT, -- 软删除
  version INTEGER DEFAULT 1, -- 版本号（冲突解决）
  sync_status TEXT DEFAULT 'pending' -- 'pending'|'synced'|'conflict'
);

CREATE INDEX idx_notes_uuid ON notes(uuid);
CREATE INDEX idx_notes_category ON notes(category_id);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
```

#### 5.1.2 编辑器设计

**核心需求**：
1. **Markdown所见即所得** - 不像Notion的块状，也不像纯文本的Markdown
2. **实时预览** - 左侧编辑，右侧预览（可选）
3. **AI辅助编辑** - 选中文字 → "AI续写/改写/翻译"
4. **块级引用** - 像Obsidian一样引用其他笔记的块
5. **数学公式/图表** - 支持LaTeX、Mermaid、流程图

**技术实现建议**：
```typescript
// 编辑器技术选型
方案A: TipTap (推荐)
  - 基于ProseMirror，扩展性强
  - 原生支持Markdown解析
  - 丰富的插件生态（AI、图表、公式）
  
方案B: CodeMirror 6 + Markdown插件
  - 轻量级，性能好
  - 需要自己实现WYSIWYG
  
方案C: 自研（基于现有Quill/CKEditor）
  - 成本高，不推荐
```

**AI编辑功能设计**：
```
用户选中文字 → 右键菜单/浮动工具栏
  ├─ AI续写 - 基于选中内容继续写作
  ├─ AI改写 - 改写选中文字（更简洁/更正式/更口语）
  ├─ AI翻译 - 翻译成中文/英文/日文
  ├─ AI总结 - 提取要点（3-5条）
  └─ AI扩写 - 基于选中内容展开论述
```

#### 5.1.3 笔记组织方式

**多维度组织**（不只是文件夹）：
```
1. 分类（Categories） - 传统文件夹式
2. 标签（Tags） - 多对多，灵活分类
3. 链接（Links） - 双向链接，构建知识网络
4. 看板（Kanban） - 按状态组织（已有）
5. 时间线（Timeline） - 按创建/更新时间
6. 地图（Map） - 地理位置（可选功能）
```

**AI自动组织**（核心差异化）：
```
用户只需"记录"，AI自动：
  → 打标签（#工作 #项目A #会议纪要）
  → 归分类（自动判断属于哪个分类）
  → 建链接（发现与相关笔记的关联）
  → 提摘要（生成一句话总结）
```

### 5.2 任务管理（Task Management）

#### 5.2.1 任务模型增强

**当前设计**：任务即笔记（status字段区分）

**问题**：任务与笔记混淆，缺少任务特有字段

**升级设计**：
```sql
-- 任务扩展表（与notes表1:1关联）
CREATE TABLE tasks (
  note_id INTEGER PRIMARY KEY,
  estimated_hours REAL, -- 预估工时
  actual_hours REAL, -- 实际工时
  progress INTEGER CHECK(progress BETWEEN 0 AND 100), -- 进度百分比
  assigned_to TEXT, -- 分配给（未来协作用）
  dependency_ids TEXT, -- 依赖的任务ID（JSON数组）
  reminder_time TEXT, -- 提醒时间
  completed_at TEXT, -- 完成时间
  FOREIGN KEY(note_id) REFERENCES notes(id)
);

-- 子任务表（替代当前的parent_id方案）
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY,
  parent_note_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(parent_note_id) REFERENCES notes(id)
);
```

#### 5.2.2 看板视图增强

**当前设计**：4列看板（备忘→待办→进行中→已完成）

**升级方向**：
```
1. 自定义列 - 用户可添加/删除/重排列
2. 列表视图 - 替代看板的另一种视图
3. 日历视图 - 按截止日期展示（路线图Q4）
4. 甘特图 - 项目任务时间线（路线图2027）
```

**看板交互优化**：
```
拖拽优化：
  - 拖拽卡片变更状态（已有）
  - 拖拽调整排序（新增）
  - 拖拽到"子任务区"变为子任务（已有但需优化）

批量操作：
  - 多选卡片 → 批量变更状态/优先级/分类
  - 快捷键支持（Shift+点击多选）
```

### 5.3 人工智能（AI Capabilities）

#### 5.3.1 AI架构设计（重点）

**核心原则：AI是底座，不是功能**

```
┌─────────────────────────────────────────┐
│         AI Provider Abstraction        │
│  (统一接口，支持多种AI提供商)           │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
┌───▼───┐   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
│云端API │   │ 本地AI  │ │ Mock │ │ Cache │
│深度学习 │   │ Ollama │ │ 测试 │ │ 缓存 │
└───────┘   └─────────┘ └─────┘ └──────┘
```

**AI Provider接口设计**：
```typescript
interface AIProvider {
  // 基础聊天（流式）
  chat(messages: Message[], options?: ChatOptions): AsyncStream<string>;
  
  // 文本处理（非流式）
  complete(prompt: string, options?: CompleteOptions): Promise<string>;
  
  // 向量化（用于语义搜索）
  embed(text: string): Promise<number[]>;
  
  // 模型信息
  getModelInfo(): ModelInfo;
}

// 实现类
class DeepSeekProvider implements AIProvider { ... }
class OpenAIProvider implements AIProvider { ... }
class OllamaProvider implements AIProvider { ... } // 新增
class LMStudioProvider implements AIProvider { ... } // 新增
```

#### 5.3.2 AI功能矩阵（详细版）

| 功能模块 | 功能点 | 状态 | 优先级 | 技术方案 |
|---------|--------|------|--------|---------|
| **笔记AI** | 单笔记内AI面板 | ✅ 已实现 | - | Sidebar + SSE流式 |
| | - 拆解子任务 | ✅ | - | Prompt工程 |
| | - 推荐下一步 | ✅ | - | Prompt工程 |
| | - 扩展内容 | ✅ | - | Prompt工程 |
| | - 自由提问 | ✅ | - | RAG（检索增强） |
| **全局AI** | 独立聊天页 | ✅ 已实现 | - | 全屏对话框 |
| | - 选择分类带入上下文 | ✅ | - | Filter + RAG |
| | - 流式SSE输出 | ✅ | - | EventSource API |
| **分类AI** | 一键总结分类 | ✅ 已实现 | - | 聚合+Prompt |
| **浮动输入** | 全局浮动AI输入框 | 🚧 开发中 | P0 | Draggable + Pin |
| | - 快速记录 | 🚧 | P0 | 自然语言→笔记 |
| | - AI自动分类 | 🚧 | P0 | NLP分类算法 |
| **智能问答** | "今天要做什么" | 🚧 规划中 | P1 | 任务列表+RAG |
| | "上周学了什么" | 🚧 | P1 | 时间过滤+RAG |
| | "项目A进展" | 🚧 | P1 | 实体识别+RAG |
| **自动整理** | AI定时整理笔记 | 🚧 规划中 | P2 | Cron + AI分析 |
| | - 自动打标签 | 🚧 | P2 | NLP关键词提取 |
| | - 自动建链接 | 🚧 | P2 | 相似度计算 |
| | - 自动归档 | 🚧 | P2 | 使用频率分析 |
| **语义搜索** | 向量语义搜索 | 🚧 规划中 | P1 | Embedding+向量DB |
| | - 自然语言查询 | 🚧 | P1 | "关于XX的笔记" |
| | - 相似笔记推荐 | 🚧 | P2 | 向量相似度 |
| **MCP服务器** | 暴露笔记为MCP资源 | 🚧 规划中 | P0 | MCP Protocol |
| | - Claude可读取 | 🚧 | P0 | stdio transport |
| | - ChatGPT插件 | 🚧 | P1 | HTTP transport |

#### 5.3.3 AI自动分类算法设计

**目标**：用户输入"明天开会讨论Q3预算"，AI自动判断应归入"工作"分类，并创建笔记

**方案设计**：
```
方法1：LLM直接分类（推荐，准确率高）
  输入：用户笔记内容 + 现有分类列表
  输出：分类ID + 置信度
  Prompt示例：
    "以下笔记内容应归入哪个分类？
     笔记：{content}
     可选分类：{categories}
     输出JSON：{"category_id": 1, "confidence": 0.95}"

方法2：向量相似度（快速，准确率中等）
  1. 将所有分类的"典型笔记"向量化
  2. 用户新笔记向量化
  3. 计算余弦相似度，取最高分分类
  
方法3：混合方案（最佳实践）
  1. 先用向量相似度快速筛选Top3分类
  2. 再用LLM精细判断
  3. 置信度<0.7时，询问用户确认
```

#### 5.3.4 语义搜索设计

**当前**：SQLite FTS5 关键词搜索

**升级**：关键词 + 语义 混合搜索

**技术方案**：
```typescript
// 搜索流程
async function search(query: string) {
  // 1. 关键词搜索（FTS5，快速）
  const keywordResults = await db.searchFTS(query);
  
  // 2. 语义搜索（向量，准确）
  const queryEmbedding = await ai.embed(query);
  const semanticResults = await db.searchVector(queryEmbedding, topK: 10);
  
  // 3. 混合排序（RRF: Reciprocal Rank Fusion）
  const merged = mergeAndRank(keywordResults, semanticResults);
  
  return merged;
}
```

**向量存储方案对比**：
```
方案A: SQLite Vector Extension (sqlite-vec)
  ✅ 优势：无需额外服务，备份简单
  ❌ 劣势：性能不如专业向量DB
  📊 适用：<10万条笔记

方案B: ChromaDB (本地运行)
  ✅ 优势：专业向量DB，性能好
  ❌ 劣势：需要单独运行服务
  📊 适用：>10万条笔记

推荐：先用方案A，用户规模大后再迁移方案B
```

### 5.4 密码保险库（Password Vault）

#### 5.4.1 安全架构设计

**当前设计**：AES-256-GCM加密 + 独立PIN

**安全问题**：
1. PIN是"第二因素"吗？其实还是密码（只是短一些）
2. 没有生物识别（指纹/面容）
3. 没有自动填充功能（浏览器插件）

**升级设计**：

**1. 加密层升级**
```typescript
// 当前：PIN → AES-256-GCM加密
// 升级：PIN/Biometric → Argon2id派生密钥 → AES-256-GCM

class VaultEncryption {
  // 密钥派生（防彩虹表攻击）
  deriveKey(pin: string, salt: Buffer): Buffer {
    return argon2id(pin, salt, {
      iterations: 3,
      memory: 64 * 1024, // 64MB
      parallelism: 4
    });
  }
  
  // 加密
  encrypt(plaintext: string, key: Buffer): EncryptedData {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    // ...
  }
}
```

**2. 生物识别支持（PWA/Electron）**
```typescript
// PWA: WebAuthn API
async function authenticateWithBiometric() {
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      rpId: window.location.hostname,
      userVerification: 'required'
    }
  });
  return credential;
}

// Electron: 系统API
// Windows: Windows Hello
// macOS: Touch ID
// Linux: fprintd (如果有)
```

**3. 浏览器自动填充（路线图）**
```
实现方式：浏览器扩展（Chrome/Firefox/Safari）
功能：
  1. 检测登录表单
  2. 从Oner保险库查询匹配账号
  3. 自动填充用户名密码
  4. 保存新账号提示
  
技术栈：
  - Chrome Extension Manifest V3
  - Native Messaging (与Oner桌面端通信)
```

#### 5.4.2 密码保险库功能清单

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **基础增删改查** | 存储网站账号密码 | P0（已有） |
| **分类管理** | 按类别组织（社交/工作/金融） | P1 |
| **搜索** | 快速查找账号 | P1 |
| **生成密码** | 随机强密码生成器 | P1 |
| **自动填充** | 浏览器扩展自动填充 | P2 |
| **安全报告** | 弱密码/重复密码检测 | P2 |
| **紧急访问** | 授权他人紧急访问（如身故） | P3 |
| **附件** | 存储文件（如身份证扫描件） | P3 |

### 5.5 同步与协作（Sync & Collaboration）

#### 5.5.1 同步架构设计（重要）

**当前状态**：无同步（纯本地/单设备）

**问题**：多设备用户无法同步数据

**设计方案**：分层同步架构

```
Layer 1: 本地优先（Offline First）
  - PWA Service Worker缓存
  - IndexedDB本地副本
  - 离线可编辑，在线后同步

Layer 2: 自托管同步（Self-Hosted Sync）
  - WebSocket实时同步
  - 冲突自动合并（CRDT算法）
  - 端到端加密（E2EE）

Layer 3: P2P同步（可选，技术极客）
  - WebRTC直连
  - 无服务器同步
  - 适合局域网场景
```

**同步技术方案对比**：

```
方案A: WebSocket + SQLite (推荐)
  原理：客户端通过WebSocket连接到自建服务器，实时推送变更
  ✅ 优势：实现简单，适合自托管
  ❌ 劣势：需要服务器always online
  
方案B: CRDT + P2P (最小化服务器)
  原理：Yjs/Automerge实现无冲突复制，WebRTC直连
  ✅ 优势：真正去中心化，无服务器也可同步
  ❌ 劣势：技术复杂，P2P连接不稳定
  
方案C: Git式同步 (开发者友好)
  原理：笔记变更记录为commit，push/pull同步
  ✅ 优势：可审计、可回滚、开发者熟悉
  ❌ 劣势：对非技术用户不友好
  
推荐路线：先实现方案A（Q3 2026），再探索方案B（2027）
```

#### 5.5.2 冲突解决策略

**场景**：同一笔记在手机和电脑同时编辑，如何合并？

**策略矩阵**：

| 策略 | 描述 | 适用场景 | 实现难度 |
|------|------|----------|---------|
| **Last Write Wins** | 最后修改的版本覆盖 | 简单场景 | 低 |
| **Manual Merge** | 提示用户选择版本 | 重要笔记 | 中 |
| **CRDT Auto Merge** | 自动合并（Yjs） | 协同编辑 | 高 |
| **Three-Way Merge** | 像Git一样合并 | 技术用户 | 中 |

**推荐实现**：
```
Phase 1 (Q3 2026): Last Write Wins + 备份旧版本
  - 简单快速上线
  - 冲突时保留两个版本，用户手动选择

Phase 2 (2027): CRDT Auto Merge
  - 引入Yjs实现自动合并
  - 适合富文本笔记的协同编辑
```

#### 5.5.3 协作功能（长期规划）

**定位**：Oner是**个人工具**，协作不是核心，但可有限支持

**协作场景**（非实时协同编辑）：
```
场景1：笔记分享（只读）
  - 生成分享链接（带密码/过期时间）
  - 对方无需账号可查看

场景2：笔记导出分享
  - 导出PDF/HTML分享

场景3：多人任务看板（弱协作）
  - 家庭/小团队任务管理
  - 无需实时编辑，只需看到彼此任务

场景4：评论与反馈（未来）
  - 在笔记上添加评论
  - @提及团队成员
```

---

## 6. AI能力架构设计

### 6.1 AI原生架构详解

#### 6.1.1 什么是AI原生？

**非AI原生（当前大多数工具）**：
```
传统应用架构：
  UI → Business Logic → Database
  
AI作为功能叠加：
  UI → Business Logic → Database
            ↓
         AI Service (附加模块)
```

**AI原生（Oner目标）**：
```
AI作为基础能力层：
  UI ↔ AI Core Layer ↔ Business Logic ↔ Database
       ↑
   所有功能都可被AI增强
```

#### 6.1.2 AI Core Layer设计

**核心职责**：
1. **理解用户意图** - NLU (Natural Language Understanding)
2. **访问知识库** - RAG (Retrieval Augmented Generation)
3. **执行操作** - Tool Use (Function Calling)
4. **学习用户习惯** - Personalization

**架构图**：
```
┌─────────────────────────────────────────────┐
│           Application Layer                 │
│  (Notes/Task/Password UI + Business Logic)  │
└────────────┬────────────────────────────────┘
             │ 调用
┌────────────▼────────────────────────────────┐
│              AI Core Layer                  │
│  ┌──────────────────────────────────────┐  │
│  │     Intent Understanding (NLU)       │  │
│  │  - 意图识别                           │  │
│  │  - 实体提取                           │  │
│  │  - 上下文管理                         │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │     Knowledge Retrieval (RAG)        │  │
│  │  - 向量检索                           │  │
│  │  - 关键词检索                         │  │
│  │  - 重排序                             │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │     Action Execution (Tool Use)      │  │
│  │  - 创建笔记                           │  │
│  │  - 搜索笔记                           │  │
│  │  - 更新任务状态                       │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │     Personalization Engine            │  │
│  │  - 用户习惯学习                       │  │
│  │  - 个性化推荐                         │  │
│  │  - A/B测试框架                       │  │
│  └──────────────────────────────────────┘  │
└────────────┬────────────────────────────────┘
             │ 调用
┌────────────▼────────────────────────────────┐
│           AI Provider Layer                 │
│  (DeepSeek/OpenAI/Ollama/LM Studio/Mock)   │
└─────────────────────────────────────────────┘
```

#### 6.1.3 NLU（意图理解）设计

**目标**：让用户用自然语言操作Oner

**示例场景**：
```
用户输入                          → 理解意图              → 执行操作
─────────────────────────────────────────────────────────────
"提醒我明天开会"                   → 创建任务+设置提醒     → INSERT note + reminder
"总结本周工作笔记"                 → 查询本周笔记+AI总结   → SELECT + AI call
"把关于AI的笔记整理一下"          → 搜索AI相关笔记       → SELECT + AI categorize
"帮我规划一下Q3的项目任务"        → 创建项目笔记+子任务   → CREATE note + subtasks
```

**技术实现**：
```typescript
// Intent Recognition Prompt
const intentPrompt = `
你是Oner的AI助手。分析用户输入，识别意图和实体。

用户输入：{userInput}

可能意图：
- create_note: 创建笔记
- search_notes: 搜索笔记
- update_task: 更新任务
- summarize: 总结内容
- plan: 制定计划

输出JSON：
{
  "intent": "create_note",
  "entities": {
    "title": "Q3项目规划",
    "category": "工作",
    "due_date": "2026-09-30"
  },
  "confidence": 0.95
}
`;
```

### 6.2 RAG（检索增强生成）设计

#### 6.2.1 为什么需要RAG？

**问题**：LLM训练数据不包含用户个人笔记，无法直接回答"我的项目A进展如何"

**RAG解决方案**：
```
1. 用户提问："项目A进展如何？"
2. RAG检索：从用户笔记中找到关于"项目A"的笔记（Top 5）
3. 构建Prompt：将检索到的笔记作为上下文，问LLM
4. LLM回答：基于用户笔记内容生成回答
```

#### 6.2.2 RAG流程设计

```
┌─────────────────┐
│  用户提问        │
│ "项目A进展如何?" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query Processing│
│ - 意图识别       │
│ - 实体提取       │
│ - 查询改写       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Retrieval      │
│ - 向量检索 TopK  │  ← Embedding Model
│ - 关键词检索     │  ← FTS5
│ - 混合排序 (RRF) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ReRanking      │
│ - 相关性重排     │  ← Cross-Encoder
│ - 多样性保证     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Augmented Gen  │
│ - 构建Prompt     │
│ - 调用LLM        │
│ - 流式输出       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  返回答案        │
│ + 引用来源       │
└─────────────────┘
```

#### 6.2.3 检索策略设计

**混合检索（关键词+语义）**：
```typescript
async function retrieveRelevantNotes(query: string): Promise<Note[]> {
  // 1. 向量检索
  const queryEmbedding = await ai.embed(query);
  const vectorResults = await db.searchVector(queryEmbedding, topK: 20);
  
  // 2. 关键词检索（FTS5）
  const keywordResults = await db.searchFTS(query, limit: 20);
  
  // 3. 混合排序（RRF）
  const merged = reciprocalRankFusion(vectorResults, keywordResults);
  
  // 4. 重排序（Cross-Encoder，可选）
  const reranked = await rerankWithCrossEncoder(query, merged.slice(0, 10));
  
  return reranked;
}
```

**Embedding模型选择**：
```
方案A: 本地模型（推荐，隐私优先）
  - model: all-MiniLM-L6-v2 (384维)
  - 大小: 80MB
  - 性能: 快，准确率中等
  - 部署: Ollama本地运行
  
方案B: 云端API（准确率高，但隐私风险）
  - OpenAI text-embedding-3-small
  - DeepSeek embedding API
  - 费用: $0.02/1M tokens
  
方案C: 混合（智能路由）
  - 敏感笔记 → 本地模型
  - 非敏感笔记 → 云端API
  
推荐：方案A（本地模型），符合Oner隐私优先定位
```

### 6.3 Tool Use（工具调用）设计

#### 6.3.1 Function Calling架构

**目标**：让AI能调用Oner的功能（创建笔记、搜索、更新任务等）

**OpenAI Function Calling示例**：
```typescript
const functions = [
  {
    name: "create_note",
    description: "创建新笔记或任务",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "笔记标题" },
        content: { type: "string", description: "笔记内容（Markdown）" },
        category: { type: "string", description: "分类名称" },
        status: { type: "string", enum: ["memo", "todo", "in_progress", "done"] }
      },
      required: ["title"]
    }
  },
  {
    name: "search_notes",
    description: "搜索笔记",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词" },
        category: { type: "string", description: "限定分类" }
      },
      required: ["query"]
    }
  }
  // ... 更多工具
];

// AI调用示例
const response = await ai.chat(messages, { functions });
// AI返回: { function_call: { name: "create_note", arguments: {...} } }
```

#### 6.3.2 Oner Tool集设计

| Tool名称 | 描述 | 参数 |
|----------|------|------|
| **create_note** | 创建笔记 | title, content, category, status, priority, due_date |
| **update_note** | 更新笔记 | note_id, title, content, status, ... |
| **delete_note** | 删除笔记 | note_id |
| **search_notes** | 搜索笔记 | query, category, date_range |
| **get_note** | 获取单条笔记 | note_id |
| **create_category** | 创建分类 | name, color, icon |
| **list_categories** | 列出所有分类 | - |
| **set_reminder** | 设置提醒 | note_id, reminder_time |
| **summarize_notes** | 总结笔记 | note_ids / date_range |

---

## 7. 数据模型与存储设计

### 7.1 数据库Schema设计（升级版）

#### 7.1.1 核心表结构

**notes表**（笔记主表）：
```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  
  -- 基础字段
  title TEXT NOT NULL DEFAULT '',
  content TEXT, -- Markdown原文
  content_html TEXT, -- 渲染HTML（缓存）
  
  -- 组织字段
  category_id INTEGER,
  tags TEXT, -- JSON数组: ["工作", "项目A"]
  
  -- 任务字段
  status TEXT DEFAULT 'memo' CHECK(status IN ('memo','todo','in_progress','done','archived')),
  priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 4),
  due_date TEXT,
  reminder_time TEXT,
  
  -- 递归/子任务
  parent_id INTEGER, -- 父笔记ID（子任务场景）
  
  -- AI字段
  ai_summary TEXT,
  ai_tags TEXT, -- JSON数组
  ai_sentiment REAL, -- 情感分析(-1到1)
  embedding BLOB, -- 向量嵌入
  
  -- 同步字段
  version INTEGER DEFAULT 1,
  sync_status TEXT DEFAULT 'pending', -- pending/synced/conflict
  deleted_at TEXT, -- 软删除
  
  -- 时间戳
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY(category_id) REFERENCES categories(id),
  FOREIGN KEY(parent_id) REFERENCES notes(id)
);

CREATE INDEX idx_notes_uuid ON notes(uuid);
CREATE INDEX idx_notes_category ON notes(category_id);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_due_date ON notes(due_date) WHERE due_date IS NOT NULL;
```

**categories表**（分类）：
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  parent_id INTEGER, -- 支持多级分类
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY(parent_id) REFERENCES categories(id)
);
```

**tags表**（标签，独立表方便统计）：
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0, -- 使用次数
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY(note_id) REFERENCES notes(id),
  FOREIGN KEY(tag_id) REFERENCES tags(id)
);
```

**attachments表**（附件）：
```sql
CREATE TABLE attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- 相对路径
  file_size INTEGER,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY(note_id) REFERENCES notes(id)
);
```

**ai_conversations表**（AI对话历史）：
```sql
CREATE TABLE ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER, -- 可选，关联到某条笔记
  category_id INTEGER, -- 可选，关联到某分类
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY(note_id) REFERENCES notes(id),
  FOREIGN KEY(category_id) REFERENCES categories(id)
);
```

#### 7.1.2 FTS5全文搜索配置

```sql
-- 创建FTS5虚拟表
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title, 
  content,
  content='notes',
  content_rowid='id',
  tokenize='trigram'
);

-- 触发器：笔记变更时更新FTS索引
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES ('delete', old.id, old.title, old.content);
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;
```

### 7.2 文件存储设计

#### 7.2.1 笔记附件存储

**目录结构**：
```
data/
├── notes/           # 笔记Markdown文件（可选，用于Git式管理）
│   ├── 2026/
│   │   ├── 06/
│   │   │   ├── note-xxx.md
│   │   │   └── ...
├── attachments/     # 附件文件
│   ├── 2026/
│   │   ├── 06/
│   │   │   ├── image-xxx.png
│   │   │   └── doc-xxx.pdf
├── thumbnails/      # 缩略图缓存
└── temp/           # 临时文件
```

#### 7.2.2 向量数据存储

**方案A：SQLite + vec扩展（推荐）**
```sql
-- 安装sqlite-vec扩展
LOAD EXTENSION vec0;

-- 创建向量表
CREATE TABLE note_embeddings (
  note_id INTEGER PRIMARY KEY,
  embedding BLOB, -- serialize后的float32数组
  model TEXT, -- 使用的embedding模型
  created_at TEXT,
  
  FOREIGN KEY(note_id) REFERENCES notes(id)
);

-- 向量搜索（KNN）
SELECT note_id, vec_distance_L2(embedding, ?) as distance
FROM note_embeddings
ORDER BY distance
LIMIT 10;
```

**方案B：独立向量数据库（ChromaDB）**
```python
# ChromaDB client
import chromadb

client = chromadb.PersistentClient(path="./data/chroma")

collection = client.get_collection("notes")
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=10
)
```

---

## 8. 技术架构升级方案

### 8.1 后端架构优化

#### 8.1.1 当前架构问题

**问题1：单线程Node.js，CPU密集任务阻塞**
- AI调用、向量计算都是CPU密集任务
- 会阻塞其他API请求

**问题2：无任务队列，AI请求无法异步处理**
- 长耗时AI任务（如批量整理笔记）会超时

**问题3：无缓存层，重复计算**
- 相同笔记的AI分析会重复调用

#### 8.1.2 升级方案

**引入任务队列（BullMQ）**：
```typescript
// AI任务队列
import { Queue, Worker } from 'bullmq';

const aiQueue = new Queue('ai-tasks', {
  connection: { host: 'localhost', port: 6379 }
});

// 提交AI任务
await aiQueue.add('analyze-note', {
  noteId: 123,
  task: 'summarize'
});

// Worker处理任务
const worker = new Worker('ai-tasks', async (job) => {
  if (job.name === 'analyze-note') {
    const result = await ai.analyzeNote(job.data.noteId);
    await saveResult(job.data.noteId, result);
  }
});
```

**引入缓存层（Redis）**：
```typescript
// 缓存AI结果
async function getAISummary(noteId: number): Promise<string> {
  const cacheKey = `ai:summary:${noteId}`;
  let summary = await redis.get(cacheKey);
  
  if (!summary) {
    summary = await ai.summarize(await getNote(noteId));
    await redis.set(cacheKey, summary, 'EX', 3600); // 1小时过期
  }
  
  return summary;
}
```

**AI服务独立进程（可选）**：
```
方案：将AI服务拆分为独立微服务
  - 主服务：Note/Task/Auth API
  - AI服务：AI分析/向量计算（可部署在GPU机器）
  
通信：gRPC / REST / Message Queue

优势：AI服务可独立扩展，不影响主服务
劣势：部署复杂度增加
```

### 8.2 前端架构优化

#### 8.2.1 当前架构问题

**问题1：所有组件在一个Bundle，首屏加载慢**
**问题2：无状态管理，组件间通信靠props/context**
**问题3：离线能力不足，Service Worker配置简单**

#### 8.2.2 升级方案

**代码分割（Code Splitting）**：
```typescript
// 路由级分割
const HomePage = lazy(() => import('./pages/HomePage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));

// 组件级分割
const HeavyChart = lazy(() => import('./components/Chart'));
```

**状态管理（Zustand，轻量级）**：
```typescript
import create from 'zustand';

interface NoteStore {
  notes: Note[];
  loading: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (note: Partial<Note>) => Promise<void>;
}

const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  loading: false,
  
  fetchNotes: async () => {
    set({ loading: true });
    const notes = await api.getNotes();
    set({ notes, loading: false });
  },
  
  createNote: async (note) => {
    const newNote = await api.createNote(note);
    set((state) => ({ notes: [newNote, ...state.notes] }));
  }
}));
```

**离线能力增强（Workbox）**：
```typescript
// workbox.config.js
import { generateSW } from 'workbox-build';

generateSW({
  swDest: './dist/sw.js',
  globDirectory: './dist',
  globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
  
  // 运行时缓存API请求
  runtimeCaching: [{
    urlPattern: /\/api\/notes/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-notes',
      expiration: { maxEntries: 50 }
    }
  }],
  
  // 跳过等待，立即激活新SW
  skipWaiting: true,
  clientsClaim: true
});
```

### 8.3 部署架构优化

#### 8.3.1 当前架构

```
Docker Compose:
  - frontend (Nginx)
  - backend (Node.js)
  - database (SQLite文件)
```

#### 8.3.2 升级方案（支持规模增长）

**方案A：小型部署（1-10用户）**
```
同当前架构，增加Redis缓存
```

**方案B：中型部署（10-100用户）**
```
- Frontend: Nginx (多实例，负载均衡)
- Backend: Node.js (多实例，PM2集群)
- Database: PostgreSQL (替代SQLite，支持并发)
- Cache: Redis
- Vector DB: ChromaDB (独立服务)
```

**方案C：大型部署（100+用户，SaaS化）**
```
- Frontend: CDN (静态资源)
- Backend: K8s (自动扩缩容)
- Database: PostgreSQL (主从复制)
- Cache: Redis Cluster
- Queue: RabbitMQ / Kafka
- Vector DB: Milvus / Qdrant (生产级向量DB)
- Object Storage: S3 (附件存储)
```

**推荐路线**：先优化方案A（当前），用户量增长后再迁移方案B

---

## 9. 用户体验设计

### 9.1 核心交互设计

#### 9.1.1 快速记录（Quick Capture）

**设计目标**：让用户3秒内完成记录

**交互流程**：
```
1. 全局快捷键 (Ctrl+Shift+Space / Cmd+Shift+Space)
   → 唤起浮动输入框（置顶，不抢焦点）

2. 输入内容（支持自然语言）
   例："明天9点提醒我开会讨论Q3预算"

3. AI实时理解（输入时即分析）
   → 识别意图：创建任务+提醒
   → 提取实体：时间=明天9点，标题=开会讨论Q3预算

4. 预览确认（可选）
   → 显示"将创建任务：开会讨论Q3预算，提醒时间：明天9:00"
   → 用户按Enter确认，或继续编辑

5. 创建完成
   → Toast提示"已创建任务"
   → 浮动框清空，准备下一次记录
```

**技术实现**：
```typescript
// 浮动输入框组件
function FloatingInput() {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  
  // 输入时实时调用AI分析（debounce 500ms）
  useEffect(() => {
    if (input.length > 5) {
      debouncedAnalyze(input);
    }
  }, [input]);
  
  async function debouncedAnalyze(text: string) {
    const result = await ai.analyzeIntent(text);
    setPreview(result); // { intent, entities, confidence }
  }
  
  async function handleSubmit() {
    if (preview && preview.confidence > 0.7) {
      // 高置信度，直接创建
      await createNoteFromIntent(preview);
    } else {
      // 低置信度，展示预览让用户确认
      showConfirmationModal(preview);
    }
  }
  
  return (
    <div className="floating-input" style={{ position: 'fixed', top: 20, right: 20 }}>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="快速记录... (Ctrl+Shift+Space)"
      />
      {preview && <PreviewPanel preview={preview} />}
    </div>
  );
}
```

#### 9.1.2 智能搜索（Smart Search）

**设计目标**：自然语言搜索，像和人对话一样

**交互流程**：
```
1. 用户按Ctrl+K打开搜索
   → 搜索框获得焦点

2. 输入自然语言查询
   例："上周关于AI的笔记"

3. 实时显示结果（边输入边搜索）
   → 关键词高亮
   → 按相关度排序

4. 筛选器（可选）
   → 日期范围：上周
   → 分类：AI
   → 类型：笔记/任务

5. 点击结果跳转
   → 打开笔记/任务详情
```

**搜索结果展示设计**：
```
搜索："上周关于AI的笔记"

结果1: 📝 Q3 AI项目规划 [工作] 
  匹配："...启动AI驱动的知识管理系统，目标是让AI成为Oner的..."
  时间：2026-06-02
  
结果2: ✅ 完成AI竞品分析 [工作]
  匹配："...分析了Notion、Obsidian、SiYuan等竞品在AI能力上的差异..."
  时间：2026-06-05
  
结果3: 💡 AI原生架构思考 [想法]
  ...
```

### 9.2 响应式设计

#### 9.2.1 断点设计

```css
/* 移动端优先 */
.container {
  padding: 16px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}

/* 大屏 */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

#### 9.2.2 移动端优化

**导航设计**：
```
桌面端：左侧边栏永久显示
移动端：底部Tab栏 + 可滑出侧边栏

底部Tab：
  - 笔记 (列表)
  - 看板 (任务)
  - AI (对话)
  - 搜索
  - 设置
```

**触摸优化**：
```css
/* 最小触摸目标44x44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 避免误触 */
.button {
  margin: 8px; /* 按钮间距 */
}
```

### 9.3 无障碍设计（Accessibility）

**WCAG 2.1 AA级合规**：

```typescript
// 键盘导航
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '/' && !isInputFocused()) {
      e.preventDefault();
      openSearch();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

// ARIA标签
<button 
  aria-label="删除笔记"
  aria-describedby="delete-note-help"
  onClick={handleDelete}
>
  <TrashIcon />
</button>
<div id="delete-note-help" className="sr-only">
  按Delete键可快速删除
</div>

// 焦点管理
function NoteDetail({ noteId }) {
  const titleRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // 打开笔记时，焦点自动移到标题
    titleRef.current?.focus();
  }, [noteId]);
}
```

---

## 10. 路线图与优先级

### 10.1 产品路线图（2026-2027）

#### Q3 2026 (当前季度) - "AI原生MVP"

**P0 核心功能**：
- [ ] **浮动AI输入框** - 全局快速记录（已有设计）
- [ ] **AI自动分类** - 自然语言→自动归类（已有设计）
- [ ] **Ollama/LM Studio本地AI接入** - 零联网AI（已有规划）
- [ ] **语义搜索（Beta）** - 向量搜索上线（已有设计）

**P1 重要功能**：
- [ ] **AI任务问答** - "今天要做什么"（已有规划）
- [ ] **同步引擎（Alpha）** - WebSocket基础同步（已有设计）
- [ ] **密码保险库分类** - 按类别组织（已有设计）

**P2 体验优化**：
- [ ] **编辑器升级** - 替换为TipTap（已有建议）
- [ ] **PWA离线增强** - Workbox配置（已有设计）

---

#### Q4 2026 - "协作与生态"

**P0 核心功能**：
- [ ] **MCP Server实现** - 成为全球首个支持MCP的自托管PKM（差异化！）
- [ ] **分享功能** - 笔记分享链接（只读）
- [ ] **日历视图** - 按截止日期展示任务

**P1 重要功能**：
- [ ] **浏览器扩展（Alpha）** - 网页剪藏+自动填充（已有规划）
- [ ] **同步引擎（Beta）** - 冲突解决+多设备支持
- [ ] **AI定时整理** - 每日凌晨AI自动整理昨日笔记

---

#### Q1 2027 - "规模化"

**P0 核心功能**：
- [ ] **性能优化** - 支持10万+笔记不卡顿
- [ ] **PostgreSQL迁移** - 从SQLite迁移（可选，用户自主选择）
- [ ] **插件系统（Alpha）** - 第三方扩展能力

**P1 重要功能**：
- [ ] **多语言支持** - i18n基础设施
- [ ] **移动端App（React Native）** - 原生移动体验（替代PWA）

---

#### Q2-Q4 2027 - "生态繁荣"

**核心方向**：
- 插件市场
- API开放平台
- 社区建设
- 商业化探索（开源+增值服务）

### 10.2 功能优先级评估矩阵

| 功能 | 用户价值 | 技术难度 | 差异化 | 优先级 | 季度 |
|------|---------|---------|--------|--------|------|
| **浮动AI输入框** | 高 | 中 | 高 | P0 | Q3 2026 |
| **AI自动分类** | 高 | 中 | 高 | P0 | Q3 2026 |
| **本地AI接入** | 高 | 低 | 高 | P0 | Q3 2026 |
| **语义搜索** | 高 | 高 | 中 | P0 | Q3 2026 |
| **MCP Server** | 中 | 高 | **极高** | P0 | Q4 2026 |
| **同步引擎** | 高 | 高 | 中 | P1 | Q3-Q4 2026 |
| **浏览器扩展** | 中 | 中 | 中 | P1 | Q4 2026 |
| **日历视图** | 中 | 低 | 低 | P1 | Q4 2026 |
| **插件系统** | 中 | 高 | 中 | P2 | Q1 2027 |
| **移动端App** | 高 | 高 | 低 | P2 | Q1 2027 |

### 10.3 技术债务与重构优先级

| 技术债务 | 影响 | 修复成本 | 优先级 | 时间 |
|---------|------|---------|--------|------|
| **前端状态管理混乱** | 中 | 中 | P1 | Q3 2026 |
| **后端无任务队列** | 高 | 中 | P0 | Q3 2026 |
| **SQLite并发性能** | 中 | 高 | P2 | Q1 2027 |
| **测试覆盖率低** | 高 | 高 | P1 | 持续 |

---

## 附录A：开源协议与商业化

### A.1 开源协议选择

**推荐：MIT License（宽松开源）**

**理由**：
1. 最大化采用率 - MIT最宽松，任何人可商用
2. 建立生态 - 吸引贡献者，快速迭代
3. 商业化空间 - MIT允许商业化（可双协议：开源版+企业版）

**备选：AGPL v3（强开源）**
- 要求修改后的代码也必须开源
- 防止云服务商白嫖代码
- 但可能降低采用率

**建议**：先用MIT快速建立用户基础，3-6个月用户量上去后再考虑双协议

### A.2 商业化路径

**模式：Open Core（开源核心+增值服务）**

```
免费版（MIT开源）：
  ✅ 所有核心功能
  ✅ 自托管部署
  ✅ 本地AI支持
  ✅ 社区支持

付费版（商业授权）：
  💰 官方托管服务（SaaS版）
  💰 企业级功能（SSO、审计日志、权限管理）
  💰 优先技术支持
  💰 高级AI模型（云端GPU推理）
```

**定价参考**：
```
SaaS版：
  - 个人版：$5/月 或 $50/年
  - 团队版：$10/人/月（5人起）
  
自托管企业版：
  - 永久授权：$499/企业（最多50人）
  - 年订阅：$199/年（含更新+支持）
```

---

## 附录B：风险与应对

### B.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| **SQLite并发性能瓶颈** | 高 | 提前规划PostgreSQL迁移方案 |
| **向量搜索性能** | 中 | 先做SQLite vec扩展，大规模时迁移ChromaDB |
| **AI成本失控** | 中 | 默认本地AI，云端AI需用户自备API Key |
| **浏览器兼容性问题** | 低 | PWA降级方案，不支持的浏览器用基础功能 |

### B.2 市场风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| **竞品快速跟进（如Obsidian加AI）** | 高 | 加快MCP+自托管差异化，建立生态壁垒 |
| **用户量增长不及预期** | 中 | 加强社区运营，技术博客，GitHub推广 |
| **开源社区活跃度低** | 中 | 设立插件奖金， hackathon活动 |

### B.3 合规风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| **GDPR/CCPA合规** | 高 | 自托管天然合规（数据不在云端） |
| **加密出口管制** | 低 | AES-256是标准算法，无管制风险 |
| **AI生成内容版权** | 中 | 用户自负责，Oner仅提供工具 |

---

## 附录C：成功指标（KPI）

### C.1 产品指标

| 指标 | 目标（6个月） | 目标（1年） |
|------|--------------|------------|
| **GitHub Stars** | 1,000 | 5,000 |
| **活跃用户（MAU）** | 500 | 5,000 |
| **留存率（7日）** | 40% | 60% |
| **功能使用率（AI）** | 60% | 80% |

### C.2 技术指标

| 指标 | 目标 |
|------|------|
| **首屏加载时间** | <2秒（P95） |
| **API响应时间** | <200ms（P95） |
| **AI响应时间** | <3秒（流式首字） |
| **测试覆盖率** | >70% |

### C.3 社区指标

| 指标 | 目标（1年） |
|------|------------|
| **贡献者数量** | 20+ |
| **插件数量** | 50+ |
| **技术博客阅读** | 10万+ |

---

## 总结

本文档为Oner产品提供了从市场分析、用户研究、功能设计到技术架构的全面规划。

**核心差异化**：
1. **AI原生+隐私优先+自托管** 的独特组合
2. **MCP协议支持**（全球首个）让Oner成为AI工作流的节点
3. **开放标准**（Markdown+标准API）对抗厂商锁定

**下一步行动**：
1. **立即开始**：浮动AI输入框 + AI自动分类（Q3 2026 P0）
2. **重点突破**：MCP Server实现（Q4 2026，差异化核心竞争力）
3. **长期建设**：插件生态 + 社区运营

---

**文档维护**：本文档应随产品迭代持续更新，建议每季度review一次。

**联系人**：[Your Name] - Oner产品负责人  
**最后更新**：2026-06-08

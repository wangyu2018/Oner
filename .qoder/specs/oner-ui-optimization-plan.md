# Oner UI 优化实施计划

**日期**: 2026-06-09 | **周期**: 8周

## 当前状态

基于"产品脑暴报告"的22个创意，筛选保留12个，Top 3深度展开。代码库经过审查，关键发现：
- tailwind.config仅41行，缺少Design Token体系
- 编辑器已有基础useAutoSave（仅localStorage草稿）
- UndoToast已存在（仅删除撤销专用）
- 首页全页spinner加载
- emoji图标未统一
- 双行Toolbar占用~90px

## 实施路线图

### 第1周：基础层建设 (Foundation)
**目标**: 建立 Design Token 系统 + 原子组件库

- [ ] `frontend/tailwind.config.js` 扩展至~200行（spacing/colors/boxShadow/fontSize/transition/animation）
- [ ] `frontend/src/styles/globals.css` 扩充（glass工具类、gradient-text、动画增强）
- [ ] 新建 `frontend/src/components/ui/Button.jsx` - 多variant/size的按钮组件
- [ ] 新建 `frontend/src/components/ui/Input.jsx` - 带label/error/icon的输入组件
- [ ] 新建 `frontend/src/components/ui/Modal.jsx` - 通用弹窗组件
- [ ] 新建 `frontend/src/components/ui/Toast.jsx` - 通用Toast组件
- [ ] 新建 `frontend/src/components/ui/Skeleton.jsx` - 骨架屏组件

### 第2周：核心组件重构 (Core Refactor)
**目标**: Toolbar/NoteCard/CardWall三大组件视觉升级

- [ ] `frontend/src/components/Toolbar.jsx` 重构为双行布局（品牌行+筛选输入行）
- [ ] `frontend/src/components/NoteCard.jsx` 信息架构重组（4层结构）
- [ ] `frontend/src/components/CardWall.jsx` 增加stagger入场动画

### 第3周：Quick Wins (SVG+Toast+骨架屏)
**目标**: 快速提升感知体验

- [ ] 全局emoji→Lucide SVG图标替换（创意3）
- [ ] 新建 `frontend/src/hooks/useToast.js` 全局Toast管理hook
- [ ] `frontend/src/components/UndoToast.jsx` 改用通用Toast组件
- [ ] `frontend/src/pages/Home.jsx` 骨架屏替代全页spinner
- [ ] `frontend/src/pages/BoardPage.jsx` 看板列骨架屏

### 第4周：编辑器自动保存+AI融合
**目标**: 沉浸式编辑体验

- [ ] `frontend/src/hooks/useAutoSave.js` 重写（后端自动保存+状态指示器）
- [ ] `frontend/src/components/NoteEditor.jsx` 集成新版自动保存
- [ ] `frontend/src/components/AIAssistant.jsx` 重构为可折叠侧边栏/底部Sheet

### 第5周：首页"今日工作台"重构
**目标**: 解决首页信息过载核心痛点

- [ ] 新建 `frontend/src/components/TodayFocus.jsx` 今日聚焦模块
- [ ] `frontend/src/components/CardWall.jsx` 智能网格扩展（多布局/权重系统）
- [ ] `frontend/src/components/CommandPalette.jsx` CommandBar增强

### 第6周：全局感知性能系统
**目标**: 让整个产品"感觉"更快

- [ ] `frontend/src/hooks/useNotes.js` 乐观更新（create/update/delete）
- [ ] `frontend/src/components/BottomNav.jsx` Spring过渡动画
- [ ] 全局按压反馈 active:scale-[0.97]
- [ ] 剩余emoji替换收尾

### 第7周：辅助页面美化
**目标**: 统一全产品视觉语言

- [ ] `frontend/src/pages/Login.jsx` 毛玻璃卡片+渐变背景
- [ ] `frontend/src/pages/Register.jsx` 同步登录页风格
- [ ] `frontend/src/pages/AIChat.jsx` 布局+气泡美化
- [ ] `frontend/src/pages/PasswordVault.jsx` 卡片列表视觉升级
- [ ] `frontend/src/pages/BoardPage.jsx` 列头+拖拽反馈增强

### 第8周：全量回归测试
- [ ] 5个断点响应式验证（375/768/1024/1440/1920）
- [ ] 暗色模式一致性检查
- [ ] 无障碍检查（aria-label/焦点导航/reduced-motion）
- [ ] Bundle大小对比

## 关键文件清单

| 文件路径 | 操作 |
|----------|------|
| `c:\AI\oner\frontend\tailwind.config.js` | 扩展 |
| `c:\AI\oner\frontend\src\styles\globals.css` | 扩充 |
| `c:\AI\oner\frontend\src\components\ui\Button.jsx` | 新建 |
| `c:\AI\oner\frontend\src\components\ui\Input.jsx` | 新建 |
| `c:\AI\oner\frontend\src\components\ui\Modal.jsx` | 新建 |
| `c:\AI\oner\frontend\src\components\ui\Toast.jsx` | 新建 |
| `c:\AI\oner\frontend\src\components\ui\Skeleton.jsx` | 新建 |
| `c:\AI\oner\frontend\src\hooks\useToast.js` | 新建 |
| `c:\AI\oner\frontend\src\hooks\useAutoSave.js` | 重写 |
| `c:\AI\oner\frontend\src\hooks\useNotes.js` | 修改 |
| `c:\AI\oner\frontend\src\components\Toolbar.jsx` | 重构 |
| `c:\AI\oner\frontend\src\components\NoteCard.jsx` | 重构 |
| `c:\AI\oner\frontend\src\components\CardWall.jsx` | 重写 |
| `c:\AI\oner\frontend\src\components\NoteEditor.jsx` | 修改 |
| `c:\AI\oner\frontend\src\components\AIAssistant.jsx` | 重构 |
| `c:\AI\oner\frontend\src\components\UndoToast.jsx` | 重写 |
| `c:\AI\oner\frontend\src\components\TodayFocus.jsx` | 新建 |
| `c:\AI\oner\frontend\src\components\BottomNav.jsx` | 修改 |
| `c:\AI\oner\frontend\src\pages\Home.jsx` | 修改 |
| `c:\AI\oner\frontend\src\pages\Login.jsx` | 重构 |
| `c:\AI\oner\frontend\src\pages\AIChat.jsx` | 重构 |
| `c:\AI\oner\frontend\src\pages\PasswordVault.jsx` | 重构 |
| `c:\AI\oner\frontend\src\pages\BoardPage.jsx` | 修改 |

## 验证方式

- 每周末 `npm run build` 确认无编译错误
- 每次改动后手动验证功能完整性
- 第8周进行性能对比（Lighthouse Score）
- 使用 `prefers-reduced-motion` 验证动画降级

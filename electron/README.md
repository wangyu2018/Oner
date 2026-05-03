# Oner Desktop - Electron 桌面应用

## 功能特性

- 系统托盘图标
- 全局快捷键
- 最小化到托盘
- 快速新建备忘
- 自动更新（待实现）

## 开发环境设置

### 1. 安装依赖

```bash
cd oner/electron
npm install
```

### 2. 准备图标

在 `icons` 目录下放置以下图标文件：

- `icon.png` - 512x512 PNG 图标（用于 Linux 和开发环境）
- `icon.ico` - Windows ICO 图标（包含多种尺寸：16x16, 32x32, 48x48, 256x256）
- `icon.icns` - macOS ICNS 图标

**推荐使用在线工具生成图标：**
- https://www.icoconverter.com/ - 转换为 ICO 格式
- https://cloudconvert.com/png-to-icns - 转换为 ICNS 格式

### 3. 开发运行

```bash
# 终端 1：启动前端开发服务器
cd oner/frontend
npm run dev

# 终端 2：启动 Electron
cd oner/electron
npm run dev
```

## 构建打包

### Windows 安装程序

```bash
cd oner/electron
npm run build:win
```

构建完成后，安装程序位于 `electron/dist/` 目录。

### macOS 应用

```bash
npm run build:mac
```

### Linux 应用

```bash
npm run build:linux
```

## 快捷键说明

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+O` | 显示/隐藏主窗口 |
| `Ctrl+Shift+N` | 快速新建备忘 |
| `Ctrl+N` | 新建备忘（应用内） |
| `Ctrl+S` | 保存备忘 |

## 系统托盘功能

- 双击托盘图标：显示主窗口
- 右键菜单：
  - 显示主窗口
  - 快速新建备忘
  - 退出应用

## 目录结构

```
electron/
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本
├── package.json     # 依赖和构建配置
├── icons/           # 应用图标
│   ├── icon.png
│   ├── icon.ico
│   └── icon.icns
└── README.md
```

## 注意事项

1. 首次运行前确保已安装 Node.js 和 npm
2. 构建前需要先启动后端服务
3. 开发模式下会自动打开开发者工具
4. 生产模式下关闭窗口会最小化到托盘

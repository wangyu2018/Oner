# Electron 安装指南

## 快速解决方案

### 方案一：使用全局 Electron（推荐）

```bash
# 1. 全局安装 Electron
npm install -g electron@28.0.0 --registry=https://registry.npmmirror.com

# 2. 安装项目依赖（跳过 Electron 下载）
cd oner/electron
npm install auto-launch electron-store --save --ignore-scripts
npm install electron-builder --save-dev --ignore-scripts

# 3. 启动应用
start-electron-global.bat
```

### 方案二：使用国内镜像

```bash
# 运行安装脚本
install-electron.bat
```

### 方案三：手动安装

1. 下载 Electron：https://npmmirror.com/mirrors/electron/28.0.0/
   - 选择 `electron-v28.0.0-win32-x64.zip`

2. 放置到缓存目录：
   ```
   C:\Users\你的用户名\AppData\Local\electron\Cache\
   ```

3. 运行：
   ```bash
   npm install
   ```

## 环境检查

运行 `check-electron.bat` 检查环境。

## 常见问题

### 1. ECONNRESET 错误

网络问题，使用国内镜像：
```bash
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
```

### 2. EPERM 错误

权限问题：
1. 关闭所有编辑器
2. 以管理员身份运行
3. 重试

### 3. 下载慢或超时

使用方案一（全局 Electron）最快。

## 文件说明

- `install-electron.bat` - 完整安装脚本
- `install-electron-simple.bat` - 简化安装（跳过 Electron 下载）
- `check-electron.bat` - 环境检查
- `start-electron-global.bat` - 使用全局 Electron 启动
- `MANUAL_INSTALL.md` - 手动安装详细说明

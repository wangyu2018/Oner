# 手动安装 Electron

如果 `npm install` 因网络问题失败，请按以下步骤手动安装。

## 方法一：使用国内镜像（推荐）

```bash
# 删除旧的 node_modules
rmdir /s /q node_modules

# 设置镜像并安装
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install --registry=https://registry.npmmirror.com
```

或运行：
```bash
install-electron.bat
```

## 方法二：手动下载 Electron

### 1. 下载 Electron

访问：https://npmmirror.com/mirrors/electron/

找到版本 `28.0.0`，下载：
- Windows: `electron-v28.0.0-win32-x64.zip`

### 2. 放置文件

将下载的 zip 文件放到缓存目录：

```
%LOCALAPPDATA%\electron\Cache\
```

通常是：
```
C:\Users\你的用户名\AppData\Local\electron\Cache\
```

文件名格式：
```
electron-v28.0.0-win32-x64.zip
```

### 3. 重新安装

```bash
npm install
```

## 方法三：使用 cnpm

```bash
# 安装 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 使用 cnpm 安装
cnpm install
```

## 方法四：使用 yarn

```bash
# 安装 yarn
npm install -g yarn

# 设置镜像
yarn config set electron_mirror https://npmmirror.com/mirrors/electron/

# 安装
yarn install
```

## 常见问题

### EPERM 错误

如果遇到权限错误：
1. 关闭所有编辑器和终端
2. 以管理员身份运行命令提示符
3. 重试安装

### 下载超时

1. 检查网络连接
2. 尝试使用 VPN
3. 使用方法二手动下载

### 清理缓存

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rmdir /s /q node_modules
del package-lock.json

# 重新安装
npm install
```

# Oner 项目迁移说明

## 项目位置
新位置：`D:\AI牛逼\oner`

## 启动方式

### 方式1：桌面快捷方式（推荐）
1. 双击桌面 `Oner.vbs` 文件
2. 等待启动完成（约 4-5 秒）

### 方式2：手动启动
1. 打开 PowerShell 或 CMD
2. 运行以下命令：
   ```powershell
   cd "D:\AI牛逼\oner\启动脚本"
   .\Oner.ps1
   ```

## 项目结构
```
D:\AI牛逼\oner\
├── backend\          # 后端服务 (Node.js + Express)
├── frontend\         # 前端应用 (React + Vite)
├── electron\         # 桌面应用 (Electron)
├── 启动脚本\         # 启动脚本目录
│   ├── Oner.ps1      # PowerShell 启动脚本
│   ├── Oner.vbs      # VBScript 启动脚本
│   └── test_migration.bat  # 迁移测试脚本
└── README.md         # 项目说明
```

## 注意事项
1. **依赖已安装**：所有 `node_modules` 已复制，无需重新安装
2. **数据库已迁移**：`oner.db` 已复制，包含所有数据
3. **配置已更新**：启动脚本中的路径已更新为新位置

## 测试迁移
运行测试脚本检查依赖：
```cmd
cd "D:\AI牛逼\oner\启动脚本"
test_migration.bat
```

## 常见问题
1. **启动失败**：检查 Node.js 是否已安装
2. **端口占用**：确保 3000 和 5173 端口未被占用
3. **权限问题**：以管理员身份运行 PowerShell

## 技术栈
- 后端：Node.js + Express + SQLite (sql.js)
- 前端：React + Vite + Tailwind CSS
- 桌面：Electron + electron-store

## 更新日志
- 2026-04-30：项目从 `D:\Download\CC-Switch-v3.10.3-Windows-Portable\oner` 迁移到 `D:\AI牛逼\oner`
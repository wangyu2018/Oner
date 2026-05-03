@echo off
echo ========================================
echo   测试 Electron 安装
echo ========================================
echo.

cd /d "%~dp0electron"

echo 检查 node_modules...
if not exist node_modules (
    echo node_modules 不存在，请先运行 install-electron.bat
    pause
    exit /b 1
)

echo 检查 electron 模块...
if not exist node_modules\.bin\electron.cmd (
    echo electron 模块不完整，请重新安装
    pause
    exit /b 1
)

echo.
echo 启动 Electron（开发模式）...
echo 注意：需要先启动后端和前端服务
echo.
echo 按 Ctrl+C 停止
echo.

set NODE_ENV=development
node_modules\.bin\electron.cmd .

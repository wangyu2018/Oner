@echo off
echo ========================================
echo   Oner 项目迁移测试
echo ========================================
echo.

echo [1/3] 检查后端依赖...
cd /d "D:\AI牛逼\oner\backend"
if exist "node_modules" (
    echo ✓ 后端 node_modules 存在
) else (
    echo ✗ 后端 node_modules 不存在，请运行 npm install
    pause
    exit /b 1
)

echo [2/3] 检查前端依赖...
cd /d "D:\AI牛逼\oner\frontend"
if exist "node_modules" (
    echo ✓ 前端 node_modules 存在
) else (
    echo ✗ 前端 node_modules 不存在，请运行 npm install
    pause
    exit /b 1
)

echo [3/3] 检查 Electron 依赖...
cd /d "D:\AI牛逼\oner\electron"
if exist "node_modules" (
    echo ✓ Electron node_modules 存在
) else (
    echo ✗ Electron node_modules 不存在，请运行 npm install
    pause
    exit /b 1
)

echo.
echo 所有依赖检查通过！
echo.
echo 项目已成功迁移到: D:\AI牛逼\oner
echo.
echo 启动方式:
echo   1. 双击桌面 Oner.vbs 启动
echo   2. 或运行: D:\AI牛逼\oner\启动脚本\Oner.ps1
echo.
pause
@echo off
echo ========================================
echo   Oner Electron - 简化安装
echo ========================================
echo.

cd /d "%~dp0electron"

echo 清理旧的安装...
if exist node_modules (
    echo 删除 node_modules...
    rmdir /s /q node_modules 2>nul
    timeout /t 3 /nobreak >nul
)

if exist package-lock.json (
    del package-lock.json
)

echo.
echo 安装核心依赖（跳过 Electron 二进制下载）...
echo.

REM 只安装 auto-launch 和 electron-store
call npm install auto-launch electron-store --save --registry=https://registry.npmmirror.com --ignore-scripts

if errorlevel 1 (
    echo 核心依赖安装失败！
    pause
    exit /b 1
)

echo.
echo 安装开发依赖（跳过 Electron 二进制下载）...
echo.

REM 安装 electron-builder 但跳过 electron
call npm install electron-builder --save-dev --registry=https://registry.npmmirror.com --ignore-scripts

echo.
echo ========================================
echo   核心依赖安装完成！
echo ========================================
echo.
echo 注意：Electron 二进制文件需要单独下载
echo 请参考 MANUAL_INSTALL.md 文件
echo.
echo 或者使用全局安装的 Electron：
echo   npm install -g electron@28.0.0
echo.
pause

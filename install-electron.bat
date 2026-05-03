@echo off
echo ========================================
echo   Oner Electron - 安装依赖（国内镜像）
echo ========================================
echo.

cd /d "%~dp0electron"

echo 清理旧的 node_modules...
if exist node_modules (
    rmdir /s /q node_modules 2>nul
    timeout /t 2 /nobreak >nul
)

echo.
echo 设置国内镜像...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo.
echo 安装依赖...
call npm install --registry=https://registry.npmmirror.com

if errorlevel 1 (
    echo.
    echo 安装失败！请尝试以下方法：
    echo 1. 使用VPN或代理
    echo 2. 手动下载Electron：https://npmmirror.com/mirrors/electron/
    echo 3. 将下载的文件放到：%%LOCALAPPDATA%%\electron\Cache\
    pause
    exit /b 1
)

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
pause

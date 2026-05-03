@echo off
echo ========================================
echo   Oner Electron - 环境检查
echo ========================================
echo.

echo [1/5] 检查 Node.js...
node --version
if errorlevel 1 (
    echo 错误：未安装 Node.js！
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)
echo.

echo [2/5] 检查 npm...
npm --version
if errorlevel 1 (
    echo 错误：npm 不可用！
    pause
    exit /b 1
)
echo.

echo [3/5] 检查全局 Electron...
where electron 2>nul
if errorlevel 1 (
    echo 未找到全局 Electron
    echo 建议运行：npm install -g electron@28.0.0
) else (
    electron --version
    echo 全局 Electron 已安装
)
echo.

echo [4/5] 检查 electron 目录...
cd /d "%~dp0electron"
if not exist package.json (
    echo 错误：electron/package.json 不存在！
    pause
    exit /b 1
)
echo package.json 存在
echo.

echo [5/5] 检查 node_modules...
if exist node_modules (
    echo node_modules 存在
    if exist node_modules\auto-launch (
        echo   - auto-launch: OK
    ) else (
        echo   - auto-launch: 缺失
    )
    if exist node_modules\electron-store (
        echo   - electron-store: OK
    ) else (
        echo   - electron-store: 缺失
    )
) else (
    echo node_modules 不存在，需要安装依赖
)
echo.

echo ========================================
echo   检查完成
echo ========================================
echo.
echo 如果依赖缺失，请运行：
echo   install-electron-simple.bat
echo.
pause

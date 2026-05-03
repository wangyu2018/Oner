@echo off
echo ========================================
echo   Oner Desktop - 使用全局 Electron 启动
echo ========================================
echo.

echo [1/3] 启动后端服务...
cd /d "%~dp0backend"
start "Oner Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo [2/3] 启动前端开发服务器...
cd /d "%~dp0frontend"
start "Oner Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo [3/3] 启动 Electron（全局模式）...
cd /d "%~dp0electron"

REM 检查全局 electron
where electron 2>nul
if errorlevel 1 (
    echo 错误：未找到全局 Electron！
    echo 请先安装：npm install -g electron@28.0.0
    pause
    exit /b 1
)

REM 设置环境变量
set NODE_ENV=development

REM 使用全局 electron 启动
electron .

pause

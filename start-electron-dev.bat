@echo off
echo ========================================
echo   Oner Desktop - 开发环境启动
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

echo [3/3] 启动 Electron...
cd /d "%~dp0electron"
start "Oner Electron" cmd /k "npm run dev"

echo.
echo 所有服务已启动！
echo - 后端: http://localhost:3000
echo - 前端: http://localhost:5173
echo - Electron 窗口将自动打开
echo.
pause

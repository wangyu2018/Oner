@echo off
title Oner Desktop

set "ONER_DIR=%~dp0"
set "FRONTEND_DIR=%ONER_DIR%frontend"
set "BACKEND_DIR=%ONER_DIR%backend"
set "ELECTRON_DIR=%ONER_DIR%electron"

echo [1/3] 启动后端...
start "Oner-Backend" cmd /c "cd /d "%BACKEND_DIR%" && node server.js"

echo [2/3] 启动前端...
start "Oner-Frontend" cmd /c "cd /d "%FRONTEND_DIR%" && npx vite"

timeout /t 3 /nobreak >nul

echo [3/3] 启动桌面应用...
cd /d "%ELECTRON_DIR%"
set NODE_ENV=development
npx electron .

echo.
echo Oner 已退出。

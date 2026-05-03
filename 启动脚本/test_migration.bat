@echo off
echo ========================================
echo   Oner Project Migration Test
echo ========================================
echo.

echo [1/3] Checking backend dependencies...
cd /d "D:\AI牛逼\oner\backend"
if exist "node_modules" (
    echo ✓ Backend node_modules exists
) else (
    echo ✗ Backend node_modules missing, please run npm install
    pause
    exit /b 1
)

echo [2/3] Checking frontend dependencies...
cd /d "D:\AI牛逼\oner\frontend"
if exist "node_modules" (
    echo ✓ Frontend node_modules exists
) else (
    echo ✗ Frontend node_modules missing, please run npm install
    pause
    exit /b 1
)

echo [3/3] Checking Electron dependencies...
cd /d "D:\AI牛逼\oner\electron"
if exist "node_modules" (
    echo ✓ Electron node_modules exists
) else (
    echo ✗ Electron node_modules missing, please run npm install
    pause
    exit /b 1
)

echo.
echo All dependencies check passed!
echo.
echo Project successfully migrated to: D:\AI牛逼\oner
echo.
echo Start methods:
echo   1. Double-click Oner.vbs on desktop
echo   2. Or run: D:\AI牛逼\oner\启动脚本\Oner.ps1
echo.
pause
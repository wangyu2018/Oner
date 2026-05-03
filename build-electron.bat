@echo off
echo ========================================
echo   Oner Desktop - 构建打包
echo ========================================
echo.

echo [1/3] 安装 Electron 依赖...
cd /d "%~dp0electron"
call npm install
if errorlevel 1 (
    echo 安装依赖失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 构建前端...
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
    echo 前端构建失败！
    pause
    exit /b 1
)

echo.
echo [3/3] 打包 Electron 应用...
cd /d "%~dp0electron"
call npm run build:win
if errorlevel 1 (
    echo Electron 打包失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建完成！
echo ========================================
echo.
echo 安装程序位于: electron\dist\
echo.
pause

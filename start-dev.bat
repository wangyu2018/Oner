@echo off
echo Starting Oner development servers...
echo.

echo Starting backend on port 3000...
start "Oner Backend" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak > nul

echo Starting frontend on port 5173...
start "Oner Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Oner is starting up!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause

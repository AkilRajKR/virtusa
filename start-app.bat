@echo off
echo ====================================
echo   AutoAuth AI - Complete Startup
echo ====================================
echo.
echo This will start both backend and frontend servers.
echo Make sure you have Node.js and Python installed.
echo.
pause

echo Starting Backend Server...
start cmd /k "cd backend && python main.py"

timeout /t 5 /nobreak

echo.
echo Starting Frontend Server...
start cmd /k "npm run dev"

echo.
echo ====================================
echo Both servers are starting!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Check the new terminal windows for logs.
echo ====================================
pause

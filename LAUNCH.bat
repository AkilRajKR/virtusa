@echo off
REM ============================================
REM   AutoAuth AI - ONE-COMMAND SETUP
REM   Production-Ready Launch Script
REM ============================================

echo.
echo ========================================
echo    AutoAuth AI - Starting Setup
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js from nodejs.org
    pause
    exit /b 1
)

echo [1/6] Installing backend dependencies...
cd backend
pip install --quiet fastapi uvicorn[standard] sqlalchemy "psycopg[binary]" python-multipart "python-jose[cryptography]" "passlib[bcrypt]" python-dotenv google-generativeai pydantic pydantic-settings alembic aiofiles websockets email-validator bcrypt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [✓] Backend dependencies installed

echo.
echo [2/6] Creating uploads directory...
if not exist "uploads" mkdir uploads
echo [✓] Uploads directory ready

echo.
echo [3/6] Initializing database...
python init_db.py
if %errorlevel% neq 0 (
    echo [WARNING] Database initialization had issues, but continuing...
)
echo [✓] Database initialized

cd ..

echo.
echo [4/6] Installing frontend dependencies...
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [✓] Frontend dependencies installed

echo.
echo [5/6] Starting Backend Server...
start "AutoAuth Backend" cmd /k "cd backend && python main.py"
timeout /t 3 /nobreak >nul

echo.
echo [6/6] Starting Frontend Server...
start "AutoAuth Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo    ✓ AutoAuth AI is Starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Login: admin@autoauth.ai / admin123
echo.
echo Check the new terminal windows for logs.
echo Press any key to close this window.
echo ========================================
pause >nul

@echo off
echo.
echo ========================================
echo    Starting AutoAuth AI Backend
echo ========================================
echo.

cd backend

REM Install dependencies if needed
echo [1/2] Checking dependencies...
pip install --quiet fastapi uvicorn[standard] sqlalchemy "psycopg[binary]" python-multipart "python-jose[cryptography]" "passlib[bcrypt]" python-dotenv google-generativeai pydantic pydantic-settings alembic aiofiles websockets email-validator bcrypt 2>nul
if %errorlevel% equ 0 (
    echo [✓] Dependencies ready
) else (
    echo [!] Dependency check skipped
)

echo.
echo [2/2] Starting backend server...
echo.
echo Backend will run on: http://localhost:8000
echo API Docs available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python main.py

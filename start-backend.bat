@echo off
echo ====================================
echo   AutoAuth AI - Starting Backend
echo ====================================
echo.

cd backend

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Creating uploads directory...
if not exist "uploads" mkdir uploads

echo.
echo Starting FastAPI server...
echo Backend will run on http://localhost:8000
echo.
python main.py

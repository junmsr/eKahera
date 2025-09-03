@echo off
echo ========================================
echo eKahera Database Setup Script
echo ========================================
echo.

echo Step 1: Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)
echo ✅ Node.js is installed

REM Check if PostgreSQL is running (basic check)
echo Checking PostgreSQL connection...
echo.

echo Step 2: Setting up backend...
cd backend
echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo Step 3: Database setup instructions
echo ========================================
echo.
echo IMPORTANT: Before proceeding, you need to:
echo 1. Edit backend/config.env with your database credentials
echo 2. Make sure PostgreSQL is running
echo 3. Have your PostgreSQL password ready
echo.
echo After editing config.env, run:
echo   node restore-db.js
echo.
echo Then test the connection with:
echo   node test-connection.js
echo.
echo Finally start the backend with:
echo   npm run dev
echo.
echo ========================================
echo.
pause

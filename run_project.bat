@echo off
title eKahera Project Runner
color 0A

echo ========================================
echo    eKahera Project Launcher
echo ========================================
echo.

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js is installed

:: Check if concurrently is installed globally
where concurrently >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing concurrently...
    call npm install -g concurrently
    if %errorlevel% neq 0 (
        echo ❌ Failed to install concurrently
        pause
        exit /b 1
    )
    echo ✅ concurrently installed
) else (
    echo ✅ concurrently already installed
)

:: Check backend dependencies
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

:: Check frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo ========================================
echo "Starting Backend & Frontend in one window..."
echo ========================================
echo.

:: Run backend + frontend + open browser in parallel
concurrently ^
  "cd backend && npm run dev" ^
  "cd frontend && npm run dev" ^
  "start http://localhost:5173"

echo.
echo ========================================
echo Servers stopped.
echo ========================================
pause

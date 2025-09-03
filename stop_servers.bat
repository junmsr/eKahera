@echo off
title Stop eKahera Servers
color 0C

echo ========================================
echo    Stopping eKahera Servers
echo ========================================
echo.

echo Stopping servers on ports 5000 and 5173...
echo.

:: Stop backend server (port 5000)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Stopping backend server (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Backend server stopped
    ) else (
        echo ℹ️ Backend server was not running
    )
)

:: Stop frontend server (port 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Stopping frontend server (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Frontend server stopped
    ) else (
        echo ℹ️ Frontend server was not running
    )
)

echo.
echo ========================================
echo All servers stopped!
echo ========================================
echo.
echo To restart servers, run: run_project.bat
echo.
pause

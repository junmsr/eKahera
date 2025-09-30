@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Stop eKahera Servers
color 0C

echo ========================================
echo    Stopping eKahera Servers
echo ========================================
echo.

echo Stopping servers on ports 5000 and 5173...
echo.

set "FOUND_BACKEND=0"
::: Stop backend server (port 5000)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    set "FOUND_BACKEND=1"
    echo Stopping backend server (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Backend server stopped
    ) else (
        echo ℹ️ Could not stop backend server (PID: %%a) or it already stopped
    )
)
if "!FOUND_BACKEND!"=="0" (
    echo ℹ️ Backend server was not running on port 5000
)

set "FOUND_FRONTEND=0"
::: Stop frontend server (port 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    set "FOUND_FRONTEND=1"
    echo Stopping frontend server (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Frontend server stopped
    ) else (
        echo ℹ️ Could not stop frontend server (PID: %%a) or it already stopped
    )
)
if "!FOUND_FRONTEND!"=="0" (
    echo ℹ️ Frontend server was not running on port 5173
)

echo.
echo ========================================
echo All servers stopped!
echo ========================================
echo.
echo To restart servers, run: run_project.bat
echo.
pause

@echo off
title eKahera Setup
color 0A

echo ========================================
echo eKahera Project Setup
echo ========================================
echo.

echo Step 1: Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH.
    echo    Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo Step 2: Installing backend dependencies...
if not exist "backend\node_modules" (
    pushd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        popd
        pause
        exit /b 1
    )
    popd
    echo ✅ Backend dependencies installed
 ) else (
    echo ✅ Backend dependencies already installed
 )

echo.
echo Step 3: Installing frontend dependencies...
if not exist "frontend\node_modules" (
    pushd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        popd
        pause
        exit /b 1
    )
    popd
    echo ✅ Frontend dependencies installed
 ) else (
    echo ✅ Frontend dependencies already installed
 )

echo.
echo Step 4: Ensuring backend configuration file exists...
if not exist "backend\config.env" (
    echo Creating backend\config.env (template)...
    > "backend\config.env" echo # eKahera backend configuration
    >> "backend\config.env" echo NODE_ENV=development
    >> "backend\config.env" echo DB_HOST=localhost
    >> "backend\config.env" echo DB_PORT=5432
    >> "backend\config.env" echo DB_NAME=ekahera_db
    >> "backend\config.env" echo DB_USER=postgres
    >> "backend\config.env" echo DB_PASSWORD=your_postgres_password_here
    echo ✅ Created config.env. Please update values if needed.
 ) else (
    echo ✅ backend\config.env already exists
 )

echo.
echo Step 5: Optional - test database connection (PostgreSQL must be running)
set "RUN_DB_TEST=%1"
if /I "%RUN_DB_TEST%"=="testdb" (
    echo Running database connectivity test...
    pushd backend
    node -e "(async()=>{try{const pool=require('./src/config/database');await pool.query('SELECT 1');console.log('✅ Database connection OK');process.exit(0);}catch(e){console.error('❌ Database connection failed:',e.message);process.exit(1);}})();"
    if %errorlevel% neq 0 (
        popd
        echo.
        echo HINT: Ensure PostgreSQL is running and config.env values are correct.
        pause
        exit /b 1
    )
    popd
)

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo Next steps:
echo 1) Ensure PostgreSQL is running and credentials in backend\config.env are correct.
echo 2) (Optional) Initialize tables: run "node -e \"require('./src/config/initDb').initializeDatabase().then(()=>console.log('Initialized')).catch(console.error)\"" from the backend folder.
echo 3) Start the project with run_project.bat
echo.
pause

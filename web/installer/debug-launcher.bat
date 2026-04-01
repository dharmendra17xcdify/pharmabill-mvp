@echo off
title PharmaBill - Debug Launcher
echo Starting PharmaBill in debug mode...
echo If you see an error below, share it to get help.
echo.

cd /d "%~dp0"

if not exist "node\node.exe" (
    echo ERROR: node\node.exe not found in install folder.
    pause
    exit /b 1
)

if not exist ".env" (
    echo ERROR: .env file not found. Please re-run the installer.
    pause
    exit /b 1
)

echo .env contents:
type .env
echo.
echo ----------------------------------------
echo Starting server... (errors will appear here)
echo ----------------------------------------

node\node.exe launcher.js

echo.
echo Server stopped or crashed. See error above.
pause

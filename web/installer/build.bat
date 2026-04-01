@echo off
setlocal
title PharmaBill - Build Installer

echo ============================================
echo  PharmaBill Installer Build Script
echo ============================================
echo.

:: ---- Paths ----
set WEB_DIR=%~dp0..
set INSTALLER_DIR=%~dp0
set DIST_DIR=%WEB_DIR%\dist
set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

:: ---- Step 1: Check Node.js is bundled ----
if not exist "%INSTALLER_DIR%node\node.exe" (
    echo [ERROR] Portable Node.js not found at installer\node\node.exe
    echo.
    echo  Please download the Node.js LTS Windows ZIP from:
    echo    https://nodejs.org/en/download
    echo  Choose "Windows Binary (.zip)" ^(x64^)
    echo  Extract it so that the file installer\node\node.exe exists.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found.

:: ---- Step 2: Build Next.js ----
echo.
echo [1/4] Building Next.js app...
cd /d "%WEB_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
)
echo [OK] Build complete.

:: ---- Step 3: Assemble dist folder ----
echo.
echo [2/4] Assembling dist folder...

if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"

:: Copy standalone server
xcopy /E /I /Y /Q "%WEB_DIR%\.next\standalone" "%DIST_DIR%\app"
:: Copy static assets into standalone (required by Next.js)
xcopy /E /I /Y /Q "%WEB_DIR%\.next\static"   "%DIST_DIR%\app\.next\static"
:: Copy public folder into standalone
if exist "%WEB_DIR%\public" (
    xcopy /E /I /Y /Q "%WEB_DIR%\public" "%DIST_DIR%\app\public"
)

:: Copy launcher scripts
copy /Y "%INSTALLER_DIR%launcher.js"          "%DIST_DIR%\launcher.js"
copy /Y "%INSTALLER_DIR%start-pharmabill.vbs" "%DIST_DIR%\start-pharmabill.vbs"
copy /Y "%INSTALLER_DIR%stop-pharmabill.bat"  "%DIST_DIR%\stop-pharmabill.bat"
copy /Y "%INSTALLER_DIR%debug-launcher.bat"  "%DIST_DIR%\debug-launcher.bat"

echo [OK] dist folder ready.

:: ---- Step 4: Compile Inno Setup ----
echo.
echo [3/4] Compiling installer...

if not exist %ISCC% (
    echo [WARNING] Inno Setup not found at: %ISCC%
    echo  Please install Inno Setup 6 from https://jrsoftware.org/isdl.php
    echo  Then compile manually:
    echo    %ISCC% "%INSTALLER_DIR%pharmabill-setup.iss"
    echo.
    echo  The dist\ folder is ready — only the final packaging step was skipped.
    pause
    exit /b 0
)

%ISCC% "%INSTALLER_DIR%pharmabill-setup.iss"
if %errorlevel% neq 0 (
    echo [ERROR] Inno Setup compilation failed.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  [4/4] Done!
echo  Installer: installer\Output\PharmaBill-Setup.exe
echo ============================================
echo.
pause

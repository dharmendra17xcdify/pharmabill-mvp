@echo off
echo Stopping PharmaBill...
taskkill /F /FI "WINDOWTITLE eq PharmaBill*" /IM node.exe >nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *launcher.js*" >nul 2>&1
echo PharmaBill stopped.
timeout /t 2 /nobreak >nul

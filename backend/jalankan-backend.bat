@echo off
cd /d "%~dp0"
title Alur Bumbu - Backend API Server (Port 5000)
color 0B

echo ========================================================
echo    🌿 ALUR BUMBU - BACKEND API SERVER (PORT 5000)
echo ========================================================
echo.
echo Memeriksa instalasi Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang atau belum masuk ke PATH!
    pause
    exit /b 1
)

echo [OK] Menjalankan Backend API di http://localhost:5000 ...
echo Tekan Ctrl+C untuk menghentikan server.
echo.

node index.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server terhenti dengan kode %errorlevel%.
    pause
)


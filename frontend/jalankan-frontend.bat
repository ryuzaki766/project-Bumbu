@echo off
cd /d "%~dp0"
title Alur Bumbu - Frontend Web App (Port 3000)
color 0E

echo ========================================================
echo    🌿 ALUR BUMBU - FRONTEND WEB INTERFACE (PORT 3000)
echo ========================================================
echo.
echo Memeriksa instalasi Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang atau belum masuk ke PATH!
    pause
    exit /b 1
)

echo [OK] Menjalankan Frontend Vite di http://localhost:3000 ...
echo Browser akan terbuka secara otomatis dalam 2 detik.
echo Tekan Ctrl+C untuk menghentikan frontend dev server.
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend terhenti dengan kode %errorlevel%.
    pause
)


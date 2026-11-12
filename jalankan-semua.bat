@echo off
cd /d "%~dp0"
title Alur Bumbu - Memulai Backend dan Frontend
color 0A

echo ========================================================
echo    🌿 ALUR BUMBU - MEMULAI BACKEND & FRONTEND SEKALIGUS
echo ========================================================
echo.
echo Memeriksa instalasi Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang atau belum masuk ke PATH!
    pause
    exit /b 1
)

echo [1/2] Menyalakan Backend API Server (Port 5000)...
start "Alur Bumbu - Backend API (5000)" cmd /k "cd /d %~dp0backend && node index.js"

echo [2/2] Menyalakan Frontend Web Interface (Port 3000)...
start "Alur Bumbu - Frontend Web (3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Menunggu 3 detik lalu membuka browser ke http://localhost:3000 ...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo ========================================================
echo ✓ Layanan telah aktif:
echo   - Frontend: http://localhost:3000
echo   - Backend : http://localhost:5000
echo   - API Health: http://localhost:5000/api/health
echo.
echo Jangan tutup jendela CMD Backend atau Frontend jika ingin
echo tetap menggunakannya. Jendela ini boleh ditutup.
echo ========================================================
pause


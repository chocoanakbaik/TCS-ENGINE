@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ============================================
echo   FREKUENSI 03:17 - THE CHOCO STUDIOS
echo   TCS ENGINE - LOCAL DEVELOPMENT RUNNER
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js belum terpasang.
  echo Install Node.js 20 LTS dari https://nodejs.org lalu jalankan file ini lagi.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm tidak ditemukan. Install ulang Node.js dengan npm disertakan.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo [INFO] Memasang dependency project. Ini hanya perlu dilakukan sekali.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] Instalasi dependency gagal. Periksa koneksi internet dan Node.js.
    pause
    exit /b 1
  )
)

start "FREKUENSI 03:17 - Browser" /min cmd /c "timeout /t 2 ^>nul ^& start http://127.0.0.1:4173"
echo [INFO] Server lokal berjalan. Jangan tutup jendela ini saat bermain.
echo [INFO] Tekan Ctrl+C untuk menghentikan server.
echo.
call npm run dev:frekuensi -- --host 127.0.0.1
pause

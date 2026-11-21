@echo off
setlocal EnableExtensions
cd /d "%~dp0"
chcp 65001 >nul

title FREKUENSI 03:17 - The Choco Studios

echo ============================================
echo   FREKUENSI 03:17 - THE CHOCO STUDIOS
echo   TCS ENGINE - GAME LAUNCHER
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

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)"
if errorlevel 1 (
  echo [ERROR] Versi Node.js terlalu lama. Game membutuhkan Node.js 18 atau lebih baru.
  echo Gunakan Node.js 20 LTS: https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" goto install_dependencies
if not exist "node_modules\three\build\three.module.js" goto install_dependencies
goto launch_game

:install_dependencies
echo [INFO] Memasang atau memperbaiki dependency game.
echo [INFO] Pastikan koneksi internet aktif selama proses ini.
echo.
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo [ERROR] Dependency gagal dipasang.
  echo Periksa koneksi internet, lalu jalankan RUN-FREKUENSI.bat kembali.
  pause
  exit /b 1
)

:launch_game
echo.
echo [INFO] Menyalakan server game di http://127.0.0.1:4173
echo [INFO] Browser akan terbuka setelah server siap.
echo [INFO] Jangan tutup jendela ini selama bermain.
echo [INFO] Tekan Ctrl+C untuk menghentikan server.
echo.
call npm run dev:frekuensi -- --host 127.0.0.1 --open
if errorlevel 1 (
  echo.
  echo [ERROR] Server game berhenti atau gagal dinyalakan.
  echo Jika port 4173 sedang digunakan, tutup sesi game sebelumnya lalu coba lagi.
  pause
  exit /b 1
)

pause

@echo off
title Installer & Runner IPWIJARUN 2026
color 0B
cls

echo ===================================================
echo   INSTALLER & RUNNER IPWIJARUN 2026 (DOCKER)
echo ===================================================
echo.

:: 1. Periksa apakah Docker CLI terinstal
echo [*] Memeriksa instalasi Docker CLI...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker tidak ditemukan di sistem ini!
    echo Silakan unduh dan instal Docker Desktop terlebih dahulu di:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b
)
echo [OK] Docker CLI terdeteksi.
echo.

:: 2. Periksa apakah Docker Daemon (Docker Desktop) sudah berjalan
echo [*] Memeriksa status Docker Desktop/Daemon...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker Daemon sudah berjalan dan aktif.
    goto run_docker
)

echo [WARNING] Docker Daemon belum berjalan.
echo [*] Mencoba menjalankan Docker Desktop secara otomatis...

:: Cari lokasi default instalasi Docker Desktop
set "DOCKER_PATH=C:\Program Files\Docker\Docker\Docker Desktop.exe"
if exist "%DOCKER_PATH%" (
    start "" "%DOCKER_PATH%"
    echo [*] Docker Desktop berhasil dipicu. Menunggu Docker Daemon siap...
) else (
    echo [!] Lokasi default Docker Desktop tidak ditemukan.
    echo Silakan jalankan Docker Desktop secara manual di komputer Anda.
    echo.
)

:: Loop untuk menunggu Docker Daemon siap (maksimal 60 detik)
set /a count=0
:wait_loop
if %count% geq 30 (
    color 0C
    echo.
    echo [ERROR] Docker Daemon tidak kunjung siap setelah 60 detik.
    echo Pastikan Docker Desktop terbuka dengan benar dan ikon Docker di system tray berwarna hijau.
    echo.
    pause
    exit /b
)

timeout /t 2 >nul
set /a count+=1
echo [*] Menunggu Docker siap... (Mencoba ke-%count%/30)
docker info >nul 2>&1
if %errorlevel% neq 0 goto wait_loop

echo.
echo [OK] Docker Daemon sekarang telah aktif!
echo.

:run_docker
echo ===================================================
echo   MEMULAI PROSES BUILD & RUN DENGAN DOCKER COMPOSE
echo ===================================================
echo.

:: Hentikan container lama jika ada yang konflik
echo [*] Membersihkan container lama jika ada...
docker compose down >nul 2>&1

:: Build dan jalankan container
echo [*] Membangun image dan menjalankan container...
docker compose up -d --build

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Gagal membangun atau menjalankan Docker container!
    echo Periksa pesan error di atas.
    echo.
    pause
    exit /b
)

echo.
echo ===================================================
echo [SUCCESS] Aplikasi IPWIJARUN 2026 Berhasil Dijalankan!
echo ===================================================
echo.
echo Aplikasi berjalan di: http://localhost:3005
echo Menghubungkan ke browser Anda...
echo.

:: Membuka browser otomatis ke port 3005
timeout /t 2 >nul
start http://localhost:3005

echo Selesai! Anda bisa menutup jendela cmd ini atau membiarkannya tetap terbuka.
echo.
pause

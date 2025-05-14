@echo off
REM Demo script untuk Checkpoint 1 - CDC Implementation untuk Windows
setlocal enabledelayedexpansion

REM Colors for Windows console
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM Tampilkan header awal
cls
echo =====================================================
echo       DEMO CDC IMPLEMENTATION - CHECKPOINT 1         
echo =====================================================
echo.

echo %BLUE%[SETUP]%NC% Checking prerequisites...
echo - Docker ^& Docker Compose
echo - Python ^& Required libraries
echo - PostgreSQL ^& MinIO containers
echo.

REM 1. Start containers (jika belum jalan)
echo %BLUE%[1/8]%NC% Memastikan container PostgreSQL dan MinIO berjalan...
docker ps | findstr "postgresql\|minio" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting docker containers...
    docker compose up -d
    timeout /t 10 /nobreak >nul
    echo %GREEN%✓%NC% Containers started successfully!
) else (
    echo %GREEN%✓%NC% Containers already running!
)
echo.

REM 2. Inisialisasi database (auto setup)
echo %BLUE%[2/8]%NC% Inisialisasi database SIAK...
echo Melakukan setup awal database dengan data seed jika diperlukan.
echo.

REM Cek apakah data sudah ada di database
echo %YELLOW%Checking:%NC% Apakah database sudah berisi data?

REM Ambil credentials dari .env file
for /F "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
)

REM Coba koneksi ke database dan cek table students
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT count(*) FROM students;" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%Initializing:%NC% Database belum diinisialisasi, menjalankan script seed...
    
    REM Menjalankan script inisialisasi database
    echo %YELLOW%Executing:%NC% python scripts/seed_to_siak.py
    python scripts/seed_to_siak.py
    
    echo %GREEN%✓%NC% Database berhasil diinisialisasi dengan data awal!
) else (
    echo %GREEN%✓%NC% Database sudah berisi data, melanjutkan demo...
)
echo.

REM 3. Ekstraksi awal (baseline)
cls
echo =====================================================
echo       DEMO CDC IMPLEMENTATION - CHECKPOINT 1         
echo =====================================================
echo.
echo %BLUE%[3/8]%NC% Melakukan ekstraksi awal data (baseline) ke MinIO...
echo Proses ini akan mengekstrak data awal sebagai baseline untuk CDC.
echo %YELLOW%Executing:%NC% python scripts/extract_siak_to_minio.py
python scripts/extract_siak_to_minio.py
if %ERRORLEVEL% NEQ 0 (
    echo %RED%✗%NC% Error running extraction script! Check error message above.
    echo Please ensure all dependencies are installed and paths are correct.
    pause
    exit /b 1
) else (
    echo %GREEN%✓%NC% Baseline extraction completed!
)
echo Data tersimpan di MinIO dengan timestamp awal.
echo Press ENTER to continue...
pause >nul

REM 4. Simulasi perubahan data (batch kecil)
cls
echo =====================================================
echo       DEMO CDC IMPLEMENTATION - CHECKPOINT 1         
echo =====================================================
echo.
echo %BLUE%[4/8]%NC% Simulasi perubahan data batch pertama (30 perubahan)...
echo Batch pertama akan mensimulasikan aktivitas normal akademik.
echo %YELLOW%Executing:%NC% python scripts/simulates_changes.py --changes 30 --commit
python scripts/simulates_changes.py --changes 30 --commit
if %ERRORLEVEL% NEQ 0 (
    echo %RED%✗%NC% Error running simulation script! Check error message above.
    echo Please ensure all dependencies are installed and paths are correct.
    pause
    exit /b 1
) else (
    echo %GREEN%✓%NC% First batch of changes completed!
)
echo Database telah diperbarui dengan 30 perubahan.
echo Press ENTER to continue...
pause >nul

REM 5. Ekstraksi CDC pertama
cls
echo =====================================================
echo       DEMO CDC IMPLEMENTATION - CHECKPOINT 1         
echo =====================================================
echo.
echo %BLUE%[5/8]%NC% Ekstraksi CDC pertama (mendeteksi 30 perubahan awal)...
echo %YELLOW%Executing:%NC% python scripts/extract_siak_to_minio.py
python scripts/extract_siak_to_minio.py
if %ERRORLEVEL% NEQ 0 (
    echo %RED%✗%NC% Error running extraction script! Check error message above.
    echo Please ensure all dependencies are installed and paths are correct.
    pause
    exit /b 1
) else (
    echo %GREEN%✓%NC% First CDC extraction completed!
)
echo Proses CDC berhasil mendeteksi dan mengekstrak perubahan pertama.
echo.

REM 6. Simulasi perubahan data (batch besar)
echo %BLUE%[6/8]%NC% Simulasi perubahan data batch kedua (100 perubahan)...
echo Batch kedua akan mensimulasikan aktivitas berat periode akhir semester.
echo %YELLOW%Executing:%NC% python scripts/simulates_changes.py --changes 100 --commit
python scripts/simulates_changes.py --changes 100 --commit
if %ERRORLEVEL% NEQ 0 (
    echo %RED%✗%NC% Error running simulation script! Check error message above.
    echo Please ensure all dependencies are installed and paths are correct.
    pause
    exit /b 1
) else (
    echo %GREEN%✓%NC% Second batch of changes completed!
)
echo Database telah diperbarui dengan 100 perubahan tambahan.
echo Press ENTER to continue...
pause >nul

REM 7. Ekstraksi CDC kedua
cls
echo =====================================================
echo       DEMO CDC IMPLEMENTATION - CHECKPOINT 1         
echo =====================================================
echo.
echo %BLUE%[7/8]%NC% Ekstraksi CDC kedua (mendeteksi 100 perubahan baru)...
echo %YELLOW%Executing:%NC% python scripts/extract_siak_to_minio.py
python scripts/extract_siak_to_minio.py
if %ERRORLEVEL% NEQ 0 (
    echo %RED%✗%NC% Error running extraction script! Check error message above.
    echo Please ensure all dependencies are installed and paths are correct.
    pause
    exit /b 1
) else (
    echo %GREEN%✓%NC% Second CDC extraction completed!
)
echo Perubahan batch kedua berhasil terdeteksi dan terekstrak.
echo Press ENTER to continue...
pause >nul

REM 8. Visualisasi hasil
cls
echo =====================================================
echo       DEMO CDC IMPLEMENTATION - CHECKPOINT 1         
echo =====================================================
echo.
echo %BLUE%[8/8]%NC% Visualisasi hasil CDC di MinIO...
echo %YELLOW%PENTING:%NC% Untuk melihat hasil CDC, silahkan:
echo   1. Buka MinIO console di %GREEN%http://localhost:9001%NC% atau berdasarkan env yang disetup
echo   2. Login dengan credentials dari file .env
echo   3. Lihat bucket %GREEN%'raw'%NC%
echo   4. Perhatikan struktur direktori dengan timestamp
echo   5. Bandingkan manifest files dari ketiga ekstraksi
echo   6. Cek data yang berubah di file CSV hasil ekstraksi
echo.

REM Menampilkan URL MinIO jika tersedia
for /F "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="MINIO_HOST" set MINIO_HOST=%%b
    if "%%a"=="MINIO_PORT" set MINIO_PORT=%%b
    if "%%a"=="MINIO_SECURE" set MINIO_SECURE=%%b
)

if defined MINIO_HOST if defined MINIO_PORT (
    if "%MINIO_SECURE%"=="True" (
        set "protocol=https"
    ) else (
        set "protocol=http"
    )
    echo MinIO Console URL: %GREEN%!protocol!://%MINIO_HOST%:%MINIO_PORT%%NC%
)

echo.
echo =====================================================
echo                   DEMO SELESAI                      
echo =====================================================
echo.
echo %BLUE%RINGKASAN ALUR CDC:%NC%
echo 1. Data awal diambil dari PostgreSQL → disimpan di MinIO
echo 2. Batch pertama perubahan (30 changes) → CDC ekstraksi #1
echo 3. Batch kedua perubahan (100 changes) → CDC ekstraksi #2
echo 4. Dalam setiap ekstraksi, CDC mendeteksi perubahan berdasarkan LSN ^& timestamp
echo 5. Hanya data yang berubah diambil, menghemat bandwidth dan storage
echo 6. Data perubahan diorganisir dengan timestamp di MinIO

echo.
echo %GREEN%Terima kasih!%NC% Demo selesai.
echo.
pause
exit /b 0

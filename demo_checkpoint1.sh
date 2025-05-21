#!/bin/bash
# Demo script untuk Checkpoint 1 - CDC Implementation
# Kompatibel dengan Mac, Linux dan WSL

# Function untuk membersihkan layar dan menunjukkan header
show_header() {
  clear
  echo "====================================================="
  echo "      DEMO FAKER, CDC, MINIO RAW IMPLEMENTATION - CHECKPOINT 1         "
  echo "====================================================="
  echo ""
}

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_header

echo -e "${BLUE}[SETUP]${NC} Checking prerequisites..."
echo "- Docker & Docker Compose"
echo "- Python & Required libraries"
echo "- PostgreSQL & MinIO containers"
echo

# 1. Start containers (jika belum jalan)
echo -e "${BLUE}[1/8] ${NC}Memastikan container PostgreSQL dan MinIO berjalan..."
if docker ps | grep -q "postgresql\|minio"; then
    echo -e "${GREEN}✓${NC} Containers already running!"
else
    echo "Starting docker containers..."
    docker compose up -d
    sleep 10
    echo -e "${GREEN}✓${NC} Containers started successfully!"
fi
echo

# 2. Inisialisasi database (auto setup)
echo -e "${BLUE}[2/8]${NC} Inisialisasi database SIAK..."
echo "Melakukan setup awal database dengan data seed jika diperlukan."

# Cek apakah data sudah ada di database
echo -e "${YELLOW}Checking:${NC} Apakah database sudah berisi data?"
PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -h $(grep DB_HOST .env | cut -d '=' -f2) -p $(grep DB_PORT .env | cut -d '=' -f2) -U $(grep DB_USER .env | cut -d '=' -f2) -d $(grep DB_NAME .env | cut -d '=' -f2) -c "SELECT count(*) FROM students;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Initializing:${NC} Database belum diinisialisasi, menjalankan script seed..."
    
    # Menjalankan script inisialisasi database
    echo -e "${YELLOW}Executing:${NC} python scripts/seed_to_siak.py"
    python scripts/seed_to_siak.py
    
    echo -e "${GREEN}✓${NC} Database berhasil diinisialisasi dengan data awal!"
else
    echo -e "${GREEN}✓${NC} Database sudah berisi data, melanjutkan demo..."
fi
echo

# 3. Ekstraksi awal (baseline)
show_header
echo -e "${BLUE}[3/8]${NC} Melakukan ekstraksi awal data (baseline) ke MinIO..."
echo "Proses ini akan mengekstrak data awal sebagai baseline untuk CDC."
echo -e "${YELLOW}Executing:${NC} python scripts/extract_siak_to_minio.py"
python scripts/extract_siak_to_minio.py
if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} Error running extraction script! Check error message above."
    echo "Please ensure all dependencies are installed and paths are correct."
    read -p "Press ENTER to exit..."
    exit 1
else
    echo -e "${GREEN}✓${NC} Baseline extraction completed!"
fi
echo -e "Data tersimpan di MinIO dengan timestamp awal."
read -p "Press ENTER to continue..."

# 4. Simulasi perubahan data (batch kecil)
show_header
echo -e "${BLUE}[4/8]${NC} Simulasi perubahan data batch pertama (30 perubahan)..."
echo "Batch pertama akan mensimulasikan aktivitas normal akademik."
echo -e "${YELLOW}Executing:${NC} python scripts/simulates_changes.py --changes 30 --commit"
python scripts/simulates_changes.py --changes 30 --commit
echo -e "${GREEN}✓${NC} First batch of changes completed!"
echo "Database telah diperbarui dengan 30 perubahan."
read -p "Press ENTER to continue..."

# 5. Ekstraksi CDC pertama
show_header
echo -e "${BLUE}[5/8]${NC} Ekstraksi CDC pertama (mendeteksi 30 perubahan awal)..."
echo -e "${YELLOW}Executing:${NC} python scripts/extract_siak_to_minio.py"
python scripts/extract_siak_to_minio.py
echo -e "${GREEN}✓${NC} First CDC extraction completed!"
echo "Proses CDC berhasil mendeteksi dan mengekstrak perubahan pertama."
echo

# 6. Simulasi perubahan data (batch besar)
echo -e "${BLUE}[6/8]${NC} Simulasi perubahan data batch kedua (100 perubahan)..."
echo "Batch kedua akan mensimulasikan aktivitas berat periode akhir semester."
echo -e "${YELLOW}Executing:${NC} python scripts/simulates_changes.py --changes 100 --commit"
python scripts/simulates_changes.py --changes 100 --commit
echo -e "${GREEN}✓${NC} Second batch of changes completed!"
echo "Database telah diperbarui dengan 100 perubahan tambahan."
read -p "Press ENTER to continue..."

# 7. Ekstraksi CDC kedua
show_header
echo -e "${BLUE}[7/8]${NC} Ekstraksi CDC kedua (mendeteksi 100 perubahan baru)..."
echo -e "${YELLOW}Executing:${NC} python scripts/extract_siak_to_minio.py"
python scripts/extract_siak_to_minio.py
echo -e "${GREEN}✓${NC} Second CDC extraction completed!"
echo "Perubahan batch kedua berhasil terdeteksi dan terekstrak."
read -p "Press ENTER to continue..."

# 8. Visualisasi hasil
show_header
echo -e "${BLUE}[8/8]${NC} Visualisasi hasil CDC di MinIO..."
echo -e "${YELLOW}PENTING:${NC} Untuk melihat hasil CDC, silahkan:"
echo "  1. Buka MinIO console di ${GREEN}http://localhost:9001${NC} atau berdasarkan env yang disetup"
echo "  2. Login dengan credentials dari file .env"
echo "  3. Lihat bucket ${GREEN}'raw'${NC}"
echo "  4. Perhatikan struktur direktori dengan timestamp"
echo "  5. Bandingkan manifest files dari ketiga ekstraksi"
echo "  6. Cek data yang berubah di file CSV hasil ekstraksi"
echo

# Menampilkan URL MinIO jika tersedia
MINIO_HOST=$(grep MINIO_HOST .env | cut -d '=' -f2)
MINIO_PORT=$(grep MINIO_PORT .env | cut -d '=' -f2)
MINIO_SECURE=$(grep MINIO_SECURE .env | cut -d '=' -f2)

if [ -n "$MINIO_HOST" ] && [ -n "$MINIO_PORT" ]; then
    if [ "$MINIO_SECURE" == "True" ]; then
        protocol="https"
    else
        protocol="http"
    fi
    echo -e "MinIO Console URL: ${GREEN}${protocol}://${MINIO_HOST}:${MINIO_PORT}${NC}"
fi

echo
echo "====================================================="
echo "                   DEMO SELESAI                      "
echo "====================================================="
echo
echo -e "${BLUE}RINGKASAN ALUR CDC:${NC}"
echo "1. Data awal diambil dari PostgreSQL → disimpan di MinIO"
echo "2. Batch pertama perubahan (30 changes) → CDC ekstraksi #1"
echo "3. Batch kedua perubahan (100 changes) → CDC ekstraksi #2" 
echo "4. Dalam setiap ekstraksi, CDC mendeteksi perubahan berdasarkan LSN & timestamp"
echo "5. Hanya data yang berubah diambil, menghemat bandwidth dan storage"
echo "6. Data perubahan diorganisir dengan timestamp di MinIO"

echo
echo -e "${GREEN}Terima kasih!${NC} Demo selesai."
echo

# Make script executable
chmod +x demo_checkpoint1.sh

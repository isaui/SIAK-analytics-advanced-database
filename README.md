# PROYEK AKHIR BASIS DATA LANJUT

1. Isa Citra Buana (2206081465)
2. Muhammad Urwatil Wutsqo (1906351101)
3. Balqis A. Lumbun (2106751184)

Proyek ini merupakan simulasi dari dashboard SIAK dengan memanfaatkan Docker, PostgreSQL, MINIO, Airflow DAG, dan dashboard menggunakan Next.js

![Dashboard SIAK](<assets/Screenshot 2025-06-02 171016.png>)


# Cara menggunakan

1. Unduh repositori ini menggunakan command git clone https://gitlab.cs.ui.ac.id/banjut-2025/banjut-2025-kel-1.git 
2. Copy file ".env.example" di direktori yang sama lalu rename file tersebut menjadi ".env"
3. Pastikan anda memiliki Docker di gawai anda, lalu jalankan command "docker compose up --build"
4. Setelah semua container aktif, pergi ke localhost:9090 dan aktifkan otomasi ETL dengan menekan tombol switch seed_siak_database dan siak_etl_pipeline.
![Menyalakan ETL](assets/DAG_IMAGE.png)
5. Pergi ke localhost:3000 untuk melihat tampilan dashboard.

# Alur

1. Menjalankan ETL Pipeline menggunakan DAG
2. Dengan Seeding, Faker akan melakukan generasi data, sementara info attendance berada di file .csv. 
3. Dengan ETL Pipeline, Data faker akan tersimpan di PostgreSQL siak.
4. Data .csv dan SQL akan tersimpan di raw MinIO dalam bentuk .parquet. 
5. File transform_raw_to_processed.py akan mengolah data parquet ke bentuk yang sudah ditransformasi.
6. File transformasi akan disimpan ke processed dalam bentuk .parquet.
7. File dalam processed akan disimpan ke PostgreSQL warehouse dan siap diakses via localhost:3000 .
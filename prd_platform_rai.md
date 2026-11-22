# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Project Name:** RAI (*UMKM Creative by RAI* — Smart Dynamic QR-to-Web & Operational Platform)

**Version:** 2.1.0 (Turso Edge DB, GitHub & Vercel CI/CD Integration)

**Founders:** Risma & Arland (RAI)

**Repository:** `https://github.com/arra7trader/RAI.git`

**Database Endpoint:** `libsql://rai-arra7trader.aws-ap-northeast-1.turso.io`

**Deployment Platform:** Vercel

**Document Type:** Master Technical, UX & Product Specification (AI-Coding Ready)

**Target Market:** UMKM (F&B, Retail, Barbershop, Bengkel, Klinik, Laundry) & Bisnis Multi-Cabang

## 1. Executive Summary & Product Vision

### 1.1 Latar Belakang & Masalah Pasar

Pelaku UMKM dan pemilik usaha lokal di Indonesia menghadapi empat kendala utama dalam mendigitalisasi operasionalnya:

1. **Owner Sibuk & Enggan Ribet Mengatur Sistem (*Tech-Fatigue*):** Mayoritas pemilik usaha malas login ke banyak dashboard, malas menginput menu satu per satu, dan bingung melakukan pengaturan teknis. Mereka menginginkan sistem yang **"sudah jadi dan siap pakai"**.

2. **Sulit Mendapat Ulasan Google Maps Bintang 5:** Pelanggan yang puas jarang memberikan ulasan secara sukarela, sedangkan satu ulasan bintang 1 langsung menurunkan reputasi usaha di Google Maps.

3. **Buta Data Pengunjung (*Foot-Traffic*):** Pemilik usaha tidak mengetahui berapa total pengunjung yang datang per hari, jam berapa toko paling ramai, dan seberapa sering pelanggan lama kembali berkunjung.

4. **Operasional Kasir, Absensi & Kas Laci Terpisah:** Pencatatan manual membuat selisih uang laci (*cash leakage*) sulit dilacak dan absensi karyawan tidak terpantau akurat.

### 1.2 Solusi Inti: "1 QR Cerdas untuk Dua Dunia" + Layanan "Terima Beres"

**RAI** menggabungkan stand akrilik/stiker QR fisik berdesain minimalis dengan satu platform web cerdas tanpa perlu menginstal aplikasi tambahan (*zero-app-install*), didukung penuh oleh layanan **Managed Setup oleh Tim RAI**:

* **Konsep "Kita yang Atur" (*Done-For-You Concierge*):** Pemilik usaha tidak perlu pusing melakukan konfigurasi teknis. Tim RAI (Arland & Risma) menyiapkan seluruh profil toko, menautkan link Google Maps, menginput daftar menu/layanan, mengatur promo voucher/stempel, hingga mencetak QR fisik yang langsung aktif. Jika owner ingin mengubah menu atau promo di kemudian hari, cukup kirim pesan WhatsApp ke Tim RAI atau gunakan tombol satu-klik.

* **Ketika Pembeli / Pengunjung Scan QR:** Sistem otomatis mencatat kunjungan harian (*foot-traffic*) dan membuka **Portal Pelanggan** berdesain bersih ala Apple berisi *Smart Google Review Filter*, Kartu Stempel Digital (*E-Stamp*), Voucher Kejutan, Katalog Menu/Layanan, Nomor Antrean, dan Kontak Toko.

* **Ketika Owner / Karyawan Scan QR yang Sama:** Sistem mengenali perangkat terautentikasi dan langsung menampilkan **Tampilan Ringkas 1-Layar** (untuk Owner: langsung melihat angka pengunjung, omzet hari ini, dan ulasan masuk tanpa perlu klik ke mana-mana; untuk Kasir: akses cepat POS Kasir dan Absensi GPS).

### 1.3 Struktur Paket Layanan (*Managed Packages — Tanpa Harga di Tahap Awal*)

Seluruh paket dirancang dengan pendekatan **Terima Beres** di mana pengaturan awal dan pembaruan data dibantu penuh oleh Tim RAI (informasi harga disembunyikan pada tahap ini dan diarahkan ke tombol **Konsultasi & Aktivasi via WhatsApp**):

1. **Paket RAI Laris** *(Fokus Pengunjung, Reputasi Google & Pelanggan Loyal)*

   * **Layanan Tim RAI:** Setup penuh profil toko, integrasi link ulasan Google Maps, input katalog menu/harga awal, aktivasi program stempel/voucher, dan pengiriman Stand Akrilik QR siap pajang.

   * **Fitur Sistem:** Live Foot-Traffic Counter, Smart Google Review Filter (Bintang 4–5 ke Google Maps, Bintang 1–3 ke jalur internal), E-Stamp Loyalty, Scan-to-Claim Voucher, Katalog Digital, Mini CRM Pelanggan, dan Ringkasan Kunjungan 1-Layar untuk Owner.

2. **Paket RAI Kasir** *(Fokus Operasional Kasir, Kontrol Uang Laci & Absensi)*

   * **Layanan Tim RAI:** Semua layanan *RAI Laris* + input seluruh database produk/harga kasir, kalibrasi titik GPS lokasi toko untuk absensi, dan pendampingan penggunaan hingga kasir lancar beroperasi.

   * **Fitur Sistem:** Semua fitur *RAI Laris* + POS Kasir Web Super Ringan, Struk Digital WhatsApp & Cetak Thermal Bluetooth, Buku Kas Laci (*Petty Cash* & Tutup Shift), Absensi Karyawan Scan QR + Selfie + GPS, dan Sistem Nomor Antrean.

3. **Paket RAI Juragan** *(Fokus Multi-Cabang, Skala Menengah & Otomasi Penuh)*

   * **Layanan Tim RAI:** Setup terpusat untuk seluruh cabang/divisi, produksi batch QR fisik hingga puluhan titik, konfigurasi laporan otomatis harian, dan dukungan prioritas (*Dedicated Admin RAI*).

   * **Fitur Sistem:** Semua fitur *RAI Kasir* + Dashboard Gabungan Multi-Cabang, Laporan Tutup Toko Otomatis ke WhatsApp Owner setiap malam, Export Laporan Excel, dan Custom Branding/Domain.

## 2. Tech Stack, Infrastructure & Deployment Pipeline

### 2.1 Recommended Stack

* **Framework:** Next.js 15 (App Router) + TypeScript (Strict Mode)

* **Styling & UI:** Tailwind CSS + Shadcn UI (dikustomisasi dengan token desain Apple HIG) + Lucide Icons

* **Typography:** `Inter` (via `next/font/google`) dipadukan dengan system font stack Apple (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text"`)

* **Database & ORM:** **Turso (libSQL / SQLite Edge Database)** menggunakan `@libsql/client` + **Prisma ORM** dengan `@prisma/adapter-libsql`

* **Authentication:** Better Auth / Auth.js (Email/Password, Nomor HP, dan Quick-PIN untuk Kasir)

* **QR Code Engine:** `qrcode` (Generator SVG & PNG resolusi tinggi siap cetak akrilik/stiker)

* **Storage (Logo, Foto Menu & Selfie Absensi):** Vercel Blob / Cloudflare R2 (dengan kompresi gambar otomatis di browser sebelum unggah)

* **WhatsApp Integration:** WhatsApp Deep Link (`https://wa.me/...`) untuk tombol bantuan/struk instan & Fonnte / WhatsApp Cloud API untuk notifikasi laporan harian otomatis

### 2.2 Infrastructure, GitHub & Vercel CI/CD Workflow

Seluruh siklus pengembangan dan rilis menggunakan alur terotomasi berbasis Git:

1. **Database Produksi (Turso Edge DB):**
   * **Primary URL:** `libsql://rai-arra7trader.aws-ap-northeast-1.turso.io`
   * **Region:** `aws-ap-northeast-1` (Tokyo) untuk latensi rendah ke wilayah Indonesia serta kompatibilitas penuh dengan fungsi *Serverless / Edge* Vercel tanpa masalah kehabisan koneksi (*connection pooling*).
   * **Manajemen Skema:** Perubahan skema dilakukan melalui Prisma (`prisma migrate diff` / Turso CLI `turso db shell`) agar sinkron antara lingkungan lokal dan produksi.

2. **Version Control (GitHub):**
   * **Repository URL:** `https://github.com/arra7trader/RAI.git`
   * **Branching Strategy:**
     * `main` — Cabang produksi utama yang langsung terhubung ke domain aktif di Vercel.
     * `dev` — Cabang pengembangan fitur baru sebelum digabungkan (*Pull Request*) ke `main`.

3. **Hosting & Auto-Deployment (Vercel):**
   * Terhubung langsung ke repositori `arra7trader/RAI` di GitHub.
   * Setiap `git push` ke cabang `main` otomatis memicu proses *build* dan *deploy* ke server produksi Vercel.
   * Setiap *Pull Request* pada cabang `dev` otomatis menghasilkan *Preview URL* untuk pengujian tampilan mobile sebelum dirilis ke klien.

4. **Required Environment Variables (`.env` & Vercel Dashboard):**
   ```env
   TURSO_DATABASE_URL="libsql://rai-arra7trader.aws-ap-northeast-1.turso.io"
   TURSO_AUTH_TOKEN="<your-turso-auth-token>"
   AUTH_SECRET="<random-32-char-secret>"
   NEXT_PUBLIC_APP_URL="https://rai.vercel.app"
   NEXT_PUBLIC_RAI_ADMIN_WA="628xxxxxxxxxx"
   ```

### 2.3 Aturan Arsitektur Inti

1. **Concierge-First Architecture ("Manage on Behalf of Owner"):** Panel `SUPER_ADMIN` memiliki mode **"Kelola Toko Klien"** yang memungkinkan Arland & Risma mengatur seluruh isi toko klien (menu, link Maps, promo, koordinat GPS, jadwal kerja) dari satu tempat tanpa meminta password milik owner.

2. **Zero-Friction Owner View:** Halaman utama Owner (`/dashboard`) dirancang sebagai *Single-Page Summary* yang langsung menampilkan metrik penting begitu QR di-scan, dilengkapi tombol mengambang **"Minta Bantuan Tim RAI"** yang langsung membuka chat WhatsApp ke admin RAI dengan format pesan otomatis.

3. **Multi-Tenant Data Isolation:** Seluruh tabel operasional terikat pada `tenant_id` untuk menjamin kerahasiaan data transaksi dan nomor WhatsApp pelanggan setiap toko.

4. **Dynamic QR Binding (`/q/[qrCodeId]`):** QR fisik dicetak memakai kode permanen. Fungsi dan tampilan tujuan QR dapat diubah sewaktu-waktu dari backend tanpa mengganti cetakan fisik.

## 3. User Roles & Access Control Matrix

| Role | Deskripsi | Cara Akses | Hak Akses & Pengalaman Utama |
| ----- | ----- | ----- | ----- |
| **`SUPER_ADMIN`** | Tim RAI (Arland & Risma) | Login via `/admin/login` | Generate batch QR fisik, onboarding toko baru secara penuh (*Concierge Setup*), ubah menu/promo/pengaturan atas permintaan owner, kelola status paket klien. |
| **`OWNER`** | Pemilik Usaha | Scan QR toko (auto-login) atau `/login` | **Zero-Click Summary:** Langsung melihat jumlah pengunjung hari ini, omzet, ulasan masuk, & absensi dalam 1 layar bersih. Tersedia tombol *"Minta Tim RAI Aturkan"* jika ingin mengubah data tanpa repot. |
| **`STAFF`** | Kasir / Pegawai Toko | Scan QR toko atau PIN Kasir | Akses langsung ke POS Kasir, validasi voucher & tambah stempel pelanggan, catat pengeluaran kas laci, dan absensi masuk/pulang (Selfie + GPS). |
| **`CUSTOMER`** | Pembeli / Pengunjung | Scan QR fisik di toko (tanpa login) | Tercatat di penghitung pengunjung harian, beri rating Google Review Filter, klaim voucher & E-Stamp (via No. WA), lihat katalog menu, dan ambil nomor antrean. |

## 4. Detailed Functional Specifications

### 4.1 Modul 1: Marketing Website Bergaya Apple (`/` & `/paket`)

* **Gaya Visual & Narasi:** Mengadopsi pendekatan desain halaman produk Apple—latar belakang putih bersih dan abu-abu lembut (`#F5F5F7`), tipografi besar dengan *letter-spacing* rapat, animasi kemunculan halus saat di-scroll (*subtle scroll reveal*), dan tata letak **Bento Grid** yang memamerkan tampilan fisik Stand Akrilik QR RAI bersanding dengan pratinjau layar HP.

* **Struktur Halaman Utama (`/`):**

  1. **Sticky Frosted Glass Navbar:** Logo **RAI**, tautan navigasi (*Cara Kerja*, *Fitur Pelanggan*, *Fitur Owner*, *Paket Layanan*), dan tombol pill *"Konsultasi Gratis"*.

  2. **Hero Section:** Headline besar dan tajam (*"Satu QR. Dua Dunia. Terima Beres."*), sub-headline yang menjelaskan bahwa pemilik usaha tidak perlu repot mengatur sistem karena semua disiapkan Tim RAI, serta visual mockup Stand QR RAI.

  3. **Interactive Dual-Experience Switcher:** Pengunjung website dapat menekan toggle **`[Tampilan Pembeli]`** vs **`[Tampilan Owner]`** untuk melihat simulasi langsung bagaimana satu QR bekerja untuk dua peran berbeda.

  4. **Bento Grid Keunggulan:** 6 kartu fitur utama dengan ilustrasi antarmuka bersih (Smart Google Review Filter, Penghitung Pengunjung Live, Kartu Stempel Digital, POS & Kontrol Uang Laci, Absensi Selfie GPS, dan Layanan Setup Terima Beres oleh Tim RAI).

  5. **Bagian Paket Layanan (Tanpa Harga):** Menampilkan 3 kartu paket (**RAI Laris**, **RAI Kasir**, **RAI Juragan**) dengan perbandingan fasilitas yang jelas dan tombol **"Tanya & Aktifkan via WhatsApp"** (tanpa menampilkan nominal harga).

  6. **Footer Minimalis:** Identitas *UMKM Creative by RAI*, tautan cepat, dan kontak WhatsApp resmi.

### 4.2 Modul 2: Super Admin Concierge Panel (`/admin`) — "Kita yang Atur"

Dirancang khusus agar Arland & Risma dapat menyiapkan akun klien dari nol hingga siap pakai dalam waktu kurang dari 10 menit:

* **Batch QR Generator (`/admin/qr-generator`):** Generate puluhan/ratusan QR Code unik sekaligus dalam format SVG/PNG resolusi tinggi untuk dicetak ke akrilik atau stiker.

* **Concierge Onboarding Wizard (`/admin/tenants/new`):** Satu halaman formulir terpadu untuk menginput nama usaha, kategori, nomor WA owner, link ulasan Google Maps, titik koordinat GPS toko (cukup tempel link Google Maps toko, sistem mengekstrak latitude/longitude otomatis), pilihan paket (`LARIS`, `KASIR`, `JURAGAN`), serta mengikat kode QR fisik yang akan dikirim ke toko tersebut.

* **Impersonate / Kelola Toko Klien (`/admin/tenants/[id]/manage`):** Tombol sekali klik bagi Tim RAI untuk masuk ke mode pengelolaan toko klien—mengunggah daftar menu/produk secara massal, membuatkan promo voucher, atau memperbarui jam buka saat owner meminta bantuan lewat WhatsApp.

### 4.3 Modul 3: Smart Dynamic QR Router & Foot-Traffic Counter (`/q/[qrCodeId]`)

1. **Deteksi Otomatis Peran:**

   * Jika perangkat yang memindai memiliki sesi `OWNER` toko tersebut → Langsung membuka **Owner Quick-View** (ringkasan angka hari ini dalam 1 layar tanpa menu rumit).

   * Jika perangkat memiliki sesi `STAFF` toko tersebut → Langsung menampilkan pilihan cepat: **`[Absen Masuk/Pulang]`** atau **`[Buka POS Kasir]`**.

   * Jika perangkat adalah pengunjung umum (`CUSTOMER`) → Mencatat kunjungan ke `store_visits` dan menampilkan **Portal Pelanggan (`/[storeSlug]`)**.

2. **Penghitung Pengunjung Harian Anti-Spam:**

   * Menggunakan `visitor_token` pada browser pengunjung dengan jeda *cooldown* 3 jam agar refresh halaman tidak dihitung ganda.

   * Memisahkan statistik **Pengunjung Baru (`NEW`)** dan **Pelanggan Kembali (`RETURNING`)**.

3. **Dynamic Mode Switcher:** Tim RAI (atau Owner jika berkenan) dapat mengganti tampilan utama QR kapan saja (`DEFAULT_HUB`, `REVIEW_FOCUS`, `MENU_ORDER`, `CLOSED_STORE`) tanpa mencetak ulang QR fisik.

### 4.4 Modul 4: Portal Pelanggan (`/[storeSlug]`)

* **Smart Google Review Filter:**

  * Pengunjung mengetuk bintang `1–5`.

  * **Bintang 4 atau 5:** Langsung diarahkan ke `google_review_url` toko di Google Maps + membuka akses klaim voucher apresiasi.

  * **Bintang 1, 2, atau 3:** Ditahan di formulir kritik/saran internal agar keluhan tersampaikan langsung ke Owner tanpa merusak rating publik Google Maps.

* **E-Stamp Loyalty & Scan-to-Claim Voucher:**

  * Tanpa instal aplikasi; pelanggan cukup memasukkan Nama & Nomor WhatsApp satu kali.

  * Kartu Stempel Digital bertambah saat divalidasi oleh kasir (via 4-digit PIN harian toko atau otomatis saat transaksi di POS Kasir).

  * Voucher promo menghasilkan kode unik 6 digit (`RAI-XXX`) yang langsung terbaca di POS Kasir.

* **Katalog Menu/Layanan, Nomor Antrean & Simpan Kontak:** Daftar harga dengan tampilan bersih bergaya kartu iOS, ambil nomor antrean harian, serta tombol simpan kontak WhatsApp & media sosial toko.

### 4.5 Modul 5: Owner Ultra-Simple View (`/dashboard`)

Didesain khusus untuk pemilik usaha yang tidak suka kerumitan teknologi:

* **Tampilan "Sekilas Hari Ini" (1 Layar Penuh):** Menampilkan 4 kartu angka besar yang mudah dibaca dalam 3 detik:

  1. **Pengunjung Scan QR Hari Ini** (beserta persentase pengunjung baru vs lama).

  2. **Total Omzet & Transaksi** (untuk paket Kasir/Juragan).

  3. **Ulasan Google Baru & Keluhan Internal** (jika ada keluhan bintang 1–3, langsung tampil di bagian atas agar cepat ditangani).

  4. **Status Kehadiran Karyawan** (siapa yang sudah absen masuk dan jam berapa).

* **Tombol Bantuan Instan ("Terima Beres"):** Tombol permanen di bagian bawah/atas layar: **`"Ingin Ubah Menu / Promo? Chat Tim RAI"`** yang langsung mengarahkan ke WhatsApp admin RAI sehingga owner tidak perlu mengutak-atik pengaturan sendiri. (Menu pengaturan mandiri tetap tersedia secara tersembunyi di balik tombol *"Pengaturan Lanjutan"* bagi owner yang ingin mengatur sendiri).

### 4.6 Modul 6: POS Kasir, Kontrol Uang Laci & Absensi GPS (`/app/*`)

* **POS Kasir Ringan (`/app/pos`):** Pilih item produk → Masukkan kode voucher atau nomor WA pelanggan (opsional, otomatis potong diskon & tambah `+1` stempel) → Pilih metode bayar (`TUNAI`, `QRIS`, `TRANSFER`) → Kirim struk ke WhatsApp pelanggan atau cetak via printer thermal Bluetooth 58mm.

* **Buku Kas Laci (`/app/cash-drawer`):** Input modal awal laci, catat pengeluaran harian (beli es batu, galon, parkir, plastik), dan hitung otomatis uang tunai yang seharusnya ada di laci saat tutup shift.

* **Absensi QR + Selfie + GPS (`/app/attendance`):** Karyawan scan QR di meja kasir, sistem memvalidasi jarak koordinat GPS menggunakan formula Haversine (`<= 50 meter` dari toko) dan mewajibkan foto selfie kamera depan secara langsung.

## 5. Information Architecture (Pages & Routes)

```
/                                   # Apple-Style Landing Page & Company Profile RAI
/paket                              # Halaman Perbandingan Paket (Tanpa Harga, CTA WhatsApp)
/login                              # Halaman Login Minimalis (Owner, Staff & Admin)

/q/[qrCodeId]                       # Smart Dynamic QR Router (Deteksi Role & Hitung Pengunjung)
/[storeSlug]                        # Portal Publik Pelanggan (Desain Bersih Ala iOS)
/[storeSlug]/menu                   # Katalog Menu / Layanan Digital
/[storeSlug]/stamp                  # Kartu Stempel Digital & Voucher Pelanggan
/[storeSlug]/queue                  # Ambil & Pantau Nomor Antrean

/app                                # Quick Launcher (Muncul saat Staff scan QR)
/app/pos                            # POS Kasir Web Ringan
/app/orders                         # Riwayat Transaksi & Kirim Ulang Struk WA
/app/cash-drawer                    # Buku Kas Laci & Tutup Shift
/app/attendance                     # Absensi Karyawan (QR + GPS + Selfie)
/app/queue-control                  # Kontrol Panggil Antrean

/dashboard                          # Owner Ultra-Simple 1-Screen Summary + Tombol Chat Tim RAI
/dashboard/reviews                  # Daftar Keluhan Internal (Bintang 1-3) & Log Klik Google Review
/dashboard/customers                # Mini CRM Daftar Pelanggan & Sapa Promo WA
/dashboard/reports                  # Laporan Keuangan, Kas Laci & Absensi Karyawan
/dashboard/advanced                 # Pengaturan Mandiri (Opsional jika Owner ingin ubah sendiri)

/admin                              # Dashboard Utama Tim RAI (Arland & Risma)
/admin/qr-generator                 # Generator Massal QR Fisik (SVG/PNG Siap Cetak)
/admin/tenants                      # Daftar Seluruh Toko Klien & Status Paket
/admin/tenants/new                  # Concierge Onboarding Wizard (Setup Toko Baru < 10 Menit)
/admin/tenants/[id]/manage          # Mode "Kita yang Atur" (Kelola Menu, Promo & Setting Toko Klien)
```

## 6. Database Schema (Turso libSQL / Prisma Specification)

*Catatan Teknis Turso/SQLite:* Seluruh Primary Key menggunakan `String @id @default(uuid())`, tipe data nominal uang Rupiah menggunakan `Int` (bilangan bulat tanpa desimal agar presisi dan ringan di SQLite/libSQL), serta konfigurasi Prisma menggunakan `provider = "sqlite"` dengan `driverAdapters` (`@prisma/adapter-libsql`).

### 6.1 Core Tenant, User & QR Tables

1. **`tenants` (Profil Usaha Klien)**

   * `id`: String (PK, UUID)

   * `name`: String (Nama Usaha)

   * `slug`: String (Unique, misal: `kopi-senja`)

   * `category`: String (`FNB`, `RETAIL`, `SERVICE`, `CLINIC`, `OTHER`)

   * `phone_wa`: String (Nomor WA Owner untuk laporan & kontak)

   * `address`: String

   * `latitude`: Float

   * `longitude`: Float

   * `geofence_radius`: Int (Default: `50` meter)

   * `google_review_url`: String

   * `instagram_url`: String (Nullable)

   * `tiktok_url`: String (Nullable)

   * `logo_url`: String (Nullable)

   * `active_qr_mode`: String (`DEFAULT_HUB`, `REVIEW_FOCUS`, `MENU_ORDER`, `CLOSED_STORE`)

   * `daily_staff_pin`: String (4 digit PIN validasi kasir)

   * `work_start_time`: String (Default: `"09:00"`)

   * `plan_tier`: String (`LARIS`, `KASIR`, `JURAGAN`)

   * `plan_status`: String (`ACTIVE`, `EXPIRED`, `TRIAL`)

   * `managed_by_rai`: Boolean (Default: `true` — menandakan layanan dikelola oleh Tim RAI)

   * `created_at`: DateTime (`@default(now())`)

2. **`users` (Tim RAI, Owner & Staff)**

   * `id`: String (PK, UUID)

   * `tenant_id`: String (FK -> `tenants.id`, Nullable untuk `SUPER_ADMIN`)

   * `name`: String

   * `email`: String (Unique)

   * `phone`: String (Nullable)

   * `password_hash`: String

   * `role`: String (`SUPER_ADMIN`, `OWNER`, `STAFF`)

   * `is_active`: Boolean (Default: `true`)

   * `created_at`: DateTime (`@default(now())`)

3. **`qr_codes` (Inventaris QR Fisik)**

   * `id`: String (PK, UUID)

   * `code`: String (Unique short code, misal: `RAI-8921`)

   * `tenant_id`: String (FK -> `tenants.id`, Nullable sebelum aktivasi)

   * `label`: String (misal: `"Stand Kasir Utama"`, `"Meja 01"`)

   * `status`: String (`UNASSIGNED`, `ACTIVE`, `SUSPENDED`)

   * `total_scans`: Int (Default: `0`)

   * `created_at`: DateTime (`@default(now())`)

### 6.2 Customer Engagement, Foot-Traffic & Loyalty Tables

4. **`store_visits` (Penghitung Pengunjung Harian)**

   * `id`: String (PK, UUID)

   * `tenant_id`: String (FK -> `tenants.id`)

   * `qr_code_id`: String (FK -> `qr_codes.id`)

   * `visitor_token`: String (Indexed)

   * `visitor_type`: String (`NEW`, `RETURNING`)

   * `visited_at`: DateTime (`@default(now())`, Indexed)

5. **`reviews_feedback` (Smart Google Review Filter)**

   * `id`: String (PK, UUID)

   * `tenant_id`: String (FK -> `tenants.id`)

   * `star_rating`: Int (`1`–`5`)

   * `action_taken`: String (`REDIRECTED_TO_GOOGLE`, `INTERNAL_COMPLAINT`)

   * `customer_name`: String (Nullable)

   * `customer_phone`: String (Nullable)

   * `feedback_message`: String (Nullable)

   * `is_resolved`: Boolean (Default: `false`)

   * `created_at`: DateTime (`@default(now())`)

6. **`customers` (Mini CRM Pelanggan)**

   * `id`: String (PK, UUID)

   * `tenant_id`: String (FK -> `tenants.id`)

   * `name`: String

   * `phone_wa`: String (Format `628xxx`, Unique composite dengan `tenant_id`)

   * `total_visits`: Int (Default: `1`)

   * `total_spent`: Int (Default: `0`)

   * `last_visit_at`: DateTime (`@default(now())`)

   * `created_at`: DateTime (`@default(now())`)

7. **`loyalty_programs` & `customer_stamps`**

   * `loyalty_programs`: `id`, `tenant_id` (Unique), `is_active`, `target_stamps` (Default `5`), `reward_title`, `terms_text`.

   * `customer_stamps`: `id`, `tenant_id`, `customer_id`, `current_stamps`, `total_redeemed`, `updated_at`.

8. **`vouchers` & `voucher_claims`**

   * `vouchers`: `id`, `tenant_id`, `title`, `discount_type` (`NOMINAL`, `PERCENTAGE`, `FREE_ITEM`), `discount_value` (Int), `min_purchase` (Int), `quota` (Int), `valid_until`, `is_active`.

   * `voucher_claims`: `id`, `voucher_id`, `tenant_id`, `customer_id`, `claim_code` (Unique 6 char), `status` (`CLAIMED`, `REDEEMED`, `EXPIRED`), `claimed_at`, `redeemed_at`.

9. **`queues` (Nomor Antrean Harian)**

   * `id`: String (PK, UUID)

   * `tenant_id`: String (FK -> `tenants.id`)

   * `queue_date`: String (Format `YYYY-MM-DD`, Indexed)

   * `queue_number`: Int

   * `customer_name`: String (Nullable)

   * `status`: String (`WAITING`, `SERVING`, `COMPLETED`, `SKIPPED`)

   * `created_at`: DateTime (`@default(now())`)

### 6.3 POS Kasir, Kas Laci & Absensi Tables

10. **`products` (Katalog Menu / Layanan):** `id`, `tenant_id`, `category`, `name`, `price` (Int), `image_url`, `is_available`, `created_at`.

11. **`transactions` & `transaction_items`:** Mencatat seluruh transaksi POS, nominal rupiah (`Int`), metode pembayaran (`CASH`, `QRIS`, `TRANSFER`), potongan voucher, dan status penambahan stempel otomatis.

12. **`cash_shifts` & `cash_drawer_logs`:** Mencatat modal awal laci (`Int`), pengeluaran kas harian (`CASH_OUT`), pemasukan kas (`CASH_IN`), dan selisih uang tunai saat tutup toko (`variance`).

13. **`attendances`:** Mencatat `CLOCK_IN` / `CLOCK_OUT`, URL foto selfie kamera depan, koordinat GPS, jarak dalam meter dari lokasi toko, dan status (`ON_TIME` / `LATE`).

## 7. Core API Endpoints Specification

### 7.1 Public & Customer Endpoints

* `GET /api/qr/[code]` — Resolve status QR, deteksi sesi role (`OWNER`/`STAFF`/`CUSTOMER`), catat log pengunjung jika pelanggan, dan arahkan ke tampilan yang sesuai.

* `GET /api/public/store/[slug]` — Ambil profil publik toko, mode tampilan aktif, katalog menu, promo aktif, dan nomor antrean berjalan.

* `POST /api/public/store/[slug]/review` — Proses rating bintang 1–5 (bintang 4–5 mengembalikan link Google Maps; bintang 1–3 menyimpan keluhan internal).

* `POST /api/public/store/[slug]/customer-identify` — Identifikasi pelanggan via Nama & No. WA untuk menampilkan kartu E-Stamp dan voucher.

* `POST /api/public/store/[slug]/stamp/add-by-pin` — Validasi 4-digit PIN kasir untuk menambah `+1` stempel.

* `POST /api/public/store/[slug]/voucher/claim` — Klaim voucher promo dan terbitkan kode unik 6 digit.

* `POST /api/public/store/[slug]/queue` — Ambil nomor antrean baru.

### 7.2 Staff & Owner Endpoints

* `POST /api/app/pos/transactions` — Simpan transaksi POS, redeem voucher, dan tambah stempel pelanggan secara atomik (`prisma.$transaction`).

* `POST /api/app/cash-drawer/open` | `/log` | `/close` — Kelola buka shift, catat kas keluar/masuk, dan tutup shift otomatis.

* `POST /api/app/attendance` — Validasi jarak Haversine GPS, simpan foto selfie, dan catat jam kehadiran.

* `GET /api/dashboard/owner-summary` — Endpoint tunggal ultra-cepat yang mengembalikan seluruh metrik ringkas untuk tampilan 1-layar Owner.

### 7.3 Super Admin Concierge Endpoints (Tim RAI)

* `POST /api/admin/qr-batch` — Generate batch kode QR fisik baru (`UNASSIGNED`) siap cetak.

* `POST /api/admin/tenants/concierge-onboard` — Buat toko baru, akun owner, akun kasir, program loyalty default, dan ikat kode QR fisik dalam satu proses sekali klik.

* `POST /api/admin/tenants/[id]/products/bulk` — Input daftar menu/produk milik klien secara massal oleh Tim RAI.

* `PATCH /api/admin/tenants/[id]/manage` — Ubah pengaturan, link Google Maps, mode QR, atau status paket toko klien atas permintaan owner.

## 8. UI/UX Design System & Brand Guidelines (Apple Aesthetic + Logo RAI)

### 8.1 Tipografi Bergaya Apple (*Apple HIG Typography*)

* **Font Stack:** Menggunakan font **`Inter`** (Google Fonts) sebagai padanan web lintas perangkat yang dikonfigurasi menyerupai **San Francisco (`SF Pro`)**, dengan fallback prioritas sistem Apple:

  ```css
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif;
  ```

* **Skala & Karakteristik Huruf:**

  * **Hero Display Title:** `48px – 64px` (Desktop) / `32px – 40px` (Mobile), `font-weight: 700`, `letter-spacing: -0.03em`, `line-height: 1.08`.

  * **Section Heading:** `32px – 40px`, `font-weight: 600`, `letter-spacing: -0.02em`, `line-height: 1.15`.

  * **Card Title & Metric Numbers:** `20px – 28px`, `font-weight: 600`, `letter-spacing: -0.015em` (angka statistik menggunakan `tabular-nums` agar sejajar rapi).

  * **Body Copy:** `15px – 17px`, `font-weight: 400`, `letter-spacing: -0.01em`, `line-height: 1.55`.

### 8.2 Palet Warna (Perpaduan Minimalisme Apple & Identitas Logo RAI)

Desain mengutamakan kanvas putih bersih khas Apple yang dipadukan dengan tiga warna aksen ikonik dari logo **UMKM Creative by RAI**:

* **Surface & Background:**

  * **Pure White (`#FFFFFF`):** Latar belakang utama halaman dan kartu konten.

  * **Apple Soft Gray (`#F5F5F7`):** Latar belakang section selang-seling, kartu Bento Grid, dan area input.

  * **Frosted Glass Header:** `rgba(255, 255, 255, 0.80)` dengan `backdrop-filter: blur(20px)` dan border bawah tipis `1px solid rgba(0, 0, 0, 0.06)`.

* **Typography Ink:**

  * **Primary Text (`#1D1D1F`):** Hitam lembut khas Apple untuk judul dan angka utama.

  * **Secondary Text (`#6E6E73`):** Abu-abu netral untuk deskripsi pendukung (selaras dengan warna teks logo `#4A4A4A`).

* **Signature Accents dari Logo RAI:**

  * **RAI Teal (`#32A8A4`):** Warna aksi utama (*Primary CTA buttons*), indikator aktif, grafik pengunjung, dan ikon kepercayaan.

  * **RAI Coral Red (`#F05A4F`):** Indikator peringatan, notifikasi keluhan internal, dan penanda aksi penting.

  * **RAI Warm Gold (`#F6B93B`):** Ikon bintang ulasan Google, stempel loyalty terisi, dan lencana paket unggulan.

### 8.3 Komponen & Interaksi Khas Apple

* **Pill Buttons:** Tombol utama berbentuk kapsul (`rounded-full`) dengan animasi skala halus saat ditekan (`active:scale-[0.98] transition-all duration-200`).

* **Bento Cards:** Kartu dengan sudut membulat besar (`rounded-3xl` / `24px`), bayangan sangat halus (`shadow-[0_4px_24px_rgba(0,0,0,0.04)]`), dan jarak antar-elemen yang lega (*generous whitespace*).

* **Prinsip "Zero-Clutter" pada Aplikasi:** Tidak ada sidebar penuh teks yang membingungkan owner. Navigasi menggunakan *bottom tab bar* bersih di HP atau maksimal 4 tab utama di desktop.

## 9. Phased Implementation Roadmap (Urutan Pengerjaan AI Coding)

### Phase 1: Infrastructure Setup (Turso + GitHub + Vercel), Landing Page & Smart QR Core *(Target: Minggu 1)*

* [ ] Inisialisasi proyek Next.js 15 + TypeScript + Tailwind CSS, hubungkan ke repositori GitHub `https://github.com/arra7trader/RAI.git`, dan aktifkan auto-deploy di **Vercel**.

* [ ] Konfigurasi **Prisma ORM + `@prisma/adapter-libsql`** yang terhubung ke database **Turso (`libsql://rai-arra7trader.aws-ap-northeast-1.turso.io`)** dan jalankan migrasi skema awal.

* [ ] Terapkan konfigurasi font Apple/Inter & palet warna logo RAI (`#32A8A4`, `#F05A4F`, `#F6B93B`, `#F5F5F7`).

* [ ] Bangun **Marketing Landing Page (`/`) & Halaman Paket (`/paket`)** bergaya Apple lengkap dengan simulasi interaktif *Pembeli vs Owner* dan tombol konsultasi WhatsApp (tanpa harga).

* [ ] Bangun **Super Admin QR Batch Generator** (`/admin/qr-generator`) dan **Concierge Onboarding Wizard** (`/admin/tenants/new`) agar Tim RAI bisa menyiapkan toko klien dalam < 10 menit.

* [ ] Implementasi **Smart Dynamic QR Router (`/q/[qrCodeId]`)** dengan pencatatan *Foot-Traffic Counter* (`NEW` vs `RETURNING`).

* [ ] Bangun **Portal Pelanggan (`/[storeSlug]`)** dengan *Smart Google Review Filter*, Katalog Menu, dan Kartu Kontak Toko.

* [ ] Bangun **Owner 1-Screen Summary (`/dashboard`)** beserta tombol bantuan instan ke WhatsApp Tim RAI.

### Phase 2: Retensi Pelanggan — E-Stamp Loyalty, Voucher & Antrean *(Target: Minggu 2)*

* [ ] Implementasi identifikasi pelanggan tanpa aplikasi (via Nomor WhatsApp) & Mini CRM (`customers`).

* [ ] Bangun fitur **Kartu Stempel Digital (`E-Stamp`)** dengan validasi PIN harian kasir.

* [ ] Bangun fitur **Scan-to-Claim Voucher Promo** dan **Nomor Antrean Digital**.

* [ ] Tambahkan fitur **Bulk Input Menu & Promo** di panel Super Admin agar Tim RAI mudah mengupdate data milik owner.

### Phase 3: POS Kasir Ringan, Buku Kas Laci & Absensi GPS *(Target: Minggu 3)*

* [ ] Bangun halaman **POS Kasir Web (`/app/pos`)** yang terhubung dengan validasi kode voucher dan penambahan stempel otomatis.

* [ ] Implementasi **Struk Digital WhatsApp** dan dukungan cetak printer thermal Bluetooth 58mm.

* [ ] Bangun **Buku Kas Laci (`cash_shifts` & `cash_drawer_logs`)** untuk menghitung modal awal, pengeluaran harian, dan selisih uang tunai saat tutup toko.

* [ ] Bangun modul **Absensi Karyawan Scan QR + Selfie + Geofencing GPS** (`/app/attendance`).

### Phase 4: Multi-Cabang & Otomasi Laporan WhatsApp *(Target: Minggu 4)*

* [x] Dukungan **Multi-Cabang** dalam satu tampilan ringkas Owner untuk paket *RAI Juragan*. Super Admin menghubungkan grup di `/admin/branches`; ringkasan hanya menyertakan tenant aktif berpaket Juragan dalam grup tersebut.

* [ ] Otomasi pengiriman **Laporan Tutup Toko** setiap malam langsung ke WhatsApp Owner (sehingga owner benar-benar tidak perlu membuka website jika sedang sibuk).

* [x] Export laporan transaksi, item transaksi, kas laci, mutasi kas, dan absensi ke format Excel (`.xlsx`), dengan cakupan tenant sesuai akun owner.

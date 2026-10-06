# SIMPUL Backend (Strapi v5 + PostgreSQL)

**SIMPUL** = Sistem Informasi Magang & Pilihan Untuk Lapangan.
API **read-only** untuk menampilkan data tempat PKL. Semua data dikelola Admin/Guru lewat **Strapi Admin Panel**.

---

## 1. Cara Menjalankan

**Kebutuhan:** Node.js 22.13–24, npm, dan Docker dengan Docker Compose.

PostgreSQL dijalankan di container Docker. Strapi tetap dijalankan langsung di komputer saat development.

```bash
# 1. Buat konfigurasi lokal
cp .env.example .env

# 2. Ganti semua secret di .env. APP_KEYS harus berisi 4 nilai dipisah koma.
#    Buat satu nilai dengan: openssl rand -base64 16

# 3. Jalankan PostgreSQL dan tunggu sampai healthy
docker compose up -d db
docker compose ps

# 4. Pasang dependency dan jalankan Strapi
npm install
npm run develop
```

Compose membaca `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, dan `DATABASE_PORT` dari `.env`. Nilai koneksi default Strapi di `.env.example` sudah cocok: host `127.0.0.1`, port `5432`, database `simpul`. Jika port 5432 sudah dipakai, ubah `DATABASE_PORT` di `.env`; port tersebut dipakai untuk sisi host.

- Admin Panel: <http://localhost:1337/admin> (buat akun admin saat pertama kali dibuka)
- API: <http://localhost:1337/api/...>

Data PostgreSQL disimpan di named volume `postgres_data`, sehingga tetap ada setelah container dihentikan atau dibuat ulang. Perintah umum:

```bash
docker compose stop db     # hentikan sementara
docker compose start db    # jalankan kembali
docker compose logs -f db  # lihat log PostgreSQL
docker compose down        # hapus container/network; data volume tetap tersimpan
```

Untuk production, siapkan PostgreSQL dan secret production sendiri, lalu jalankan `npm run build` dan `npm run start`.

### Mengisi data contoh

Setelah PostgreSQL siap dan `.env` terkonfigurasi, isi database development dengan data demo:

```bash
npm run seed
```

Seeder menambahkan contoh jurusan, role, satu mitra, relasi posisi, testimoni, hero slider, dan app info. Data yang sudah ditemukan akan dilewati, tidak diubah atau dihapus saat seeder dijalankan ulang. Data mitra, alamat, kontak, dan testimoni bersifat simulasi; ganti sebelum dipakai untuk informasi nyata. Seeder menolak berjalan saat `NODE_ENV=production`.

> Izin akses publik (hanya baca) **otomatis diatur** di `src/index.ts` saat Strapi start. Tidak perlu klik apa-apa di Settings.

---

## 2. Cara Mengisi Data (Admin Panel)

Isi **berurutan** supaya relasi mudah dipilih:

1. **Major** (jurusan) → contoh: RPL, PM, AKL
2. **Role** (posisi pekerjaan) → contoh: Kasir, Display Staff, Backend Developer
3. **Company** (tempat PKL) → profil, foto, jam kerja, syarat, fasilitas, kontak
4. **Company Role** → hubungkan *Company + Role* dan isi `responsibilities`
5. **Testimonial** → ulasan siswa, pilih Company-nya
6. **Hero Slider** dan **App Info**

Format JSON yang dipakai:

```json
// requirements / facilities / responsibilities  (array of string)
["Surat pengantar", "Fotokopi kartu pelajar"]

// contact_info
{ "email": "hrd@contoh.com", "phone": "0261-123456", "whatsapp": "628123456789" }
```

> Semua content type memakai `draftAndPublish: false`, jadi data langsung tampil di API setelah **Save** (tidak perlu Publish).

---

## 3. Daftar Endpoint (semua GET)

| Kebutuhan | Endpoint |
| :-- | :-- |
| Hero slider aktif | `/api/hero-sliders?sort=sort_order:asc&populate=*` |
| Semua tempat PKL | `/api/companies` |
| Detail 1 tempat PKL | `/api/companies/{documentId}` |
| Komparasi 2 tempat PKL | `/api/companies?filters[id][$in][0]=1&filters[id][$in][1]=2` |
| Daftar jurusan + jumlah mitra | `/api/majors?populate=*` |
| Daftar role | `/api/roles?populate=*` |
| Info aplikasi | `/api/app-info?populate=*` |
| Testimoni | `/api/testimonials?populate=*` |

**`/api/companies` otomatis sudah berisi** gambar, jam kerja, dan jurusan. `roles` dan `testimonials` tidak ikut dikirim secara default; keduanya tetap dapat dipakai untuk filter di server, atau diminta secara eksplisit dengan `populate`.

Setiap item di `/api/majors` menyertakan `companies_count`, yaitu jumlah perusahaan yang terhubung langsung melalui relasi many-to-many `companies`.

`/api/hero-sliders` otomatis hanya mengembalikan slider dengan `is_active=true`; filter eksplisit seperti `?filters[is_active][$eq]=false` tetap dapat dipakai untuk meminta slider nonaktif.

### Filter tempat PKL (`/api/companies`)

| Mau cari | Tambahkan di URL |
| :-- | :-- |
| Berdasarkan **jurusan** | `?major={majorDocumentId}` |
| Berdasarkan **role** | `?role={roleDocumentId}` |
| Jurusan **dan** role | `?major={majorDocumentId}&role={roleDocumentId}` |
| Search nama company, jurusan, atau role | `?search=developer` |
| Berdasarkan nama | `?filters[name][$containsi]=plaza` |
| Kuota tersedia | `?filters[quota_status][$eq]=Tersedia` |
| Rating tertinggi dulu | `?sort=rating:desc` |
| Halaman berikutnya | `?pagination[page]=2&pagination[pageSize]=10` |

Semua filter bisa digabung dengan `&`. Default 25 data per halaman (maks 100).

> Parameter ringkas `major` dan `role` menerima `documentId`. Masing-masing boleh dipakai sendiri; jika keduanya dikirim, perusahaan harus cocok dengan jurusan **dan** role (AND). `search` mencari teks tanpa membedakan huruf besar/kecil pada nama company, nama jurusan, atau judul role. Search dapat digabung dengan `major`/`role`; setiap batasan yang dikirim harus terpenuhi. Semua parameter juga dapat digabung dengan sorting dan pagination Strapi lainnya. Bentuk filter Strapi standar tetap didukung. Jurusan terhubung langsung ke perusahaan; role dan tanggung jawab berada di relasi `company.roles` dan tidak terikat ke jurusan tertentu.

---

## 4. Contoh Pemakaian di Frontend (JavaScript)

```js
const API = "http://localhost:1337/api";

// Daftar tempat PKL yang terhubung ke jurusan tertentu
const majorDocumentId = 'xd3nx2vlyb26hrm0qwegtwuh1';
const res = await fetch(`${API}/companies?major=${majorDocumentId}`);
const { data } = await res.json();      // data = array perusahaan

// Search nama company, jurusan, atau role
const search = 'developer';
const searchRes = await fetch(`${API}/companies?search=${encodeURIComponent(search)}`);

data.forEach((c) => {
  console.log(c.name, c.quota_status, c.rating);
  const imageUrl = c.images?.[0]?.url;
  if (imageUrl) {
    console.log(imageUrl.startsWith('http') ? imageUrl : `http://localhost:1337${imageUrl}`);
  }
});

// Komparasi 2 tempat PKL
const cmp = await fetch(`${API}/companies?filters[id][$in][0]=1&filters[id][$in][1]=2`);
const [a, b] = (await cmp.json()).data;
```

Bentuk respons (Strapi v5, **tanpa** pembungkus `attributes`):

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123...",
      "name": "Plaza Asia",
      "quota_status": "Tersedia",
      "rating": 4.5,
      "images": [{ "url": "/uploads/foto.jpg" }],
      "working_hours": [{ "shift_name": "Shift 1 (Pagi)", "working_hours_text": "08.00 - 16.00 WIB" }],
      "majors": [{ "code": "AKL", "name": "Akuntansi" }]
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 25, "pageCount": 1, "total": 1 } }
}
```

### Hal yang sering bikin bingung

- **`id` vs `documentId`**: di Strapi v5, detail satu data (`/api/companies/{...}`) memakai **`documentId`** (string), bukan `id` angka. Filter `filters[id]...` tetap memakai `id` angka.
- **URL gambar** dari provider lokal berbentuk `/uploads/...`, jadi tambahkan origin backend. Provider Cloudinary mengembalikan URL absolut yang bisa dipakai langsung.
- **`app-info` 404** = admin belum mengisi & Save datanya di Admin Panel.
- **CORS**: isi `CORS_ORIGINS` di `.env` dengan alamat frontend (contoh `http://localhost:3000`).
- POST/PUT/DELETE ke API publik ditolak (405). Ini disengaja.

---

## 5. Pemetaan Dokumentasi → Strapi

| Dokumen | Di project ini |
| :-- | :-- |
| `companies` | `src/api/company` |
| `majors` | `src/api/major` |
| `roles` | `src/api/role` (tabel `job_roles`, agar tidak bentrok dengan role bawaan Strapi) |
| `company_roles` | `src/api/company-role` (Company + Role + responsibilities) |
| `testimonials` | `src/api/testimonial` |
| `hero_sliders` | `src/api/hero-slider` (Collection Type) |
| `app_info` | `src/api/app-info` (Single Type) |
| `component_working_shift` | `src/components/shared/working-shift.json` |

## 6. Indeks Proyek

Proyek ini adalah backend CMS Strapi v5 untuk data tempat PKL SIMPUL. PostgreSQL menyimpan konten dan data admin; Strapi menyediakan Admin Panel serta REST API. Akses publik dikonfigurasi read-only saat bootstrap aplikasi.

| Bagian | Lokasi | Kegunaan |
| :-- | :-- | :-- |
| Konfigurasi server, database, CORS | `config/` | Pengaturan runtime Strapi dan koneksi PostgreSQL |
| Bootstrap aplikasi | `src/index.ts` | Memberi izin baca pada role Public |
| Company/tempat PKL | `src/api/company/` | Profil perusahaan, jam kerja, role, dan testimoni |
| Major/jurusan | `src/api/major/` | Data jurusan sekolah |
| Role pekerjaan | `src/api/role/` | Katalog posisi pekerjaan |
| Company Role | `src/api/company-role/` | Relasi perusahaan, role, dan tanggung jawab |
| Testimonial | `src/api/testimonial/` | Ulasan siswa terkait perusahaan |
| Hero Slider | `src/api/hero-slider/` | Konten banner beranda |
| App Info | `src/api/app-info/` | Informasi aplikasi (single type) |
| Komponen jam kerja | `src/components/shared/` | Skema shift kerja yang dapat dipakai ulang |
| Database development | `docker-compose.yml` | PostgreSQL 16 dengan volume persisten |

## 7. Struktur Folder

```
config/                 database (PostgreSQL), server, CORS, dll
docker-compose.yml      PostgreSQL untuk development
src/index.ts            mengatur akses publik read-only
src/api/<nama>/
  content-types/        schema.json (definisi field)
  routes|controllers|services/
src/api/company/middlewares/default-populate.ts   populate otomatis
src/components/shared/  component working-shift
```

## 8. Persiapan Deploy Railway + Cloudinary

### Railway

1. Buat project Railway, tambahkan service **PostgreSQL**, lalu deploy repository ini sebagai service aplikasi.
2. Set **Build Command** ke `npm run build`, **Start Command** ke `npm run start`, dan **Healthcheck Path** ke `/_health` di pengaturan service. Strapi memakai `PORT` dari Railway dan listen pada `0.0.0.0`.
3. Tambahkan variabel berikut di service Strapi. Ganti `Postgres` dengan nama service database Railway jika berbeda.

```env
NODE_ENV=production
PUBLIC_URL=https://<domain-backend-railway>
PROXY_KOA=true
CORS_ORIGINS=https://<domain-frontend>
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SCHEMA=public
DATABASE_SSL=false
UPLOAD_PROVIDER=cloudinary
```

Railway menyediakan `DATABASE_URL` melalui private network untuk koneksi antarlayanan; aplikasi membaca URL tersebut jika tersedia, dan tetap memakai `DATABASE_*` terpisah untuk development lokal. Jangan set `PORT` sendiri; Railway menyediakannya. [Dokumentasi Railway PostgreSQL](https://docs.railway.com/databases/postgresql), [Build dan Start Commands](https://docs.railway.com/builds/build-and-start-commands).

Tambahkan secret Strapi dengan nilai acak dan berbeda untuk setiap variabel:

```env
APP_KEYS=<4 nilai acak dipisahkan koma>
API_TOKEN_SALT=<secret acak>
ADMIN_JWT_SECRET=<secret acak>
TRANSFER_TOKEN_SALT=<secret acak>
ENCRYPTION_KEY=<secret acak>
JWT_SECRET=<secret acak>
```

`APP_KEYS` harus memiliki tepat 4 nilai. Jangan salin nilai placeholder dari `.env.example` ke Railway. Set `CORS_ORIGINS` ke origin frontend sebenarnya, bukan `*`. Setelah membuat domain publik Railway, isi `PUBLIC_URL` dengan URL backend tersebut.

### Cloudinary

1. Ambil **Cloud name**, **API Key**, dan **API Secret** dari dashboard Cloudinary.
2. Tambahkan variabel berikut di service Strapi Railway:

```env
CLOUDINARY_NAME=<cloud-name>
CLOUDINARY_KEY=<api-key>
CLOUDINARY_SECRET=<api-secret>
CLOUDINARY_FOLDER_NAME=simpul
```

Provider resmi `@strapi/provider-upload-cloudinary` sudah menjadi dependency. Saat `UPLOAD_PROVIDER=cloudinary`, Strapi mengirim upload baru ke Cloudinary; default lokal tetap digunakan saat development. Konfigurasi CSP Admin Panel mengizinkan gambar/media dari `res.cloudinary.com`. Jika frontend memakai CSP sendiri, izinkan domain tersebut pada `img-src`. [Panduan resmi provider Cloudinary Strapi](https://docs.strapi.io/cms/configurations/media-library-providers/cloudinary).

Setelah variabel diisi, deploy service dan buat akun admin pertama di `https://<domain-backend-railway>/admin`. Gambar yang sebelumnya tersimpan lokal di `public/uploads` tidak otomatis dipindahkan ke Cloudinary; upload ulang atau migrasikan aset lama secara terpisah.

# 🔐 DocsCrypt - File Encryption System

Aplikasi web untuk mengunggah, mengenkripsi, dan mendekripsi file Word (.docx) dan Excel (.xlsx) menggunakan kombinasi algoritma **Aria-128-CBC** dan **Affine Cipher**.

## 🚀 Fitur Utama

- ✅ **Upload File**: Mendukung file Word (.docx) dan Excel (.xlsx)
- 🔐 **Enkripsi Ganda**: Kombinasi Aria-128-CBC + Affine Cipher
- 🔓 **Dekripsi Aman**: Restore file asli dengan integritas 100%
- 👥 **Multi User**: Sistem autentikasi dan manajemen user
- 📊 **Dashboard**: Interface modern untuk manajemen file
- 🧪 **Testing**: Built-in testing untuk validasi algoritma
- 🗄️ **Database**: Metadata tersimpan aman di MySQL

## 🏗️ Teknologi

### Backend
- **Node.js** dengan **Hapi.js** framework
- **MySQL** untuk database
- **Aria-128-CBC** (menggunakan AES-128-CBC equivalent)
- **Affine Cipher** untuk lapisan enkripsi tambahan
- **JWT** untuk autentikasi
- **Multer** untuk file upload

### Frontend
- **React** dengan **Vite**
- **Tailwind CSS** untuk styling
- **Axios** untuk API calls
- **React Router** untuk routing
- **React Hot Toast** untuk notifications

### Prerequisites
- Node.js (v16 atau lebih baru)
- MySQL Server
- Git

### Test via Frontend
1. Buka http://localhost:5173
2. Login dengan: `username: testuser`, `password: password123`
3. Kunjungi halaman "Encryption Test" untuk test algoritma
4. Upload file .docx/.xlsx di halaman "Upload File"

## 🔐 Cara Kerja Enkripsi

### Proses Enkripsi
1. **Input**: File asli (.docx/.xlsx)
2. **Step 1**: Transformasi dengan Affine Cipher
   - Formula: `E(x) = (ax + b) mod m`
   - Parameter: a=5, b=8, m=256
3. **Step 2**: Enkripsi dengan Aria-128-CBC
   - Algoritma: AES-128-CBC (equivalent)
   - Key: 128-bit
   - IV: Random 16 bytes
4. **Output**: File terenkripsi + metadata

### Proses Dekripsi
1. **Input**: File terenkripsi + metadata
2. **Step 1**: Dekripsi dengan Aria-128-CBC
3. **Step 2**: Reverse transformasi Affine Cipher
   - Formula: `D(y) = a^(-1)(y - b) mod m`
4. **Output**: File asli yang dipulihkan

### Keamanan
- **Double Encryption**: Dua lapisan enkripsi untuk keamanan maksimal
- **Random IV**: Setiap enkripsi menggunakan IV yang berbeda
- **SHA-256 Checksum**: Validasi integritas file
- **Secure Storage**: File asli dihapus setelah enkripsi

## 📁 Struktur Proyek

```
project-docscrypt/
├── backend/
│   ├── src/
│   │   ├── config/          # Konfigurasi database
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   │   └── encryption/  # Algoritma enkripsi
│   │   └── utils/           # Utilities
│   ├── uploads/             # File upload sementara
│   ├── encrypted/           # File terenkripsi
│   └── test_files/          # File untuk testing
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Halaman aplikasi
│   │   └── services/        # API services
│   └── public/
├── database/
│   └── schema.sql           # Database schema
└── README.md
```


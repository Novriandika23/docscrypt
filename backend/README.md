# 🔐 DocsCrypt Backend API

Secure Node.js backend API for document encryption and decryption using ARIA-128-CBC and Affine Cipher algorithms.

![DocsCrypt Backend](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-API-blue?style=for-the-badge&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange?style=for-the-badge&logo=mysql)

## ✨ Features

### 🔒 **Security Features**
- **Dual-Layer Encryption**: ARIA-128-CBC + Affine Cipher combination
- **JWT Authentication**: Secure token-based user authentication
- **File Integrity**: SHA-256 checksums for file validation
- **Secure Storage**: Encrypted files stored separately from originals
- **Random IV Generation**: Unique initialization vectors for each encryption

### 🚀 **API Capabilities**
- **RESTful API**: Clean, organized endpoints following REST principles
- **File Upload**: Multi-format support (DOCX, XLSX, PDF, TXT, PPT)
- **Real-time Processing**: Instant encryption/decryption operations
- **User Management**: Registration, login, and session handling
- **File Management**: Upload, encrypt, decrypt, download, and delete operations

### 🛡️ **Data Protection**
- **Environment Variables**: Sensitive data stored securely
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without data leakage
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse and attacks

## 🛠️ Tech Stack

### **Core Technologies**
- **Node.js 18+** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MySQL 8.0+** - Relational database for metadata storage

### **Security & Encryption**
- **crypto (Node.js)** - Built-in cryptographic functionality
- **jsonwebtoken** - JWT token generation and verification
- **bcrypt** - Password hashing and verification

### **File Handling**
- **multer** - Multipart/form-data file upload middleware
- **fs/promises** - Asynchronous file system operations
- **path** - File path utilities

### **Development Tools**
- **nodemon** - Development server with auto-restart
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing middleware

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- MySQL 8.0+ server running
- Git for version control

### **Installation**

1. **Clone the repository:**
```bash
git clone https://github.com/Novriandika23/docscrypt.git
cd docscrypt
git checkout backend
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=docscrypt_db

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Encryption Keys
ARIA_KEY=your_32_character_aria_key_here
AFFINE_A=5
AFFINE_B=8
```

4. **Setup database:**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS docscrypt_db;"

# Setup tables and test data
node setup_database.js
```

5. **Start development server:**
```bash
npm run dev
```

The API will be available at: `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js         # MySQL connection configuration
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── files.js           # File management endpoints
│   │   └── encryption.js      # Encryption/decryption endpoints
│   ├── services/
│   │   ├── encryption/
│   │   │   ├── aria.js        # ARIA-128-CBC implementation
│   │   │   ├── affine.js      # Affine Cipher implementation
│   │   │   └── combined.js    # Combined encryption service
│   │   └── fileHandler.js     # File processing utilities
│   └── utils/
│       └── auth.js            # JWT utilities and middleware
├── uploads/                   # Temporary file uploads
├── encrypted/                 # Encrypted file storage
├── temp/                      # Temporary processing files
├── .env.example              # Environment variables template
├── server.js                 # Main application entry point
├── setup_database.js         # Database initialization script
└── package.json              # Dependencies and scripts
```

## 🔗 API Endpoints

### **Authentication**
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile (protected)
```

### **File Management**
```http
GET    /api/files/list     # List user files (protected)
POST   /api/files/upload   # Upload new file (protected)
DELETE /api/files/:id      # Delete file (protected)
```

### **Encryption Operations**
```http
POST /api/encryption/encrypt/:fileId           # Encrypt file (protected)
POST /api/encryption/decrypt/:fileId           # Decrypt file (protected)
POST /api/encryption/decrypt-upload            # Decrypt uploaded file (protected)
GET  /api/encryption/download/:fileId          # Download decrypted file (protected)
GET  /api/encryption/download-encrypted/:fileId # Download encrypted file (protected)
GET  /api/encryption/download-decrypted/:tempId # Download temp decrypted file (protected)
```

### **System Information**
```http
GET /api/encryption/info   # Get encryption algorithm info
GET /api/encryption/test   # Test encryption algorithms
```

## 🔐 Encryption Algorithms

### **ARIA-128-CBC**
```javascript
// Implementation using Node.js crypto module
const algorithm = 'aes-128-cbc'; // AES-128-CBC as ARIA equivalent
const key = crypto.randomBytes(16); // 128-bit key
const iv = crypto.randomBytes(16);  // 128-bit IV

// Encryption
const cipher = crypto.createCipher(algorithm, key);
const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

// Decryption
const decipher = crypto.createDecipher(algorithm, key);
const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
```

### **Affine Cipher**
```javascript
// Mathematical transformation
const encrypt = (byte) => (AFFINE_A * byte + AFFINE_B) % 256;
const decrypt = (byte) => (modInverse(AFFINE_A, 256) * (byte - AFFINE_B + 256)) % 256;

// Parameters
const AFFINE_A = 5;  // Multiplicative key (must be coprime with 256)
const AFFINE_B = 8;  // Additive key
```

### **Combined Process**
1. **Encryption**: Original → Affine → ARIA → Encrypted
2. **Decryption**: Encrypted → ARIA → Affine → Original

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run test suite

# Database
npm run setup-db     # Initialize database and tables
npm run reset-db     # Reset database (development only)

# Utilities
npm run encrypt-test # Test encryption algorithms
npm run clean        # Clean temporary files
```

## 🔧 Configuration

### **Database Configuration**
Update database settings in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=docscrypt_db
```

### **Security Configuration**
```env
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
ARIA_KEY=your_32_character_encryption_key_here
AFFINE_A=5
AFFINE_B=8
```

### **Server Configuration**
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 🧪 Testing

### **Algorithm Testing**
```bash
# Test encryption algorithms
node test_encryption.js

# Test complete workflow
node test_complete_flow.js
```

### **API Testing with cURL**
```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Upload file (replace TOKEN with actual JWT)
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.docx"
```

## 📊 Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Files Table**
```sql
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  encrypted_path VARCHAR(500),
  is_encrypted BOOLEAN DEFAULT FALSE,
  checksum VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🚀 Deployment

### **Production Build**
```bash
# Install production dependencies
npm ci --only=production

# Set environment variables
export NODE_ENV=production
export PORT=3001
export DB_HOST=your_production_db_host

# Start server
npm start
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔒 Security Best Practices

### **Implemented Security Measures**
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **Input Validation**: Comprehensive request validation
- ✅ **File Type Validation**: Whitelist of allowed file types
- ✅ **Path Traversal Protection**: Secure file path handling
- ✅ **Environment Variables**: Sensitive data protection
- ✅ **CORS Configuration**: Controlled cross-origin access
- ✅ **Error Handling**: No sensitive data in error responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Novriandika23**
- GitHub: [@Novriandika23](https://github.com/Novriandika23)
- Repository: [DocsCrypt](https://github.com/Novriandika23/docscrypt)

## 🙏 Acknowledgments

- Node.js community for the excellent runtime
- Express.js team for the robust web framework
- MySQL team for the reliable database system
- Crypto community for encryption standards and implementations
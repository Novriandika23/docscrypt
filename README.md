# 🔐 DocsCrypt Frontend

Modern React.js web application for secure document encryption and decryption using ARIA-128-CBC and Affine Cipher algorithms.

![DocsCrypt Logo](public/logo-tanpa-bg.png)

## ✨ Features

### 🔒 **Security Features**
- **Dual-Layer Encryption**: ARIA-128-CBC + Affine Cipher
- **Secure File Upload**: Multi-format support (DOCX, XLSX, PDF, TXT, PPT)
- **Real-time Encryption Status**: Visual feedback for all operations
- **Protected Routes**: JWT-based authentication
- **Secure File Download**: Encrypted file delivery

### 🎨 **User Interface**
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Works perfectly on desktop and mobile
- **File Type Icons**: Color-coded icons for different file types
- **Progress Indicators**: Real-time upload and encryption progress
- **Interactive Dashboard**: Comprehensive file management

### 📱 **User Experience**
- **Intuitive Navigation**: Easy-to-use interface for all users
- **File Management**: Upload, encrypt, decrypt, and download files
- **User Authentication**: Secure login and registration system
- **Error Handling**: Comprehensive error messages and validation

## 🛠️ Tech Stack

### **Core Technologies**
- **React 18** - Modern React with hooks and functional components
- **Vite** - Lightning-fast build tool and dev server
- **React Router DOM** - Client-side routing and navigation

### **Styling & UI**
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **PostCSS** - CSS processing and optimization

### **HTTP & API**
- **Axios** - Promise-based HTTP client for API communication
- **JWT Handling** - Secure token-based authentication

### **Development Tools**
- **ESLint** - Code linting and quality assurance
- **Hot Module Replacement** - Instant development feedback

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm/yarn
- DocsCrypt Backend API running on port 3001

### **Installation**

1. **Clone the repository:**
```bash
git clone https://github.com/Novriandika23/docscrypt.git
cd docscrypt
git checkout frontend
cd frontend
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Start development server:**
```bash
npm run dev
# or
yarn dev
```

4. **Open your browser:**
```
http://localhost:5173
```

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── logo-tanpa-bg.png  # Main logo
│   ├── docscrypt-logo.svg # SVG logo
│   └── vite.svg           # Vite icon
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.jsx     # Main app layout
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── DocsCryptLogo.jsx  # Logo component
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx  # File management dashboard
│   │   ├── Upload.jsx     # File upload interface
│   │   ├── Decrypt.jsx    # File decryption interface
│   │   ├── Login.jsx      # User authentication
│   │   └── Register.jsx   # User registration
│   ├── services/          # API services
│   │   └── api.js         # HTTP client configuration
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # This file
```

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Production
npm run build        # Create optimized production build
npm run preview      # Preview the production build locally
```

## 🔧 Configuration

### **API Configuration**
Update the API base URL in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

## 📱 Pages & Features

### **🏠 Dashboard**
- File list with encryption status
- Upload new files
- Download encrypted/decrypted files
- Delete files
- File type indicators with colors

### **📤 Upload**
- Drag & drop file upload
- Multiple file format support
- Real-time upload progress
- Automatic encryption after upload

### **🔓 Decrypt**
- Select encrypted files
- Enter decryption password
- Download decrypted files
- Decryption status feedback

### **🔐 Authentication**
- User registration and login
- JWT token management
- Protected route access
- Secure session handling

## 🎨 UI Components

### **File Type Icons**
- 📊 **Excel** (XLSX, XLS, CSV) - Green icons
- 📄 **Word** (DOCX, DOC) - Blue icons
- 📕 **PDF** - Red icons
- 📝 **Text** (TXT) - Gray icons
- 📊 **PowerPoint** (PPTX, PPT) - Orange icons

### **Status Indicators**
- 🔒 **Encrypted** - Green badge with lock icon
- 🔓 **Decrypted** - Blue badge with unlock icon
- ⏳ **Processing** - Yellow badge with spinner

## 🔗 API Integration

The frontend communicates with the DocsCrypt backend API:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **File Upload**: `/api/files/upload`
- **File Encryption**: `/api/encryption/encrypt`
- **File Decryption**: `/api/encryption/decrypt`
- **File Management**: `/api/files/list`, `/api/files/delete`

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Vite team for the blazing-fast build tool
- Tailwind CSS for the utility-first CSS framework
- Lucide React for beautiful icons

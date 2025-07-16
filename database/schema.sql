-- Create database
CREATE DATABASE IF NOT EXISTS kripto_grafi_db;
USE kripto_grafi_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  encrypted_name VARCHAR(255) NOT NULL,
  file_type ENUM('docx', 'xlsx') NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  encryption_method VARCHAR(50) DEFAULT 'aria-128-cbc+affine',
  storage_path VARCHAR(500),
  cloudinary_url VARCHAR(500),
  is_encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_file_type (file_type),
  INDEX idx_created_at (created_at)
);

-- Insert sample user for testing (password: 'password123')
INSERT INTO users (username, email, password_hash) VALUES 
('testuser', 'test@example.com', '$2b$10$rQZ8kHWKtGY5uJQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5e');

-- Show tables
SHOW TABLES;

-- Show table structures
DESCRIBE users;
DESCRIBE files;

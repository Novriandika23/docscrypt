/**
 * Database Setup Script
 * Run this script to create database and tables
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  console.log('🔄 Setting up database...');
  
  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'docscrypt_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Close connection and reconnect with database specified
    await connection.end();

    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName
    });

    // Create users table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create files table
    await dbConnection.execute(`
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
      )
    `);
    console.log('✅ Files table created');

    // Create a test user (password: 'password123')
    const testUserExists = await dbConnection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['testuser']
    );

    if (testUserExists[0].length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);

      await dbConnection.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        ['testuser', 'test@example.com', hashedPassword]
      );
      console.log('✅ Test user created (username: testuser, password: password123)');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // Show table information
    const [tables] = await dbConnection.execute('SHOW TABLES');
    console.log('\n📋 Database tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });

    // Show users count
    const [userCount] = await dbConnection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Total users: ${userCount[0].count}`);

    // Show files count
    const [fileCount] = await dbConnection.execute('SELECT COUNT(*) as count FROM files');
    console.log(`📁 Total files: ${fileCount[0].count}`);

    await dbConnection.end();
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };

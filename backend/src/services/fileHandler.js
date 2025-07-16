/**
 * File Handler Service
 * Handles file operations including encryption, decryption, and storage
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const CombinedEncryption = require('./encryption/combined');
const { pool } = require('../config/database');

class FileHandler {
  constructor() {
    // Initialize encryption service
    const ariaKey = process.env.ARIA_KEY || 'default-key-change-this-in-prod';
    const affineA = parseInt(process.env.AFFINE_A) || 5;
    const affineB = parseInt(process.env.AFFINE_B) || 8;
    
    this.encryption = new CombinedEncryption(ariaKey, affineA, affineB);
    
    // Define paths
    this.uploadsPath = path.join(__dirname, '../../uploads');
    this.encryptedPath = path.join(__dirname, '../../encrypted');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsPath, { recursive: true });
      await fs.mkdir(this.encryptedPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  /**
   * Encrypt a file
   * @param {number} fileId - File ID from database
   * @param {number} userId - User ID
   * @returns {Object} - Encryption result
   */
  async encryptFile(fileId, userId) {
    try {
      console.log(`🔐 Starting encryption for file ID: ${fileId}`);

      // Get file info from database
      const [files] = await pool.execute(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId]
      );

      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0];

      if (file.is_encrypted) {
        throw new Error('File is already encrypted');
      }

      // Read original file
      const originalPath = file.storage_path;
      const fileBuffer = await fs.readFile(originalPath);
      
      console.log(`📁 Read file: ${fileBuffer.length} bytes`);

      // Encrypt file
      const encryptionResult = this.encryption.encryptFile(fileBuffer);

      // Generate encrypted filename
      const encryptedFilename = `encrypted_${Date.now()}_${file.encrypted_name}`;
      const encryptedPath = path.join(this.encryptedPath, encryptedFilename);

      // Create file with IV prepended to encrypted data for standalone decryption
      const ivBuffer = Buffer.from(encryptionResult.metadata.iv, 'hex');
      const fileWithIV = Buffer.concat([ivBuffer, encryptionResult.encrypted]);

      // Save encrypted file with IV
      await fs.writeFile(encryptedPath, fileWithIV);
      console.log(`💾 Saved encrypted file with IV: ${encryptedPath}`);

      // Update database
      await pool.execute(
        `UPDATE files SET 
         is_encrypted = TRUE, 
         storage_path = ?, 
         encryption_method = ?,
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [encryptedPath, 'aria-128-cbc+affine', fileId]
      );

      // Store encryption metadata (you might want to create a separate table for this)
      const metadataJson = JSON.stringify(encryptionResult.metadata);
      
      // For now, we'll store metadata in a separate file
      const metadataPath = encryptedPath + '.meta';
      await fs.writeFile(metadataPath, metadataJson);

      // Remove original file for security
      try {
        await fs.unlink(originalPath);
        console.log(`🗑️ Removed original file: ${originalPath}`);
      } catch (unlinkError) {
        console.warn('Could not remove original file:', unlinkError.message);
      }

      console.log('✅ File encryption completed successfully');

      return {
        success: true,
        fileId: fileId,
        encryptedPath: encryptedPath,
        metadata: encryptionResult.metadata,
        message: 'File encrypted successfully'
      };

    } catch (error) {
      console.error('❌ File encryption failed:', error.message);
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a file
   * @param {number} fileId - File ID from database
   * @param {number} userId - User ID
   * @returns {Object} - Decryption result with file buffer
   */
  async decryptFile(fileId, userId) {
    try {
      console.log(`🔓 Starting decryption for file ID: ${fileId}`);

      // Get file info from database
      const [files] = await pool.execute(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId]
      );

      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0];

      if (!file.is_encrypted) {
        throw new Error('File is not encrypted');
      }

      // Read encrypted file
      const encryptedPath = file.storage_path;
      const fileWithIV = await fs.readFile(encryptedPath);

      console.log(`📁 Read encrypted file: ${fileWithIV.length} bytes`);

      // Extract IV from the beginning of the file (first 16 bytes)
      const ivBuffer = fileWithIV.slice(0, 16);
      const encryptedBuffer = fileWithIV.slice(16);
      const ivHex = ivBuffer.toString('hex');

      // Read metadata for verification
      const metadataPath = encryptedPath + '.meta';
      let metadata;

      try {
        const metadataJson = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataJson);
      } catch (metaError) {
        throw new Error('Could not read encryption metadata');
      }

      // Decrypt file
      const decryptedBuffer = this.encryption.decryptFile(encryptedBuffer, ivHex);
      
      console.log(`🔓 Decrypted file: ${decryptedBuffer.length} bytes`);

      // Verify integrity if checksum is available
      if (metadata.checksum) {
        const currentChecksum = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');
        if (currentChecksum !== metadata.checksum) {
          throw new Error('File integrity check failed - file may be corrupted');
        }
        console.log('✅ File integrity verified');
      }

      console.log('✅ File decryption completed successfully');

      return {
        success: true,
        fileId: fileId,
        fileName: file.original_name,
        fileBuffer: decryptedBuffer,
        fileType: file.file_type,
        metadata: metadata,
        message: 'File decrypted successfully'
      };

    } catch (error) {
      console.error('❌ File decryption failed:', error.message);
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  /**
   * Get encrypted file (without decryption)
   * @param {number} fileId - File ID from database
   * @param {number} userId - User ID
   * @returns {Object} - Encrypted file data
   */
  async getEncryptedFile(fileId, userId) {
    try {
      console.log(`🔒 Getting encrypted file for ID: ${fileId}`);

      // Get file info from database
      const [files] = await pool.execute(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId]
      );

      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0];

      if (!file.is_encrypted) {
        throw new Error('File is not encrypted');
      }

      // Read encrypted file (raw data)
      const encryptedPath = file.storage_path;
      const encryptedBuffer = await fs.readFile(encryptedPath);

      console.log(`📁 Read encrypted file: ${encryptedBuffer.length} bytes`);

      // Read metadata for additional info
      const metadataPath = encryptedPath + '.meta';
      let metadata = null;

      try {
        const metadataJson = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataJson);
      } catch (metaError) {
        console.warn('Could not read metadata:', metaError.message);
      }

      console.log('✅ Encrypted file retrieved successfully');

      return {
        success: true,
        fileId: fileId,
        fileName: file.original_name,
        encryptedBuffer: encryptedBuffer,
        fileType: file.file_type,
        metadata: metadata,
        message: 'Encrypted file retrieved successfully'
      };

    } catch (error) {
      console.error('❌ Get encrypted file failed:', error.message);
      throw new Error(`Get encrypted file failed: ${error.message}`);
    }
  }

  /**
   * Test encryption/decryption with a sample file
   * @returns {Object} - Test results
   */
  async testFileEncryption() {
    try {
      console.log('🧪 Testing file encryption/decryption...');

      // Create test data
      const testData = Buffer.from('This is a test file content for encryption testing!', 'utf8');
      const testFilePath = path.join(this.uploadsPath, 'test_file.txt');
      
      // Write test file
      await fs.writeFile(testFilePath, testData);

      // Test encryption
      const encryptionResult = this.encryption.encryptFile(testData);
      
      // Test decryption
      const decryptedData = this.encryption.decryptFile(
        encryptionResult.encrypted, 
        encryptionResult.metadata.iv
      );

      // Verify integrity
      const isValid = this.encryption.verifyIntegrity(testData, decryptedData);

      // Clean up test file
      try {
        await fs.unlink(testFilePath);
      } catch (cleanupError) {
        console.warn('Could not clean up test file:', cleanupError.message);
      }

      return {
        success: isValid,
        originalSize: testData.length,
        encryptedSize: encryptionResult.encrypted.length,
        decryptedSize: decryptedData.length,
        message: isValid ? 'File encryption test passed!' : 'File encryption test failed!'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Decrypt uploaded encrypted file
   * @param {Buffer} encryptedData - Encrypted file data
   * @param {string} fileName - Original filename
   * @param {string} originalFileName - Original file name (optional)
   * @param {string} customKey - Custom encryption key (optional)
   * @returns {Object} - Decryption result
   */
  async decryptUploadedFile(encryptedData, fileName, originalFileName, customKey) {
    try {
      console.log(`🔓 Starting decryption for uploaded file: ${fileName}`);

      // Extract original filename from .encrypted file
      let actualFileName = originalFileName;
      if (!actualFileName && fileName.endsWith('.encrypted')) {
        actualFileName = fileName.replace('.encrypted', '');
      }

      // Try to decrypt with current encryption settings
      // Note: This assumes the file was encrypted with the same settings
      // In a real system, you might want to store encryption metadata separately

      // For now, we'll try to extract IV from the beginning of the file
      // This is a simplified approach - in production, you'd want better metadata handling

      if (encryptedData.length < 16) {
        throw new Error('Encrypted file too small - missing IV data');
      }

      // Try to decrypt assuming standard format
      // Extract IV from the beginning of the file (first 16 bytes)
      try {
        if (encryptedData.length < 16) {
          throw new Error('File too small - missing IV data');
        }

        // Extract IV and encrypted data
        const ivBuffer = encryptedData.slice(0, 16);
        const actualEncryptedData = encryptedData.slice(16);
        const ivHex = ivBuffer.toString('hex');

        console.log(`🔑 Extracted IV: ${ivHex}`);
        console.log(`📁 Encrypted data size: ${actualEncryptedData.length} bytes`);

        // Decrypt using extracted IV
        const decryptedBuffer = this.encryption.decryptFile(actualEncryptedData, ivHex);

        console.log(`🔓 Decrypted uploaded file: ${decryptedBuffer.length} bytes`);

        // Generate temporary ID for download
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store temporarily (in production, use proper temp storage)
        const tempPath = path.join(__dirname, '../../temp');
        await fs.mkdir(tempPath, { recursive: true });

        const tempFilePath = path.join(tempPath, `${tempId}_${actualFileName}`);
        await fs.writeFile(tempFilePath, decryptedBuffer);

        // Store temp file info in memory (in production, use database or cache)
        if (!this.tempFiles) {
          this.tempFiles = new Map();
        }

        this.tempFiles.set(tempId, {
          filePath: tempFilePath,
          fileName: actualFileName,
          fileSize: decryptedBuffer.length,
          createdAt: new Date(),
          userId: null // Will be set by caller
        });

        // Clean up old temp files (older than 1 hour)
        this.cleanupTempFiles();

        console.log('✅ File decryption completed successfully');

        return {
          success: true,
          tempId: tempId,
          fileName: actualFileName,
          fileSize: decryptedBuffer.length,
          message: 'File decrypted successfully'
        };

      } catch (decryptError) {
        throw new Error(`Decryption failed: ${decryptError.message}. File may be corrupted or encrypted with different settings.`);
      }

    } catch (error) {
      console.error('❌ File decryption failed:', error.message);
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  /**
   * Get temporary decrypted file
   * @param {string} tempId - Temporary file ID
   * @param {number} userId - User ID
   * @returns {Object} - File data
   */
  async getTempDecryptedFile(tempId, userId) {
    try {
      if (!this.tempFiles || !this.tempFiles.has(tempId)) {
        throw new Error('Temporary file not found or expired');
      }

      const tempFileInfo = this.tempFiles.get(tempId);

      // Check if file exists
      const fileBuffer = await fs.readFile(tempFileInfo.filePath);

      // Clean up temp file after reading
      try {
        await fs.unlink(tempFileInfo.filePath);
        this.tempFiles.delete(tempId);
      } catch (cleanupError) {
        console.warn('Could not clean up temp file:', cleanupError.message);
      }

      return {
        success: true,
        fileName: tempFileInfo.fileName,
        fileBuffer: fileBuffer,
        fileSize: tempFileInfo.fileSize
      };

    } catch (error) {
      console.error('❌ Get temp file failed:', error.message);
      throw new Error(`Get temp file failed: ${error.message}`);
    }
  }

  /**
   * Clean up old temporary files
   */
  cleanupTempFiles() {
    if (!this.tempFiles) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [tempId, fileInfo] of this.tempFiles.entries()) {
      if (fileInfo.createdAt < oneHourAgo) {
        try {
          fs.unlink(fileInfo.filePath).catch(() => {}); // Ignore errors
          this.tempFiles.delete(tempId);
          console.log(`🧹 Cleaned up expired temp file: ${tempId}`);
        } catch (error) {
          console.warn('Could not clean up temp file:', error.message);
        }
      }
    }
  }

  /**
   * Get encryption service parameters
   * @returns {Object} - Encryption parameters
   */
  getEncryptionInfo() {
    return this.encryption.getParameters();
  }
}

module.exports = FileHandler;

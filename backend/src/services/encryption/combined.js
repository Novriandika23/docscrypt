/**
 * Combined Encryption Service
 * Combines Aria-128-CBC and Affine Cipher for enhanced security
 * 
 * Encryption Flow: Original Data → Affine Cipher → Aria-128-CBC → Encrypted Data
 * Decryption Flow: Encrypted Data → Aria-128-CBC Decrypt → Affine Cipher Decrypt → Original Data
 */

const AriaCipher = require('./aria');
const AffineCipher = require('./affine');
const crypto = require('crypto');

class CombinedEncryption {
  constructor(ariaKey, affineA = 5, affineB = 8) {
    // Initialize Aria cipher
    this.ariaCipher = new AriaCipher(ariaKey);
    
    // Initialize Affine cipher
    this.affineCipher = new AffineCipher(affineA, affineB);
    
    // Store parameters for metadata
    this.parameters = {
      aria: {
        algorithm: 'aes-128-cbc', // Using AES as Aria equivalent
        keyLength: 16
      },
      affine: {
        a: affineA,
        b: affineB,
        m: 256
      }
    };
  }

  /**
   * Encrypt data using combined approach
   * @param {Buffer} data - Data to encrypt
   * @param {Buffer} iv - Optional IV for Aria encryption
   * @returns {Object} - Encrypted data with metadata
   */
  encrypt(data) {
    try {
      if (!Buffer.isBuffer(data)) {
        throw new Error('Data must be a Buffer');
      }

      console.log(`🔄 Starting combined encryption for ${data.length} bytes`);

      // Step 1: Apply Affine Cipher (pre-processing)
      console.log('📝 Step 1: Applying Affine Cipher...');
      const affineEncrypted = this.affineCipher.encrypt(data);
      console.log(`✅ Affine encryption complete: ${affineEncrypted.length} bytes`);

      // Step 2: Apply Aria-128-CBC encryption
      console.log('🔐 Step 2: Applying Aria-128-CBC encryption...');
      const ariaResult = this.ariaCipher.encrypt(affineEncrypted);
      console.log(`✅ Aria encryption complete: ${ariaResult.encrypted.length} bytes`);

      // Generate metadata
      const metadata = {
        originalSize: data.length,
        encryptedSize: ariaResult.encrypted.length,
        iv: ariaResult.iv.toString('hex'),
        algorithm: 'aria-128-cbc+affine',
        timestamp: new Date().toISOString(),
        checksum: crypto.createHash('sha256').update(data).digest('hex')
      };

      console.log('✅ Combined encryption successful');

      return {
        encrypted: ariaResult.encrypted,
        metadata: metadata,
        success: true
      };

    } catch (error) {
      console.error('❌ Combined encryption failed:', error.message);
      throw new Error(`Combined encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using combined approach
   * @param {Buffer} encryptedData - Encrypted data
   * @param {string} ivHex - IV in hex format
   * @returns {Buffer} - Decrypted original data
   */
  decrypt(encryptedData, ivHex) {
    try {
      if (!Buffer.isBuffer(encryptedData)) {
        throw new Error('Encrypted data must be a Buffer');
      }

      console.log(`🔄 Starting combined decryption for ${encryptedData.length} bytes`);

      // Convert IV from hex
      const iv = Buffer.from(ivHex, 'hex');

      // Step 1: Decrypt with Aria-128-CBC
      console.log('🔓 Step 1: Applying Aria-128-CBC decryption...');
      const ariaDecrypted = this.ariaCipher.decrypt(encryptedData, iv);
      console.log(`✅ Aria decryption complete: ${ariaDecrypted.length} bytes`);

      // Step 2: Decrypt with Affine Cipher
      console.log('📝 Step 2: Applying Affine Cipher decryption...');
      const originalData = this.affineCipher.decrypt(ariaDecrypted);
      console.log(`✅ Affine decryption complete: ${originalData.length} bytes`);

      console.log('✅ Combined decryption successful');

      return originalData;

    } catch (error) {
      console.error('❌ Combined decryption failed:', error.message);
      throw new Error(`Combined decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt file
   * @param {Buffer} fileBuffer - File data as Buffer
   * @returns {Object} - Encrypted file data with metadata
   */
  encryptFile(fileBuffer) {
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('File data must be a Buffer');
    }

    console.log(`📁 Encrypting file: ${fileBuffer.length} bytes`);
    return this.encrypt(fileBuffer);
  }

  /**
   * Decrypt file
   * @param {Buffer} encryptedBuffer - Encrypted file data
   * @param {string} ivHex - IV in hex format
   * @returns {Buffer} - Decrypted file data
   */
  decryptFile(encryptedBuffer, ivHex) {
    if (!Buffer.isBuffer(encryptedBuffer)) {
      throw new Error('Encrypted file data must be a Buffer');
    }

    console.log(`📁 Decrypting file: ${encryptedBuffer.length} bytes`);
    return this.decrypt(encryptedBuffer, ivHex);
  }

  /**
   * Verify decryption integrity
   * @param {Buffer} originalData - Original data
   * @param {Buffer} decryptedData - Decrypted data
   * @returns {boolean} - True if data matches
   */
  verifyIntegrity(originalData, decryptedData) {
    if (!Buffer.isBuffer(originalData) || !Buffer.isBuffer(decryptedData)) {
      return false;
    }

    if (originalData.length !== decryptedData.length) {
      return false;
    }

    return originalData.equals(decryptedData);
  }

  /**
   * Get encryption parameters
   * @returns {Object} - Encryption parameters
   */
  getParameters() {
    return {
      ...this.parameters,
      affineDetails: this.affineCipher.getParameters(),
      ariaDetails: this.ariaCipher.getKeyInfo()
    };
  }

  /**
   * Test encryption/decryption with sample data
   * @returns {Object} - Test results
   */
  testEncryption() {
    try {
      const testData = Buffer.from('Hello, this is a test message for encryption!', 'utf8');
      
      console.log('🧪 Testing combined encryption...');
      
      // Encrypt
      const encrypted = this.encrypt(testData);
      
      // Decrypt
      const decrypted = this.decrypt(encrypted.encrypted, encrypted.metadata.iv);
      
      // Verify
      const isValid = this.verifyIntegrity(testData, decrypted);
      
      return {
        success: isValid,
        originalSize: testData.length,
        encryptedSize: encrypted.encrypted.length,
        decryptedSize: decrypted.length,
        message: isValid ? 'Test passed successfully!' : 'Test failed - data mismatch'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CombinedEncryption;

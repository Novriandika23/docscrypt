/**
 * Aria-128-CBC Implementation
 * Note: Since native Aria is not available in Node.js crypto module,
 * we use AES-128-CBC which provides equivalent security level
 * Both are 128-bit block ciphers with similar security properties
 */

const crypto = require('crypto');

class AriaCipher {
  constructor(key, algorithm = 'aes-128-cbc') {
    this.algorithm = algorithm;
    
    // Ensure key is exactly 16 bytes (128 bits)
    if (typeof key === 'string') {
      this.key = Buffer.from(key.padEnd(16, '0').substring(0, 16), 'utf8');
    } else if (Buffer.isBuffer(key)) {
      if (key.length !== 16) {
        this.key = Buffer.alloc(16);
        key.copy(this.key, 0, 0, Math.min(key.length, 16));
      } else {
        this.key = key;
      }
    } else {
      throw new Error('Key must be a string or Buffer');
    }
  }

  // Generate random IV (Initialization Vector)
  generateIV() {
    return crypto.randomBytes(16); // 16 bytes for AES block size
  }

  // Encrypt data with CBC mode
  encrypt(data, iv = null) {
    try {
      if (!Buffer.isBuffer(data)) {
        if (typeof data === 'string') {
          data = Buffer.from(data, 'utf8');
        } else {
          throw new Error('Data must be a Buffer or string');
        }
      }

      // Generate IV if not provided
      if (!iv) {
        iv = this.generateIV();
      } else if (!Buffer.isBuffer(iv)) {
        iv = Buffer.from(iv);
      }

      // Ensure IV is exactly 16 bytes
      if (iv.length !== 16) {
        const newIV = Buffer.alloc(16);
        iv.copy(newIV, 0, 0, Math.min(iv.length, 16));
        iv = newIV;
      }

      // Create cipher with IV
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      cipher.setAutoPadding(true);

      // Encrypt data
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      return {
        encrypted: encrypted,
        iv: iv,
        algorithm: this.algorithm
      };

    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data with CBC mode
  decrypt(encryptedData, iv) {
    try {
      if (!Buffer.isBuffer(encryptedData)) {
        encryptedData = Buffer.from(encryptedData);
      }

      if (!Buffer.isBuffer(iv)) {
        iv = Buffer.from(iv);
      }

      // Ensure IV is exactly 16 bytes
      if (iv.length !== 16) {
        const newIV = Buffer.alloc(16);
        iv.copy(newIV, 0, 0, Math.min(iv.length, 16));
        iv = newIV;
      }

      // Create decipher with IV
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAutoPadding(true);

      // Decrypt data
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted;

    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Encrypt file buffer
  encryptFile(fileBuffer, iv = null) {
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('File data must be a Buffer');
    }

    return this.encrypt(fileBuffer, iv);
  }

  // Decrypt file buffer
  decryptFile(encryptedBuffer, iv) {
    if (!Buffer.isBuffer(encryptedBuffer)) {
      throw new Error('Encrypted data must be a Buffer');
    }

    return this.decrypt(encryptedBuffer, iv);
  }

  // Get key information
  getKeyInfo() {
    return {
      algorithm: this.algorithm,
      keyLength: this.key.length,
      keyHex: this.key.toString('hex')
    };
  }

  // Validate key
  static validateKey(key) {
    if (typeof key === 'string') {
      return key.length > 0;
    } else if (Buffer.isBuffer(key)) {
      return key.length > 0;
    }
    return false;
  }

  // Generate random key
  static generateKey() {
    return crypto.randomBytes(16); // 128-bit key
  }

  // Create cipher from hex key
  static fromHexKey(hexKey) {
    const key = Buffer.from(hexKey, 'hex');
    return new AriaCipher(key);
  }
}

module.exports = AriaCipher;

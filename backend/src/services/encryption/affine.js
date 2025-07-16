/**
 * Affine Cipher Implementation
 * Formula: E(x) = (ax + b) mod m
 * Decryption: D(y) = a^(-1)(y - b) mod m
 */

class AffineCipher {
  constructor(a = 5, b = 8, m = 256) {
    this.a = a;
    this.b = b;
    this.m = m;
    
    // Validate that 'a' and 'm' are coprime
    if (this.gcd(a, m) !== 1) {
      throw new Error(`'a' (${a}) and 'm' (${m}) must be coprime for Affine cipher`);
    }
    
    this.aInverse = this.modInverse(a, m);
  }

  // Greatest Common Divisor
  gcd(a, b) {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  // Extended Euclidean Algorithm to find modular inverse
  extendedGcd(a, b) {
    if (a === 0) {
      return [b, 0, 1];
    }
    
    const [gcd, x1, y1] = this.extendedGcd(b % a, a);
    const x = y1 - Math.floor(b / a) * x1;
    const y = x1;
    
    return [gcd, x, y];
  }

  // Find modular inverse of 'a' modulo 'm'
  modInverse(a, m) {
    const [gcd, x] = this.extendedGcd(a, m);
    
    if (gcd !== 1) {
      throw new Error(`Modular inverse of ${a} modulo ${m} does not exist`);
    }
    
    return ((x % m) + m) % m;
  }

  // Encrypt a single byte
  encryptByte(byte) {
    return (this.a * byte + this.b) % this.m;
  }

  // Decrypt a single byte
  decryptByte(byte) {
    return (this.aInverse * (byte - this.b + this.m)) % this.m;
  }

  // Encrypt buffer
  encrypt(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Input must be a Buffer');
    }
    
    const encrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      encrypted[i] = this.encryptByte(buffer[i]);
    }
    
    return encrypted;
  }

  // Decrypt buffer
  decrypt(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Input must be a Buffer');
    }
    
    const decrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      decrypted[i] = this.decryptByte(buffer[i]);
    }
    
    return decrypted;
  }

  // Get cipher parameters
  getParameters() {
    return {
      a: this.a,
      b: this.b,
      m: this.m,
      aInverse: this.aInverse
    };
  }

  // Validate parameters
  static validateParameters(a, b, m = 256) {
    if (typeof a !== 'number' || typeof b !== 'number' || typeof m !== 'number') {
      throw new Error('Parameters must be numbers');
    }
    
    if (a <= 0 || b < 0 || m <= 0) {
      throw new Error('Parameters must be positive (a > 0, b >= 0, m > 0)');
    }
    
    // Check if a and m are coprime
    const gcd = (a, b) => {
      while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
      }
      return a;
    };
    
    if (gcd(a, m) !== 1) {
      throw new Error(`'a' (${a}) and 'm' (${m}) must be coprime`);
    }
    
    return true;
  }
}

module.exports = AffineCipher;

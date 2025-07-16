const Joi = require('joi');
const { authenticate } = require('../utils/auth');
const { pool } = require('../config/database');
const FileHandler = require('../services/fileHandler');

const encryptionRoutes = {
  name: 'encryption-routes',
  version: '1.0.0',
  register: async (server, options) => {

    // Initialize file handler
    const fileHandler = new FileHandler();

    // Test encryption endpoint
    server.route({
      method: 'GET',
      path: '/test',
      handler: async (request, h) => {
        try {
          const testResult = await fileHandler.testFileEncryption();
          return h.response({
            success: testResult.success,
            message: 'Encryption test completed',
            results: testResult
          }).code(200);
        } catch (error) {
          return h.response({
            error: true,
            message: 'Test failed',
            details: error.message
          }).code(500);
        }
      }
    });

    // Get encryption info
    server.route({
      method: 'GET',
      path: '/info',
      handler: (request, h) => {
        const info = fileHandler.getEncryptionInfo();
        return h.response({
          success: true,
          encryptionInfo: info
        }).code(200);
      }
    });

    // Encrypt file
    server.route({
      method: 'POST',
      path: '/encrypt/{fileId}',
      options: {
        pre: [{ method: authenticate }],
        validate: {
          params: Joi.object({
            fileId: Joi.number().integer().positive().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const fileId = request.params.fileId;
          const userId = request.auth.user.userId;

          console.log(`🔐 Encryption request for file ${fileId} by user ${userId}`);

          // Use file handler to encrypt
          const result = await fileHandler.encryptFile(fileId, userId);

          return h.response({
            success: true,
            message: result.message,
            fileId: result.fileId,
            metadata: result.metadata
          }).code(200);

        } catch (error) {
          console.error('Encryption error:', error);
          return h.response({
            error: true,
            message: error.message
          }).code(500);
        }
      }
    });

    // Decrypt file
    server.route({
      method: 'POST',
      path: '/decrypt/{fileId}',
      options: {
        pre: [{ method: authenticate }],
        validate: {
          params: Joi.object({
            fileId: Joi.number().integer().positive().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const fileId = request.params.fileId;
          const userId = request.auth.user.userId;

          console.log(`🔓 Decryption request for file ${fileId} by user ${userId}`);

          // Use file handler to decrypt
          const result = await fileHandler.decryptFile(fileId, userId);

          return h.response({
            success: true,
            message: result.message,
            fileId: result.fileId,
            fileName: result.fileName,
            fileType: result.fileType,
            fileSize: result.fileBuffer.length,
            metadata: result.metadata
          }).code(200);

        } catch (error) {
          console.error('Decryption error:', error);
          return h.response({
            error: true,
            message: error.message
          }).code(500);
        }
      }
    });

    // Download decrypted file
    server.route({
      method: 'GET',
      path: '/download/{fileId}',
      options: {
        pre: [{ method: authenticate }],
        validate: {
          params: Joi.object({
            fileId: Joi.number().integer().positive().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const fileId = request.params.fileId;
          const userId = request.auth.user.userId;

          console.log(`📥 Download request for file ${fileId} by user ${userId}`);

          // Decrypt file first
          const result = await fileHandler.decryptFile(fileId, userId);

          // Set appropriate headers for file download
          const response = h.response(result.fileBuffer);
          response.header('Content-Type', 'application/octet-stream');
          response.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
          response.header('Content-Length', result.fileBuffer.length);

          return response;

        } catch (error) {
          console.error('Download error:', error);
          return h.response({
            error: true,
            message: error.message
          }).code(500);
        }
      }
    });

    // Download encrypted file (raw encrypted data)
    server.route({
      method: 'GET',
      path: '/download-encrypted/{fileId}',
      options: {
        pre: [{ method: authenticate }],
        validate: {
          params: Joi.object({
            fileId: Joi.number().integer().positive().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const fileId = request.params.fileId;
          const userId = request.auth.user.userId;

          console.log(`🔒 Download encrypted request for file ${fileId} by user ${userId}`);

          // Get encrypted file directly (without decryption)
          const result = await fileHandler.getEncryptedFile(fileId, userId);

          // Set appropriate headers for encrypted file download
          const response = h.response(result.encryptedBuffer);
          response.header('Content-Type', 'application/octet-stream');
          response.header('Content-Disposition', `attachment; filename="${result.fileName}.encrypted"`);
          response.header('Content-Length', result.encryptedBuffer.length);

          return response;

        } catch (error) {
          console.error('Download encrypted error:', error);
          return h.response({
            error: true,
            message: error.message
          }).code(500);
        }
      }
    });

    // Upload and decrypt encrypted file
    server.route({
      method: 'POST',
      path: '/decrypt-upload',
      options: {
        pre: [{ method: authenticate }],
        payload: {
          output: 'data',
          parse: true,
          multipart: true,
          maxBytes: 50 * 1024 * 1024, // 50MB limit
        },
        validate: {
          payload: Joi.object({
            file: Joi.any().required().description('Encrypted file to decrypt'),
            originalFileName: Joi.string().optional().description('Original file name'),
            encryptionKey: Joi.string().optional().description('Custom encryption key (if different)')
          })
        }
      },
      handler: async (request, h) => {
        try {
          const userId = request.auth.user.userId;
          const { file, originalFileName, encryptionKey } = request.payload;

          console.log(`🔓 Decrypt upload request by user ${userId}`);
          console.log('Payload keys:', Object.keys(request.payload));
          console.log('File info:', file ? {
            filename: file.hapi?.filename,
            bytes: file.bytes,
            hasData: !!file._data
          } : 'No file');

          if (!file) {
            return h.response({
              error: true,
              message: 'No file provided'
            }).code(400);
          }

          // Get file data - Hapi.js stores it differently
          let fileData;
          if (file._data) {
            fileData = file._data;
          } else if (Buffer.isBuffer(file)) {
            fileData = file;
          } else {
            return h.response({
              error: true,
              message: 'Invalid file data format'
            }).code(400);
          }

          // Validate file extension
          const fileName = file.hapi?.filename || 'unknown.encrypted';
          if (!fileName.endsWith('.encrypted')) {
            return h.response({
              error: true,
              message: 'Only .encrypted files are allowed for decryption'
            }).code(400);
          }

          console.log(`📁 Processing file: ${fileName}, size: ${fileData.length} bytes`);

          // Use file handler to decrypt uploaded encrypted file
          const result = await fileHandler.decryptUploadedFile(
            fileData,
            fileName,
            originalFileName,
            encryptionKey
          );

          return h.response({
            success: true,
            message: 'File decrypted successfully',
            fileName: result.fileName,
            fileSize: result.fileSize,
            downloadUrl: `/api/encryption/download-decrypted/${result.tempId}`
          }).code(200);

        } catch (error) {
          console.error('Decrypt upload error:', error);
          return h.response({
            error: true,
            message: error.message
          }).code(500);
        }
      }
    });

    // Download decrypted file from upload
    server.route({
      method: 'GET',
      path: '/download-decrypted/{tempId}',
      options: {
        pre: [{ method: authenticate }],
        validate: {
          params: Joi.object({
            tempId: Joi.string().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const { tempId } = request.params;
          const userId = request.auth.user.userId;

          console.log(`📥 Download decrypted temp file ${tempId} by user ${userId}`);

          // Get temporary decrypted file
          const result = await fileHandler.getTempDecryptedFile(tempId, userId);

          // Set appropriate headers for file download
          const response = h.response(result.fileBuffer);
          response.header('Content-Type', 'application/octet-stream');
          response.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
          response.header('Content-Length', result.fileBuffer.length);

          return response;

        } catch (error) {
          console.error('Download decrypted temp error:', error);
          return h.response({
            error: true,
            message: error.message
          }).code(500);
        }
      }
    });
  }
};

module.exports = encryptionRoutes;

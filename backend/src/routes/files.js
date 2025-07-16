const Joi = require('joi');
const Path = require('path');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const { pool } = require('../config/database');
const { authenticate } = require('../utils/auth');

// File validation helper
const validateFileType = (filename) => {
  const allowedTypes = ['.docx', '.xlsx'];
  const fileExtension = Path.extname(filename).toLowerCase();
  return allowedTypes.includes(fileExtension);
};

const fileRoutes = {
  name: 'file-routes',
  version: '1.0.0',
  register: async (server, options) => {
    
    // Upload file
    server.route({
      method: 'POST',
      path: '/upload',
      options: {
        pre: [{ method: authenticate }],
        payload: {
          output: 'stream',
          parse: true,
          multipart: true,
          maxBytes: 50 * 1024 * 1024 // 50MB
        }
      },
      handler: async (request, h) => {
        try {
          const data = request.payload;

          if (!data.file) {
            return h.response({
              error: true,
              message: 'No file uploaded'
            }).code(400);
          }

          // Validate file type
          if (!validateFileType(data.file.hapi.filename)) {
            return h.response({
              error: true,
              message: 'Only Word (.docx) and Excel (.xlsx) files are allowed'
            }).code(400);
          }

          const fileExtension = Path.extname(data.file.hapi.filename).toLowerCase();

          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `upload-${uniqueSuffix}${fileExtension}`;
          const uploadPath = Path.join(__dirname, '../../uploads/', filename);

          // Read file data from Hapi stream
          const fileData = data.file._data;

          // Save file
          await fsPromises.writeFile(uploadPath, fileData);

          // Calculate file hash
          const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');

          // Get file stats
          const stats = await fsPromises.stat(uploadPath);
          
          // Save file metadata to database
          const [result] = await pool.execute(
            `INSERT INTO files (user_id, original_name, encrypted_name, file_type, file_size, file_hash, storage_path, is_encrypted) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              request.auth.user.userId,
              data.file.hapi.filename,
              filename,
              fileExtension.replace('.', ''),
              stats.size,
              fileHash,
              uploadPath,
              false // Not encrypted yet
            ]
          );
          
          return h.response({
            success: true,
            message: 'File uploaded successfully',
            file: {
              id: result.insertId,
              originalName: data.file.hapi.filename,
              filename: filename,
              size: stats.size,
              type: fileExtension.replace('.', ''),
              hash: fileHash,
              uploadedAt: new Date().toISOString()
            }
          }).code(201);
          
        } catch (error) {
          console.error('Upload error:', error);
          return h.response({
            error: true,
            message: 'Failed to upload file'
          }).code(500);
        }
      }
    });

    // Get user files
    server.route({
      method: 'GET',
      path: '/list',
      options: {
        pre: [{ method: authenticate }]
      },
      handler: async (request, h) => {
        try {
          const [files] = await pool.execute(
            `SELECT id, original_name, encrypted_name, file_type, file_size, 
                    is_encrypted, created_at, updated_at 
             FROM files 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [request.auth.user.userId]
          );
          
          return h.response({
            success: true,
            files: files
          }).code(200);
          
        } catch (error) {
          console.error('List files error:', error);
          return h.response({
            error: true,
            message: 'Failed to retrieve files'
          }).code(500);
        }
      }
    });

    // Delete file
    server.route({
      method: 'DELETE',
      path: '/{fileId}',
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
          
          // Get file info
          const [files] = await pool.execute(
            'SELECT storage_path FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
          );
          
          if (files.length === 0) {
            return h.response({
              error: true,
              message: 'File not found'
            }).code(404);
          }
          
          // Delete physical file
          try {
            await fsPromises.unlink(files[0].storage_path);
          } catch (fsError) {
            console.warn('File already deleted from filesystem:', fsError.message);
          }
          
          // Delete from database
          await pool.execute(
            'DELETE FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
          );
          
          return h.response({
            success: true,
            message: 'File deleted successfully'
          }).code(200);
          
        } catch (error) {
          console.error('Delete file error:', error);
          return h.response({
            error: true,
            message: 'Failed to delete file'
          }).code(500);
        }
      }
    });
  }
};

module.exports = fileRoutes;

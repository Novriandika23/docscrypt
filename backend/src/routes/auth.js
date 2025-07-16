const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authRoutes = {
  name: 'auth-routes',
  version: '1.0.0',
  register: async (server, options) => {
    
    // Register user
    server.route({
      method: 'POST',
      path: '/register',
      options: {
        validate: {
          payload: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const { username, email, password } = request.payload;
          
          // Check if user already exists
          const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
          );
          
          if (existingUsers.length > 0) {
            return h.response({
              error: true,
              message: 'Username or email already exists'
            }).code(400);
          }
          
          // Hash password
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(password, saltRounds);
          
          // Insert new user
          const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
          );
          
          return h.response({
            success: true,
            message: 'User registered successfully',
            userId: result.insertId
          }).code(201);
          
        } catch (error) {
          console.error('Registration error:', error);
          return h.response({
            error: true,
            message: 'Internal server error'
          }).code(500);
        }
      }
    });

    // Login user
    server.route({
      method: 'POST',
      path: '/login',
      options: {
        validate: {
          payload: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const { username, password } = request.payload;
          
          // Find user
          const [users] = await pool.execute(
            'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
            [username, username]
          );
          
          if (users.length === 0) {
            return h.response({
              error: true,
              message: 'Invalid credentials'
            }).code(401);
          }
          
          const user = users[0];
          
          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password_hash);
          
          if (!isValidPassword) {
            return h.response({
              error: true,
              message: 'Invalid credentials'
            }).code(401);
          }
          
          // Generate JWT token
          const token = jwt.sign(
            { 
              userId: user.id, 
              username: user.username,
              email: user.email 
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
          );
          
          return h.response({
            success: true,
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          }).code(200);
          
        } catch (error) {
          console.error('Login error:', error);
          return h.response({
            error: true,
            message: 'Internal server error'
          }).code(500);
        }
      }
    });

    // Verify token middleware
    server.route({
      method: 'GET',
      path: '/verify',
      options: {
        validate: {
          headers: Joi.object({
            authorization: Joi.string().required()
          }).unknown()
        }
      },
      handler: async (request, h) => {
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
          
          if (!token) {
            return h.response({
              error: true,
              message: 'No token provided'
            }).code(401);
          }
          
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
          
          return h.response({
            success: true,
            user: decoded
          }).code(200);
          
        } catch (error) {
          return h.response({
            error: true,
            message: 'Invalid token'
          }).code(401);
        }
      }
    });
  }
};

module.exports = authRoutes;

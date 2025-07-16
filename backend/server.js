const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Path = require('path');
require('dotenv').config();

const { testConnection, initializeTables } = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const fileRoutes = require('./src/routes/files');
const encryptionRoutes = require('./src/routes/encryption');

const init = async () => {
  // Create Hapi server
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'], 
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      },
      files: {
        relativeTo: Path.join(__dirname, 'uploads')
      }
    }
  });

  // Register plugins
  await server.register([
    Inert,
    Vision
  ]);

  // Register routes
  server.route([
    // Health check
    {
      method: 'GET',
      path: '/',
      handler: (request, h) => {
        return {
          message: 'Kripto Grafi API Server is running!',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
      }
    },
    
    // Static file serving for uploads
    {
      method: 'GET',
      path: '/uploads/{param*}',
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true
        }
      }
    }
  ]);

  // Register route modules
  try {
    await server.register(authRoutes, { routes: { prefix: '/api/auth' } });
    console.log('✅ Auth routes registered');

    await server.register(fileRoutes, { routes: { prefix: '/api/files' } });
    console.log('✅ File routes registered');

    await server.register(encryptionRoutes, { routes: { prefix: '/api/encryption' } });
    console.log('✅ Encryption routes registered');
  } catch (error) {
    console.error('❌ Failed to register routes:', error);
    throw error;
  }

  // Error handling
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    
    if (response.isBoom) {
      console.error('Error:', response.output.payload);
      
      return h.response({
        error: true,
        message: response.output.payload.message,
        statusCode: response.output.statusCode
      }).code(response.output.statusCode);
    }
    
    return h.continue;
  });

  // Test database connection and initialize tables
  console.log('🔄 Testing database connection...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    console.log('🔄 Initializing database tables...');
    await initializeTables();
  } else {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  // Start server
  await server.start();
  console.log(`🚀 Server running on ${server.info.uri}`);
  console.log(`📁 Upload directory: ${Path.join(__dirname, 'uploads')}`);
  
  return server;
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// Start server
init().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { init };

const jwt = require('jsonwebtoken');

// JWT Authentication middleware
const authenticate = (request, h) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return h.response({
        error: true,
        message: 'No token provided'
      }).code(401).takeover();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    request.auth = { user: decoded };
    
    return h.continue;
  } catch (error) {
    return h.response({
      error: true,
      message: 'Invalid token'
    }).code(401).takeover();
  }
};

module.exports = {
  authenticate
};

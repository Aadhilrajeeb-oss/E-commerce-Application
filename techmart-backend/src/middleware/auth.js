const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return error(res, 'Access Denied: No Token Provided', 401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return error(res, 'Access Denied: Invalid Token', 403);
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, 'Access Denied: Insufficient Permissions', 403);
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };

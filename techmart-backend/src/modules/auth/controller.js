const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const redisClient = require('../../config/redis');
const { success, error } = require('../../utils/apiResponse');

const generateTokens = (user) => {
  const payload = { id: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return error(res, 'User already exists', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role || 'staff']
    );

    return success(res, newUser.rows[0], 'User registered successfully', 201);
  } catch (err) {
    return error(res, 'Error registering user', 500, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    return success(res, { accessToken, user: userData }, 'Login successful');
  } catch (err) {
    return error(res, 'Error logging in', 500, err.message);
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return error(res, 'No refresh token provided', 401);

    // Check if blacklisted
    const isBlacklisted = await redisClient.get(`bl_${refreshToken}`);
    if (isBlacklisted) return error(res, 'Token is blacklisted', 403);

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return error(res, 'Invalid refresh token', 403);

      const payload = { id: decoded.id, role: decoded.role };
      const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
      
      return success(res, { accessToken: newAccessToken }, 'Token refreshed');
    });
  } catch (err) {
    return error(res, 'Error refreshing token', 500, err.message);
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      // Decode to get exp time
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await redisClient.setEx(`bl_${refreshToken}`, expiresIn, 'true');
        }
      }
    }
    
    res.clearCookie('refreshToken');
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    return error(res, 'Error logging out', 500, err.message);
  }
};

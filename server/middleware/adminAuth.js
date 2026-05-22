const jwt = require('jsonwebtoken');
const store = require('../store');

const JWT_SECRET = process.env.JWT_SECRET || 'offerforge-admin-secret-key-2026';
const ADMIN_TOKEN_EXPIRY = '12h';

function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ADMIN_TOKEN_EXPIRY });
}

function verifyAdminToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function adminAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.slice(7);
    const decoded = verifyAdminToken(token);
    const { adminId } = decoded;

    const admin = store.findAdminById(adminId);
    if (!admin) {
      return res.status(401).json({ error: '管理员账号不存在' });
    }
    if (admin.status !== 1) {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ error: '认证失败' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

module.exports = { signAdminToken, verifyAdminToken, adminAuthMiddleware, requireRole, JWT_SECRET };

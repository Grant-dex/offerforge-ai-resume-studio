const express = require('express');
const bcrypt = require('bcrypt');
const store = require('../../store');
const { signAdminToken, adminAuthMiddleware } = require('../../middleware/adminAuth');
const { logAction } = require('../../utils/adminLog');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const admin = store.findAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    store.updateAdmin(admin.id, { last_login_at: new Date().toISOString() });

    const token = signAdminToken({ adminId: admin.id, role: admin.role });
    await logAction(admin.id, 'admin_login', 'admin', admin.id, null, req.ip);

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/admin/me
router.get('/me', adminAuthMiddleware, async (req, res) => {
  try {
    const admin = store.findAdminById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: '管理员不存在' });
    }
    const { password_hash, ...rest } = admin;
    res.json(rest);
  } catch (err) {
    console.error('Admin me error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/admin/change-password
router.put('/change-password', adminAuthMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少 6 位' });
    }

    const admin = store.findAdminById(req.admin.id);
    const valid = await bcrypt.compare(oldPassword, admin.password_hash);
    if (!valid) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    store.updateAdmin(req.admin.id, { password_hash: hash });

    await logAction(req.admin.id, 'change_password', 'admin', req.admin.id, null, req.ip);
    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/admin/admins — list admins (super_admin only)
router.get('/admins', adminAuthMiddleware, async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足' });
  }
  try {
    res.json(store.listAdmins());
  } catch (err) {
    console.error('List admins error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/admin/admins — create admin (super_admin only)
router.post('/admins', adminAuthMiddleware, async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足' });
  }
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    const existing = store.findAdminByUsername(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    const hash = await bcrypt.hash(password, 10);
    const admin = store.createAdmin(username, hash, role || 'admin');
    await logAction(req.admin.id, 'create_admin', 'admin', admin.id, { username, role }, req.ip);
    res.json({ id: admin.id, message: '管理员创建成功' });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/admin/admins/:id/status — toggle admin status
router.put('/admins/:id/status', adminAuthMiddleware, async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足' });
  }
  try {
    const { status } = req.body;
    store.updateAdmin(parseInt(req.params.id), { status });
    await logAction(req.admin.id, 'toggle_admin', 'admin', parseInt(req.params.id), { status }, req.ip);
    res.json({ message: '状态已更新' });
  } catch (err) {
    console.error('Toggle admin error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;

const express = require('express');
const store = require('../../store');
const { adminAuthMiddleware } = require('../../middleware/adminAuth');
const { logAction } = require('../../utils/adminLog');

const router = express.Router();

// GET /api/admin/users
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const result = store.listUsers({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      search: req.query.search || '',
      isPro: req.query.isPro,
      status: req.query.status,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    });
    res.json(result);
  } catch (err) {
    console.error('User list error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/admin/users/:id
router.get('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const user = store.getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    console.error('User detail error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/:id/status', adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = parseInt(req.params.id);
    store.updateUser(userId, { status });
    await logAction(req.admin.id, status === 1 ? 'enable_user' : 'disable_user', 'user', userId, { status }, req.ip);
    res.json({ message: status === 1 ? '用户已启用' : '用户已禁用' });
  } catch (err) {
    console.error('User status error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /api/admin/users/:id/pro
router.put('/:id/pro', adminAuthMiddleware, async (req, res) => {
  try {
    const { isPro, proExpiresAt } = req.body;
    const userId = parseInt(req.params.id);
    store.updateUser(userId, { is_pro: isPro ? 1 : 0, pro_expires_at: proExpiresAt || null });
    await logAction(req.admin.id, isPro ? 'grant_pro' : 'revoke_pro', 'user', userId, { isPro, proExpiresAt }, req.ip);
    res.json({ message: isPro ? 'Pro 已开通' : 'Pro 已取消' });
  } catch (err) {
    console.error('User Pro error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    if (req.admin.role === 'viewer') {
      return res.status(403).json({ error: '权限不足' });
    }
    const userId = parseInt(req.params.id);
    store.updateUser(userId, { status: -1 });
    await logAction(req.admin.id, 'delete_user', 'user', userId, null, req.ip);
    res.json({ message: '用户已删除' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;

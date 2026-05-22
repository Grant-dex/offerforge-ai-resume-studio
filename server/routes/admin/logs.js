const express = require('express');
const store = require('../../store');
const { adminAuthMiddleware } = require('../../middleware/adminAuth');

const router = express.Router();

// GET /api/admin/logs
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const result = store.listLogs({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      adminId: req.query.adminId ? parseInt(req.query.adminId) : undefined,
      action: req.query.action || undefined
    });

    // Attach admin names
    const list = result.list.map(log => {
      const admin = store.findAdminById(log.admin_id);
      return { ...log, admin_name: admin ? admin.username : `ID:${log.admin_id}` };
    });

    res.json({ ...result, list });
  } catch (err) {
    console.error('Logs list error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /api/admin/logs/actions
router.get('/actions', adminAuthMiddleware, async (req, res) => {
  try {
    const { list } = store.listLogs({ pageSize: 99999 });
    const actions = [...new Set(list.map(l => l.action))].sort();
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;

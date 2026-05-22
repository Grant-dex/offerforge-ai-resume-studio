const express = require('express');
const store = require('../../store');
const { adminAuthMiddleware } = require('../../middleware/adminAuth');

const router = express.Router();

router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const allUsers = store.listUsers({ pageSize: 99999 }).list;
    const today = new Date().toISOString().slice(0, 10);

    const totalUsers = allUsers.length;
    const todayNew = allUsers.filter(u => u.created_at && u.created_at.slice(0, 10) === today).length;
    const proUsers = allUsers.filter(u => u.is_pro === 1).length;
    const activeToday = allUsers.filter(u => u.last_login_at && u.last_login_at.slice(0, 10) === today).length;
    const totalLogins = allUsers.reduce((sum, u) => sum + (u.login_count || 0), 0);

    // New users trend (last 7 days)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      trend.push({ date: ds, count: allUsers.filter(u => u.created_at && u.created_at.slice(0, 10) === ds).length });
    }

    const proExpiring = allUsers.filter(u => {
      if (!u.is_pro || !u.pro_expires_at) return false;
      const exp = new Date(u.pro_expires_at);
      const now = new Date();
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;

    const logs = store.listLogs({ pageSize: 99999 }).list;
    const aiTotal = logs.filter(l => l.action && l.action.startsWith('ai_')).length;
    const aiToday = logs.filter(l => l.action && l.action.startsWith('ai_') && l.created_at && l.created_at.slice(0, 10) === today).length;

    res.json({
      totalUsers,
      todayNewUsers: todayNew,
      proUsers,
      activeToday,
      totalLogins,
      newUsersTrend: trend,
      aiToday,
      aiTotal,
      proExpiringSoon: proExpiring
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;

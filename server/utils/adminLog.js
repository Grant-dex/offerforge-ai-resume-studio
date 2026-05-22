const store = require('../store');

function logAction(adminId, action, targetType = null, targetId = null, detail = null, ip = null) {
  try {
    store.addLog({ admin_id: adminId, action, target_type: targetType, target_id: targetId, detail, ip });
  } catch (err) {
    console.error('Log action error:', err);
  }
}

module.exports = { logAction };

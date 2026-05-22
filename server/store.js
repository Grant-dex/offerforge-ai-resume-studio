const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'admin.json');

const defaultData = {
  admins: [
    {
      id: 1,
      username: 'admin',
      password_hash: '', // will be set on first start
      role: 'super_admin',
      status: 1,
      last_login_at: null,
      created_at: new Date().toISOString()
    }
  ],
  users: [],
  logs: [],
  nextUserId: 1,
  nextLogId: 1
};

let data = null;

function load() {
  if (data) return data;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } else {
      data = { ...defaultData };
      save();
    }
  } catch {
    data = { ...defaultData };
    save();
  }
  return data;
}

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== Admin operations =====
function findAdminByUsername(username) {
  return load().admins.find(a => a.username === username && a.status === 1) || null;
}

function findAdminById(id) {
  return load().admins.find(a => a.id === id) || null;
}

function updateAdmin(id, updates) {
  const db = load();
  const idx = db.admins.findIndex(a => a.id === id);
  if (idx >= 0) {
    Object.assign(db.admins[idx], updates);
    db.admins[idx].updated_at = new Date().toISOString();
    save();
  }
}

function listAdmins() {
  return load().admins.map(a => ({ ...a, password_hash: undefined }));
}

function createAdmin(username, passwordHash, role = 'admin') {
  const db = load();
  const id = Math.max(0, ...db.admins.map(a => a.id)) + 1;
  const admin = {
    id,
    username,
    password_hash: passwordHash,
    role,
    status: 1,
    last_login_at: null,
    created_at: new Date().toISOString()
  };
  db.admins.push(admin);
  save();
  return { ...admin, password_hash: undefined };
}

// ===== User operations =====
function listUsers({ page = 1, pageSize = 20, search = '', isPro, status, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
  const db = load();
  let users = [...db.users];

  if (search) {
    const s = search.toLowerCase();
    users = users.filter(u =>
      (u.nickname && u.nickname.toLowerCase().includes(s)) ||
      (u.phone && u.phone.includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s))
    );
  }
  if (isPro !== undefined && isPro !== '') users = users.filter(u => u.is_pro === parseInt(isPro));
  if (status !== undefined && status !== '') users = users.filter(u => u.status === parseInt(status));

  users.sort((a, b) => {
    const va = a[sortBy] || '', vb = b[sortBy] || '';
    if (sortOrder === 'ASC') return va > vb ? 1 : -1;
    return va < vb ? 1 : -1;
  });

  const total = users.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, list: users.slice(start, start + pageSize) };
}

function getUserById(id) {
  return load().users.find(u => u.id === id) || null;
}

function updateUser(id, updates) {
  const db = load();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx >= 0) {
    Object.assign(db.users[idx], updates);
    db.users[idx].updated_at = new Date().toISOString();
    save();
    return db.users[idx];
  }
  return null;
}

// ===== Log operations =====
function addLog(entry) {
  const db = load();
  const id = db.nextLogId++;
  const log = { id, ...entry, created_at: new Date().toISOString() };
  db.logs.push(log);
  if (db.logs.length > 10000) db.logs = db.logs.slice(-5000);
  save();
  return log;
}

function listLogs({ page = 1, pageSize = 20, adminId, action } = {}) {
  const db = load();
  let logs = [...db.logs].reverse();

  if (adminId) logs = logs.filter(l => l.admin_id === parseInt(adminId));
  if (action) logs = logs.filter(l => l.action === action);

  const total = logs.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, list: logs.slice(start, start + pageSize) };
}

module.exports = {
  // Admin
  findAdminByUsername,
  findAdminById,
  updateAdmin,
  listAdmins,
  createAdmin,
  // Users
  listUsers,
  getUserById,
  updateUser,
  // Logs
  addLog,
  listLogs,
  // Save
  save
};

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin(origin, callback) {
    // Allow any localhost / 127.0.0.1 origin in development
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}));
app.use(express.json());

const authRoutes = require('./routes/auth');
const wechatRoutes = require('./routes/wechat');
const pdfRoutes = require('./routes/pdf');
const adminAuthRoutes = require('./routes/admin/auth');
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminUsersRoutes = require('./routes/admin/users');
const adminLogsRoutes = require('./routes/admin/logs');

app.use('/api/auth', authRoutes);
app.use('/api/wechat', wechatRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/logs', adminLogsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ OfferForge 后端运行在 http://localhost:${PORT}`);
});

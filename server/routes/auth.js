const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendEmailCode } = require('../utils/mailer');
const { signToken } = require('../utils/jwt');
const crypto = require('crypto');

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function checkRateLimit(target, type) {
  const [rows] = await pool.query(
    `SELECT created_at FROM verify_codes
     WHERE target=? AND type=?
     ORDER BY created_at DESC LIMIT 1`,
    [target, type]
  );
  if (rows.length > 0) {
    const lastSent = new Date(rows[0].created_at).getTime();
    if (Date.now() - lastSent < 60000) {
      throw new Error('发送太频繁，请60秒后再试');
    }
  }
}

// ── 1. 发送手机验证码 ───────────────────────────────────────────────
// POST /api/auth/send-sms
router.post('/send-sms', async (req, res) => {
  const { phone } = req.body;
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }
  try {
    await checkRateLimit(phone, 'sms');
    const code = genCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'UPDATE verify_codes SET used=1 WHERE target=? AND type="sms" AND used=0',
      [phone]
    );
    await pool.query(
      'INSERT INTO verify_codes (target, code, type, expires_at) VALUES (?, ?, "sms", ?)',
      [phone, code, expiresAt]
    );

    // Try SMS, fallback to console.log
    let smsSent = false;
    try {
      const { sendSmsCode } = require('../utils/sms');
      await sendSmsCode(phone, code);
      smsSent = true;
    } catch {
      console.log(`[DEV] 手机验证码: ${phone} -> ${code}`);
    }

    res.json({ success: true, msg: smsSent ? '验证码已发送' : '验证码已生成（开发模式，请查看控制台）' });
  } catch (err) {
    res.status(500).json({ error: err.message || '发送失败，请稍后重试' });
  }
});

// ── 2. 手机号验证码登录/注册 ───────────────────────────────────────
// POST /api/auth/login-phone
router.post('/login-phone', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: '参数不完整' });

  const [codeRows] = await pool.query(
    `SELECT id FROM verify_codes
     WHERE target=? AND type='sms' AND code=? AND used=0 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [phone, code]
  );
  if (codeRows.length === 0) {
    return res.status(400).json({ error: '验证码错误或已过期' });
  }
  await pool.query('UPDATE verify_codes SET used=1 WHERE id=?', [codeRows[0].id]);

  let [users] = await pool.query('SELECT * FROM users WHERE phone=?', [phone]);
  let user;
  if (users.length === 0) {
    const [result] = await pool.query(
      'INSERT INTO users (phone, nickname) VALUES (?, ?)',
      [phone, `用户${phone.slice(-4)}`]
    );
    const [newUser] = await pool.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    user = newUser[0];
  } else {
    user = users[0];
  }

  const token = signToken({ userId: user.id });
  res.json({
    success: true,
    token,
    user: { userId: user.id, nickname: user.nickname, phone: user.phone, isPro: !!user.is_pro }
  });
});

// ── 3. 发送邮箱验证码 ───────────────────────────────────────────────
// POST /api/auth/send-email-code
router.post('/send-email-code', async (req, res) => {
  const { email } = req.body;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }
  try {
    await checkRateLimit(email, 'email');
    const code = genCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'UPDATE verify_codes SET used=1 WHERE target=? AND type="email" AND used=0',
      [email]
    );
    await pool.query(
      'INSERT INTO verify_codes (target, code, type, expires_at) VALUES (?, ?, "email", ?)',
      [email, code, expiresAt]
    );

    let mailSent = false;
    try {
      await sendEmailCode(email, code);
      mailSent = true;
    } catch {
      console.log(`[DEV] 邮箱验证码: ${email} -> ${code}`);
    }

    res.json({ success: true, msg: mailSent ? '验证码已发送至邮箱' : '验证码已生成（开发模式，请查看控制台）' });
  } catch (err) {
    res.status(500).json({ error: err.message || '邮件发送失败' });
  }
});

// ── 4. 邮箱验证码登录/注册 ─────────────────────────────────────────
// POST /api/auth/login-email
router.post('/login-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: '参数不完整' });

  const [codeRows] = await pool.query(
    `SELECT id FROM verify_codes
     WHERE target=? AND type='email' AND code=? AND used=0 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [email, code]
  );
  if (codeRows.length === 0) {
    return res.status(400).json({ error: '验证码错误或已过期' });
  }
  await pool.query('UPDATE verify_codes SET used=1 WHERE id=?', [codeRows[0].id]);

  let [users] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
  let user;
  if (users.length === 0) {
    const nickname = email.split('@')[0];
    const [result] = await pool.query(
      'INSERT INTO users (email, nickname) VALUES (?, ?)',
      [email, nickname]
    );
    const [newUser] = await pool.query('SELECT * FROM users WHERE id=?', [result.insertId]);
    user = newUser[0];
  } else {
    user = users[0];
  }

  const token = signToken({ userId: user.id });
  res.json({
    success: true,
    token,
    user: { userId: user.id, nickname: user.nickname, email: user.email, isPro: !!user.is_pro }
  });
});

module.exports = router;

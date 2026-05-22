const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendEmailCode(email, code) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: '【OfferForge】您的验证码',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f6f8fb;border-radius:12px;">
        <h2 style="color:#FF5C00;margin-bottom:8px;">OfferForge AI简历</h2>
        <p style="color:#333;font-size:15px;">您的验证码为：</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#FF5C00;padding:16px 0;">${code}</div>
        <p style="color:#999;font-size:13px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="color:#bbb;font-size:12px;">如非本人操作，请忽略此邮件。</p>
      </div>
    `,
  });
}

module.exports = { sendEmailCode };

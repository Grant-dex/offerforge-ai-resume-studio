const crypto = require('crypto');
const axios = require('axios');
const pool = require('../db');
const { signToken } = require('./jwt');
require('dotenv').config();

const APPID = process.env.WECHAT_APP_ID;
const SECRET = process.env.WECHAT_APP_SECRET;
const WECHAT_TOKEN = process.env.WECHAT_TOKEN;

let cachedAccessToken = null;
let accessTokenExpireAt = 0;

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpireAt) {
    return cachedAccessToken;
  }
  const res = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
  );
  if (res.data.errcode) throw new Error(`获取AccessToken失败: ${res.data.errmsg}`);
  cachedAccessToken = res.data.access_token;
  accessTokenExpireAt = Date.now() + (res.data.expires_in - 300) * 1000;
  return cachedAccessToken;
}

async function createWechatQrcode(req, res) {
  try {
    const sceneId = crypto.randomBytes(16).toString('hex');
    const expiresIn = 300;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const accessToken = await getAccessToken();

    const qrRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`,
      {
        expire_seconds: expiresIn,
        action_name: 'QR_STR_SCENE',
        action_info: { scene: { scene_str: sceneId } }
      }
    );

    if (qrRes.data.errcode) {
      throw new Error(`创建二维码失败: ${qrRes.data.errmsg}`);
    }

    const ticket = encodeURIComponent(qrRes.data.ticket);
    const qrUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticket}`;

    await pool.query(
      `INSERT INTO wechat_tickets (scene_id, ticket, qr_url, expires_at) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ticket=VALUES(ticket), qr_url=VALUES(qr_url),
       status='pending', expires_at=VALUES(expires_at)`,
      [sceneId, qrRes.data.ticket, qrUrl, expiresAt]
    );

    res.json({ success: true, sceneId, qrUrl, expiresIn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function pollWechatLogin(req, res) {
  const { sceneId } = req.params;
  const [rows] = await pool.query('SELECT * FROM wechat_tickets WHERE scene_id=?', [sceneId]);
  if (rows.length === 0) return res.json({ status: 'expired' });

  const ticket = rows[0];

  if (new Date() > new Date(ticket.expires_at)) {
    await pool.query('UPDATE wechat_tickets SET status="expired" WHERE scene_id=?', [sceneId]);
    return res.json({ status: 'expired' });
  }

  if (ticket.status === 'confirmed' && ticket.openid) {
    let [users] = await pool.query('SELECT * FROM users WHERE wechat_openid=?', [ticket.openid]);
    if (users.length === 0) return res.json({ status: 'pending' });
    const user = users[0];
    const token = signToken({ userId: user.id });
    return res.json({
      status: 'confirmed',
      token,
      user: { userId: user.id, nickname: user.nickname, isPro: !!user.is_pro }
    });
  }

  res.json({ status: ticket.status });
}

async function wechatCallback(req, res) {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = WECHAT_TOKEN;

  if (req.method === 'GET') {
    const str = [token, timestamp, nonce].sort().join('');
    const hash = crypto.createHash('sha1').update(str).digest('hex');
    if (hash === signature) {
      res.send(echostr);
    } else {
      res.status(403).send('Forbidden');
    }
    return;
  }

  // POST — receive event
  try {
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser();
    const xmlData = parser.parse(req.body);
    const msg = xmlData.xml;

    if (msg.Event === 'SCAN' || msg.Event === 'subscribe') {
      const openid = msg.FromUserName;
      const sceneStr = msg.EventKey?.replace('qrscene_', '') || msg.EventKey;

      if (sceneStr) {
        await pool.query(
          `UPDATE wechat_tickets SET status='confirmed', openid=? WHERE scene_id=? AND status='pending'`,
          [openid, sceneStr]
        );

        let [users] = await pool.query('SELECT * FROM users WHERE wechat_openid=?', [openid]);
        if (users.length === 0) {
          await pool.query(
            'INSERT INTO users (wechat_openid, nickname) VALUES (?, ?) ON DUPLICATE KEY UPDATE wechat_openid=wechat_openid',
            [openid, `微信用户_${openid.slice(-6)}`]
          );
        }
      }
    }

    res.set('Content-Type', 'text/xml');
    res.send('<xml><ToUserName><![CDATA[]]></ToUserName><FromUserName><![CDATA[]]></FromUserName><CreateTime>0</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[扫码成功，请返回网页完成登录]]></Content></xml>');
  } catch (err) {
    res.set('Content-Type', 'text/xml');
    res.send('<xml><ToUserName><![CDATA[]]></ToUserName><FromUserName><![CDATA[]]></FromUserName><CreateTime>0</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[系统错误，请重试]]></Content></xml>');
  }
}

module.exports = { createWechatQrcode, pollWechatLogin, wechatCallback };

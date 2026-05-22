const express = require('express');
const router = express.Router();
const { createWechatQrcode, pollWechatLogin, wechatCallback } = require('../utils/wechat');

// GET /api/wechat/qrcode
router.get('/qrcode', createWechatQrcode);

// GET /api/wechat/poll/:sceneId
router.get('/poll/:sceneId', pollWechatLogin);

// GET/POST /api/wechat/callback
router.get('/callback', wechatCallback);
router.post('/callback', express.text({ type: 'text/xml' }), wechatCallback);

module.exports = router;

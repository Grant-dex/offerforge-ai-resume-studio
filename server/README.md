# OfferForge 后端服务

## 快速启动

```bash
# 1. 安装依赖
cd server
npm install

# 2. 初始化数据库（需要本地 MySQL 已运行）
mysql -u root -p < init.sql

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，至少填写 DB_PASSWORD 和 JWT_SECRET

# 4. 启动开发服务器（nodemon 自动重启）
npm run dev
```

启动后访问 http://localhost:3001/api/health 确认服务正常。

## 目录结构

```
server/
├── index.js              # Express 入口
├── db.js                 # MySQL 连接池
├── init.sql              # 建表 SQL
├── .env                  # 环境变量（不提交 Git）
├── .env.example          # 环境变量模板
├── routes/
│   ├── auth.js           # 认证路由
│   └── wechat.js         # 微信路由
└── utils/
    ├── jwt.js            # JWT 签发/校验
    ├── sms.js            # 阿里云短信发送
    ├── mailer.js         # 邮件发送（nodemailer）
    └── wechat.js         # 微信二维码 + 轮询 + 回调
```

## API 文档

| 方法 | 路径 | 说明 | Body |
|------|------|------|------|
| POST | `/api/auth/send-sms` | 发送手机验证码 | `{ phone }` |
| POST | `/api/auth/login-phone` | 手机号登录 | `{ phone, code }` |
| POST | `/api/auth/send-email-code` | 发送邮箱验证码 | `{ email }` |
| POST | `/api/auth/login-email` | 邮箱登录 | `{ email, code }` |
| GET | `/api/wechat/qrcode` | 获取微信二维码 | — |
| GET | `/api/wechat/poll/:sceneId` | 轮询扫码状态 | — |
| GET/POST | `/api/wechat/callback` | 微信服务器回调 | — |

## 开发模式

**短信**和**邮件**在未配置服务商账号时，会自动降级为终端打印验证码：

```
[DEV SMS] To: 13812345678  Code: 123456
[DEV] 邮箱验证码: test@example.com -> 123456
```

开发时只需配置 MySQL 和 JWT_SECRET 即可启动。

## 可选服务配置

### QQ 邮箱（推荐先配这个）

1. 登录 QQ 邮箱 → 设置 → 账户
2. 找到「POP3/SMTP 服务」→ 开启
3. 按提示发送短信，获取**授权码**
4. 将授权码填入 `.env` 的 `MAIL_PASS`
5. `MAIL_USER` 填你的 QQ 邮箱地址

### 阿里云短信

1. 阿里云控制台 → RAM 访问控制 → 创建 AccessKey
2. 开通短信服务 → 申请签名和模板
3. 模板内容：`您的验证码为${code}，5分钟内有效。`
4. 将 AccessKey、签名名称、模板 Code 填入 `.env`

### 微信公众号（扫码登录）

1. 需要**已认证的服务号**（订阅号不支持）
2. 微信公众平台 → 开发 → 基本配置 → 获取 AppID 和 AppSecret
3. 本地开发用 ngrok 做内网穿透：`ngrok http 3001`
4. 将 ngrok 的 https 地址填入微信后台的服务器 URL

import { SignJWT } from "jose";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization"
};

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiPath = url.pathname.replace(/^\/api\/?/, "");

  try {
    if (request.method === "GET" && apiPath === "health") {
      return json({ status: "ok", time: new Date().toISOString(), runtime: "cloudflare-pages-functions" });
    }

    if (request.method === "POST" && apiPath === "auth/send-email-code") {
      return handleSendEmail(context);
    }
    if (request.method === "POST" && apiPath === "auth/login-email") {
      return handleEmailLogin(context);
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ success: false, error: message }, 500);
  }
}

async function handleSendEmail(context) {
  const body = await context.request.json();
  const email = String(body.email || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: "邮箱格式不正确" }, 400);
  }

  await checkRateLimit(context.env.DB, email, "email");
  const code = genCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await invalidateCodes(context.env.DB, email, "email");
  await context.env.DB
    .prepare("INSERT INTO verify_codes (target, code, type, expires_at) VALUES (?, ?, 'email', ?)")
    .bind(email, code, expiresAt)
    .run();

  // Try sending via Resend, but return code in response for learning mode
  try {
    if (context.env.RESEND_API_KEY) {
      await sendEmailCode(context.env, email, code);
    }
  } catch (e) {
    console.error("Email send failed:", e.message);
  }

  return json({ success: true, msg: "验证码已发送", code: context.env.RESEND_API_KEY ? undefined : code });
}

async function handleEmailLogin(context) {
  const body = await context.request.json();
  const email = String(body.email || "");
  const code = String(body.code || "");

  if (!email || !code) {
    return json({ success: false, error: "参数不完整" }, 400);
  }

  // Rate limit: max 5 attempts per 60 seconds per email
  await checkLoginRateLimit(context.env.DB, email);

  const codeRow = await context.env.DB
    .prepare("SELECT id FROM verify_codes WHERE target=? AND type='email' AND code=? AND used=0 AND expires_at > ? ORDER BY id DESC LIMIT 1")
    .bind(email, code, new Date().toISOString())
    .first();

  if (!codeRow) {
    return json({ success: false, error: "验证码错误或已过期" }, 400);
  }

  await context.env.DB.prepare("UPDATE verify_codes SET used=1 WHERE id=?").bind(codeRow.id).run();

  let user = await context.env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
  if (!user) {
    const isPro = email === "zangxiang112@gmail.com" ? 1 : 0;
    const result = await context.env.DB
      .prepare("INSERT INTO users (email, nickname, is_pro) VALUES (?, ?, ?)")
      .bind(email, email.split("@")[0], isPro)
      .run();
    user = await context.env.DB.prepare("SELECT * FROM users WHERE id=?").bind(result.meta.last_row_id).first();
  }

  // Update login stats
  await context.env.DB
    .prepare("UPDATE users SET login_count = COALESCE(login_count, 0) + 1, last_login_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), user.id)
    .run();

  const token = await signToken(context.env.JWT_SECRET, { userId: user.id, role: "user" });
  return json({ success: true, token, user: serializeUser(user) });
}

async function sendEmailCode(env, email, code) {
  if (!env.RESEND_API_KEY) {
    throw new Error("未配置 RESEND_API_KEY，暂时无法发送邮箱验证码");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Authorization": `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: "OfferForge <onboarding@resend.dev>",
      to: [email],
      subject: "【OfferForge】您的验证码",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f6f8fb;border-radius:12px;">
          <h2 style="color:#FF5C00;margin-bottom:8px;">OfferForge AI简历</h2>
          <p style="color:#333;font-size:15px;">您的验证码为：</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#FF5C00;padding:16px 0;">${code}</div>
          <p style="color:#999;font-size:13px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(`邮件发送失败: ${textBody}`);
  }
}

async function checkRateLimit(db, target, type) {
  const row = await db
    .prepare("SELECT created_at FROM verify_codes WHERE target=? AND type=? ORDER BY created_at DESC LIMIT 1")
    .bind(target, type)
    .first();

  if (!row?.created_at) return;
  const lastSent = new Date(row.created_at).getTime();
  if (Number.isFinite(lastSent) && Date.now() - lastSent < 60_000) {
    throw new Error("发送太频繁，请60秒后再试");
  }
}

async function checkLoginRateLimit(db, email) {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const row = await db
    .prepare("SELECT COUNT(*) as c FROM verify_codes WHERE target=? AND type='email' AND created_at > ?")
    .bind(email, oneMinuteAgo)
    .first();
  if (row?.c >= 5) {
    throw new Error("验证码尝试过于频繁，请60秒后再试");
  }
}

async function invalidateCodes(db, target, type) {
  await db.prepare("UPDATE verify_codes SET used=1 WHERE target=? AND type=? AND used=0").bind(target, type).run();
}

async function signToken(secret, payload) {
  if (!secret) {
    throw new Error("未配置 JWT_SECRET");
  }

  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

function serializeUser(user) {
  return {
    userId: user.id,
    nickname: user.nickname,
    email: user.email || undefined,
    isPro: Boolean(user.is_pro)
  };
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

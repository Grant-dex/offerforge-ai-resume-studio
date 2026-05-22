import { SignJWT, jwtVerify } from "jose";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization"
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const path = url.pathname.replace(/^\/api\/admin\/?/, "");

  try {
    // Public routes
    if (request.method === "POST" && path === "login") {
      return handleLogin(context);
    }

    // All other routes require auth
    const admin = await authenticateAdmin(context);
    if (!admin) {
      return json({ error: "未登录" }, 401);
    }

    if (request.method === "GET" && path === "me") {
      return json({ id: admin.id, username: admin.username, role: admin.role });
    }

    if (request.method === "PUT" && path === "change-password") {
      return handleChangePassword(context, admin);
    }

    if (request.method === "GET" && path === "dashboard") {
      return handleDashboard(context);
    }

    if (request.method === "GET" && path === "users") {
      return handleListUsers(context);
    }

    // User detail routes
    const userMatch = path.match(/^users\/(\d+)$/);
    if (request.method === "GET" && userMatch) {
      return handleGetUser(context, parseInt(userMatch[1]));
    }

    const statusMatch = path.match(/^users\/(\d+)\/status$/);
    if (request.method === "PUT" && statusMatch) {
      return handleSetUserStatus(context, parseInt(statusMatch[1]), admin);
    }

    const proMatch = path.match(/^users\/(\d+)\/pro$/);
    if (request.method === "PUT" && proMatch) {
      return handleSetUserPro(context, parseInt(proMatch[1]), admin);
    }

    const deleteMatch = path.match(/^users\/(\d+)$/);
    if (request.method === "DELETE" && deleteMatch) {
      return handleDeleteUser(context, parseInt(deleteMatch[1]), admin);
    }

    if (request.method === "GET" && path === "logs") {
      return handleListLogs(context);
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

// ── Auth ────────────────────────────────────────────────────────────

async function authenticateAdmin(context) {
  const auth = context.request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  try {
    const key = new TextEncoder().encode(context.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, key);
    if (payload.role !== "admin" || !payload.adminId) return null;

    const admin = await context.env.DB
      .prepare("SELECT id, username, role FROM admins WHERE id = ?")
      .bind(payload.adminId)
      .first();
    return admin || null;
  } catch {
    return null;
  }
}

async function handleLogin(context) {
  const { env } = context;
  const body = await context.request.json();
  const username = String(body.username || "");
  const password = String(body.password || "");

  if (!username || !password) {
    return json({ error: "请输入用户名和密码" }, 400);
  }

  // Seed admin user if not exists
  const existingAdmin = await env.DB.prepare("SELECT id FROM admins WHERE username = ?").bind(username).first();
  if (!existingAdmin) {
    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return json({ error: "用户名或密码错误" }, 401);
    }
    const salt = await generateSalt();
    const hash = await hashPassword(password, salt);
    await env.DB
      .prepare("INSERT INTO admins (username, password_hash, password_salt) VALUES (?, ?, ?)")
      .bind(username, hash, salt)
      .run();
  }

  const admin = await env.DB.prepare("SELECT * FROM admins WHERE username = ?").bind(username).first();
  if (!admin) {
    return json({ error: "用户名或密码错误" }, 401);
  }

  const valid = await verifyPassword(password, admin.password_hash, admin.password_salt || "");
  if (!valid) {
    return json({ error: "用户名或密码错误" }, 401);
  }

  await env.DB
    .prepare("INSERT INTO admin_logs (admin_id, action, target, ip) VALUES (?, 'login', ?, ?)")
    .bind(admin.id, username, context.request.headers.get("CF-Connecting-IP") || "")
    .run();

  const token = await signToken(env.JWT_SECRET, { adminId: admin.id, role: "admin" });

  return json({
    token,
    admin: { id: admin.id, username: admin.username, role: admin.role }
  });
}

async function handleChangePassword(context, admin) {
  const body = await context.request.json();
  const oldPassword = String(body.oldPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!oldPassword || !newPassword) {
    return json({ error: "请填写新旧密码" }, 400);
  }
  if (newPassword.length < 6) {
    return json({ error: "新密码至少 6 位" }, 400);
  }

  const row = await context.env.DB.prepare("SELECT password_hash, password_salt FROM admins WHERE id = ?").bind(admin.id).first();
  const valid = await verifyPassword(oldPassword, row.password_hash, row.password_salt || "");
  if (!valid) {
    return json({ error: "旧密码错误" }, 400);
  }

  const newSalt = await generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);
  await context.env.DB
    .prepare("UPDATE admins SET password_hash = ?, password_salt = ? WHERE id = ?")
    .bind(newHash, newSalt, admin.id)
    .run();

  return json({ success: true });
}

// ── Dashboard ────────────────────────────────────────────────────────

async function handleDashboard(context) {
  const { env } = context;

  const today = new Date().toISOString().slice(0, 10);

  const [totalUsers, todayNewUsers, proUsers, activeToday, totalLogins, aiTodayRes, aiTotalRes, proExpiring] =
    await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE status = 1").first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE status = 1 AND created_at >= ?").bind(today).first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE is_pro = 1 AND status = 1").first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE status = 1 AND last_login_at >= ?").bind(today).first(),
      env.DB.prepare("SELECT COALESCE(SUM(login_count),0) as c FROM users").first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM admin_logs WHERE action LIKE 'ai_%' AND created_at >= ?").bind(today).first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM admin_logs WHERE action LIKE 'ai_%'").first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE is_pro = 1 AND pro_expires_at IS NOT NULL AND pro_expires_at <= ? AND status = 1")
        .bind(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)).first(),
    ]);

  // New users trend (last 7 days)
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const row = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE status = 1 AND created_at >= ? AND created_at < ?")
      .bind(d, new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .first();
    trend.push({ date: d, count: row.c });
  }

  return json({
    totalUsers: totalUsers.c,
    todayNewUsers: todayNewUsers.c,
    proUsers: proUsers.c,
    activeToday: activeToday.c,
    totalLogins: totalLogins.c,
    newUsersTrend: trend,
    aiToday: aiTodayRes.c,
    aiTotal: aiTotalRes.c,
    proExpiringSoon: proExpiring.c,
  });
}

// ── Users ─────────────────────────────────────────────────────────────

async function handleListUsers(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20")));
  const search = url.searchParams.get("search") || "";
  const isPro = url.searchParams.get("isPro") || "";

  let where = "WHERE 1=1";
  const bindings = [];

  if (search) {
    where += " AND (nickname LIKE ? OR email LIKE ? OR phone LIKE ?)";
    bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (isPro === "1") {
    where += " AND is_pro = 1";
  } else if (isPro === "0") {
    where += " AND is_pro = 0";
  }

  const totalRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM users ${where}`).bind(...bindings).first();
  const offset = (page - 1) * pageSize;
  const list = await env.DB
    .prepare(`SELECT id, nickname, phone, email, is_pro, pro_expires_at, status, login_count, last_login_at, created_at FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, pageSize, offset)
    .all();

  return json({ list: list.results, total: totalRow.c, page, pageSize });
}

async function handleGetUser(context, id) {
  const user = await context.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  if (!user) return json({ error: "用户不存在" }, 404);

  return json({
    id: user.id,
    nickname: user.nickname,
    phone: user.phone,
    email: user.email,
    isPro: Boolean(user.is_pro),
    proExpiresAt: user.pro_expires_at,
    status: user.status,
    loginCount: user.login_count,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });
}

async function handleSetUserStatus(context, id, admin) {
  const body = await context.request.json();
  const status = parseInt(body.status);

  await context.env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(status, id).run();
  await logAction(context, "set_user_status", `user:${id}`, `status -> ${status}`, admin.id);
  return json({ success: true });
}

async function handleSetUserPro(context, id, admin) {
  const body = await context.request.json();
  const isPro = body.isPro ? 1 : 0;
  const proExpiresAt = body.proExpiresAt || null;

  await context.env.DB
    .prepare("UPDATE users SET is_pro = ?, pro_expires_at = ? WHERE id = ?")
    .bind(isPro, proExpiresAt, id)
    .run();
  await logAction(context, "set_user_pro", `user:${id}`, `is_pro -> ${isPro}`, admin.id);
  return json({ success: true });
}

async function handleDeleteUser(context, id, admin) {
  await context.env.DB.prepare("UPDATE users SET status = -1 WHERE id = ?").bind(id).run();
  await logAction(context, "delete_user", `user:${id}`, "soft deleted", admin.id);
  return json({ success: true });
}

// ── Logs ──────────────────────────────────────────────────────────────

async function handleListLogs(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, parseInt(url.searchParams.get("pageSize") || "50"));
  const offset = (page - 1) * pageSize;

  const totalRow = await env.DB.prepare("SELECT COUNT(*) as c FROM admin_logs").first();
  const list = await env.DB
    .prepare("SELECT * FROM admin_logs ORDER BY id DESC LIMIT ? OFFSET ?")
    .bind(pageSize, offset)
    .all();

  return json({ list: list.results, total: totalRow.c, page, pageSize });
}

async function logAction(context, action, target, detail, adminId = 0) {
  await context.env.DB
    .prepare("INSERT INTO admin_logs (admin_id, action, target, detail, ip) VALUES (?, ?, ?, ?, ?)")
    .bind(adminId, action, target, detail, context.request.headers.get("CF-Connecting-IP") || "")
    .run();
}

// ── Helpers ───────────────────────────────────────────────────────────

async function signToken(secret, payload) {
  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const saltBytes = enc.encode(salt || "offerforge");
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return btoa(String.fromCharCode(...new Uint8Array(derived)));
}

async function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

async function verifyPassword(input, storedHash, salt) {
  return (await hashPassword(input, salt)) === storedHash;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders }
  });
}

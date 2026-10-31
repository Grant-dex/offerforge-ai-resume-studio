import { jwtVerify } from "jose";
import { AIError, aiJson, handleAIRequest } from "../../../server/deepseek.mjs";

import { trialEnabled, trialContext, trialStatus, reserveTrial } from "../../../server/ai-trial.mjs";

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  const url = new URL(request.url);
  const isStatus = url.pathname === "/api/ai/status" && request.method === "GET";
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return aiJson({ error: "请从本站使用 AI 功能。" }, 403);
  if (!isStatus && request.method !== "POST") return aiJson({ error: "此接口仅接受 POST 请求。" }, 405);
  try {
    const user = await authenticateUser(request, env.JWT_SECRET, env.DB);
    const proEmails = String(env.PRO_EMAILS || "").split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
    const member = user && (user.is_pro === 1 || user.is_pro === true || proEmails.includes(String(user.email || "").toLowerCase()));
    if (trialEnabled(env) && !member) {
      const context = await trialContext(request, env);
      if (isStatus) return aiJson(await trialStatus(context, env));
      return handleAIRequest(request, env, { flashOnly: true, beforeGenerate: () => reserveTrial(context) });
    }
    if (isStatus) return aiJson({ mode: "account", configured: Boolean(String(env.AI_API_KEY || "").trim()) });
    if (!user) return aiJson({ error: "请先登录" }, 401);
    if (!member) return aiJson({ error: "此功能需要 PRO 会员" }, 402);
    return handleAIRequest(request, env);
  } catch (error) {
    return aiJson({ error: error instanceof AIError ? error.message : "AI 试用服务暂时不可用，请稍后重试。", code: error instanceof AIError ? error.code : "AI_TRIAL_UNAVAILABLE" }, error instanceof AIError ? error.status : 503);
  }
}

async function authenticateUser(request, jwtSecret, db) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  try {
    const key = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, key);
    if (payload.role !== "user" || !payload.userId) return null;

    const user = await db.prepare("SELECT id, email, is_pro FROM users WHERE id = ? AND status = 1").bind(payload.userId).first();
    return user || null;
  } catch {
    return null;
  }
}

import { AIError } from "./deepseek.mjs";
export const trialEnabled = env => env.AI_TRIAL_ENABLED === "true";
const bounded = (value, fallback) => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 1000 ? Number(value) : fallback;

export async function trialContext(request, env, now = new Date()) {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!env.DB || !ip) throw new AIError("AI 试用服务暂时不可用，请稍后重试。", 503, "AI_TRIAL_UNAVAILABLE");
  const day = now.toISOString().slice(0, 10);
  const salt = env.JWT_SECRET || env.AI_API_KEY;
  if (!salt) throw new AIError("AI 试用服务尚未配置。", 503, "AI_NOT_CONFIGURED");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${day}:${ip}`));
  const visitor = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return { db: env.DB, day, visitor, limit: bounded(env.AI_TRIAL_PER_IP, 6), globalLimit: bounded(env.AI_TRIAL_GLOBAL_DAILY, 60), now: now.toISOString() };
}
export async function trialStatus(context, env) {
  const row = await context.db.prepare("SELECT COUNT(*) AS total, COALESCE(SUM(visitor_hash = ?), 0) AS used FROM ai_trial_usage WHERE day = ?").bind(context.visitor, context.day).first();
  const remaining = Math.max(0, Math.min(context.limit - Number(row?.used || 0), context.globalLimit - Number(row?.total || 0)));
  const resetAt = new Date(`${context.day}T00:00:00.000Z`); resetAt.setUTCDate(resetAt.getUTCDate() + 1);
  return { mode: "trial", configured: Boolean(String(env.AI_API_KEY || "").trim()), remaining, limit: context.limit, resetAt: resetAt.toISOString() };
}
export async function reserveTrial(context) {
  // One atomic write checks both limits. Never split this into count-then-insert requests.
  const result = await context.db.prepare(`INSERT INTO ai_trial_usage (id, day, visitor_hash, created_at)
    SELECT ?, ?, ?, ?
    WHERE (SELECT COUNT(*) FROM ai_trial_usage WHERE day = ?) < ?
      AND (SELECT COUNT(*) FROM ai_trial_usage WHERE day = ? AND visitor_hash = ?) < ?`)
    .bind(crypto.randomUUID(), context.day, context.visitor, context.now, context.day, context.globalLimit, context.day, context.visitor, context.limit).run();
  if (Number(result.meta?.changes) !== 1) throw new AIError("今日 AI 试用额度已用完，请在额度重置后再试。", 429, "AI_TRIAL_EXHAUSTED");
}

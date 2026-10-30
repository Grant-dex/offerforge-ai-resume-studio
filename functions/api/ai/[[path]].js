import { jwtVerify } from "jose";

const DEEPSEEK_BASE = "https://api.deepseek.com/anthropic";
const MODEL_FLASH = "deepseek-v4-flash";
const MODEL_PRO = "deepseek-v4-pro[1m]";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST,OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization"
      }
    });
  }

  const apiPath = url.pathname.replace(/^\/api\/ai\/?/, "");

  try {
    // Auth check
    const user = await authenticateUser(request, env.JWT_SECRET, env.DB);
    if (!user) {
      return json({ error: "请先登录" }, 401);
    }

    // PRO check
    const proEmails = String(env.PRO_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (user.is_pro !== 1 && user.is_pro !== true && !proEmails.includes(String(user.email || "").toLowerCase())) {
      return json({ error: "此功能需要 PRO 会员" }, 402);
    }

    // Determine model from request
    const body = await request.json();
    const model = body.model === "pro" ? MODEL_PRO : MODEL_FLASH;

    if (apiPath === "score") {
      return handleAIScore(env, body, model);
    }
    if (apiPath === "suggestions") {
      return handleAISuggestions(env, body, model);
    }
    if (apiPath === "jd-match") {
      return handleJDMatch(env, body, model);
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
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

async function callDeepSeek(apiKey, messages, maxTokens, model) {
  const res = await fetch(`${DEEPSEEK_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI 请求失败 (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const contentArray = Array.isArray(data.content) ? data.content : [];
  const textBlocks = contentArray.filter((block) => block.type === "text");
  let result = textBlocks.map((block) => block.text || "").join("").trim();

  if (result) return result;

  if (contentArray.length > 0 && contentArray[0]?.text) {
    return contentArray[0].text;
  }

  if (Array.isArray(data.choices) && data.choices.length > 0) {
    return data.choices[0]?.message?.content || JSON.stringify(data);
  }

  return JSON.stringify(data);
}

function extractJSON(text) {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { JSON.parse(arrMatch[0]); return arrMatch[0]; } catch { /* fall through */ } }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) { try { JSON.parse(objMatch[0]); return objMatch[0]; } catch { /* fall through */ } }
  return text.trim();
}

async function handleAIScore(env, body, model) {
  const { summary, signal } = body;
  const prompt = `你是一位资深 HR 和简历优化专家。请根据以下简历内容，从5个维度进行打分（0-100分），并给出2条改进建议。\n\n${summary}\n\n你必须严格输出一个JSON对象，不要加任何说明。直接输出：\n{"keyword":80,"format":75,"completeness":70,"quantified":65,"overall":72,"suggestions":["建议1","建议2"]}`;

  const text = await callDeepSeek(env.AI_API_KEY, [{ role: "user", content: prompt }], 1024, model);

  const cleaned = extractJSON(text);
  let result;
  try { result = JSON.parse(cleaned); } catch {
    try {
      const fixed = cleaned.replace(/,(\s*[}\]])/g, "$1").replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      result = JSON.parse(fixed);
    } catch {
      result = { keyword: 50, format: 50, completeness: 50, quantified: 50, overall: 50, suggestions: ["解析失败"] };
    }
  }

  const clamp = (v, fallback = 50) => { const n = Number(v); return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback; };

  return json({
    keyword: clamp(result.keyword, 60),
    format: clamp(result.format, 55),
    completeness: clamp(result.completeness, 50),
    quantified: clamp(result.quantified, 45),
    overall: clamp(result.overall, 55),
    suggestions: Array.isArray(result.suggestions) ? result.suggestions.filter((s) => typeof s === "string" && s.length > 0).slice(0, 3) : []
  });
}

async function handleAISuggestions(env, body, model) {
  const { summary } = body;
  const prompt = `你是一位资深简历优化专家。请根据以下简历内容，针对每个模块给出具体的文案优化建议。\n\n${summary}\n\n你必须严格输出一个JSON数组：\n[{"module":"模块名","field":"字段名","title":"建议标题","original":"原文","suggested":"优化后文案","priority":"高/中/低"}]`;

  const text = await callDeepSeek(env.AI_API_KEY, [{ role: "user", content: prompt }], 2048, model);

  const cleaned = extractJSON(text);
  let items;
  try { items = JSON.parse(cleaned); } catch {
    try {
      const fixed = cleaned.replace(/,(\s*[}\]])/g, "$1").replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      items = JSON.parse(fixed);
    } catch {
      throw new Error("AI 未返回有效的优化建议");
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("AI 未返回有效的优化建议");
  }

  return json(items.map((item, i) => ({
    id: `ai-suggestion-${i}`,
    module: String(item.module || "综合"),
    field: String(item.field || ""),
    title: String(item.title || "优化建议"),
    original: String(item.original || ""),
    suggested: String(item.suggested || ""),
    priority: (["高", "中", "低"].includes(item.priority) ? item.priority : "中")
  })));
}

async function handleJDMatch(env, body, model) {
  const { summary, jdText } = body;
  const prompt = `你是一位资深 HR。请根据简历和职位描述分析匹配度。\n\n【简历】\n${summary}\n\n【职位描述】\n${jdText}\n\n输出JSON：\n{"score":85,"matchedSkills":["技能1","技能2","技能3","技能4"],"suggestion":"一句话建议"}`;

  const text = await callDeepSeek(env.AI_API_KEY, [{ role: "user", content: prompt }], 1024, model);

  const cleaned = extractJSON(text);
  let result;
  try { result = JSON.parse(cleaned); } catch {
    try {
      const fixed = cleaned.replace(/,(\s*[}\]])/g, "$1").replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      result = JSON.parse(fixed);
    } catch {
      result = { score: 50, matchedSkills: [], suggestion: "分析失败，请重试" };
    }
  }

  const clamp = (v, fallback = 50) => { const n = Number(v); return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback; };

  return json({
    score: clamp(result.score, 60),
    matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills.slice(0, 4) : [],
    suggestion: typeof result.suggestion === "string" ? result.suggestion : ""
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" }
  });
}

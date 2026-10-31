import { aiJson, handleAIRequest } from "./deepseek.mjs";
const loopback = host => host === "127.0.0.1" || host === "localhost" || host === "[::1]";

/** Development only. Requests must originate from the same loopback website. */
export function createLocalAIMiddleware(env) {
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/ai/")) return next();
    const send = async response => {
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
    };
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (!loopback(url.hostname) || !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress)
        || (req.headers.origin && req.headers.origin !== url.origin) || req.headers["sec-fetch-site"] === "cross-site") {
        return send(aiJson({ error: "本机 AI 服务仅接受本站请求。" }, 403));
      }
      if (url.pathname === "/api/ai/status" && req.method === "GET") return send(aiJson({ mode: "local", configured: Boolean(String(env.AI_API_KEY || "").trim()) }));
      if (req.method !== "POST") return send(aiJson({ error: "此接口仅接受 POST 请求。" }, 405));
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > 180000) return send(aiJson({ error: "请求内容过长，请精简简历。" }, 413));
        chunks.push(Buffer.from(chunk));
      }
      const controller = new AbortController();
      const cancel = () => { if (!res.writableEnded) controller.abort(); };
      res.on("close", cancel);
      try {
        return await send(await handleAIRequest(new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: Buffer.concat(chunks).toString("utf8"), signal: controller.signal }), env));
      } finally { res.off("close", cancel); }
    } catch {
      return send(aiJson({ error: "本机 AI 服务暂时不可用，请重试。" }, 500));
    }
  };
}
export function localAIPlugin(env) {
  return { name: "offerforge-local-ai", apply: "serve", configureServer(server) { server.middlewares.use(createLocalAIMiddleware(env)); } };
}

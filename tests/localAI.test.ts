import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import { createLocalAIMiddleware } from "../server/ai-dev.mjs";
import { onRequest } from "../functions/api/ai/[[path]].js";
function call(options: Record<string, any> = {}) {
  return new Promise<{ status: number; data: any }>((resolve, reject) => {
    const req = Object.assign(Readable.from(options.body ? [JSON.stringify(options.body)] : []), {
      method: options.method || "GET", url: options.url || "/api/ai/status",
      headers: { host: "127.0.0.1:5173", ...options.headers }, socket: { remoteAddress: options.remote || "127.0.0.1" },
    });
    const res = Object.assign(new EventEmitter(), { statusCode: 200, writableEnded: false,
      setHeader() {}, end(text: string) { this.writableEnded = true; resolve({ status: this.statusCode, data: JSON.parse(text) }); },
    });
    void createLocalAIMiddleware({ AI_API_KEY: "test-only-secret" })(req, res, () => resolve({ status: 404, data: null })).catch(reject);
  });
}
test("local availability reveals configuration status, never the key", async () => {
  assert.deepEqual(await call(), { status: 200, data: { mode: "local", configured: true } });
});
test("foreign origins, remote clients and hostile host headers cannot use local AI", async () => {
  for (const options of [{ headers: { origin: "https://untrusted.example" } }, { headers: { host: "untrusted.example" } }, { remote: "10.0.0.2" }, { headers: { "sec-fetch-site": "cross-site" } }]) assert.equal((await call(options)).status, 403);
});
test("same-origin local AI works without manufacturing a PRO account", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ content: [{ type: "text", text: '[]' }] })));
  const response = await call({ method: "POST", url: "/api/ai/suggestions", headers: { origin: "http://127.0.0.1:5173" }, body: { summary: "测试简历" } });
  assert.deepEqual(response, { status: 200, data: [] });
});
test("development support cannot bypass production session checks", async () => {
  const response = await onRequest({ request: new Request("https://example.test/api/ai/score", { method: "POST", body: '{"summary":"test"}' }), env: { AI_API_KEY: "test", LOCAL_AI_ENABLED: true } });
  assert.equal(response.status, 401);
});

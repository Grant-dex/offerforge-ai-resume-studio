import assert from "node:assert/strict";
import test from "node:test";
import { handleAIRequest } from "../server/deepseek.mjs";
const env = { AI_API_KEY: "server-only-test-key" };
const validScore = { keyword: 80, format: 75, completeness: 90, quantified: 60, overall: 78, suggestions: ["补充可验证的成果"] };
const request = (endpoint: string, body: object = { summary: "测试简历内容" }) => new Request(`http://127.0.0.1:5173/api/ai/${endpoint}`, { method: "POST", body: JSON.stringify(body) });
const upstream = (data: unknown, extra = {}) => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(data) }], stop_reason: "end_turn", ...extra }), { status: 200 });

test("score uses the official server endpoint and current model names, keeping credentials out of responses", async t => {
  const fetch = t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.deepseek.com/anthropic/v1/messages");
    assert.equal((init.headers as Record<string,string>)["x-api-key"], env.AI_API_KEY);
    const body = JSON.parse(init.body as string);
    assert.equal(body.model, "deepseek-flash");
    assert.deepEqual(body.thinking, { type: "disabled" });
    return upstream(validScore);
  });
  const response = await handleAIRequest(request("score"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), validScore);
  assert.equal(fetch.mock.callCount(), 1);
});
test("pro model can be configured on the server", async t => {
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.equal(JSON.parse(init.body as string).model, "deepseek-v4-pro"); return upstream(validScore);
  });
  assert.equal((await handleAIRequest(request("score", { summary: "简历", model: "pro" }), env)).status, 200);
});
test("provider auth, balance and rate errors are actionable without leaking upstream data", async t => {
  for (const [status, code] of [[401,"AI_AUTH_INVALID"],[402,"AI_BALANCE_INSUFFICIENT"],[429,"AI_RATE_LIMITED"]] as const) {
    const mock = t.mock.method(globalThis, "fetch", async () => new Response(`provider echoed ${env.AI_API_KEY}`, { status }));
    const response = await handleAIRequest(request("score"), env);
    assert.equal(response.status, status === 429 ? 429 : 502);
    const body = await response.json();
    assert.equal(body.code, code); assert.ok(!JSON.stringify(body).includes(env.AI_API_KEY));
    mock.mock.restore();
  }
});
test("missing credentials and malformed inputs fail before making paid requests", async t => {
  const fetch = t.mock.method(globalThis, "fetch", async () => upstream(validScore));
  assert.equal((await handleAIRequest(request("score"), {})).status, 503);
  assert.equal((await handleAIRequest(request("score", { summary: "" }), env)).status, 400);
  assert.equal((await handleAIRequest(request("score", { summary: "简历", model: "arbitrary-model" }), env)).status, 400);
  assert.equal((await handleAIRequest(request("unknown"), env)).status, 404);
  assert.equal((await handleAIRequest(new Request("http://localhost/api/ai/score", { method: "POST", body: "{" }), env)).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});
test("malformed or truncated AI output never becomes a fabricated score", async t => {
  for (const payload of [upstream({ overall: 80 }), upstream(validScore, { stop_reason: "max_tokens" }), new Response('{"content":[{"type":"text","text":"not JSON"}]}')]) {
    const mock = t.mock.method(globalThis, "fetch", async () => payload);
    const response = await handleAIRequest(request("score"), env);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).overall, undefined);
    mock.mock.restore();
  }
});
test("empty suggestions are valid and complete suggestions retain exact source text", async t => {
  let result: unknown = [];
  t.mock.method(globalThis, "fetch", async () => upstream(result));
  assert.deepEqual(await (await handleAIRequest(request("suggestions"), env)).json(), []);
  result = [{ module: "工作经历", field: "bullets", title: "更具体", original: "负责客户管理", suggested: "负责客户需求跟进与交付协调", priority: "中" }];
  const data = await (await handleAIRequest(request("suggestions"), env)).json();
  assert.equal(data[0].original, "负责客户管理"); assert.equal(data[0].id, "ai-suggestion-0");
});
test("JD matching requires a description and returns structured output", async t => {
  t.mock.method(globalThis, "fetch", async () => upstream({ score: 82, matchedSkills: ["客户管理"], suggestion: "补充交付经历" }));
  assert.equal((await handleAIRequest(request("jd-match"), env)).status, 400);
  const response = await handleAIRequest(request("jd-match", { summary: "负责客户管理", jdText: "需要客户沟通能力" }), env);
  assert.equal((await response.json()).score, 82);
});
test("bullet optimization is a real request and rejects incomplete replacements", async t => {
  let result: unknown = ["负责客户需求跟进"];
  t.mock.method(globalThis, "fetch", async () => upstream(result));
  assert.deepEqual(await (await handleAIRequest(request("optimize-bullets", { bullets: ["负责客户沟通"] }), env)).json(), result);
  result = [];
  assert.equal((await handleAIRequest(request("optimize-bullets", { bullets: ["负责客户沟通"] }), env)).status, 502);
});
test("timeouts have a specific retryable error", async t => {
  t.mock.method(globalThis, "fetch", async () => { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; });
  const response = await handleAIRequest(request("score"), env);
  assert.equal(response.status, 504); assert.equal((await response.json()).code, "AI_TIMEOUT");
});

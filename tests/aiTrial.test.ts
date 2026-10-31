import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { trialContext, trialStatus, reserveTrial } from "../server/ai-trial.mjs";
import { onRequest } from "../functions/api/ai/[[path]].js";

function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../cloudflare/migrations/20261031_ai_trial.sql", import.meta.url), "utf8"));
  const DB = { prepare(sql: string) { const statement = sqlite.prepare(sql); return { bind(...values: any[]) { return { async first() { return statement.get(...values) ?? null; }, async run() { const result = statement.run(...values); return { meta: { changes: Number(result.changes) } }; } }; } }; } };
  return { sqlite, DB };
}
const makeRequest = (ip = "203.0.113.8", method = "GET", endpoint = "status", body?: any, origin?: string) => new Request(`https://resume.example/api/ai/${endpoint}`, { method, headers: { "CF-Connecting-IP": ip, ...(origin ? { Origin: origin } : {}) }, body: body ? JSON.stringify(body) : undefined });
function environment() { const db = database(); return { ...db, env: { DB: db.DB, AI_TRIAL_ENABLED: "true", AI_API_KEY: "trial-test-key", JWT_SECRET: "trial-test-salt", AI_TRIAL_PER_IP: "6", AI_TRIAL_GLOBAL_DAILY: "60" } }; }

test("public trial counts requests without retaining raw network addresses", async () => {
  const {env,sqlite}=environment(); const context=await trialContext(makeRequest(),env);
  assert.deepEqual((await trialStatus(context,env)).remaining,6);
  await reserveTrial(context);
  assert.equal((await trialStatus(context,env)).remaining,5);
  const record=sqlite.prepare("SELECT * FROM ai_trial_usage").get()!;
  assert.equal(record.visitor_hash,context.visitor); assert.ok(!JSON.stringify(record).includes("203.0.113.8"));
});
test("concurrent attempts cannot exceed the individual limit", async () => {
  const {env}=environment(); const context=await trialContext(makeRequest(),env);
  const results=await Promise.allSettled(Array.from({length:20},()=>reserveTrial(context)));
  assert.equal(results.filter(result=>result.status==="fulfilled").length,6);
  assert.equal((await trialStatus(context,env)).remaining,0);
});
test("the global limit also applies across different visitors", async () => {
  const {env}=environment(); env.AI_TRIAL_GLOBAL_DAILY="3";
  for(let index=0;index<3;index++)await reserveTrial(await trialContext(makeRequest(`203.0.113.${index}`),env));
  const next=await trialContext(makeRequest("203.0.113.90"),env);
  await assert.rejects(reserveTrial(next),/额度已用完/);
  assert.equal((await trialStatus(next,env)).remaining,0);
});
test("day rollover resets counts and changes the visitor digest", async () => {
  const {env}=environment(); const today=await trialContext(makeRequest(),env,new Date("2026-10-31T23:59:00Z"));
  await reserveTrial(today);
  const tomorrow=await trialContext(makeRequest(),env,new Date("2026-11-01T00:01:00Z"));
  assert.notEqual(today.visitor,tomorrow.visitor); assert.equal((await trialStatus(tomorrow,env)).remaining,6);
});
test("quota exhaustion stops generation and pro requests use the flash model for visitors", async t => {
  const {env}=environment();env.AI_TRIAL_PER_IP="1";
  const fetch=t.mock.method(globalThis,"fetch",async (_url:string,init:RequestInit)=>{
    assert.equal(JSON.parse(init.body as string).model,"deepseek-flash");
    return new Response(JSON.stringify({content:[{type:"text",text:"[]"}]}));
  });
  const request=()=>makeRequest(undefined,"POST","suggestions",{summary:"示例项目经历",model:"pro"});
  assert.equal((await onRequest({request:request(),env})).status,200);
  const blocked=await onRequest({request:request(),env});assert.equal(blocked.status,429);
  assert.equal((await blocked.json()).code,"AI_TRIAL_EXHAUSTED");assert.equal(fetch.mock.callCount(),1);
});
test("invalid input does not consume trial points", async () => {
  const {env}=environment();
  assert.equal((await onRequest({request:makeRequest(undefined,"POST","score",{summary:""}),env})).status,400);
  const status=await onRequest({request:makeRequest(),env});assert.equal((await status.json()).remaining,6);
});
test("cross-origin requests and missing infrastructure fail closed", async () => {
  const {env}=environment();
  assert.equal((await onRequest({request:makeRequest(undefined,"POST","score",{summary:"test"},"https://other.example"),env})).status,403);
  assert.equal((await onRequest({request:new Request("https://resume.example/api/ai/status"),env})).status,503);
  assert.equal((await onRequest({request:makeRequest(),env:{...env,DB:null}})).status,503);
});
test("disabled trial retains login requirements", async () => {
  const {env}=environment();env.AI_TRIAL_ENABLED="false";
  assert.equal((await onRequest({request:makeRequest(undefined,"POST","score",{summary:"test"}),env})).status,401);
});

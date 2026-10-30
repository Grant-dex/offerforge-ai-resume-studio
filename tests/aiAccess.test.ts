import assert from "node:assert/strict";
import test from "node:test";
import { SignJWT } from "jose";
import { onRequest } from "../functions/api/ai/[[path]].js";

const secret = "test-secret-for-membership-regression-only";
const token = await new SignJWT({ role: "user", userId: "test-user" })
  .setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h")
  .sign(new TextEncoder().encode(secret));

async function request(isPro: unknown, authorization = `Bearer ${token}`) {
  return onRequest({
    request: new Request("https://example.test/api/ai/unknown", {
      method: "POST", headers: { Authorization: authorization, "Content-Type": "application/json" }, body: "{}",
    }),
    env: { JWT_SECRET: secret, DB: { prepare: () => ({ bind: () => ({ first: async () => ({ id: "test-user", email: "member@example.test", is_pro: isPro }) }) }) } },
  });
}

test("D1 numeric PRO flag passes membership gate and reaches routing", async () => {
  assert.equal((await request(1)).status, 404);
});
test("non-members and truthy string flags remain denied", async () => {
  for (const flag of [0, null, undefined, "1", "true"]) assert.equal((await request(flag)).status, 402);
});
test("unauthenticated and invalid sessions remain denied", async () => {
  assert.equal((await request(1, "")).status, 401);
  assert.equal((await request(1, "Bearer invalid")).status, 401);
});

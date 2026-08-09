import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import { expect, it } from "vitest";
import worker from "./index";

const call = (path: string, ctx: ExecutionContext) =>
  worker.fetch(new Request(`https://render.test${path}`), env as never, ctx);

it("responds ok on /health", async () => {
  const ctx = createExecutionContext();
  const res = await call("/health", ctx);
  await waitOnExecutionContext(ctx);
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("ok");
});

it("exposes a working R2 binding", async () => {
  await env.OG_BUCKET.put("probe", "x");
  const got = await env.OG_BUCKET.get("probe");
  expect(await got?.text()).toBe("x");
});

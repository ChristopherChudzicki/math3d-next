import type { Env } from "./env";

export default {
  async fetch(
    request: Request,
    _env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/health") return new Response("ok");
    return new Response("not found", { status: 404 });
  },
};

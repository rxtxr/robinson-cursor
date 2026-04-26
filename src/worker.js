// Worker entry — Cloudflare runs this for every request to robinson-cursor.com.
// Routes /api/* to function handlers; everything else is served from the
// static `dist/` build (Astro output) via the ASSETS binding.

import { onRequestPost as feedbackPost } from "../functions/api/feedback.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Pages-Functions-style context shim for the feedback handler so we
    // don't have to fork its code path between Pages and Workers.
    const fnCtx = {
      request,
      env,
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx)
    };

    if (url.pathname === "/api/feedback") {
      if (request.method === "POST") return feedbackPost(fnCtx);
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" }
      });
    }

    // Static assets fall through to the ASSETS binding (Astro output in dist/).
    return env.ASSETS.fetch(request);
  }
};

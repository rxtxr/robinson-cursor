// Cloudflare Pages Function — POST /api/feedback
//
// Receives a feedback submission from any project (currently only day-030
// out-of-africa wires this up). Writes the record to a KV namespace bound
// as FEEDBACK_KV. If no binding exists at runtime, falls back to logging
// the record to the function log so submissions are never lost silently.
//
// After storing, a notification email is sent via Resend if env.RESEND_API_KEY
// is configured. The send happens via ctx.waitUntil so the user-facing
// response isn't blocked by the upstream API call.
//
// Storage: each submission gets a key `feedback:{ISO-timestamp}:{rand6}`
// and a JSON value with the validated payload + server-side adornments
// (CF country, IP). To list / inspect:
//   wrangler kv key list --binding FEEDBACK_KV --remote
//   wrangler kv key get  --binding FEEDBACK_KV --remote "feedback:..."
//
// Required env (set via Cloudflare Pages → Settings → Environment variables):
//   RESEND_API_KEY      — Resend.com API key. Without this, no email is sent.
// Optional env:
//   FEEDBACK_NOTIFY_TO  — recipient (defaults to mareisen@pm.me)
//   RESEND_FROM         — From header (defaults to "OOA Feedback <onboarding@resend.dev>")

const VALID_TYPES = new Set(["correction", "bug", "suggestion", "question", "praise"]);
const MAX_MESSAGE = 4000;
const MAX_EMAIL   = 200;
const MAX_EVENT   = 80;
const MAX_PROJECT = 80;
const MAX_UA      = 300;

function clip(s, n) {
  if (typeof s !== "string") return null;
  return s.slice(0, n);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

async function sendNotification(record, env) {
  if (!env.RESEND_API_KEY) {
    console.log("[feedback] no RESEND_API_KEY env — skipping email");
    return;
  }
  const to       = env.FEEDBACK_NOTIFY_TO || "mareisen@pm.me";
  const from     = env.RESEND_FROM || "OOA Feedback <onboarding@resend.dev>";
  const previewMsg = (record.message || "").replace(/\s+/g, " ").slice(0, 80);
  const subject  = `[ooa] ${record.type}: ${previewMsg}`;

  const lines = [
    `Type:     ${record.type}`,
    `Project:  ${record.project || "-"}`,
    record.event_id   ? `Event:    ${record.event_id}` : null,
    `From:     ${record.email || "(no email given)"}`,
    record.cf_country ? `Country:  ${record.cf_country}` : null,
    `IP:       ${record.ip || "-"}`,
    `UA:       ${record.user_agent || "-"}`,
    `Sent:     ${record.submitted_at}`,
    "",
    "── message ──",
    record.message
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: lines,
        // If the user gave an email, set Reply-To so a one-click reply works.
        reply_to: record.email || undefined
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[feedback] resend ${res.status}: ${txt}`);
    }
  } catch (err) {
    console.error("[feedback] resend error:", err);
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  if (!body || typeof body.message !== "string" || !VALID_TYPES.has(body.type)) {
    return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
  }
  if (body.message.length === 0 || body.message.length > MAX_MESSAGE) {
    return jsonResponse({ ok: false, error: "message_length" }, 400);
  }

  const ts   = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 8);
  const key  = `feedback:${ts}:${rand}`;

  const record = {
    type:        body.type,
    email:       clip(body.email,    MAX_EMAIL),
    message:     clip(body.message,  MAX_MESSAGE),
    event_id:    clip(body.event_id, MAX_EVENT),
    project:     clip(body.project,  MAX_PROJECT),
    user_agent:  clip(body.user_agent, MAX_UA),
    submitted_at: ts,
    ip:          request.headers.get("CF-Connecting-IP") || null,
    cf_country:  (request.cf && request.cf.country) || null
  };

  if (env.FEEDBACK_KV) {
    try {
      await env.FEEDBACK_KV.put(key, JSON.stringify(record));
    } catch (err) {
      console.error("[feedback] KV put failed:", err);
      console.log("[feedback] (KV failed; record below)\n" + JSON.stringify(record));
      return jsonResponse({ ok: false, error: "storage_error" }, 500);
    }
  } else {
    // No KV binding configured — log to function logs as fallback.
    console.log("[feedback] (no FEEDBACK_KV binding; record below)\n" + JSON.stringify(record));
  }

  // Send the email notification AFTER returning the response — waitUntil
  // keeps the handler alive until the upstream call resolves so the user
  // doesn't wait on the Resend round-trip.
  if (waitUntil) {
    waitUntil(sendNotification(record, env));
  } else {
    // Local dev / older runtime fallback — block, but don't fail the
    // submission if the email send breaks.
    sendNotification(record, env).catch(err => console.error(err));
  }

  return jsonResponse({ ok: true, key });
}

// 405 for non-POST so we don't silently swallow GETs etc.
export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }
  // Should never reach here (onRequestPost takes precedence).
}

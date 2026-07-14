# Security Audit — robinson-cursor

**Date:** 2026-07-14
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 0     |
| Moderate | 0     |
| Low      | 2     |

> ✅ **Significant improvement since the 2026-07-11 audit. Both HIGH findings (astro GHSA-jrpj-wcv7-9fh9, GHSA-2pvr-wf23-7pc7) and the MODERATE finding (js-yaml GHSA-h67p-54hq-rp68) no longer appear in `npm audit` — resolved by the `astro@6.4.8` upgrade landed in #13. Remaining issues are 2 LOW. Persisting code-pattern findings from previous audits remain unaddressed.**

---

## Changes Since Last Audit (2026-07-11)

| Status      | Finding |
|-------------|---------|
| ✅ RESOLVED | `astro ≤7.0.0-beta.6` — XSS via Unescaped Spread Props (GHSA-jrpj-wcv7-9fh9) — no longer flagged |
| ✅ RESOLVED | `astro ≤7.0.0-beta.6` — Host Header SSRF in error page fetch (GHSA-2pvr-wf23-7pc7) — no longer flagged |
| ✅ RESOLVED | `js-yaml 4.0.0–4.1.1` — Quadratic-complexity DoS (GHSA-h67p-54hq-rp68) — no longer flagged |
| ♻ PERSISTS | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) LOW |
| ♻ PERSISTS | `astro` flagged LOW (via esbuild) |
| ♻ PERSISTS | `innerHTML` in `day-007-visualaizer/script.js:76` — unfixed |
| ♻ PERSISTS | `innerHTML` with XOR-decoded contact in `src/pages/privacy.astro:134` — unfixed |
| ♻ PERSISTS | `innerHTML` with `marked.parse()` output in `day-030-out-of-africa/main.js:1908` — unfixed |
| 🆕 NEW     | Feedback API (`functions/api/feedback.js`) — no rate limiting; spam/abuse vector |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 2 packages (0 high, 0 moderate, 2 low)

---

### LOW — esbuild: Arbitrary File Read on Windows Dev Server ♻

| Field      | Value |
|------------|-------|
| Package    | `esbuild` |
| Installed  | (transitive via astro) |
| Vulnerable | 0.27.3 – 0.28.0 |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CWE        | CWE-22 (Path Traversal) |
| CVSS Score | 2.5 (Low) |
| Fix        | Upgrade `astro` to 7.0.9 (`npm audit fix --force`, semver major) |

**Description:** The esbuild development server on Windows allows path traversal to read arbitrary files outside the project root. Windows dev environments only; no impact on production (Cloudflare Pages static deployment).

---

### LOW — astro: Flagged via esbuild ♻

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | 6.4.8 |
| Fix        | Upgrade to `astro@7.0.9` |

`astro` is flagged at LOW severity because it bundles the vulnerable `esbuild` version. Upgrading to `astro@7.x` resolves this (semver-major change).

---

## 2. Outdated Dependencies

**Tool:** `npm outdated` + `package-lock.json`

| Package  | In package.json | Wanted (lock) | Latest  | Status |
|----------|-----------------|---------------|---------|--------|
| `astro`  | `^6.4.8`        | 6.4.8         | 7.0.9   | 1 major version behind ⚠ |
| `marked` | `^18.0.0`       | 18.0.6        | 18.0.6  | Current ✅ |

**astro 6.x → 7.x:** The `npm audit fix` fix for the LOW esbuild finding requires upgrading to `astro@7.x` (semver-major). The [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) should be reviewed before upgrading — breaking changes are expected.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with `marked.parse()` on Fetched Markdown ♻

**File:** `projects/day-030-out-of-africa/main.js:1908`
**Severity:** Low (persists from 2026-07-11 audit)

```js
wrap.innerHTML = marked.parse(md);
```

The Markdown content is fetched from the same origin (`CHANGELOG.md`). If the deployed file were ever replaced with attacker-controlled content, the `marked.parse()` output is injected into the DOM without sanitization, enabling XSS.

**Recommended action:** Sanitize `marked` output with `DOMPurify.sanitize()` before assigning to `innerHTML`, or use DOM node construction instead.

---

### LOW — `innerHTML` with External Track Metadata ♻

**File:** `projects/day-007-visualaizer/script.js:76-78`
**Severity:** Low (persists from 2026-04-14 audit)

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

Data is sourced from local `tracks.json`. Low risk as currently implemented (file is not user-controlled). The `track.licenseUrl` is also used unvalidated as an `href`.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` against an `https://` allowlist before constructing the anchor.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Severity:** Low (persists from 2026-04-14 audit)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source data is a build-time constant. No runtime attack surface — the decoded string cannot be influenced by an external party. Flagged as a pattern warning only.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes.

---

### LOW — Feedback API: No Rate Limiting 🆕

**File:** `functions/api/feedback.js`
**Severity:** Low

The `/api/feedback` Cloudflare Pages Function accepts POST requests with no rate limiting, captcha, or abuse throttle. A bot can flood the KV namespace with submissions and send an unbounded number of notification emails (if `RESEND_API_KEY` is set).

Current protections in place:
- Input validation: `type` must be one of 5 allowed values, `message` is capped at 4000 chars
- Cloudflare's global DDoS mitigation applies at the network layer

**Recommended action:** Add a rate limit using Cloudflare's [Rate Limiting Rules](https://developers.cloudflare.com/waf/rate-limiting-rules/) (free tier: up to 10 rules), or implement a Turnstile challenge in the front-end form before the POST is made.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **Committed `.env` files:** None found.
- **`wrangler.jsonc` KV namespace ID** (`d3bd92095a4542698d19734f15ad4bf7`): Non-secret Cloudflare resource identifier — safe to commit.
- **CORS:** Not applicable — static site + Cloudflare Workers. No permissive CORS headers found in production code.
- **Hardcoded secrets:** None found.
- **`RESEND_API_KEY`:** Correctly stored as a Cloudflare Pages environment variable, not committed to the repo.

---

## Recommended Actions (Priority Order)

| Priority | Action |
|----------|--------|
| 🟡 Low | Run `npm audit fix --force` to upgrade `astro` to 7.x. Review the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) first. Test the build with `astro build` and smoke-test locally. |
| 🟡 Low | In `day-030-out-of-africa/main.js:1908`, sanitize `marked.parse()` output before `innerHTML` assignment. |
| 🟡 Low | In `day-007-visualaizer/script.js:76`, replace `innerHTML` with `textContent` for track metadata fields; validate the URL. |
| 🟡 Low | In `privacy.astro:134`, replace `innerHTML` with DOM node construction. |
| ⬜ Info | Consider adding a Cloudflare Rate Limiting Rule on `POST /api/feedback` to reduce spam/abuse risk. |

---

*Scan completed: 2026-07-14 | Tool versions: npm audit (npm 10.x)*

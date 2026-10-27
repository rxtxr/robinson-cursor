# Security Audit — robinson-cursor

**Date:** 2026-10-27
**Previous audit:** 2026-07-11
**Tool versions:** npm audit, manual code review

---

## Summary

| Severity | Count | Change vs. 2026-07-11 |
|---|---|---|
| Critical | 1 | NEW (was 0) |
| High | 11 | ↑ (was 2) |
| Moderate | 0 | ↓ (was 1) |
| Low | 4 | ↑ (was 3) |

**⚠ CRITICAL findings present — significant escalation from previous audit.**

---

## 1. Dependency Vulnerabilities (npm)

### Critical

| Package | Advisory | Issue | Fix |
|---|---|---|---|
| `astro` 6.4.8 | GHSA-26w7-cxv4-gfx2 | **Remote Code Execution via AVIF image optimization during build** | Upgrade to `astro@^7.4.1` |
| `astro` 6.4.8 | GHSA-376h-93r7-7g6f | Authorization bypass from missing path-segment boundary check on `base` | Upgrade to `astro@^7.4.1` |

The RCE fires during `astro build` when AVIF images are processed — this can compromise CI environments (Cloudflare Pages build runners).

### High

#### `astro` (included in upgrade to v7)
| Advisory | Issue |
|---|---|
| GHSA-f48w-9m4c-m7f5 | XSS via unescaped spread attribute names |
| GHSA-7pw4-f3q4-r2p2 | XSS via unescaped `transition:*` directive values on hydrated islands |
| GHSA-4g3v-8h47-v7g6 | Reflected XSS via unescaped View Transition animation properties |
| GHSA-98hj-9722-w3j8 | Reflected/Stored XSS via unescaped `<script>`/`<style>` tag content in JSX/MDX |

#### `sharp` 0.34.5 → fix: upgrade to `0.35.5`
| Advisory | Issue |
|---|---|
| GHSA-f88m-g3jw-g9cj | libvips: CVE-2026-33327/33328/35590/35591 |
| GHSA-rgj7-g3m4-5g8c | libheif: GHSA-g89c-p67h-r497, GHSA-2jg2-4ch7-h545 |
| GHSA-wq5f-xc86-pv6w | librsvg: CVE-2026-96889 |

#### Other high-severity transitive deps (resolved by `npm audit fix` after main upgrades)
| Package | Advisory | Issue |
|---|---|---|
| `devalue` | 8 advisories | DoS, shared memory serialization, quadratic expansion, unhandled rejection, null-prototype bypass |
| `vite` | GHSA-698v-4r3x-3vcv + 4 more | Windows `%`-escaping, arbitrary command exec, `fs.existsSync` bypass, cross-origin script exec, path bypass |
| `js-yaml` | GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh | Quadratic CPU via `!!omap`, `maxTotalMergeKeys` bypass |
| `postcss` | GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | Path traversal via sourceMappingURL |
| `smol-toml` | GHSA-7w5x-hrqm-74c2, GHSA-r4xh-jqrq-34v2 | DoS via malformed TOML, quadratic parse |
| `nanoid` | GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8 | Infinite loop on negative/zero size |
| `svgo` | GHSA-2p49-hgcm-8545 + 2 more | Incomplete `removeScripts` sanitization |
| `zod` | GHSA-mrhx-c7xc-m3w5 | Memory exhaustion on oversized constrained collections |
| `source-map-js` | GHSA-68fv-2mgg-jv7q | Event-loop DoS via indexed source-map offsets |
| `http-cache-semantics` | GHSA-ch52-4w7c-c8xp | Cross-user cached response disclosure via `max-stale` |

### Low

| Package | Advisory | Issue |
|---|---|---|
| `esbuild` | GHSA-g7r4-m6w7-qqqr | Arbitrary file read on Windows dev server (dev/Windows only) |

---

## 2. Outdated Dependencies

| Package | Installed | Latest | Action |
|---|---|---|---|
| `astro` | 6.4.8 | **7.4.1** | Upgrade required (security) |
| `sharp` | 0.34.5 | 0.35.5 | Upgrade required (security) |
| `marked` | 18.0.4 | 18.1.2 | Minor patch only — no action urgent |

---

## 3. Code Security Findings

All findings below persist from the 2026-07-11 audit (no new findings).

### [LOW] `innerHTML` with `marked.parse()` on same-origin fetched Markdown

**File:** `projects/day-030-out-of-africa/main.js:1908`
```js
wrap.innerHTML = marked.parse(md);
```
`CHANGELOG.md` is fetched from same origin. A compromised deploy serving malicious content could result in XSS.

**Fix:** Wrap with `DOMPurify.sanitize()`:
```js
wrap.innerHTML = DOMPurify.sanitize(marked.parse(md));
```

### [LOW] `innerHTML` with external track metadata

**File:** `projects/day-007-visualaizer/script.js:76`
```js
lic.innerHTML = track.licenseUrl ? `<a href="${track.licenseUrl}"...>${track.license}</a> — ${track.artist}` : ...
```
Data from local `tracks.json` — low risk, but should use DOM construction.

### [LOW] `innerHTML` with XOR-decoded build-time contact data

**File:** `src/pages/privacy.astro:134`
```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```
Build-time constant, no external input — low risk. Replace with DOM node construction for defense in depth.

### [LOW] Feedback API has no rate limiting

**File:** `functions/api/feedback.js`
The POST handler validates payload shape but applies no IP-based rate limiting. A bot can exhaust KV quota and spam email notifications via `RESEND_API_KEY`.

**Fix:** Add a Cloudflare WAF rate limiting rule on `POST /api/feedback` (e.g. 10 req/min per IP).

---

## 4. Configuration Review

- **`.env` files:** Not committed. `.env` and `.env.production` are in `.gitignore` ✅
- **`wrangler.jsonc`:** KV namespace ID committed — non-secret resource identifier, safe ✅
- **Dockerfile:** Not present ✅
- **CORS:** No permissive CORS headers ✅
- **Hardcoded secrets:** None found — `RESEND_API_KEY` sourced from env at runtime ✅

---

## 5. Recommended Actions (Priority Order)

| Priority | Action |
|---|---|
| 🔴 Critical | `npm install astro@^7.4.1` — fixes RCE in build pipeline, authorization bypass, and all XSS |
| 🔴 High | `npm install sharp@^0.35.5` — fixes libvips/libheif/librsvg CVEs |
| 🔴 High | `npm audit fix` after above — resolves devalue, vite, postcss, nanoid, svgo, zod, etc. |
| 🟡 Low | `day-030/main.js:1908` — sanitize `marked.parse()` output with DOMPurify |
| 🟡 Low | `day-007/script.js:76` — replace `innerHTML` template with DOM construction |
| 🟡 Low | `privacy.astro:134` — replace `innerHTML` with DOM construction |
| 🟡 Low | Add Cloudflare WAF rate limiting rule on `POST /api/feedback` |

---

*Generated by automated security scan on 2026-10-27*

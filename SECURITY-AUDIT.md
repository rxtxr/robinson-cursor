# Security Audit — robinson-cursor

**Date:** 2026-06-30
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-05-19

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 3     |
| Medium   | 1     |
| Low      | 1     |

> ⚠ **3 High-severity findings — 2 new astro CVEs (XSS + SSRF) and vite path traversal persisting from 2026-05-19. Astro upgrade to ≥6.4.6 resolves all of them.**

---

## Changes Since Last Audit (2026-05-19)

| Status      | Finding |
|-------------|---------|
| 🆕 NEW HIGH | `astro <6.4.6` — XSS via unescaped attribute names in spread props (GHSA-jrpj-wcv7-9fh9) |
| 🆕 NEW HIGH | `astro <6.4.6` — Host header SSRF in prerendered error page fetch (GHSA-2pvr-wf23-7pc7) |
| 🆕 NEW MOD  | `js-yaml 4.0.0–4.1.1` — Quadratic-complexity DoS via repeated YAML merge aliases (GHSA-h67p-54hq-rp68) |
| 🆕 NEW LOW  | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) |
| ♻ PERSISTS  | `vite 7.0.0–7.3.4` — 2 HIGH: `server.fs.deny` bypass + NTLMv2 hash disclosure (GHSA-fx2h-pf6j-xcff, GHSA-v6wh-96g9-6wx3) — flagged 2026-05-19, **not yet fixed** |
| ✅ RESOLVED | `devalue` — DoS via sparse array (GHSA-77vg-94rm-hx3p) — no longer detected |
| ✅ RESOLVED | `defu` — Prototype Pollution (GHSA-737v-mqg7-c878) — no longer detected |
| ✅ RESOLVED | `astro` — XSS in `define:vars` (GHSA-j687-52p2-xcff) — no longer detected |
| ✅ RESOLVED | `astro` — Server island replay (GHSA-xr5h-phrj-8vxv) — no longer detected |
| ✅ RESOLVED | `postcss` — XSS via `</style>` (GHSA-qx2v-qp2m-jg93) — no longer detected |
| ✅ RESOLVED | `marked` 1 major behind — now current (18.x) |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 4 packages (2 high astro, 1 high vite, 1 moderate, 1 low)

---

### HIGH — astro: XSS via Unescaped Attribute Names in Spread Props 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` <6.4.6 |
| Installed  | ^6.1.1 (resolves to 6.1.x) |
| Advisory   | [GHSA-jrpj-wcv7-9fh9](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9) |
| CWE        | CWE-79 (XSS) |
| CVSS       | 4.2 (Medium-class) |
| Fixed in   | astro 6.4.6 |

**Description:** When using spread props (`{...obj}`) in Astro component templates, attribute names from the spread object are not properly HTML-escaped. An attacker who can influence the keys of a spread object (e.g. via build-time data or SSR user input) can inject arbitrary HTML attributes, leading to XSS.

**Impact for this site:** Static output (`output: 'static'`), so SSR exploitation is not possible. Risk exists if any build-time data with untrusted keys is fed into spread props.

**Recommended action:** `npm install astro@^6.4.6`

---

### HIGH — astro: Host Header SSRF in Prerendered Error Page Fetch 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` <6.4.6 |
| Installed  | ^6.1.1 (resolves to 6.1.x) |
| Advisory   | [GHSA-2pvr-wf23-7pc7](https://github.com/advisories/GHSA-2pvr-wf23-7pc7) |
| CWE        | CWE-918 (SSRF), CWE-20 |
| CVSS       | 7.5 (High) |
| Fixed in   | astro 6.4.6 |

**Description:** Astro's prerendered error pages make an internal `fetch()` using the `Host` header from the incoming request without validation. An attacker can supply a crafted `Host` header to redirect the internal fetch to an arbitrary server, enabling SSRF.

**Impact for this site:** Site is deployed to Cloudflare Pages as static HTML. Direct SSRF exploitation requires a rendering path that makes server-side fetches (not applicable here), but fix is still warranted.

**Recommended action:** `npm install astro@^6.4.6`

---

### HIGH — vite: `server.fs.deny` Bypass + NTLMv2 Hash Disclosure ♻ (persists from 2026-05-19)

| Field      | Value |
|------------|-------|
| Package    | `vite` 7.0.0–7.3.4 |
| GHSAs      | [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff), [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) |
| Fixed in   | vite 7.3.5+ |

**Findings (dev server only):**
- **`server.fs.deny` bypass on Windows** — Windows alternate filesystem paths bypass the allowlist, enabling arbitrary file reads during `astro dev`.
- **NTLMv2 hash disclosure** — `launch-editor` can open UNC paths on Windows, leaking NTLM credentials to an attacker on the local network when the dev server is running.

These were flagged in the 2026-05-19 audit and remain unaddressed. The astro upgrade to ≥6.4.6 may pull in a fixed vite — verify with `npm audit` after upgrading.

**Recommended action:**
```bash
npm install astro@^6.4.6
npm audit  # verify vite is resolved; if not:
npm install vite@^7.3.5 --save-dev
```

---

### MODERATE — js-yaml: Quadratic-Complexity DoS via Merge Aliases 🆕

| Field      | Value |
|------------|-------|
| Package    | `js-yaml` 4.0.0–4.1.1 |
| Advisory   | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) |
| CWE        | CWE-407 |
| CVSS       | 5.3 (Medium) |
| Fixed in   | js-yaml 4.1.2+ |

**Description:** Processing YAML with many repeated merge-key aliases (`<<: *anchor`) triggers quadratic time complexity, enabling a DoS via crafted YAML. `js-yaml` is a transitive dependency (via astro build tooling). Risk is low since no user-controlled YAML is read at build time for this project.

**Recommended action:** Resolved by updating astro to ≥6.4.6 (which pulls in a patched js-yaml).

---

### LOW — esbuild: Arbitrary File Read on Windows Dev Server 🆕

| Field      | Value |
|------------|-------|
| Package    | `esbuild` 0.27.3–0.28.0 |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CVSS       | 2.5 (Low) — Windows-only |

**Description:** Arbitrary files can be read via path-traversal requests to the esbuild dev server on Windows. Linux/macOS unaffected.

**Recommended action:** Resolved by updating astro to ≥6.4.6 (pulls in esbuild ≥0.28.1).

---

## 2. Outdated Dependencies

| Package  | Installed | Wanted | Latest | Gap             |
|----------|-----------|--------|--------|-----------------|
| `astro`  | ~6.1.x    | 6.4.8  | 7.0.3  | 1+ major ⚠     |
| `marked` | 18.x      | 18.0.5 | 18.0.5 | Current ✅     |

`astro` is 1 major version behind (6.x vs 7.x). Security fixes are available in 6.4.6–6.4.8 — upgrading within the 6.x range is a non-breaking fix. A 7.x upgrade can follow as a separate planned migration.

---

## 3. Code Security Patterns

### innerHTML — Low Risk (site source pages)

| Location | Content | Risk |
|----------|---------|------|
| `src/pages/privacy.astro:134` | XOR-decoded contact info from build-time constant | Low — not user-controlled |
| `src/pages/projects/[slug].astro:193` | Static HTML string literal | Low |
| `src/pages/index.astro:159` | Static HTML string literal | Low |

None of these derive from user input or external data at runtime. The `privacy.astro` pattern (carried over from prior audits) uses `innerHTML` unnecessarily — `textContent` + DOM nodes would be safer — but no XSS attack surface exists.

### innerHTML — Frozen Projects

Multiple `innerHTML` usages in `projects/day-028`, `day-029`, `day-030` (carried forward from prior audits). Projects are frozen per repo convention and isolated from each other.

- `day-030/main.js:1908`: `wrap.innerHTML = marked.parse(md)` — the `md` is fetched from a same-origin `CHANGELOG.md` (controlled file, not user input). Low risk.
- `day-028`, `day-029`: Template literals with controlled string interpolation (artist metadata from fetched JSON on same origin). Low risk.

**No actionable XSS surface identified.**

### Cloudflare Function — `functions/api/feedback.js`

Reviewed:
- ✅ Type allowlist (`VALID_TYPES`) prevents invalid input
- ✅ All string fields clipped with `clip()` before storage
- ✅ User email used only as `reply_to`, not rendered as HTML
- ✅ KV key uses ISO timestamp + 6-char random (no collisions)
- ✅ RESEND_API_KEY and FEEDBACK_NOTIFY_TO read from environment variables — not hardcoded

No security issues found.

### Hardcoded Secrets

None found. `.env` and `.env.production` correctly excluded by `.gitignore`.

---

## 4. Configuration Review

| Item | Status |
|------|--------|
| `.env` committed | No ✅ |
| `.gitignore` covers `.env` | Yes ✅ |
| Dockerfile | Not present ✅ |
| `wrangler.jsonc` secrets | None — KV namespace ID is non-sensitive ✅ |
| Astro output mode | `'static'` — minimizes server-side attack surface ✅ |
| CORS config | Not applicable (static site) ✅ |

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| P0 — Immediate | `npm install astro@^6.4.6` — fixes 2 HIGH CVEs (XSS + SSRF) and pulls in patched js-yaml, esbuild |
| P1 — This week | Run `npm audit` after update; if vite still flagged, `npm install vite@^7.3.5 --save-dev` |
| P2 — Planned | Evaluate astro 7.x upgrade (review migration guide for breaking changes) |
| P3 — Cosmetic | Replace `innerHTML` in `privacy.astro` with `textContent` + DOM nodes |

Quick fix:
```bash
npm install astro@^6.4.6
npm audit
```

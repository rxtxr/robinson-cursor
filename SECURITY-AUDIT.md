# Security Audit — robinson-cursor

**Date:** 2026-06-23
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-05-19

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Moderate | 1     |
| Low      | 1     |

> ⚠ **2 High-severity findings. Some vulnerabilities flagged in the May 2026 audit (defu, devalue, postcss XSS, astro define:vars XSS) appear to have been resolved — either via upstream patches or changed resolution. New advisories introduced since last scan.**

---

## Changes Since Last Audit (2026-05-19)

| Status       | Finding |
|--------------|---------|
| 🆕 NEW HIGH  | `astro <=6.4.5` — Host header SSRF in prerendered error page fetch (GHSA-2pvr-wf23-7pc7) |
| 🆕 NEW MOD   | `astro <=6.4.5` — XSS via Unescaped Attribute Names in Spread Props (GHSA-jrpj-wcv7-9fh9) |
| 🆕 NEW MOD   | `js-yaml <=4.1.1` — Quadratic-complexity DoS in merge key handling (GHSA-h67p-54hq-rp68) |
| 🆕 NEW LOW   | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) |
| ♻ PERSISTS  | `vite` — `server.fs.deny` bypass on Windows (GHSA-fx2h-pf6j-xcff) |
| ♻ PERSISTS  | `vite` — NTLMv2 hash disclosure via launch-editor (GHSA-v6wh-96g9-6wx3) |
| ✅ RESOLVED  | `defu <=6.1.4` — Prototype Pollution (GHSA-737v-mqg7-c878) — no longer reported |
| ✅ RESOLVED  | `devalue 5.6.3–5.8.0` — DoS via sparse array (GHSA-77vg-94rm-hx3p) — no longer reported |
| ✅ RESOLVED  | `astro <=6.1.9` — `define:vars` XSS (GHSA-j687-52p2-xcff) — no longer reported |
| ✅ RESOLVED  | `astro <=6.1.9` — Server island replay (GHSA-xr5h-phrj-8vxv) — no longer reported |
| ✅ RESOLVED  | `postcss <8.5.10` — XSS via unescaped `</style>` (GHSA-qx2v-qp2m-jg93) — no longer reported |
| ♻ PERSISTS  | `innerHTML` in `day-007-visualaizer/script.js:76` — LOW (unfixed) |
| ♻ PERSISTS  | `innerHTML` in `src/pages/privacy.astro:134` — LOW (unfixed) |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit` (npm 10.x)
**Lock file:** `package-lock.json`
**Total advisories:** 4 packages (2 high, 1 moderate, 1 low)

---

### HIGH — astro: Host Header SSRF in Prerendered Error Page Fetch 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | ≤ 6.4.5 |
| Advisory   | [GHSA-2pvr-wf23-7pc7](https://github.com/advisories/GHSA-2pvr-wf23-7pc7) |
| CWE        | CWE-20 (Improper Input Validation), CWE-918 (SSRF) |
| CVSS Score | 7.5 High — CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:L/A:N |
| Fix        | `npm audit fix` (upgrades astro to ≥ 6.4.6) |

**Description:** Astro's prerendered error page handler does not validate the `Host` header when making internal fetch requests. An attacker can craft a request with a forged `Host` header, causing Astro's server to make server-side requests to internal or arbitrary URLs (SSRF). This is particularly relevant for Cloudflare Pages deployments with SSR or server islands enabled.

**Exploitability:** This site currently uses Astro in mostly-static mode; SSR endpoints in `functions/` are Cloudflare Workers, not Astro server routes. Risk is **low to moderate** in the current deployment, but the patch is safe and required.

---

### HIGH — vite: Multiple Dev Server Vulnerabilities ♻

| Field      | Value |
|------------|-------|
| Package    | `vite` |
| Installed  | 7.0.0 – 7.3.3 |
| Fix        | `npm audit fix` |

Indirect dependency of `astro`. Both advisories were present in some form in the May 2026 audit.

#### 1. `server.fs.deny` Bypass on Windows Alternate Paths
- **Advisory:** [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
- **CWE:** CWE-22, CWE-200
- **Description:** The `server.fs.deny` restriction can be bypassed on Windows using alternate path representations (e.g., short names, UNC paths), allowing arbitrary file reads.

#### 2. NTLMv2 Hash Disclosure via launch-editor UNC Paths
- **Advisory:** [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3)
- **CWE:** CWE-73, CWE-522
- **Description:** The bundled `launch-editor` helper can be triggered via a crafted request to open a UNC path, causing Windows to initiate SMB authentication and leak the NTLMv2 hash.

> **Note:** Both vite advisories affect `astro dev` only (dev server) and have no impact on Cloudflare Pages production deployments.

---

### MODERATE — astro: XSS via Unescaped Attribute Names in Spread Props 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | ≤ 6.4.5 |
| Advisory   | [GHSA-jrpj-wcv7-9fh9](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9) |
| CWE        | CWE-79 (XSS) |
| CVSS Score | 4.2 Moderate — CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N |
| Fix        | `npm audit fix` (same astro upgrade to ≥ 6.4.6) |

**Description:** When using Astro's spread props syntax (`{...props}`) with attribute names containing characters like `>` or `"`, Astro does not properly escape the attribute name in the rendered HTML output. If an attacker can control prop names (e.g., from untrusted data passed to a component), this could allow attribute injection or XSS.

**Exploitability for this site:** Prop names are statically defined in component code; no user-controlled spread props detected. Risk is **low** but the patch is free.

---

### MODERATE — js-yaml: Quadratic Complexity DoS in Merge Key Handling 🆕

| Field      | Value |
|------------|-------|
| Package    | `js-yaml` |
| Installed  | ≤ 4.1.1 |
| Advisory   | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) |
| CWE        | CWE-407 (Inefficient Algorithmic Complexity) |
| CVSS Score | 5.3 Moderate — CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L |
| Fix        | `npm audit fix` |

**Description:** `js-yaml`'s YAML merge key (`<<`) handling is susceptible to quadratic-complexity parsing when deeply nested aliases are used. A specially crafted YAML input can cause extreme CPU usage (DoS). Indirect dependency (used by Astro's build pipeline for internal config parsing).

**Exploitability:** Only exploitable if user-controlled YAML is parsed by `js-yaml` at runtime. This site has no such pathway — the risk is build-time only. Patch is still recommended.

---

### LOW — esbuild: Arbitrary File Read on Windows Dev Server 🆕

| Field      | Value |
|------------|-------|
| Package    | `esbuild` |
| Installed  | 0.27.3 – 0.28.0 |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CWE        | CWE-22 (Path Traversal) |
| CVSS Score | 2.5 Low — CVSS:3.1/AV:L/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:N |
| Fix        | `npm audit fix` |

**Description:** esbuild's development server on Windows allows reading arbitrary files via specially crafted paths. Affects `astro dev` on Windows only; no impact on Linux/Mac development or Cloudflare Pages production.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package  | In package.json | Wanted  | Latest  | Status |
|----------|-----------------|---------|---------|--------|
| `astro`  | ^6.1.1          | 6.4.8   | 7.0.0   | **1 major version behind** ⚠ (also has in-range CVEs) |
| `marked` | ^18.0.0         | 18.0.5  | 18.0.5  | ✅ Up to date (was behind in May audit — now resolved) |

**`astro` 6.x → 7.0.0:** Astro 7 is the latest major. An in-range upgrade to `astro@^6.4.8` will fix the SSRF and XSS CVEs without a breaking change. Consider planning a full upgrade to Astro 7 separately.

---

## 3. Code Security Patterns

### LOW — `innerHTML` Assignment with JSON Track Data ♻

**File:** `projects/day-007-visualaizer/script.js:76-78`
**Severity:** Low (carried over from 2026-05-19 audit, **still unfixed**)

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

`track.*` values come from `tracks.json` fetched locally. Risk is low (controlled data source) but the pattern would become dangerous if the data source changes.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` against an `https://` allowlist before constructing the anchor.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Severity:** Low (carried over from 2026-05-19 audit, **still unfixed**)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

The source data is a build-time constant; there is no runtime attack surface. However, `innerHTML` is unnecessarily risky.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes, or `insertAdjacentHTML` after sanitizing.

---

### LOW — `innerHTML` with Error Message in WASM Init

**File:** `projects/day-019-essentia-live/index.html:345`
**Severity:** Low (new finding)

```js
document.getElementById('loading').innerHTML =
  `<div style="color:var(--accent2)">WASM load failed: ${e.message}</div>`;
```

`e.message` comes from a caught WASM/JS error. Error messages are typically controlled by the runtime and not attacker-controlled in this context, but injecting untrusted data into `innerHTML` is a code smell.

**Recommended action:** Use `textContent` for `e.message` and build the `<div>` with DOM methods.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** ✅ Yes — correctly excluded.
- **`.env` committed:** ✅ No tracked `.env` files found.
- **`wrangler.jsonc`:** ✅ No secrets; contains only deployment name and compatibility date.
- **`functions/api/feedback.js`:** ✅ Uses `env.RESEND_API_KEY` from Cloudflare Workers secrets — not hardcoded.
- **CORS:** Not applicable — primarily a static site; Cloudflare Workers use default CORS policies.
- **Hardcoded secrets:** ✅ None found.

---

## Recommended Actions (Priority Order)

1. **[High — Immediate]** Run `npm audit fix` to patch `astro` (SSRF + XSS), `vite` (fs bypass + NTLMv2), `js-yaml` (DoS), and `esbuild` (file read). Run `astro build` locally and verify the site builds cleanly after the upgrade.

2. **[High]** Update `astro` constraint in `package.json` from `^6.1.1` to `^6.4.8` and run `npm install` to confirm the advisory-free version is resolved. Consider planning a full upgrade to Astro 7 for a future sprint.

3. **[Low]** In `day-007-visualaizer/script.js:76-78`, replace `innerHTML` with `textContent` for `track.license` and `track.artist`. This finding has been open since the April 2026 audit.

4. **[Low]** In `src/pages/privacy.astro:134`, replace `innerHTML` with DOM node construction. This finding has been open since the April 2026 audit.

5. **[Low]** In `day-019-essentia-live/index.html:345`, replace `innerHTML = \`...${e.message}...\`` with `textContent`.

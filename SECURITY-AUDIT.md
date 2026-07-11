# Security Audit — robinson-cursor

**Date:** 2026-07-11
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
| Low      | 2     |

> ⚠ **2 High-severity findings. Several vulnerabilities from the 2026-05-19 audit have been resolved; new issues introduced by dependency updates.**

---

## Changes Since Last Audit (2026-05-19)

| Status       | Finding |
|--------------|---------|
| ✅ RESOLVED  | `defu ≤6.1.4` — Prototype Pollution HIGH (GHSA-737v-mqg7-c878) — no longer flagged |
| ✅ RESOLVED  | `devalue 5.6.3–5.8.0` — DoS via sparse array (GHSA-77vg-94rm-hx3p) — no longer flagged |
| ✅ RESOLVED  | `postcss <8.5.10` — XSS in CSS stringify (GHSA-qx2v-qp2m-jg93) — no longer flagged |
| ✅ RESOLVED  | `astro ≤6.1.9` — XSS in `define:vars` (GHSA-j687-52p2-xcff) — no longer flagged |
| ✅ RESOLVED  | `astro ≤6.1.9` — Server island replay (GHSA-xr5h-phrj-8vxv) — no longer flagged |
| ✅ RESOLVED  | `marked` 1 major version behind (now at `^18.0.0` — current) |
| 🆕 NEW HIGH  | `astro ≤7.0.0-beta.6` — XSS via Unescaped Attribute Names in Spread Props (GHSA-jrpj-wcv7-9fh9) |
| 🆕 NEW HIGH  | `astro ≤7.0.0-beta.6` — Host header SSRF in prerendered error page fetch (GHSA-2pvr-wf23-7pc7) |
| 🆕 NEW LOW   | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) |
| 🆕 NEW MOD   | `js-yaml 4.0.0–4.1.1` — Quadratic-complexity DoS via merge key aliases (GHSA-h67p-54hq-rp68) |
| ♻ PERSISTS  | `vite 7.0.0–7.3.x` — 2 HIGH advisories (NTLMv2, fs.deny bypass) — updated advisory set |
| ♻ PERSISTS  | `innerHTML` in `day-007-visualaizer/script.js:76` — unfixed |
| ♻ PERSISTS  | `innerHTML` with XOR-decoded contact in `src/pages/privacy.astro:134` — unfixed |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 4 packages (2 high, 1 moderate, 1 low)

---

### HIGH — astro: XSS via Unescaped Attribute Names in Spread Props 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | ≤ 7.0.0-beta.6 |
| Advisory   | [GHSA-jrpj-wcv7-9fh9](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9) |
| CWE        | CWE-79 (XSS) |
| CVSS Score | 4.2 (High) |
| Fix        | `npm audit fix` |

**Description:** When object spread props (`{...obj}`) are used in Astro component templates, attribute names taken from user-controlled or external data are not properly escaped in the rendered HTML. An attacker who can influence the keys of a spread object passed to a component can inject arbitrary HTML attributes, potentially enabling XSS.

**Exploitability for this site:** Review components in `src/` that use spread props (`{...someObject}`) with externally-sourced keys. If all spread usage is from static/build-time objects, exploitability is low — the upgrade is still recommended.

---

### HIGH — astro: Host Header SSRF in Prerendered Error Page Fetch 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | ≤ 7.0.0-beta.6 |
| Advisory   | [GHSA-2pvr-wf23-7pc7](https://github.com/advisories/GHSA-2pvr-wf23-7pc7) |
| CWE        | CWE-918 (SSRF) |
| CVSS Score | 7.5 (High) |
| Fix        | `npm audit fix` |

**Description:** During prerendering, Astro's error page handler makes an internal HTTP fetch using the incoming `Host` header without validation. An attacker who can send a crafted request with a spoofed `Host` header can cause the server to make requests to arbitrary internal or external endpoints (Server-Side Request Forgery).

**Exploitability for this site:** This vulnerability affects the Astro SSR/prerender build pipeline and any dev server (`astro dev`). Since the production site is deployed as static files on Cloudflare Pages, the production risk is low. However, any CI environment running `astro build` or `astro dev` with network access should be patched.

---

### HIGH — vite: Multiple Vulnerabilities ♻ (updated advisory set)

| Field      | Value |
|------------|-------|
| Package    | `vite` |
| Installed  | 7.0.0 – 7.3.3 |
| Fix        | `npm audit fix` |

Indirect dependency of `astro`. Affects dev server only (`astro dev`); no impact on Cloudflare Pages static deployments.

1. **NTLMv2 Hash Disclosure via UNC Paths (Windows)** — [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3)
   The `launch-editor` dependency resolves UNC paths without sanitization, leaking NTLMv2 credentials on Windows.

2. **`server.fs.deny` Bypass via Windows Alternate Paths** — [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
   The `server.fs.deny` restriction can be bypassed using alternate path representations on Windows.

---

### MODERATE — js-yaml: Quadratic-Complexity DoS via Merge Keys 🆕

| Field      | Value |
|------------|-------|
| Package    | `js-yaml` |
| Installed  | 4.0.0 – 4.1.1 |
| Advisory   | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) |
| CWE        | CWE-400 (Uncontrolled Resource Consumption) |
| CVSS Score | 5.3 (Moderate) |
| Fix        | `npm audit fix` |

**Description:** `js-yaml` is vulnerable to a quadratic-complexity denial-of-service when parsing YAML documents that use merge keys (`<<`) with repeated aliases. A crafted YAML file can cause CPU exhaustion. `js-yaml` is an indirect dependency of `astro`. If YAML files are parsed from untrusted sources at build time, this could be exploited; for static build inputs, impact is low.

---

### LOW — esbuild: Arbitrary File Read on Windows Dev Server 🆕

| Field      | Value |
|------------|-------|
| Package    | `esbuild` |
| Installed  | 0.27.3 – 0.28.0 |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CWE        | CWE-22 (Path Traversal) |
| CVSS Score | 2.5 (Low) |
| Fix        | `npm audit fix` |

**Description:** The esbuild development server on Windows allows path traversal to read arbitrary files. Windows-only; dev environment only.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated` + `package-lock.json`

| Package  | In package.json | Wanted (lock) | Latest  | Status |
|----------|-----------------|---------------|---------|--------|
| `astro`  | `^6.1.1`        | 6.4.8         | 7.0.7   | 1 major version behind ⚠ (see security note) |
| `marked` | `^18.0.0`       | 18.0.6        | 18.0.6  | Current ✅ |

**astro 6.x → 7.x:** The current lock resolves `^6.1.1` to 6.4.8. The latest is 7.0.7. While not a security requirement today, the HIGH advisories above (GHSA-jrpj-wcv7-9fh9, GHSA-2pvr-wf23-7pc7) affect all `≤7.0.0-beta.6`. After running `npm audit fix`, verify that astro is brought to ≥7.0.1 or the latest patched 6.x release.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with `marked.parse()` on Fetched Markdown 🆕

**File:** `projects/day-030-out-of-africa/main.js:1908`
**Severity:** Low

```js
const [md, marked] = await Promise.all([
  fetch("CHANGELOG.md", { cache: "no-cache" }).then(r => r.text()),
  loadMarked()
]);
wrap.innerHTML = marked.parse(md);
```

`CHANGELOG.md` is fetched from the same origin (`/embed/day-030-out-of-africa/CHANGELOG.md`). If this file is ever replaced with attacker-controlled content (e.g., via a compromised deploy), the `marked.parse()` output is injected directly into the DOM without sanitization, enabling XSS.

**Recommended action:** Pass `marked` output through `DOMPurify.sanitize()` before assignment, or use the `sanitize` option available in newer `marked` versions (though the dedicated sanitizer is preferred).

---

### LOW — `innerHTML` with External Track Metadata ♻

**File:** `projects/day-007-visualaizer/script.js:76-78`
**Severity:** Low (persists from 2026-04-14 audit)

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

Data is sourced from local `tracks.json`. Low risk as currently implemented.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` against an `https://` allowlist before constructing the anchor.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Severity:** Low (persists from 2026-04-14 audit)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source data is a build-time constant. No runtime attack surface.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **Committed `.env` files:** None found.
- **`wrangler.jsonc`:** Contains a KV namespace ID (`d3bd92095a4542698d19734f15ad4bf7`) — this is a non-secret Cloudflare resource identifier, safe to commit.
- **CORS:** Not applicable — static site + Cloudflare Workers. No permissive CORS headers found.
- **Hardcoded secrets:** None found.

---

## Recommended Actions (Priority Order)

| Priority | Action |
|----------|--------|
| 🔴 High | Run `npm audit fix` to patch `astro`, `vite`, `js-yaml`, `esbuild`. This addresses all 4 vulnerabilities in a single command. Run `astro build` and smoke-test locally after. |
| 🔴 High | Verify post-fix that `astro` is upgraded to a version > 7.0.0-beta.6 (both HIGH CVEs affect ≤7.0.0-beta.6). |
| 🟡 Low | In `day-030-out-of-africa/main.js:1908`, sanitize `marked.parse()` output before `innerHTML` assignment. |
| 🟡 Low | In `day-007-visualaizer/script.js:76`, replace `innerHTML` with `textContent` for track metadata fields. |
| 🟡 Low | In `privacy.astro:134`, replace `innerHTML` with DOM node construction. |

---

*Scan completed: 2026-07-11 | Tool versions: npm audit (npm 10.x)*

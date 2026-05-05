# Security Audit — robinson-cursor

**Date:** 2026-05-05
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Medium   | 2     |
| Low      | 2     |

> ⚠ **High-severity findings persist from prior audits.** Two packages with known CVEs remain unpatched. Two new moderate-severity advisories added since the 2026-04-14 audit (`astro` XSS and `postcss` XSS).

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit` (npm 10.9.7)
**Lock file:** `package-lock.json`
**Total advisories:** 4 (across 4 packages)

### HIGH — defu: Prototype Pollution *(persists from 2026-04-14)*

| Field       | Value |
|-------------|-------|
| Package     | `defu` |
| Affected    | ≤ 6.1.4 |
| Advisory    | [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878) |
| CWE         | CWE-1321 (Prototype Pollution) |
| CVSS        | 7.5 (High) |
| Fix         | `npm audit fix` |

**Description:** `defu` allows prototype pollution via the `__proto__` key in a defaults argument. An attacker who can control input to a `defu()` call can pollute `Object.prototype`, potentially affecting all objects in the process. Indirect dependency pulled in by `astro`.

---

### HIGH — vite: Multiple Vulnerabilities *(persists from 2026-04-14)*

| Field       | Value |
|-------------|-------|
| Package     | `vite` |
| Affected    | 7.0.0 – 7.3.1 |
| Fix         | `npm audit fix` |

Indirect dependency pulled in by `astro`. All three advisories affect the **development server only** and do not affect production builds or Cloudflare Pages deployments.

#### 1. Path Traversal in Optimized Deps `.map` Handling
- **Advisory:** [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)
- **Severity:** High — CWE-22 (Path Traversal)
- **Description:** Vite dev server improperly handles `.map` requests, allowing path traversal to read arbitrary files.

#### 2. `server.fs.deny` Bypass with Query Parameters
- **Advisory:** [GHSA-v2wj-q39q-566r](https://github.com/advisories/GHSA-v2wj-q39q-566r)
- **Severity:** High — CWE-284 (Improper Access Control)
- **Description:** `server.fs.deny` restrictions can be bypassed by appending query parameters.

#### 3. Arbitrary File Read via Dev Server WebSocket
- **Advisory:** [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583)
- **Severity:** High — CWE-200 (Exposure of Sensitive Information)
- **Description:** The WebSocket handler can be exploited to read arbitrary files without authentication.

---

### MODERATE — astro: XSS via `define:vars` *(new since 2026-04-14)*

| Field       | Value |
|-------------|-------|
| Package     | `astro` |
| Affected    | < 6.1.6 |
| Advisory    | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) |
| Fix         | `npm audit fix` |

**Description:** Incomplete sanitization of `</script>` tag sequences inside `define:vars` directives can allow XSS injection into the rendered HTML. Affects any page that uses `define:vars` with user-controlled or externally sourced data.

---

### MODERATE — postcss: XSS via Unescaped `</style>` in CSS Output *(new since 2026-04-14)*

| Field       | Value |
|-------------|-------|
| Package     | `postcss` |
| Affected    | < 8.5.10 |
| Advisory    | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) |
| Fix         | `npm audit fix` |

**Description:** PostCSS's CSS stringifier does not escape `</style>` sequences, allowing injected CSS to break out of `<style>` blocks in rendered HTML. Exploitable if any PostCSS-processed CSS is derived from user-controlled input.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package  | Installed | Latest | Status                          |
|----------|-----------|--------|---------------------------------|
| `marked` | 17.0.5    | 18.0.3 | **1 major version behind** ⚠    |
| `astro`  | 6.1.1     | 6.2.2  | Minor versions behind (security patch available) |

**`marked` 17 → 18:** Crossed a major version boundary. Upgrade is recommended to receive security fixes not backported to v17. Review the [marked v18 changelog](https://github.com/markedjs/marked/releases) for breaking changes before upgrading.

**`astro` 6.1.1 → 6.2.2:** Version 6.1.6 includes the XSS fix noted above (GHSA-j687-52p2-xcff). `npm audit fix` will handle this.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with XOR-Decoded Contact Data *(persists from 2026-03-31)*

**File:** `src/pages/privacy.astro:134`
**Severity:** Low

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Contact data is XOR-obfuscated at build time and decoded client-side. The source data is a build-time constant with no runtime attack surface. However, `innerHTML` is unnecessarily risky; if the decoded content ever contains HTML-special characters or the data source changes, this could enable stored XSS.

**Recommended action:** Replace `innerHTML` with `textContent` and insert `<br>` elements explicitly via `appendChild`.

---

### LOW — `innerHTML` with Static String Literals in Navigation

**Files:** `src/pages/index.astro:159`, `src/pages/projects/[slug].astro:193`
**Severity:** Low (informational)

```js
blackout.innerHTML = '<div class="sd-blackout-text">SIGNAL LOST</div>...';
```

These assignments use fully static, hardcoded strings with no external input. No XSS risk in current form, but flagged as a best-practice issue — `innerHTML` with any string creates maintenance risk if the strings are ever made dynamic.

**Recommended action:** Consider using `insertAdjacentHTML` with static strings, or DOM construction for clarity. Low priority.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **`.env` committed:** No tracked `.env` files found in the repository.
- **`wrangler.jsonc`:** No secrets detected; contains only deployment name, compatibility date, and a non-sensitive KV namespace ID.
- **Feedback API (`functions/api/feedback.js`):** Input validation and size limits are present. No SQL or shell injection surfaces. RESEND_API_KEY is consumed from environment variables, not hardcoded.
- **CORS:** No server-side CORS configuration (static Astro site on Cloudflare Pages). Cloudflare's default headers apply.
- **`eval()` usage:** None found in project source files.
- **Hardcoded secrets:** None found.

---

## Recommended Actions (Priority Order)

1. **[High]** Run `npm audit fix` to update `defu`, `vite`, `astro`, and `postcss` to patched versions. Verify the Astro build succeeds after the update (`npm run build`).
2. **[Medium]** Update `marked` from `^17.0.5` to `^18.0.0` in `package.json`, run `npm install`, and test any pages that render Markdown.
3. **[Low]** In `src/pages/privacy.astro:134`, replace `innerHTML` assignment with DOM node construction to eliminate the pattern entirely.
4. **[Low]** In `src/pages/index.astro` and `src/pages/projects/[slug].astro`, consider replacing static `innerHTML` assignments with DOM construction as a preventive measure.

---

## Changelog

| Date       | Changes |
|------------|---------|
| 2026-05-05 | Added astro XSS (GHSA-j687-52p2-xcff) and postcss XSS (GHSA-qx2v-qp2m-jg93) as new moderate findings. Updated vite affected range (now 7.0.0–7.3.1). Updated marked latest to 18.0.3, astro latest to 6.2.2. |
| 2026-04-14 | Initial audit. Identified defu prototype pollution and vite path traversal / file read as high findings. |

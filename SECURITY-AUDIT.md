# Security Audit — robinson-cursor

**Date:** 2026-08-11
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-28

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 6     |
| Moderate | 0     |
| Low      | 1     |

> ⚠ **6 High-severity findings — count up from 4 last audit.** Two new packages flagged (js-yaml, nanoid). All findings from 2026-07-28 persist; no dependency upgrades landed since then.

---

## Changes Since Last Audit (2026-07-28)

| Status       | Finding |
|--------------|---------|
| 🆕 NEW HIGH  | `js-yaml 4.0.0–4.3.0` — Quadratic CPU consumption via `!!omap` (GHSA-5p4m-2wfm-xmqj; note: distinct from the GHSA-h67p-54hq-rp68 advisory resolved in 2026-07-11) |
| 🆕 NEW HIGH  | `nanoid ≤3.3.16` — Non-terminating loop with negative/zero size (GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8) |
| 🆕 UPDATED   | `postcss ≤8.5.22` — second path-traversal advisory added (GHSA-fxqj-rqcc-2cmp, incomplete-fix follow-up to GHSA-r28c-9q8g-f849) |
| ♻ PERSISTS  | `astro ≤7.0.9` — 3 XSS CVEs (GHSA-4g3v-8h47-v7g6, GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2) |
| ♻ PERSISTS  | `postcss ≤8.5.22` — path traversal HIGH (GHSA-r28c-9q8g-f849) |
| ♻ PERSISTS  | `sharp <0.35.0` — 4 libvips CVEs (GHSA-f88m-g3jw-g9cj) |
| ♻ PERSISTS  | `svgo 4.0.0–4.0.1` — removeScripts bypass HIGH (GHSA-2p49-hgcm-8545) |
| ♻ PERSISTS  | `esbuild 0.27.3–0.28.0` — arbitrary file read on Windows dev server LOW |
| ♻ PERSISTS  | `innerHTML` findings in `day-007`, `day-030`, `privacy.astro` — unfixed |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 7 packages (6 high, 0 moderate, 1 low)

---

### HIGH — astro ≤ 7.0.9: Three XSS Vulnerabilities ♻

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | 6.4.8 |
| Advisories | GHSA-4g3v-8h47-v7g6, GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2 |
| CWE        | CWE-79 (XSS) |
| Fix        | `npm install astro@^7.2.0` (major version bump 6 → 7) |

1. **GHSA-4g3v-8h47-v7g6** — Reflected XSS via unescaped View Transition animation properties (≥2.9.0 ≤7.0.9)
2. **GHSA-f48w-9m4c-m7f5** — XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix for CVE-2026-54298; <7.0.6)
3. **GHSA-7pw4-f3q4-r2p2** — XSS via unescaped `transition:*` directive values on hydrated islands (≥3.10.0 <7.0.4)

**Note:** These are the same advisories as the 2026-07-28 audit. The astro upgrade to v7 that would resolve them has not landed yet.

---

### HIGH — js-yaml 4.0.0–4.3.0: Quadratic CPU Consumption 🆕

| Field      | Value |
|------------|-------|
| Package    | `js-yaml` |
| Advisory   | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) |
| CWE        | CWE-400 (Uncontrolled Resource Consumption) |
| Fix        | `npm audit fix` (non-breaking) |

**Description:** Quadratic CPU consumption in `!!omap` tag resolution — a new advisory distinct from the GHSA-h67p-54hq-rp68 advisory that was resolved in the 2026-07-11 cycle. A crafted YAML document triggers O(n²) processing. Indirect dependency of `astro`. Low production impact since YAML is only parsed at build time from controlled input.

---

### HIGH — nanoid ≤ 3.3.16: Non-Terminating Loop 🆕

| Field      | Value |
|------------|-------|
| Package    | `nanoid` |
| Advisories | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv), [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) |
| Fix        | `npm audit fix` (non-breaking) |

**Description:** Custom alphabet generators with a negative or zero `size` argument loop indefinitely, hanging the process. Also affects the non-secure generator when given a negative size. Indirect dependency. No direct call sites in this project.

---

### HIGH — postcss ≤ 8.5.22: Path Traversal in Source Map Auto-Loading ♻ (updated)

| Field      | Value |
|------------|-------|
| Package    | `postcss` |
| Advisories | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849), [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) (new this cycle) |
| CWE        | CWE-22 (Path Traversal) |
| CVSS Score | 7.5 |
| Fix        | `npm audit fix` (non-breaking) |

**Description:** `sourceMappingURL` comments trigger path traversal to arbitrary `.map` files. GHSA-fxqj-rqcc-2cmp is an incomplete-fix follow-up advisory for the same root cause when the `from` option is unset. Indirect dependency of `astro`.

---

### HIGH — sharp < 0.35.0: libvips Inherited CVEs ♻

| Field      | Value |
|------------|-------|
| Package    | `sharp` |
| Installed  | 0.34.5 |
| Advisory   | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) |
| CVEs       | CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| Fix        | `npm install sharp@^0.35.3` |

**Description:** Four vulnerabilities inherited from the bundled libvips library. `sharp` is a devDependency for thumbnail optimization (`npm run optimize-thumbs`). Not deployed to Cloudflare Pages. Review `scripts/optimize-thumbs.mjs` for any breaking changes on upgrade (0.34 → 0.35).

---

### HIGH — svgo 4.0.0–4.0.1: removeScripts Plugin Bypass ♻

| Field      | Value |
|------------|-------|
| Package    | `svgo` |
| Advisory   | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) |
| CVSS Score | 8.2 (AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N) |
| Fix        | `npm audit fix` (non-breaking) |

**Description:** The `removeScripts` SVGO plugin fails to remove some executable `<script>`-adjacent elements, leaving XSS potential in "sanitized" SVGs. Indirect dependency. Only relevant if SVGs from untrusted sources are processed; all SVGs in this project are author-controlled.

---

### LOW — esbuild 0.27.3–0.28.0: Arbitrary File Read on Windows Dev Server ♻

| Field      | Value |
|------------|-------|
| Package    | `esbuild` |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CVSS Score | 2.5 (local, Windows-only) |
| Fix        | Resolved when astro is upgraded to 7.x (esbuild is a transitive dep) |

**Description:** Path traversal on the esbuild dev server on Windows. Dev environment only; no production impact.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package  | In package.json | Resolved (lock) | Latest  | Status |
|----------|-----------------|-----------------|---------|--------|
| `astro`  | `^6.4.8`        | 6.4.8           | 7.2.0   | 1 major behind ⚠ (has 3 HIGH XSS vulns) |
| `sharp`  | `^0.34.5`       | 0.34.5          | 0.35.3  | 1 minor behind ⚠ (has 4 HIGH CVEs) |
| `marked` | `^18.0.0`       | 18.0.9          | 18.0.9  | Current ✅ |

---

## 3. Code Security Patterns

### LOW — `innerHTML` with `marked.parse()` on Fetched Markdown ♻

**File:** `projects/day-030-out-of-africa/main.js:1908`

```js
wrap.innerHTML = marked.parse(md);   // md fetched from same-origin CHANGELOG.md
```

Same-origin fetch limits practical exploitability. If CHANGELOG.md were replaced by an attacker-controlled version, the raw `marked` output would be injected without sanitization. Consider `DOMPurify.sanitize(marked.parse(md))` or Markdown-to-DOM via a safe renderer.

---

### LOW — `innerHTML` with External Track Metadata ♻

**File:** `projects/day-007-visualaizer/script.js:76`

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

Data sourced from local `tracks.json`. Low risk as currently implemented. Use `textContent` for `track.license`/`track.artist` and validate `track.licenseUrl` against an `https://` allowlist.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source is a build-time constant embedded in the Astro template — no runtime attack surface. Replace with `textContent` + explicit `<br>` DOM nodes.

---

## 4. Configuration Review

- ✅ `.env` / `.env.production` in `.gitignore` — correctly excluded.
- ✅ No `.env` files committed to the repository.
- ✅ No hardcoded secrets found.
- ✅ `RESEND_API_KEY` and `FEEDBACK_NOTIFY_TO` loaded from Cloudflare environment only.
- ✅ KV namespace ID in `wrangler.jsonc` is a non-secret resource identifier, safe to commit.
- ✅ No Dockerfile present.
- ✅ `feedback.js` validates payload types and enforces field-length limits before storage.

---

## 5. Recommended Actions (Priority Order)

| Priority | Action |
|----------|--------|
| 🔴 High | `npm install astro@^7.2.0` — fixes 3 Astro XSS CVEs and the esbuild LOW. Review the [Astro 6→7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) and run `astro build` + smoke-test before merging. |
| 🔴 High | `npm install sharp@^0.35.3` — fixes 4 libvips CVEs (devDependency only). Check `scripts/optimize-thumbs.mjs` for breaking API changes. |
| 🟡 Medium | `npm audit fix` — fixes js-yaml, nanoid, postcss, svgo without breaking changes. |
| 🟢 Low | `day-030/main.js:1908` — sanitize `marked.parse()` output before `innerHTML`. |
| 🟢 Low | `day-007/script.js:76` — use `textContent` for track metadata fields. |
| 🟢 Low | `privacy.astro:134` — replace `innerHTML` with DOM node construction. |

Single command to resolve all 7 npm advisories:

```bash
npm install astro@^7.2.0 sharp@^0.35.3 && npm audit fix
```

---

*Scan completed: 2026-08-11 | Tool versions: npm audit (npm 10.x)*

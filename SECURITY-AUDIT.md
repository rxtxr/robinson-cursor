# Security Audit — robinson-cursor

**Date:** 2026-07-21
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 0     |
| Moderate | 2     |
| Low      | 2     |

> ℹ️ No critical or high findings this week. Two moderate XSS vulnerabilities in `astro` remain open — the recommended fix (upgrade to 7.1.3) requires a major version bump.

---

## Changes Since Last Audit (2026-07-11)

| Status       | Finding |
|--------------|---------|
| ✅ RESOLVED  | `astro ≤7.0.0-beta.6` — XSS via Unescaped Attribute Names in Spread Props (GHSA-jrpj-wcv7-9fh9) — no longer flagged |
| ✅ RESOLVED  | `astro ≤7.0.0-beta.6` — Host Header SSRF in Prerendered Error Page Fetch (GHSA-2pvr-wf23-7pc7) — no longer flagged |
| ✅ RESOLVED  | `js-yaml 4.0.0–4.1.1` — Quadratic-complexity DoS via merge keys (GHSA-h67p-54hq-rp68) — no longer flagged |
| ✅ RESOLVED  | `vite` HIGH vulnerabilities — NTLMv2, fs.deny bypass — no longer flagged |
| 🆕 NEW MOD  | `astro ≥2.9.0 ≤7.0.9` — Reflected XSS via View Transition animation properties (GHSA-4g3v-8h47-v7g6) |
| 🆕 NEW MOD  | `astro <7.0.6` — XSS via unescaped spread attribute names in renderHTMLElement (GHSA-f48w-9m4c-m7f5) |
| 🆕 NEW LOW  | `astro ≥3.10.0 <7.0.4` — XSS via unescaped `transition:*` directive values on hydrated islands (GHSA-7pw4-f3q4-r2p2) |
| ♻ PERSISTS | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) |
| ♻ PERSISTS | `innerHTML` with `marked.parse()` in `day-030-out-of-africa/main.js:1908` |
| ♻ PERSISTS | `innerHTML` with external track metadata in `day-007-visualaizer/script.js:76` |
| ♻ PERSISTS | `innerHTML` with XOR-decoded contact data in `src/pages/privacy.astro:134` |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 3 packages (2 moderate, 1 low + 1 low persisting)

---

### MODERATE — astro: Reflected XSS via View Transition Animation Properties 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | `6.4.8` (affected range: `≥2.9.0 ≤7.0.9`) |
| Advisory   | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) |
| CWE        | CWE-79 (XSS) |
| Fix        | `astro ≥7.1.0` (major version bump required) |

**Description:** When using Astro's View Transitions feature, animation property values set via `transition:*` directives or the `data-astro-transition-*` attributes are reflected into the page without proper HTML escaping. An attacker who can influence these values can inject arbitrary HTML/script, enabling reflected XSS.

**Exploitability for this site:** Medium. The site uses Astro View Transitions if any pages include `<ViewTransitions />`. If animation property names or values are derived from URL parameters or user input, this is directly exploitable. If all values are static/build-time, runtime risk is low but upgrade is still recommended.

---

### MODERATE — astro: XSS via Unescaped Spread Attribute Names in renderHTMLElement 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | `6.4.8` (affected range: `<7.0.6`) |
| Advisory   | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) |
| CWE        | CWE-79 (XSS) |
| Fix        | `astro ≥7.0.6` |

**Description:** Incomplete fix for a prior XSS vulnerability (CVE-2026-54298). When `{...spread}` syntax is used with object keys containing HTML special characters in `renderHTMLElement`, those keys are not properly escaped in the rendered output.

**Exploitability for this site:** Review `src/` for spread usage (`{...someObject}`) where object keys could contain `<`, `>`, `"`, or `'`. If all spread prop keys are statically defined in source, exploitability is low.

---

### LOW — astro: XSS via transition:* Directive Values on Hydrated Islands 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | `6.4.8` (affected range: `≥3.10.0 <7.0.4`) |
| Advisory   | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) |
| CWE        | CWE-79, CWE-83, CWE-116 |
| Fix        | `astro ≥7.0.4` |

**Description:** Unescaped `transition:*` attribute values are rendered into hydrated island wrappers without sanitization. This is a narrower variant of the View Transition XSS above, limited to components using `client:*` hydration directives.

---

### LOW — esbuild: Arbitrary File Read on Windows Dev Server ♻

| Field      | Value |
|------------|-------|
| Package    | `esbuild` |
| Installed  | `0.27.3–0.28.0` |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CWE        | CWE-22 |
| CVSS       | 2.5 (Low) |
| Fix        | Upgrade `astro` — brings in a patched esbuild |

**Description:** Path traversal in the esbuild dev server on Windows allows reading of arbitrary files. Windows-only; dev environment only. No impact on Cloudflare Pages deployment.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package | Installed | Wanted | Latest | Status |
|---------|-----------|--------|--------|--------|
| `astro` | 6.4.8     | 6.4.8  | 7.1.3  | 1 major version behind ⚠ (see security note) |
| `marked`| 18.0.x    | 18.0.7 | 18.0.7 | Current ✅ |

**astro 6.x → 7.x:** All three astro CVEs above are fixed in `astro ≥7.1.0`. The upgrade from 6.x to 7.x is a major version bump and may include breaking changes. Review the [Astro v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/) before updating.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with `marked.parse()` on Fetched Markdown ♻

**File:** `projects/day-030-out-of-africa/main.js:1908`
**Severity:** Low (persists from 2026-07-11 audit)

```js
wrap.innerHTML = marked.parse(md);
```

`CHANGELOG.md` is fetched from the same origin. If this file is ever replaced with attacker-controlled content, the `marked.parse()` output is injected into the DOM without sanitization, enabling stored XSS.

**Recommended action:** Pass `marked` output through `DOMPurify.sanitize()` before assignment. Since `day-030` is a frozen project, this is acceptable to defer.

---

### LOW — `innerHTML` with External Track Metadata ♻

**File:** `projects/day-007-visualaizer/script.js:76`
**Severity:** Low (persists from 2026-04-14 audit)

Data sourced from local `tracks.json`. Low risk as currently implemented.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` before constructing the anchor. Defer — frozen project.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Severity:** Low (persists from 2026-04-14 audit)

Source data is a build-time constant. No runtime attack surface.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded. ✅
- **Committed `.env` files:** None found. ✅
- **Hardcoded secrets:** None found. ✅
- **`wrangler.jsonc`:** Contains a KV namespace ID — this is a non-secret Cloudflare resource identifier, safe to commit. ✅
- **CORS:** Not applicable — static site on Cloudflare Pages. ✅

---

## Recommended Actions (Priority Order)

| Priority | Action |
|----------|--------|
| 🟡 Moderate | Upgrade astro: `npm install astro@latest` (brings 6.4.8 → 7.1.3). Fixes all 3 astro CVEs and the esbuild LOW. Review the [v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/) and run `astro build` smoke test after. |
| 🟢 Low | In `day-030-out-of-africa/main.js:1908`, sanitize `marked.parse()` output — but project is frozen, acceptable to defer. |
| 🟢 Low | In `day-007-visualaizer/script.js:76`, replace `innerHTML` with `textContent` — frozen project, defer. |
| 🟢 Low | In `src/pages/privacy.astro:134`, replace `innerHTML` with DOM node construction. |

---

*Scan completed: 2026-07-21 | Tool versions: npm audit (npm 10.x)*

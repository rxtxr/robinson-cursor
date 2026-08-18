# Security Audit — robinson-cursor

**Date:** 2026-08-18
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 6     |
| Moderate | 0     |
| Low      | 1     |

> ⚠ **6 High-severity findings. Advisory set has shifted significantly since 2026-07-11 — several new issues added by upstream updates.**

---

## Changes Since Last Audit (2026-07-11)

| Status       | Finding |
|--------------|---------|
| ✅ RESOLVED  | `astro ≤7.0.0-beta.6` — XSS via Unescaped Attribute Names (GHSA-jrpj-wcv7-9fh9) — no longer flagged |
| ✅ RESOLVED  | `astro ≤7.0.0-beta.6` — Host Header SSRF in prerendered error fetch (GHSA-2pvr-wf23-7pc7) — no longer flagged |
| ✅ RESOLVED  | `js-yaml 4.0.0–4.1.1` — Merge-key DoS (GHSA-h67p-54hq-rp68) — updated advisory range |
| 🆕 NEW HIGH  | `astro ≤7.0.9` — XSS via unescaped spread attribute names in renderHTMLElement — incomplete fix for CVE-2026-54298 (GHSA-f48w-9m4c-m7f5) |
| 🆕 NEW HIGH  | `astro ≤7.0.9` — XSS via unescaped `transition:*` directive values on hydrated islands (GHSA-7pw4-f3q4-r2p2) |
| 🆕 NEW HIGH  | `astro ≤7.0.9` — Reflected XSS via unescaped View Transition animation properties (GHSA-4g3v-8h47-v7g6) |
| 🆕 NEW HIGH  | `nanoid ≤3.3.17` — Infinite loop in custom/non-secure generators (GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8) |
| 🆕 NEW HIGH  | `postcss ≤8.5.22` — Path traversal via sourceMappingURL (GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849) |
| 🆕 NEW HIGH  | `sharp <0.35.0` — Inherited libvips vulnerabilities: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 (GHSA-f88m-g3jw-g9cj) |
| 🆕 NEW HIGH  | `svgo 4.0.0–4.0.1` — `removeScripts` plugin leaves some executable scripts intact (GHSA-2p49-hgcm-8545) |
| ♻ UPDATED   | `js-yaml 4.0.0–4.3.0` — Quadratic CPU consumption in `!!omap` resolution (GHSA-5p4m-2wfm-xmqj) — broader range, same class |
| ♻ PERSISTS  | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) — LOW |
| ♻ PERSISTS  | `astro` 1 major version behind (6.4.8 installed, 7.2.2 latest) — upgrade still pending |
| ♻ PERSISTS  | `innerHTML` in `day-030-out-of-africa/main.js:1908` — unfixed |
| ♻ PERSISTS  | `innerHTML` with XOR-decoded contact in `src/pages/privacy.astro:134` — unfixed |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 7 vulnerabilities (6 high, 1 low)

---

### HIGH — astro: XSS via Unescaped Spread Attribute Names (incomplete fix) 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Affected   | ≤ 7.0.9 |
| Advisory   | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) |
| CWE        | CWE-79 (XSS) |
| Fix        | `npm audit fix --force` (installs astro@7.2.2) |

**Description:** The fix for CVE-2026-54298 (XSS via spread attribute names) was incomplete. In `renderHTMLElement`, attribute names from spread objects are still not fully escaped, leaving an XSS injection path for components that spread externally-influenced objects.

---

### HIGH — astro: XSS via Unescaped `transition:*` Directive Values 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Affected   | ≤ 7.0.9 |
| Advisory   | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) |
| CWE        | CWE-79 (XSS) |
| Fix        | `npm audit fix --force` (installs astro@7.2.2) |

**Description:** On hydrated islands, `transition:name` and related `transition:*` directive values are rendered into HTML without proper escaping. An attacker who can influence these values can inject arbitrary HTML/JS.

---

### HIGH — astro: Reflected XSS via View Transition Animation Properties 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Affected   | ≤ 7.0.9 |
| Advisory   | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) |
| CWE        | CWE-79 (XSS) |
| Fix        | `npm audit fix --force` (installs astro@7.2.2) |

**Description:** Astro's View Transition feature injects animation properties into HTML without escaping, enabling reflected XSS in pages that use `transition:animate` with dynamic values.

---

### HIGH — sharp: Inherited libvips Vulnerabilities 🆕

| Field      | Value |
|------------|-------|
| Package    | `sharp` (devDependency) |
| Affected   | < 0.35.0 |
| Advisory   | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) |
| CWE        | CWE-1395 (Dependency on Vulnerable Third-Party Component) |
| CVEs       | CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| Fix        | `npm audit fix --force` (installs sharp@0.35.3) |

**Description:** `sharp` bundles `libvips` which contains multiple high-severity vulnerabilities in the flagged CVEs. These affect image processing; exploitability depends on whether attacker-controlled images are processed at build time.

**Exploitability for this site:** `sharp` is used as a devDependency for thumbnail optimization (`scripts/optimize-thumbs.mjs`). Risk is limited to the build environment; no user-uploaded images are processed.

---

### HIGH — svgo: `removeScripts` Plugin Bypass 🆕

| Field      | Value |
|------------|-------|
| Package    | `svgo` (indirect, via `astro`) |
| Affected   | 4.0.0 – 4.0.1 |
| Advisory   | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) |
| CWE        | CWE-79 (XSS), CWE-184 (Incomplete List of Disallowed Inputs) |
| CVSS Score | 8.2 (High) |
| Fix        | `npm audit fix` |

**Description:** SVGO's `removeScripts` optimization plugin fails to remove certain JavaScript constructs inside SVG files, leaving XSS payloads intact after "sanitization". If SVG files from untrusted sources are optimized at build time, this can result in XSS in deployed assets.

**Exploitability for this site:** SVG optimization via `svgo` happens during `astro build`. If all SVG files in the repo are authored by the project owner, risk is low. Upgrade is still recommended.

---

### HIGH — postcss: Path Traversal via sourceMappingURL 🆕

| Field      | Value |
|------------|-------|
| Package    | `postcss` (indirect) |
| Affected   | ≤ 8.5.22 |
| Advisories | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) |
| Fix        | `npm audit fix` |

**Description:** When `from` is unset in PostCSS processing, auto-loading of source maps follows attacker-controlled `sourceMappingURL` comments, allowing disclosure of arbitrary `.map` files. Affects build pipeline only.

---

### HIGH — nanoid: Infinite Loop in Custom/Non-Secure Generators 🆕

| Field      | Value |
|------------|-------|
| Package    | `nanoid` (indirect) |
| Affected   | ≤ 3.3.17 |
| Advisories | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv), [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) |
| Fix        | `npm audit fix` |

**Description:** Non-secure and custom `nanoid` generators can loop indefinitely with negative or zero size arguments. DoS risk in build tooling.

---

### LOW — esbuild: Arbitrary File Read on Windows Dev Server ♻

| Field      | Value |
|------------|-------|
| Package    | `esbuild` (indirect, via `astro`) |
| Affected   | 0.27.3 – 0.28.0 |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| Fix        | `npm audit fix --force` (tied to astro upgrade) |

**Description:** Path traversal in esbuild's Windows dev server. Windows-only; dev environment only. Persists from previous audit.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package  | In package.json | Lock resolved | Latest  | Status |
|----------|-----------------|---------------|---------|--------|
| `astro`  | `^6.4.8`        | not installed | 7.2.2   | **1 major version behind ⚠** |
| `marked` | `^18.0.0`       | not installed | 18.0.10 | Current minor patch ✅ |

**astro 6.x → 7.x:** Remains 1 major version behind. The 3 HIGH XSS advisories above (GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2, GHSA-4g3v-8h47-v7g6) all affect `≤7.0.9`; the fix is `7.2.2+`. Running `npm audit fix --force` will upgrade astro to 7.2.2 and resolve these.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with `marked.parse()` on Same-Origin Markdown ♻

**File:** `projects/day-030-out-of-africa/main.js:1908`
**Status:** Persists from 2026-07-11

```js
wrap.innerHTML = marked.parse(md);
```

`CHANGELOG.md` is fetched from the same origin. If the deployed file is ever replaced with attacker-controlled content, unsanitized `marked.parse()` output is injected directly into the DOM. Recommended: wrap in `DOMPurify.sanitize()`.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Status:** Persists from 2026-07-11

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source is a build-time constant (obfuscated email address). No runtime attack surface. Recommended: use `textContent` + explicit DOM node construction.

---

### LOW — `innerHTML` Assignments in Project Files

Multiple `innerHTML = ""` (clearing) and `innerHTML = ...` (static template literals) in:
- `projects/day-028-klangkosmos/main.js` — Last.fm API metadata rendered via template literals
- `projects/day-029-1919-1-337/main.js` — error message rendered via template literal

These use data fetched from external APIs (Last.fm, Wikipedia). If API responses include malicious HTML, it will be injected. Projects are frozen after publication per CLAUDE.md policy.

**Recommended action:** Add `DOMPurify` to these projects if they are re-opened for maintenance, or accept as known low risk given the frozen-project policy.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded. ✅
- **`projects/day-002-music-charts/.env` in `.gitignore`:** Yes — correctly excluded. ✅
- **Committed `.env` files:** None found. ✅
- **`wrangler.jsonc`:** Contains a KV namespace ID — non-secret Cloudflare resource identifier, safe to commit. ✅
- **CORS:** Static site + Cloudflare Workers; no permissive CORS headers found. ✅
- **Hardcoded secrets:** None found. ✅

---

## Recommended Actions (Priority Order)

| Priority | Action |
|----------|--------|
| 🔴 High | Run `npm audit fix --force` to upgrade `astro` to 7.2.2+, `sharp` to 0.35.3+. Note: major version changes — run `astro build` and smoke-test the site after. |
| 🔴 High | Run `npm audit fix` (without `--force`) first to patch `postcss`, `nanoid`, `svgo`, `js-yaml` without breaking changes. |
| 🔴 High | After upgrade, verify `astro` is ≥ 7.1.0 to confirm all 3 XSS advisories (GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2, GHSA-4g3v-8h47-v7g6) are resolved. |
| 🟡 Low | In `day-030-out-of-africa/main.js:1908`, wrap `marked.parse()` output in `DOMPurify.sanitize()` before `innerHTML` assignment. |
| 🟡 Low | In `privacy.astro:134`, replace `innerHTML` with DOM node construction. |
| 🟡 Low | Review `day-028` and `day-029` API-sourced `innerHTML` assignments when those projects are next opened. |

---

*Scan completed: 2026-08-18 | Tool versions: npm audit (npm 10.x)*

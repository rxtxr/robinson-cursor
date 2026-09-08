# Security Audit — robinson-cursor

**Date:** 2026-09-08  
**Auditor:** Automated weekly security scan  
**Package manager:** npm (Node.js / Astro)

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 6 |
| 🟡 Moderate | 0 |
| 🔵 Low | 1 |
| **Total** | **7** |

**Additional findings:**  
- 2 `innerHTML` usages with decoded content in `src/pages/privacy.astro` (low risk — content is decoded from hardcoded constants, not user input)

---

## 1. Dependency Vulnerabilities (`npm audit`)

### 🟠 HIGH

**astro** `<=7.0.9`  
Three XSS vulnerabilities in the Astro framework itself:
- [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) — XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix for CVE-2026-54298)  
- [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) — XSS via unescaped `transition:*` directive values on hydrated islands  
- [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) — Reflected XSS via unescaped View Transition animation properties  
Fix: upgrade `astro` → `7.3.1+` (currently installed: `6.4.8`, latest: `7.3.1`)

**js-yaml** `4.0.0 - 4.3.0`  
- [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) — Quadratic CPU consumption in `!!omap` resolution (ReDoS-class DoS against YAML parsing)  
Fix: upgrade to `js-yaml@4.3.1+`

**nanoid** `<=3.3.17`  
- [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) — Non-secure generators loop indefinitely with negative size  
- [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) — Custom generators loop indefinitely when size is zero  
Fix: upgrade transitive dependency via astro upgrade

**postcss** `<=8.5.22`  
- [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) — Attacker-controlled `sourceMappingURL` reads arbitrary `.map` files when `from` is unset  
- [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) — Path traversal in previous source map auto-loading  
Fix: upgrade transitive dependency

**sharp** `<0.35.0`  
- [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) — Inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591  
Fix: upgrade `sharp` to `0.35.0+`

**svgo** `4.0.0 - 4.0.1`  
- [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) — `removeScripts` plugin leaves some executable scripts intact; SVG files processed by this version may retain active script content  
Fix: upgrade `svgo` to `4.0.2+`

### 🔵 LOW

**esbuild** `0.27.3 - 0.28.0`  
- [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) — Arbitrary file read when running the development server on Windows  
Fix: transitive; resolved by astro upgrade

---

## 2. Outdated Dependencies

**astro** is on `6.4.8`; installed version has multiple HIGH XSS vulnerabilities. Latest is `7.3.1`.  
Upgrade is the primary recommended action for this repo.

`marked` is on `18.0.12` (latest stable — up to date).

---

## 3. Code Security Patterns

### innerHTML usage (informational)

**`src/pages/projects/[slug].astro` (line 193)**  
```js
blackout.innerHTML = '<div class="sd-blackout-text">SIGNAL LOST</div>...';
```
Static string — not user-controlled. Safe.

**`src/pages/index.astro` (line 159)**  
Similar static string assignment. Safe.

**`src/pages/privacy.astro` (line 134)**  
```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```
Content is decoded from `encodedContact` — a hardcoded base64-encoded constant in the file. Not user-controlled input. Low risk, but worth noting: if the encoding pattern were reused with external data it would become a XSS vector.

**`projects/day-030-out-of-africa/main.js`**  
Multiple `innerHTML = ""` (clearing) and `innerHTML = staticSvgString` usages. All static or cleared — no user input involved. Safe.

**No hardcoded API keys, tokens, or secrets found** in any `.ts`, `.astro`, or `.js` files.

---

## 4. Configuration Review

- No `Dockerfile` found.
- `.gitignore` correctly covers `.env`, `.env.production`, and the day-002 data directory.
- No `.env` files committed to the repo.
- `wrangler.jsonc` present (Cloudflare Pages) — no secrets visible.

---

## Recommended Actions

1. **Immediate:** Upgrade `astro` from `6.4.8` → `7.3.1` to resolve three XSS CVEs. This is a major version jump — review Astro's migration guide and test the build after upgrading.
   ```bash
   npm install astro@7.3.1
   npm audit fix
   ```
2. **Short-term:** Upgrade `sharp` → `0.35.0+` and `svgo` → `4.0.2+` to patch libvips and SVG script-stripping vulnerabilities.
3. **Verify:** After astro upgrade, run `npm audit` again — several HIGH findings (nanoid, postcss, esbuild) should resolve as transitive dependencies of astro.

---

*Note: The astro XSS vulnerabilities affect server-side rendering. robinson-cursor uses Astro primarily as a static site generator (Cloudflare Pages), which reduces but does not eliminate risk — reflected XSS in View Transitions applies to client-side navigation.*

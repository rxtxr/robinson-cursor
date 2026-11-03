# Security Audit — robinson-cursor

**Date:** 2026-11-03  
**Auditor:** Automated weekly scan  
**Scope:** root package.json (npm), repository configuration

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 8 |
| 🟡 Moderate | 5 |
| 🟢 Low | 1 |
| **Total** | **17** |

> **Note:** This is the recurring weekly audit. 27 previous audit PRs remain open and unmerged. The primary action required is upgrading `astro` from 6.x to 7.x, which fixes the critical RCE CVE (CVSS 9.8) and several XSS vulnerabilities.

---

## 1. Dependency Vulnerabilities (`npm audit`)

### 🔴 CRITICAL

**`astro` ≤7.2.7** — Remote Code Execution via AVIF image optimization
- [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2): **CVSS 9.8** — `astro build` with user-supplied AVIF images triggers a heap buffer overflow/OOB write in the underlying image processing library, leading to arbitrary code execution on the build server
- **Fix:** upgrade `astro` to ≥7.2.8

**`astro` ≤7.0.5** — XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix for CVE-2026-54298)
- [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5): Cross-site scripting
- **Fix:** upgrade `astro` to ≥7.0.6

**`astro` ≥2.9.0 ≤7.0.9** — Reflected XSS via unescaped View Transition animation properties
- [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6): Cross-site scripting
- **Fix:** upgrade `astro` to ≥7.0.10

**Additional `astro` CVEs (same package, various ranges):**
- [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2): XSS via `transition:*` directive values on hydrated islands
- Authorization bypass from missing path-segment boundary check when stripping configured base

### 🟠 HIGH (transitive deps, same set as devDependencies)

All of these are pulled in by `astro`'s bundled Vite/Vitest toolchain:

**`vite` ≤6.4.3** — Path traversal, cross-origin script execution, `fs.deny` bypass (8 CVEs)  
**`@xmldom/xmldom` ≤0.8.14** — XML injection, ReDoS, quadratic memory (10 CVEs)  
**`browserslist` ≤4.28.6** — OOM, prototype write via untrusted stats  
**`postcss` ≤8.5.22** — Arbitrary `.map` file disclosure (path traversal via sourceMappingURL)  
**`nanoid` ≤3.3.17** — Infinite loop with negative/zero size  
**`form-data` 4.0.0–4.0.5** — CRLF injection  
**`source-map-js` 1.0.0–1.2.1** — Event-loop DoS  
**`ws` 8.0.0–8.20.1** — Uninitialized memory disclosure, memory exhaustion DoS  

### 🟡 MODERATE

**`@vitest/mocker` ≤4.1.11** — Path Traversal, code injection  
**`esbuild` ≤0.24.2** — Dev server SSRF  
**`fflate` 0.8.0–0.8.2** — Infinite loop on malformed ZIP64  
**`baseline-browser-mapping` 2.0.0–2.11.0** — Process termination DoS  
**`vite-node` ≤2.2.0-beta.2** — Fixed by vite/vitest upgrade  

### 🟢 LOW

**`@babel/core` ≤7.29.0** — Arbitrary File Read via sourceMappingURL comment (CVSS 3.2)

---

## 2. Outdated Dependencies

| Package | Current (package.json) | Latest | Notes |
|---------|----------------------|--------|-------|
| `astro` | ^6.4.8 | 7.4.5 | **1 major behind; upgrade fixes critical RCE** |
| `marked` | ^18.0.0 | 18.1.3 | Patch behind, no known CVEs |

---

## 3. Code Security Patterns

**No issues found in source code (`src/`):**
- No hardcoded API keys, secrets, or tokens
- No `eval()` usage
- `innerHTML` assignments in `src/pages/` use **static string literals only** — no user input flows, low XSS risk
- No disabled TLS verification
- No overly permissive CORS settings

**Projects directory (`projects/`) — frozen after publication:**
- `projects/day-030-out-of-africa/main.js` contains multiple `innerHTML` assignments, but these use static strings or DOM-safe content. Projects are frozen per repo policy.

**No hardcoded secrets found** in any scanned file.

---

## 4. Configuration Review

### ✅ `.env` files properly gitignored
`.gitignore` contains entries for `.env`, `.env.production`, and `projects/day-002-music-charts/.env`.

### ✅ No Dockerfile
No containerization configuration to review.

### ✅ No sensitive configuration files committed

---

## 5. Recommended Actions

### Immediate (Critical — CVSS 9.8 RCE)
1. **Upgrade `astro` to ≥7.2.8**
   ```bash
   npm install astro@^7
   ```
   This single upgrade resolves the critical RCE and all XSS CVEs in astro, and transitively fixes many of the high/moderate findings (vite, esbuild, etc.) as astro 7.x bundles updated versions.
   
   **Migration notes:** Review the [Astro v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/) for breaking changes before upgrading in production.

2. **Run `npm audit fix`** after the astro upgrade for remaining auto-fixable issues.

### Context
- The critical AVIF RCE (CVSS 9.8) triggers **at build time** when processing untrusted AVIF images. For this project's use case (building static pages from curated assets), the practical risk is lower — but the vulnerability is in the production build pipeline itself.
- The XSS vulnerabilities in Astro's View Transitions and hydrated islands affect the **deployed site** and are higher priority for a public-facing project.
- All `HIGH` transitive dep CVEs are fixed by upgrading `astro` to 7.x.

---

*Generated by automated weekly security scan on 2026-11-03.*

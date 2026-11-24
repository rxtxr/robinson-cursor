# Security Audit — 2026-11-24

**Repository:** robinson-cursor  
**Scan date:** 2026-11-24  
**Scanner:** npm audit, manual pattern search

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 (Astro framework — multiple XSS/RCE CVEs) |
| High     | 10    |
| Low      | 1     |
| **Total**| **12**|

> **⚠️ CRITICAL:** Astro is the production web framework powering this site. Multiple XSS and RCE vulnerabilities exist in the installed version (^6.4.8). **Upgrade to Astro ≥ 7.4.13 is strongly recommended.**

---

## 1. Dependency Vulnerabilities (npm)

### Critical — Astro (Production Framework)

The installed version range `^6.4.8` is affected by **8 critical CVEs**:

| Advisory | Title | Fixed in |
|----------|-------|----------|
| GHSA-mh32-jxcr-mh9f | XSS via attribute injection in dynamic tag names | 7.4.5+ |
| GHSA-98hj-9722-w3j8 | Reflected/Stored XSS via unescaped `<script>`/`<style>` in JSX/MDX | 7.3.2+ |
| GHSA-376h-93r7-7g6f | Authorization bypass from missing path-segment boundary check | 7.2.4+ |
| GHSA-26w7-cxv4-gfx2 | **Remote Code Execution** through AVIF image optimization | 7.2.8+ |
| GHSA-4g3v-8h47-v7g6 | Reflected XSS via View Transition animation properties | 7.0.10+ |
| GHSA-7pw4-f3q4-r2p2 | XSS via unescaped `transition:*` directive on hydrated islands | 7.0.4+ |
| GHSA-f48w-9m4c-m7f5 | XSS via unescaped spread attribute names (incomplete fix for CVE-2026-54298) | 7.0.6+ |
| GHSA-r3h5-4585-7x3w | Image endpoint path traversal (sibling directory read) | 7.4.7+ |

**Recommended action:** Upgrade `astro` to `^7.4.13` or latest stable. This is a **breaking major version change** (v6 → v7); review the Astro v7 migration guide before upgrading.

### High

| Package | Title |
|---------|-------|
| `vite` | launch-editor escapeCmdArgs() omits % escaping on Windows |
| `sharp` | Inherited vulnerabilities in libvips (CVE chain) |
| `zod` | Memory exhaustion while validating oversized inputs |
| `svgo` | removeScripts plugin leaves some executable script content |
| `postcss` | Incomplete fix for line hijacking via source map comments |
| `source-map-js` | Event-loop DoS through large source maps |
| `nanoid` | Non-secure generator can loop indefinitely |
| `js-yaml` | Quadratic CPU consumption on `!!omap` resolve |
| `smol-toml` | DoS via malformed TOML document |
| `devalue` | DoS via malformed input + shared memory serialization |

### Low

| Package | Title |
|---------|-------|
| `(1 package)` | Low-severity finding, run `npm audit` for details |

---

## 2. Outdated Dependencies

| Package | Installed | Latest | Note |
|---------|-----------|--------|------|
| `astro` | ^6.4.8 | 7.4.13 | **1 major version behind — critical CVEs in v6** |

---

## 3. Code Security Patterns

### innerHTML Usage (Static Strings — Low Risk)

The following `innerHTML` assignments exist but use **static string literals only** (no user-controlled data). Risk is low but noted for completeness:

- `src/pages/projects/[slug].astro:193` — blackout animation overlay
- `src/pages/index.astro:159` — blackout animation overlay  
- `projects/day-030-out-of-africa/main.js:1258,1263,1330` — SVG/scrubber manipulation

**Recommended action:** No immediate action required. If any of these evolve to include dynamic content, switch to `textContent` or proper DOM methods.

### No Issues Found

- **Hardcoded secrets/API keys:** None found.
- **`eval()` usage:** None found.
- **Overly permissive CORS:** None found.

---

## 4. Configuration

- **`.env` / `.env.production`:** Both files exist locally but are listed in `.gitignore` and contain no content. ✅
- **No Dockerfile** present. N/A.

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Upgrade `astro` from `^6.4.8` to `^7.4.13`. Multiple XSS and RCE vulnerabilities affect the current version. Follow the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/).
2. **[HIGH]** After Astro upgrade, run `npm audit fix` to resolve remaining transitive vulnerabilities (vite, sharp, zod, etc.).
3. **[LOW]** The `innerHTML` usages with static strings are acceptable; add a comment where these exist noting they must remain static if modified in the future.

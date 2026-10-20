# Security Audit — robinson-cursor

**Date:** 2026-10-20
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 9     |
| Moderate | 0     |
| Low      | 1     |

> ⚠️ **CRITICAL findings present. Immediate action required.**
>
> A CVSS 9.8 Remote Code Execution vulnerability exists in `astro` via AVIF image optimization.
> The astro package requires a major version upgrade (6.x → 7.2.8+) to resolve all critical and high issues.

---

## Changes Since Last Audit (2026-07-11)

| Status      | Finding |
|-------------|---------|
| ✅ RESOLVED | `astro ≤ 7.0.0-beta.6` — XSS via Unescaped Attribute Names in Spread Props (GHSA-jrpj-wcv7-9fh9) — resolved in 7.x |
| ✅ RESOLVED | `astro ≤ 7.0.0-beta.6` — Host header SSRF in prerendered error page fetch (GHSA-2pvr-wf23-7pc7) |
| ✅ RESOLVED | `vite 7.0.x–7.3.x` HIGH advisories — fixed in newer minor versions |
| ✅ RESOLVED | `js-yaml ≤ 4.1.1` — DoS via merge key aliases (GHSA-h67p-54hq-rp68) |
| 🆕 CRITICAL | `astro < 7.2.8` — **RCE via AVIF image optimization** (GHSA-26w7-cxv4-gfx2, CVSS 9.8) |
| 🆕 HIGH     | `astro < 7.0.6` — XSS via spread attribute names (incomplete CVE-2026-54298 fix) (GHSA-f48w-9m4c-m7f5) |
| 🆕 HIGH     | `astro < 7.0.4` — XSS via unescaped `transition:*` directive values (GHSA-7pw4-f3q4-r2p2) |
| 🆕 HIGH     | `astro ≤ 7.0.9` — Reflected XSS via View Transition animation properties (GHSA-4g3v-8h47-v7g6) |
| 🆕 HIGH     | `astro ≤ 7.2.3` — Authorization bypass via path-segment boundary check (GHSA-376h-93r7-7g6f) |
| 🆕 HIGH     | `sharp` — libvips/libheif/librsvg CVEs (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c, GHSA-wq5f-xc86-pv6w) |
| 🆕 HIGH     | `svgo` — `removeScripts` plugin XSS bypasses (3 advisories) |
| 🆕 HIGH     | `devalue` — DoS and serialization issues (8 advisories) |
| 🆕 HIGH     | `smol-toml` — DoS via malformed TOML (2 advisories) |
| 🆕 HIGH     | `postcss` — Path traversal via sourceMappingURL (2 advisories) |
| 🆕 HIGH     | `nanoid` — Infinite loop with negative/zero size (2 advisories) |
| 🆕 HIGH     | `source-map-js` — Event-loop DoS (GHSA-68fv-2mgg-jv7q) |
| 🆕 HIGH     | `http-cache-semantics` — Cross-user cached response disclosure (GHSA-ch52-4w7c-c8xp) |
| 🆕 HIGH     | `js-yaml` — Quadratic CPU via !!omap + maxTotalMergeKeys bypass (2 advisories) |
| ♻ PERSISTS | `innerHTML` in `src/pages/privacy.astro:134` — XOR-decoded contact email (intentional) |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 11 packages (1 critical, 9 high, 1 low across transitive deps)

---

### 🔴 CRITICAL — astro: Remote Code Execution via AVIF Image Optimization

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | `^6.4.8` (6.x branch) |
| Vulnerable | `< 7.2.8` |
| Advisory   | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) |
| CWE        | CWE-125 (Out-of-bounds Read), CWE-787 (Out-of-bounds Write) |
| CVSS Score | **9.8 (Critical)** |
| Fix        | Upgrade `astro` to `>= 7.2.8` |

**Impact:** Crafted AVIF image files can trigger memory corruption in astro's image optimization pipeline, leading to remote code execution. This affects build-time image processing (anyone who can submit content that gets built) and possibly any server-side image optimization endpoints.

**Recommendation:** Run `npm install astro@latest` to upgrade to 7.x. Note: this is a **major version bump** (6→7) that may require config changes.

---

### 🔴 HIGH — astro: Multiple XSS Vulnerabilities (3 advisories)

| Advisory | Title | Range |
|----------|-------|-------|
| [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) | XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix) | `< 7.0.6` |
| [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) | XSS via unescaped `transition:*` directive values on hydrated islands | `>= 3.10.0 < 7.0.4` |
| [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) | Reflected XSS via View Transition animation properties | `>= 2.9.0 <= 7.0.9` |

**Fix:** All resolved by upgrading to `astro >= 7.2.8`.

---

### 🔴 HIGH — astro: Authorization Bypass

| Field      | Value |
|------------|-------|
| Advisory   | [GHSA-376h-93r7-7g6f](https://github.com/advisories/GHSA-376h-93r7-7g6f) |
| CWE        | CWE-187 (Partial String Comparison) |
| Vulnerable | `<= 7.2.3` |

**Fix:** Upgrade to `astro >= 7.2.8`.

---

### 🔴 HIGH — sharp: Multiple libvips/libheif/librsvg CVEs

| Advisory | Description |
|----------|-------------|
| [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | libheif vulnerabilities GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545 |
| [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | librsvg CVE-2026-96889 |

**Impact:** These vulnerabilities affect `sharp` which is used for thumbnail optimization. Crafted image files could cause memory corruption at build time.

**Recommendation:** Run `npm install sharp@latest` and check if the updated version resolves these.

---

### 🔴 HIGH — svgo: Incomplete `removeScripts` Sanitization (3 advisories)

| Advisory | Description |
|----------|-------------|
| [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) | `removeScripts` leaves some executable scripts intact |
| [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) | Namespace and control-character bypasses |
| [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | Incomplete sanitization of HTML in SVG `foreignObject` |

**Impact:** If any SVG files in the project go through svgo's `removeScripts` and are served to users, XSS is possible. Primarily a build-time concern.

---

### 🔴 HIGH — devalue: DoS and Serialization Issues (8 advisories)

Multiple issues in `devalue` (used internally by Astro for SSR serialization):
- DoS via malformed input
- Shared memory exposure via stringify/uneval
- Prototype-key bypass
- Unhandled rejections in `stringifyAsync`

**Fix:** Resolved by upgrading `astro` to latest (which brings updated internal deps).

---

### 🔴 HIGH — Other Transitive Dependency Issues

| Package | Finding | Fix |
|---------|---------|-----|
| `smol-toml` | DoS via malformed TOML (2 advisories) | Via astro upgrade |
| `postcss` | Path traversal via sourceMappingURL (2 advisories) | Via astro upgrade |
| `nanoid` | Infinite loop with negative/zero size (2 advisories) | Via astro upgrade |
| `source-map-js` | Event-loop DoS via indexed source-map | Via astro upgrade |
| `http-cache-semantics` | Cross-user cached response disclosure | Via astro upgrade |
| `js-yaml` | Quadratic CPU via !!omap resolution (2 advisories) | Via astro upgrade |

---

### 🟡 LOW — esbuild: Arbitrary file read on Windows dev server

| Field      | Value |
|------------|-------|
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| Platform   | Windows only |

**Impact:** Dev-server only, Windows only. Low real-world risk for this project.

---

## 2. Outdated Dependencies

| Package | Installed | Latest | Gap |
|---------|-----------|--------|-----|
| `astro` | `^6.4.8`  | `7.4.1` | **1 major version behind** |
| `marked` | `^18.0.0` | `18.1.1` | Minor — current |
| `sharp` | `^0.34.5` (devDep) | Check npm | — |

**Action required:** `astro` is one major version behind and the 6.x branch has critical security issues with no backport. Upgrade to `astro@7`.

---

## 3. Code Security Patterns

### innerHTML Usages

Several `innerHTML` assignments found. Most are in frozen day-project files (static content or empty-clearing patterns) and are low risk. Notable findings:

| File | Line | Pattern | Risk |
|------|------|---------|------|
| `src/pages/privacy.astro` | 134 | XOR-decoded bytes → innerHTML | Low (intentional obfuscation of contact email, no user input) |
| `src/pages/projects/[slug].astro` | 193 | Static string literal | Low |
| `src/pages/index.astro` | 159 | Static string literal | Low |
| `projects/day-030-out-of-africa/main.js` | 1908 | `marked.parse(md)` → innerHTML | Medium (frozen project file; content from static JSON) |

The `marked.parse()` at day-030 line 1908 is worth noting: if the markdown source (`md`) were ever user-controlled, this would be an XSS vector. Currently it reads from a static asset file, so risk is low.

### Hardcoded Secrets

No hardcoded API keys or tokens found. API keys are correctly read from environment variables:
- `env.RESEND_API_KEY` in `functions/api/feedback.js` — correct pattern.

---

## 4. Configuration Review

- No Dockerfile present.
- No `.env` files committed to git (confirmed via `git ls-files | grep .env`).
- `.gitignore` status: should include `.env` — verify it covers local environment files.

---

## 5. Recommended Actions

### Immediate (Critical / High)

1. **Upgrade `astro` to `^7.2.8` (or latest 7.x)**
   ```bash
   npm install astro@latest
   ```
   Then update `astro.config.mjs` if any breaking changes apply (review astro v7 migration guide).
   This single upgrade resolves the CVSS 9.8 RCE + all 4 astro XSS/auth-bypass advisories + most transitive dep issues.

2. **Upgrade `sharp`**
   ```bash
   npm install sharp@latest
   ```

3. **Re-run audit after upgrades**
   ```bash
   npm audit
   ```

### Medium Priority

4. **Review `marked.parse()` + innerHTML pattern** in `projects/day-030-out-of-africa/main.js:1908` — add DOMPurify sanitization if markdown content ever becomes dynamic.

5. **Confirm `.gitignore` covers `.env`** files across the project.

---

*This report was generated by automated security scan on 2026-10-20.*

# Security Audit — robinson-cursor

**Date:** 2026-09-15
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 6     |
| Moderate | 0     |
| Low      | 1     |

> ⚠ **1 Critical and 6 High-severity findings. Regression since 2026-07-11 audit — new vulnerabilities introduced in dependency updates.**

---

## Changes Since Last Audit (2026-07-11)

| Status | Finding |
|--------|---------|
| ✅ RESOLVED | Previous High findings resolved by astro upgrade to ^6.4.8 |
| 🆕 NEW | `sharp ≤ 0.35.4-rc.0` — libvips/libheif CVEs (HIGH) |
| 🆕 NEW | `svgo 4.0.0–4.0.2` — removeScripts bypass (HIGH) |
| 🆕 NEW | `smol-toml ≤ 1.7.0` — DoS via malformed TOML (HIGH) |
| 🆕 NEW | `vitest < 3.2.6` — arbitrary file read/execute via UI server (CRITICAL) |

---

## 1. Dependency Audit

### npm (`npm audit`)

Total: **8 vulnerabilities** (1 critical, 6 high, 1 low)

#### 🔴 Critical

| Package | Vulnerability | Advisory | CVSS |
|---------|--------------|----------|------|
| `vitest < 3.2.6` | Arbitrary file read and execute when Vitest UI server is listening | [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) | 9.8 |

Vitest is pulled in as a transitive dependency of `astro`. The Vitest UI server vulnerability is exploitable during local development if `vitest --ui` is run with network access.

#### 🟠 High

| Package | Vulnerability | Advisory | CVSS |
|---------|--------------|----------|------|
| `sharp ≤ 0.35.4-rc.0` | Inherited libvips CVEs: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591; libheif: GHSA-g89c-p67h-r497, GHSA-2jg2-4ch7-h545 | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | — |
| `svgo 4.0.0–4.0.2` | `removeScripts` plugin leaves executable scripts intact; bypasses via namespace, control characters, and `foreignObject` | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545), [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r), [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | — |
| `smol-toml ≤ 1.7.0` | Denial of Service via malformed TOML documents | [GHSA-7w5x-hrqm-74c2](https://github.com/advisories/GHSA-7w5x-hrqm-74c2) | — |
| `form-data < 4.0.6` | CRLF injection via unescaped multipart field names | [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) | 7.5 |
| `browserslist ≤ 4.28.6` | Unbounded memory growth (OOM DoS) + prototype pollution via custom stats | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) | 7.5 |
| `@xmldom/xmldom ≤ 0.8.14` | Multiple XML injection and ReDoS vulnerabilities | [GHSA-6gmq-8vp8-gcm6](https://github.com/advisories/GHSA-6gmq-8vp8-gcm6) et al. | — |

#### 🔵 Low

| Package | Vulnerability | Advisory |
|---------|--------------|----------|
| `@babel/core ≤ 7.29.0` | Arbitrary file read via `sourceMappingURL` comment | [GHSA-4x5r-pxfx-6jf8](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8) |

**Note:** Most vulnerable packages are devDependencies bundled with astro. `sharp` is a direct devDependency used in the `optimize-thumbs` script (build-time only, not runtime). The svgo finding is notable because it affects SVG sanitization — relevant if SVGs from projects are processed through the build pipeline.

---

## 2. Outdated Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `astro` | ^6.4.8 | 7.3.2 | **1 major version behind** — Astro 7 released |

Astro 7 is a major version upgrade. Evaluate migration when convenient; upgrading will likely pull in patched transitive dependencies.

---

## 3. Code Security Patterns

- **No hardcoded secrets or API keys** found in source files.
- **No `.env` files committed** to the repo. The `.gitignore` entry for `projects/day-002-music-charts/.env` is a precautionary gitignore — the file does not exist in the repo.
- **`innerHTML` usage** — found in several locations:
  - `src/pages/privacy.astro:134` — decodes XOR-obfuscated contact info from a hardcoded encoded string. No user-controlled input; XSS risk is negligible.
  - `src/pages/projects/[slug].astro:193` and `src/pages/index.astro:159` — set to fixed hardcoded HTML strings ("SIGNAL LOST" blackout overlay). No user input.
  - `projects/day-030-out-of-africa/main.js` — multiple `innerHTML = ""` (clearing) and setting from controlled data. Low risk.
  - **No `innerHTML` assignments from user-supplied or URL-derived input found.**

---

## 4. Configuration Review

- **No Dockerfile** present.
- **`.gitignore`** correctly excludes `.env` and `.env.production`.
- No CORS configuration issues found (static site served by Cloudflare Pages).
- Cloudflare `wrangler.jsonc` is present but contains no secrets.

---

## 5. Recommended Actions

### Immediate (Critical)

1. **Upgrade astro** to pull in a patched vitest version:
   ```bash
   npm install astro@latest
   ```
   Astro 7 (latest) includes updated transitive dependencies. This also resolves `smol-toml`, `svgo`, `browserslist`, and `@xmldom/xmldom` findings.

### Short-term (High)

2. **Upgrade sharp** (devDependency):
   ```bash
   npm install --save-dev sharp@latest
   ```
   Note: `npm audit fix --force` will install `sharp@0.35.4` which is flagged as a breaking change — review the `optimize-thumbs.mjs` script after upgrading.

3. **Run `npm audit fix`** after the above upgrades to resolve remaining transitive dep issues:
   ```bash
   npm audit fix
   ```

### Planned

4. **Astro 7 migration** — review the [Astro 7 upgrade guide](https://docs.astro.build/) for any breaking changes in the Astro config or component syntax before upgrading in production.

5. **Re-run `npm audit`** after applying fixes to verify clean state.

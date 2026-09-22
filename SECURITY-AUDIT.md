# Security Audit — robinson-cursor

**Date:** 2026-09-22
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 6     |
| Moderate | 1     |
| Low      | 1     |

> ⚠ **1 Critical finding — Astro itself has multiple XSS and RCE vulnerabilities in the currently-pinned version. Upgrade to Astro 7 required.**

---

## Changes Since Last Audit (2026-07-11)

| Status       | Finding |
|--------------|---------|
| ✅ RESOLVED  | `sharp ≤0.32.6` — High (prev audit) — still present with new CVEs in 0.34.x |
| 🆕 NEW       | `astro 6.x` — Critical: XSS (×3) + RCE + Authorization bypass |
| 🆕 NEW       | `smol-toml ≤1.7.0` — High: DoS via malformed TOML |
| 🆕 NEW       | `svgo 4.0.0–4.0.2` — High: `removeScripts` bypass (×3) |
| 🔄 UPDATED   | `sharp` — New libvips + libheif CVEs (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c) |
| 🔄 CARRY     | `@babel/core ≤7.29.0` — Low (unchanged) |

---

## 1. Dependency Audit — npm

**Command:** `npm audit`
**Result:** 9 vulnerabilities (1 low, 1 moderate, 6 high, 1 critical)

### Critical

| Package | Vulnerability | CVE/GHSA | Fix |
|---------|--------------|----------|-----|
| `astro` (direct dep) | **XSS via unescaped spread attribute names** (incomplete fix for CVE-2026-54298) | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) | Upgrade to astro@7 |
| `astro` (direct dep) | **XSS via unescaped `transition:*` directive values** on hydrated islands | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) | Upgrade to astro@7 |
| `astro` (direct dep) | **Reflected XSS via unescaped View Transition animation properties** | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) | Upgrade to astro@7 |
| `astro` (direct dep) | **Remote code execution through AVIF image optimization** | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) | Upgrade to astro@7 |
| `astro` (direct dep) | **Authorization bypass — missing path-segment boundary check** when stripping configured base | [GHSA-376h-93r7-7g6f](https://github.com/advisories/GHSA-376h-93r7-7g6f) | Upgrade to astro@7 |

### High

| Package | Vulnerability | CVE/GHSA |
|---------|--------------|----------|
| `sharp` (devDep) | Inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) |
| `sharp` (devDep) | Vulnerabilities in libheif used by sharp | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) |
| `smol-toml` (transitive) | DoS via malformed TOML documents | [GHSA-7w5x-hrqm-74c2](https://github.com/advisories/GHSA-7w5x-hrqm-74c2) |
| `svgo` (transitive) | `removeScripts` plugin leaves some executable scripts intact | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) |
| `svgo` (transitive) | `removeScripts` allows executable links via namespace/control-char bypasses | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) |
| `svgo` (transitive) | `removeScripts` incompletely sanitizes executable HTML in SVG `foreignObject` | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j47) |
| `js-yaml` (transitive) | Vulnerability in YAML parser | — |
| `nanoid` (transitive) | Generators can loop indefinitely with certain inputs | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) |
| `postcss` (transitive) | Path traversal via `sourceMappingURL` | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) |

### Moderate

| Package | Vulnerability |
|---------|--------------|
| `devalue` | Potential DoS — advisory in transitive dep |

### Low

| Package | Vulnerability |
|---------|--------------|
| `esbuild` | Development server advisory (build tool only) |

**Recommended fix:**
```bash
# Step 1: fix safe (non-breaking) upgrades
npm audit fix

# Step 2: upgrade to Astro 7 (breaking change — review Astro migration guide)
npm audit fix --force
# or manually: npm install astro@latest
```

⚠ Astro 6 → 7 is a major version upgrade. Review the [Astro v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/) before upgrading. The SVGO and svgo-related findings will likely be resolved by the Astro upgrade.

---

## 2. Outdated Dependencies

| Package | Current | Latest | Gap |
|---------|---------|--------|-----|
| `astro` | 6.4.8 | 7.3.3 | **1 major version behind** — ⚠ has critical CVEs |
| `marked` | 18.x | 18.x | Current |
| `sharp` | 0.34.5 | 0.35.x | Minor — high CVEs in current version |

---

## 3. Code Security Patterns

### ℹ️ `innerHTML` usage in source pages

`src/pages/[slug].astro` and `src/pages/index.astro` assign static HTML strings (`'<div class="...">`
to `innerHTML` for cosmetic UI effects. No user input is involved — these are hardcoded strings.

`src/pages/privacy.astro` decodes and renders obfuscated static content via `xorDecodeBytes`.
The data is baked into the page (not from user input or a remote fetch), so XSS risk is low.
The `innerHTML` assignments in `projects/day-030-out-of-africa/main.js` all assign static strings
or clear elements (`innerHTML = ""`).

**Assessment:** Low risk. No user-controlled data flows into `innerHTML`.

### ✅ No hardcoded secrets

`RESEND_API_KEY` and `FEEDBACK_KV` are read from Cloudflare Worker environment bindings —
not hardcoded. The KV namespace ID in `wrangler.jsonc` is a non-sensitive resource identifier.

### ✅ No `eval()` usage

No dynamic code evaluation found.

### ✅ No `.env` files committed

`.gitignore` correctly excludes `.env` and `.env.production`.

---

## 4. Configuration Review

### `wrangler.jsonc`

- No sensitive credentials in config.
- KV namespace ID `d3bd92095a4542698d19734f15ad4bf7` is a public resource identifier, not a secret.
- `compatibility_date: 2026-03-28` — consider updating to current date after verifying no breaking changes.

### No Dockerfile

No container configuration — not applicable.

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| CRITICAL | Upgrade `astro` from 6.x to 7.x — resolves XSS (×3), RCE, and auth bypass CVEs |
| HIGH | Run `npm audit fix --force` after Astro upgrade to clear remaining high/moderate findings |
| HIGH | Upgrade `sharp` devDependency: `npm install sharp@latest` (resolves libvips/libheif CVEs) |
| LOW | Update `wrangler.jsonc` `compatibility_date` to current date |
| LOW | Review Astro 7 migration guide for breaking changes before upgrading |

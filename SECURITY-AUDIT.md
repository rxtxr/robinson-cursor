# Security Audit — robinson-cursor

**Date:** 2026-09-01
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

> ⚠️ **6 High-severity findings. New vulnerabilities since 2026-07-11 audit.**

Additional notes:
- `astro` is 1 major version behind (6.x → 7.x available); the upgrade also resolves 3 XSS CVEs
- Several `innerHTML` assignments found — assessed as low risk (static content only)

---

## 1. Dependency Audit

### npm audit (7 vulnerabilities total)

#### High

| Package | Range | Advisory | Title |
|---------|-------|----------|-------|
| `astro` | ≤7.0.9 | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) | XSS via unescaped spread attribute names in `renderHTMLElement` |
| `astro` | ≤7.0.9 | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) | XSS via unescaped `transition:*` directive values on hydrated islands |
| `astro` | ≤7.0.9 | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) | Reflected XSS via unescaped View Transition animation properties |
| `js-yaml` | 4.0.0–4.3.0 | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | Quadratic CPU consumption in `!!omap` resolution (ReDoS-style DoS) |
| `nanoid` | ≤3.3.17 | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | Non-secure generators can loop indefinitely with negative size |
| `postcss` | ≤8.5.22 | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | Attacker-controlled `sourceMappingURL` reads arbitrary `.map` files |
| `sharp` | <0.35.0 | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | Inherited libvips vulnerabilities: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| `svgo` | 4.0.0–4.0.1 | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) | `removeScripts` plugin leaves some executable scripts intact |

#### Low

| Package | Range | Advisory | Title |
|---------|-------|----------|-------|
| `esbuild` | 0.27.3–0.28.0 | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) | Arbitrary file read via dev server on Windows |

**Context on Astro XSS CVEs:** These affect Astro's server-side rendering pipeline. This site is a static build deployed to Cloudflare Pages, so the XSS risk is at **build time** rather than runtime. However, upgrading is strongly recommended to eliminate any residual risk in dev mode and future SSR usage.

**Context on `sharp`:** Used only as a devDependency for thumbnail optimization (`scripts/optimize-thumbs.mjs`). Not exposed in the production build.

---

## 2. Outdated Dependencies

| Package | Current | Latest | Gap |
|---------|---------|--------|-----|
| `astro` | 6.4.8 | 7.2.10 | **1 major version** — upgrade also fixes 3 Astro XSS CVEs |

---

## 3. Code Security Patterns

### 3a. innerHTML Assignments

Several `innerHTML` assignments found. All reviewed — **no user-controlled input flows into any of these**:

| File | Line | Content | Risk |
|------|------|---------|------|
| `src/pages/index.astro` | 159 | Static blackout UI string | ✅ None |
| `src/pages/projects/[slug].astro` | 193 | Static blackout UI string | ✅ None |
| `src/pages/privacy.astro` | 134 | XOR-decoded contact strings from static embedded data | ✅ None (no user input) |
| `projects/day-030-out-of-africa/main.js` | 1258–1612 | Static SVG/HTML strings, data-driven from bundled static JSON | ✅ None |

No `innerHTML` assignments accept user-supplied strings or external API responses without sanitization.

### 3b. Hardcoded Secrets

No hardcoded API keys, tokens, or passwords found. ✅

### 3c. eval()

No `eval()` usage found. ✅

### 3d. SQL / Command Injection

No SQL or shell command construction found. ✅

---

## 4. Configuration Review

- `.env` and `.env.production` are in `.gitignore`. ✅
- `projects/day-002-music-charts/.env` is explicitly gitignored. ✅
- No `.env` files found committed in the working tree. ✅
- No Dockerfile.
- Cloudflare Pages deploy is git-push driven — no credentials in repo. ✅

---

## 5. Recommended Actions

| Priority | Action |
|----------|--------|
| **High** | Upgrade `astro` to 7.x: resolves 3 XSS CVEs and pulls in fixed `esbuild`, `sharp`, `svgo`. Run `npm audit fix --force` and test the build. |
| **High** | Fix remaining auto-fixable vulnerabilities: `npm audit fix` (covers `js-yaml`, `nanoid`, `postcss`, `svgo`) |
| **Low** | Monitor `esbuild` Windows file-read fix — only affects dev server on Windows; no production impact |

### Quick fix commands

```bash
# Auto-fixable (non-breaking):
npm audit fix

# Breaking upgrade — upgrades astro 6 → 7 (test thoroughly):
npm audit fix --force

# After upgrading astro, verify the build:
npm run build
```

**Note:** Upgrading `astro` from 6 to 7 is a major version bump. Review the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) before applying, and test that all pages build and render correctly.

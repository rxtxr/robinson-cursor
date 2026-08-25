# Security Audit — robinson-cursor

**Date:** 2026-08-25
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 6 |
| Moderate | 0 |
| Low | 1 |
| **Total** | **7** |

Python dependencies: No known vulnerabilities.
Secrets scan: No hardcoded secrets detected.

---

## 1. Dependency Vulnerabilities (`npm audit`)

### HIGH — Astro XSS (multiple CVEs)

**Package:** `astro` ≤ 7.0.9 (installed: `^6.4.8`)

| Advisory | Title | CVE/GHSA |
|----------|-------|----------|
| GHSA-f48w-9m4c-m7f5 | XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix for CVE-2026-54298) | moderate |
| GHSA-7pw4-f3q4-r2p2 | XSS via unescaped `transition:*` directive values on hydrated islands | low |
| GHSA-4g3v-8h47-v7g6 | Reflected XSS via unescaped View Transition animation properties | moderate |

**Fix:** Upgrade to `astro@7.2.6` (`npm audit fix --force` — major version bump).

---

### HIGH — js-yaml ReDoS / DoS (CVE-2026-59870)

**Package:** `js-yaml` 4.0.0–4.3.0 (transitive via astro)
**Advisory:** GHSA-5p4m-2wfm-xmqj
**Detail:** Quadratic CPU consumption in `!!omap` resolution; a crafted YAML document can exhaust server CPU (CVSS 7.5 — High, network-reachable, no auth required).
**Fix:** `npm audit fix` upgrades `js-yaml` to ≥ 4.3.1.

---

### HIGH — sharp libvips CVEs

**Package:** `sharp` < 0.35.0 (devDependency, used for image optimisation)
**Advisory:** GHSA-f88m-g3jw-g9cj
**CVEs:** CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 (inherited from bundled libvips)
**Fix:** `npm audit fix --force` installs `sharp@0.35.3` (breaking change — test thumbnail optimisation after upgrade).

---

### HIGH — PostCSS path traversal in source maps

**Package:** `postcss` ≤ 8.5.22 (transitive)
**Advisories:** GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849
**Detail:** Attacker-controlled `sourceMappingURL` can cause PostCSS to read arbitrary `.map` files when `from` is unset.
**Fix:** `npm audit fix`.

---

### HIGH — nanoid infinite loop (DoS)

**Package:** `nanoid` ≤ 3.3.17 (transitive)
**Advisories:** GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8
**Detail:** Non-secure generators loop indefinitely with negative size; custom generators loop when size is zero.
**Fix:** `npm audit fix`.

---

### HIGH — SVGO `removeScripts` bypass

**Package:** `svgo` 4.0.0–4.0.1 (transitive via astro)
**Advisory:** GHSA-2p49-hgcm-8545
**Detail:** The `removeScripts` plugin leaves some executable scripts intact, defeating its stated security purpose.
**Fix:** `npm audit fix`.

---

### LOW — esbuild arbitrary file read (Windows dev server only)

**Package:** `esbuild` 0.27.3–0.28.0 (transitive)
**Advisory:** GHSA-g7r4-m6w7-qqqr
**Detail:** Arbitrary file read via `sourceMappingURL` comment when running the esbuild dev server on Windows. **Not exploitable in CI or Linux production builds.**
**Fix:** Resolved by upgrading astro to v7.

---

## 2. Outdated Dependencies (> 1 major version behind)

| Package | Installed | Latest | Versions Behind |
|---------|-----------|--------|-----------------|
| `astro` | `^6.4.8` | `7.2.6` | 1 major |

Note: `marked@^18.0.0` is current at latest (18.0.11). No other major-version lag.

---

## 3. Code Security Patterns

### innerHTML usage

Three occurrences found:

| File | Line | Content | Risk |
|------|------|---------|------|
| `src/pages/projects/[slug].astro` | 193 | `blackout.innerHTML = '<div class="sd-blackout-text">SIGNAL LOST</div>...'` | **Low** — hardcoded string literal, no user input |
| `src/pages/index.astro` | 159 | `blackout.innerHTML = '<div class="sd-blackout-text">SIGNAL LOST</div>...'` | **Low** — hardcoded string literal, no user input |
| `src/pages/privacy.astro` | 134 | `p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>')` | **Low-Medium** — content is XOR-decoded from a build-time constant; no runtime user input, but decoded HTML is injected without sanitisation. If the encoded blob were ever tampered with in a supply-chain scenario, arbitrary HTML would execute. Prefer `textContent` or explicit text node creation. |

**Recommendation:** Replace `p.innerHTML` in `privacy.astro` with `textContent` (contact lines are plain text and need no HTML) or use `document.createElement` per line and set `textContent` on each.

### Secrets scan

No hardcoded API keys, tokens, or passwords found in source files.

### CORS

No wildcard CORS headers detected.

---

## 4. Configuration Review

- `.env` and `.env.production` are correctly listed in `.gitignore`. ✅
- No `.env` files are tracked in git. ✅
- No Dockerfile present (Cloudflare Pages serverless deploy — not applicable).

---

## 5. Recommended Actions

### Immediate (High severity)

1. **Run `npm audit fix`** — fixes `js-yaml`, `postcss`, `nanoid`, `svgo` in one step.
2. **Upgrade astro to v7**: `npm install astro@latest` — resolves the three XSS advisories, esbuild, and js-yaml simultaneously. Review Astro v7 migration guide for breaking changes.
3. **Upgrade sharp**: `npm audit fix --force` or `npm install sharp@latest` — test thumbnail generation after.

### Medium priority

4. **Replace `innerHTML` in `privacy.astro`** with `textContent` to eliminate residual XSS surface.
5. **Upgrade astro** also brings `marked` and other transitive deps current.

### Low priority

6. esbuild low advisory is resolved by the astro upgrade and is not exploitable on Linux/CI anyway.

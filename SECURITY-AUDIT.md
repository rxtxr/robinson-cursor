# Security Audit — robinson-cursor

**Date:** 2026-10-06  
**Scope:** Root `package.json` (Astro site)  
**Tools:** `npm audit`

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 9     |
| Moderate | 0     |
| Low      | 1     |
| **Total**| **11**|

> ⚠️ **Critical finding: Remote Code Execution in astro via AVIF image optimization (CVSS 9.8)**

---

## 1. Dependency Audit — Critical

### CRITICAL: astro — Remote Code Execution (CVSS 9.8)

| Advisory | Severity | CVSS | URL |
|----------|----------|------|-----|
| GHSA-26w7-cxv4-gfx2 — Astro: RCE through AVIF image optimization | **Critical** | 9.8 | https://github.com/advisories/GHSA-26w7-cxv4-gfx2 |
| GHSA-f48w-9m4c-m7f5 — Astro: XSS via unescaped spread attribute names in renderHTMLElement | Moderate | — | https://github.com/advisories/GHSA-f48w-9m4c-m7f5 |
| GHSA-7pw4-f3q4-r2p2 — Astro: XSS via unescaped transition:* directive values | Low | — | https://github.com/advisories/GHSA-7pw4-f3q4-r2p2 |
| GHSA-4g3v-8h47-v7g6 — Astro: Reflected XSS via unescaped View Transition animation properties | Moderate | — | https://github.com/advisories/GHSA-4g3v-8h47-v7g6 |
| GHSA-376h-93r7-7g6f — Astro: Authorization bypass via missing path-segment boundary check | Moderate | — | https://github.com/advisories/GHSA-376h-93r7-7g6f |

**Affected versions:** astro `<=7.2.7`  
**Installed:** astro `^6.4.8`  
**Fix:** Upgrade to astro `>=7.2.8` (fixes RCE); full fix for all issues: `>=7.3.5`

**Risk context:** The RCE vulnerability (CVSS 9.8) allows remote code execution through AVIF image processing. This is a **build-time** vulnerability — exploitable if untrusted image files are processed during `astro build`. The XSS vulnerabilities affect server-side rendering (SSR); this project appears to be a static site, which reduces XSS exposure, but the authorization bypass and RCE remain relevant.

---

## 2. Dependency Audit — High

### HIGH: sharp (libvips vulnerabilities)

| Advisory | URL |
|----------|-----|
| GHSA-f88m-g3jw-g9cj — sharp: inherited libvips CVEs (CVE-2026-33327, -33328, -35590, -35591) | https://github.com/advisories/GHSA-f88m-g3jw-g9cj |
| GHSA-rgj7-g3m4-5g8c — sharp: libheif vulnerabilities GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545 | https://github.com/advisories/GHSA-rgj7-g3m4-5g8c |

Used as devDependency for thumbnail optimization. Build-time exposure only.

### HIGH: svgo (script sanitization bypass — 3 advisories)

| Advisory | URL |
|----------|-----|
| GHSA-2p49-hgcm-8545 — SVGO removeScripts leaves some executable scripts intact | https://github.com/advisories/GHSA-2p49-hgcm-8545 |
| GHSA-w27v-7q3p-w38r — SVGO: removeScripts allows executable links via namespace/control-char bypasses | https://github.com/advisories/GHSA-w27v-7q3p-w38r |
| GHSA-4vpr-x523-8j87 — SVGO: removeScripts incompletely sanitizes SVG foreignObject | https://github.com/advisories/GHSA-4vpr-x523-8j87 |

If SVG files from untrusted sources are processed through svgo's `removeScripts` plugin, executable scripts may survive sanitization.

### HIGH: devalue (multiple DoS / memory disclosure — 7 advisories)

- GHSA-9rgm-9g3h-6x36 — DoS via malformed input
- GHSA-j22f-vq7h-c4qm — stringify/uneval serialize shared memory (information disclosure)
- GHSA-hx4r-w6wj-j8fg — Residual sparse-array CPU amplification
- GHSA-mcm9-63f2-9j32 — Repeated primitive strings cause quadratic expansion
- GHSA-wf3x-273g-mvxv — Sparse arrays cause eager allocation
- GHSA-x5rw-q4pp-hg5g — stringifyAsync unhandled rejection
- GHSA-4q55-j62x-fr9h — null-prototype object keys bypass __proto__ rejection

### HIGH: Other transitive dependencies

- GHSA-ch52-4w7c-c8xp — http-cache-semantics: cross-user cached response disclosure
- GHSA-5p4m-2wfm-xmqj / GHSA-2883-xcg3-v3hh — js-yaml: quadratic CPU on !!omap
- GHSA-28wg-ghj8-5hjv / GHSA-2v37-7h3g-55p8 — nanoid: infinite loop
- GHSA-fxqj-rqcc-2cmp / GHSA-r28c-9q8g-f849 — postcss: path traversal in source maps
- GHSA-7w5x-hrqm-74c2 / GHSA-r4xh-jqrq-34v2 — smol-toml: DoS via malformed TOML
- GHSA-68fv-2mgg-jv7q — source-map-js: event-loop DoS

---

## 3. Outdated Dependencies

| Package | Installed | Latest | Major Bump |
|---------|-----------|--------|------------|
| astro | 6.4.8 | 7.3.5 | ✅ Yes (v7) — **also fixes critical CVE** |

Upgrading astro from v6 to v7 resolves the critical RCE and all other astro advisories. This is a major version bump; check the Astro v7 migration guide before upgrading.

---

## 4. Code Security Patterns

Three `innerHTML` assignments found in Astro pages:

| File | Line | Context |
|------|------|---------|
| `src/pages/projects/[slug].astro` | 193 | Static string literal: `'<div class="sd-blackout-text">SIGNAL LOST</div>...'` — **safe** |
| `src/pages/index.astro` | 159 | Static string literal: `'<div class="sd-blackout-text">SIGNAL LOST</div>...'` — **safe** |
| `src/pages/privacy.astro` | 134 | XOR-decoded bytes joined with `<br>` inserted via innerHTML — **review recommended** |

The `privacy.astro` pattern decodes from what appears to be hardcoded base64 content using a XOR key. If the source data is purely static/hardcoded this is safe, but if it ever incorporates user-supplied input it would be an XSS vector. Recommend replacing with `textContent` or sanitizing before insertion.

No `eval()` calls found. No hardcoded API keys or secrets found.

---

## 5. Configuration Review

- `.gitignore` properly excludes `.env`, `.env.production`, and a project-specific `.env` file. ✅
- No `.env` files found committed to the repository. ✅
- Cloudflare Pages deployment via git push — no server-side secrets exposure beyond Cloudflare's own security model.

---

## 6. Recommended Actions

### Immediate (critical — fix before next deploy)

1. **Upgrade astro to v7.3.5** — resolves RCE (CVSS 9.8) and all XSS advisories:
   ```bash
   npm install astro@^7.3.5
   ```
   Check the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) for breaking changes.

2. After upgrading astro, run `npm audit` again — many high findings (devalue, postcss, nanoid, smol-toml, svgo, sharp) are transitive dependencies of astro and will likely be resolved by the upgrade.

### Short-term

3. **Review `privacy.astro:134`** — replace `innerHTML` with `textContent` or sanitize input before DOM insertion to prevent future XSS if content ever becomes dynamic.

4. **Upgrade sharp devDependency** if still outdated after astro upgrade:
   ```bash
   npm install -D sharp@latest
   ```

---

*Generated by security audit script — 2026-10-06*

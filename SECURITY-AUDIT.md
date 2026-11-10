# Security Audit — 2026-11-10

**Scan date:** 2026-11-10  
**Auditor:** Automated weekly scan (Claude Code)  
**Scope:** Repository root (npm / Astro)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 10    |
| Low      | 1     |
| **Total**| **12**|

---

## 1. Dependency Audit — npm

Run: `npm audit`

### Critical

| Package | Advisory | CVSS | Fix |
|---------|----------|------|-----|
| `astro` | **Remote code execution through AVIF image optimization** (GHSA-26w7-cxv4-gfx2) | **9.8** (Critical) | Upgrade to `^7.4.8` |

Additional `astro` advisories bundled in the same upgrade:

| Advisory | Severity | Range |
|----------|----------|-------|
| XSS via unescaped spread attribute names (GHSA-f48w-9m4c-m7f5) — incomplete fix for CVE-2026-54298 | Moderate | <7.0.6 |
| Authorization bypass from missing path-segment boundary check (GHSA-376h-93r7-7g6f) | Moderate | ≤7.2.3 |
| XSS via unescaped `<script>`/`<style>` in JSX/MDX (GHSA-98hj-9722-w3j8) | Moderate | <7.3.2 |
| Reflected XSS via View Transition animation properties (GHSA-4g3v-8h47-v7g6) | Moderate | ≥2.9.0 ≤7.0.9 |
| XSS via `transition:*` directive on hydrated islands (GHSA-7pw4-f3q4-r2p2) | Low | ≥3.10.0 <7.0.4 |

### High

| Package | Advisory |
|---------|----------|
| `sharp` | Inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| `vite` | `launch-editor`: `escapeCmdArgs()` omits `%` escaping on Windows |
| `devalue` | `stringify`/`uneval` serialize shared memory (GHSA-j22f-vq7h-c4qm, CVSS 7.5) |
| `devalue` | Repeated primitive strings cause quadratic expansion in `uneval` |
| `zod` | Memory exhaustion validating oversized constrained collections |
| `js-yaml` | Quadratic CPU consumption in `!!omap` resolution — CVE-2026-59870 fix not backported |
| `smol-toml` | Denial of Service via malformed TOML documents |
| `postcss` | Incomplete fix GHSA-6g55-p6wh-862q — attacker-controlled `.map` file read |
| `source-map-js` | Event-loop DoS via indexed source-map section offsets |
| `svgo` | `removeScripts` plugin leaves some executable scripts intact |
| `nanoid` | Non-secure generators loop indefinitely with negative size |

### Low

| Package | Advisory |
|---------|----------|
| `esbuild` | Allows arbitrary file read when running dev server on Windows |

**Recommended fix:**
```bash
npm install astro@^7.4.8
npm audit fix
```

---

## 2. Outdated Dependencies

Run: `npm outdated`

| Package | Current | Latest | Gap |
|---------|---------|--------|-----|
| `astro` | 6.4.8 | 7.4.8 | **1 major version** (also fixes critical CVE) |

---

## 3. Code Security Patterns

- **Hardcoded secrets / API keys:** None found in `src/`
- **`eval()`:** None found
- **`innerHTML` assignments:** Found in `src/pages/projects/[slug].astro` (line 193) and `src/pages/index.astro` (line 159)
  - Both assign **static string literals** (hardcoded UI text: `"SIGNAL LOST"`)
  - No user input involved — not exploitable XSS, but noted for awareness
- **SQL injection:** Not applicable (no server-side SQL)
- **TLS / CORS:** No overly permissive settings found

---

## 4. Configuration Review

- **`.env` files:** Not committed — correctly listed in `.gitignore`
- **Cloudflare Pages config (`wrangler.jsonc`):** No sensitive values detected
- **No Dockerfile** in repository

---

## Recommended Actions

1. **[Critical — act now]** Upgrade `astro` to `^7.4.8` — fixes AVIF RCE (CVSS 9.8) + 5 XSS advisories:
   ```bash
   npm install astro@^7.4.8
   npm audit fix
   git commit -am "security: upgrade astro to ^7.4.8"
   ```
2. **[High priority]** After astro upgrade, run `npm audit fix` for remaining high findings (vite, sharp, devalue, etc.)
3. **[Low priority]** Consider replacing `innerHTML` assignments with `textContent` + DOM node construction, even though the current strings are static

---

*Previous audit: 2026-11-03 | Next scheduled: 2026-11-17*

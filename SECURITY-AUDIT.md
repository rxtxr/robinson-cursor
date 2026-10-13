# Security Audit — robinson-cursor

**Date:** 2026-10-13  
**Auditor:** Automated weekly security scan  
**Previous audit:** 2026-07-11  
**Package manager:** npm (Node.js / Astro)  

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 9 |
| 🔵 Low | 1 |
| **Total** | **11** |

**No hardcoded secrets found. No env files committed.**  
The critical finding (Astro RCE via AVIF, CVSS 9.8) affects the production build pipeline.

---

## 1. Dependency Audit — npm

### 🔴 CRITICAL

#### `astro` ^6.4.8
- **GHSA-26w7-cxv4-gfx2** — **Remote Code Execution through AVIF image optimization**  
  CVSS 9.8 · https://github.com/advisories/GHSA-26w7-cxv4-gfx2  
  Range: `< 7.2.8`  
  A malformed AVIF image processed during the build or via Astro's image service can trigger a memory-corruption exploit in the underlying `libvips`/`sharp` stack, leading to RCE.

- **GHSA-f48w-9m4c-m7f5** — XSS via unescaped spread attribute names in `renderHTMLElement`  
  Range: `< 7.0.6`

- **GHSA-7pw4-f3q4-r2p2** — XSS via unescaped `transition:*` directive values on hydrated islands  
  Range: `>= 3.10.0 < 7.0.4`

- **GHSA-4g3v-8h47-v7g6** — Reflected XSS via View Transition animation properties  
  Range: `>= 2.9.0 <= 7.0.9`

- **GHSA-376h-93r7-7g6f** — Authorization bypass — missing path-segment boundary check when stripping `base`  
  Range: `<= 7.2.3`

**Fix:** Upgrade `astro` from `^6.4.8` to `^7.3.8` (breaking change — review Astro v7 migration guide).

---

### 🟠 HIGH

#### `sharp` ^0.34.5
- **GHSA-f88m-g3jw-g9cj** — libvips CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591  
  Range: `< 0.35.0`

- **GHSA-rgj7-g3m4-5g8c** — libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545  
  Range: `< 0.35.4`

- **GHSA-wq5f-xc86-pv6w** — librsvg CVE-2026-96889  
  Range: `< 0.35.5`

**Fix:** Upgrade `sharp` to `^0.35.5`.

#### `devalue` (transitive via astro)
Multiple DoS, memory-disclosure, and prototype-pollution vulnerabilities:  
GHSA-9rgm-9g3h-6x36, GHSA-j22f-vq7h-c4qm, GHSA-hx4r-w6wj-j8fg, GHSA-mcm9-63f2-9j32, GHSA-wf3x-273g-mvxv, GHSA-x5rw-q4pp-hg5g, GHSA-4q55-j62x-fr9h.  
Range: `<= 5.9.2` · **Fix available (update astro).**

#### `http-cache-semantics` (transitive)
- **GHSA-ch52-4w7c-c8xp** — max-stale handling can disclose cross-user cached responses. CVSS 7.5  
  Range: `<= 4.2.0` · **Fix available.**

#### `js-yaml` (transitive)
- **GHSA-5p4m-2wfm-xmqj** — Quadratic CPU on `!!omap` in YAML. CVSS 7.5 · Range: `>= 4.0.0 < 4.3.1`  
- **GHSA-2883-xcg3-v3hh** — `maxTotalMergeKeys` bypass. CVSS 7.5 · Range: `>= 4.0.0 < 4.3.2`  
**Fix available.**

#### `nanoid` (transitive)
- **GHSA-28wg-ghj8-5hjv** — Infinite loop with negative size. CVSS 5.9 · Range: `< 3.3.16`  
- **GHSA-2v37-7h3g-55p8** — Infinite loop with zero size. CVSS 5.9 · Range: `< 3.3.18`  
**Fix available.**

#### `postcss` (transitive)
- **GHSA-r28c-9q8g-f849** — Path Traversal in sourceMappingURL auto-loading. CVSS 7.5 · Range: `<= 8.5.17`  
- **GHSA-fxqj-rqcc-2cmp** — Incomplete fix of above. Range: `<= 8.5.22`  
**Fix available.**

#### `smol-toml` (transitive)
- **GHSA-7w5x-hrqm-74c2** — DoS via malformed TOML documents. Range: `<= 1.7.0`  
- **GHSA-r4xh-jqrq-34v2** — Quadratic-time parse. Range: `<= 1.8.0`  
**Fix available.**

#### `source-map-js` (transitive)
- **GHSA-68fv-2mgg-jv7q** — Event-loop DoS via indexed source-map offsets. Range: `< 1.2.2`  
**Fix available.**

#### `svgo` (transitive)
- **GHSA-2p49-hgcm-8545** — `removeScripts` plugin leaves executable scripts intact. Range: `>= 4.0.0 < 4.0.2`  
- **GHSA-w27v-7q3p-w38r** — `removeScripts` allows executable links via namespace/control-char bypasses. Range: `< 4.1.0`  
- **GHSA-4vpr-x523-8j87** — `removeScripts` misses SVG `<foreignObject>` executable HTML. Range: `< 4.1.0`  
**Fix available.**

---

### 🔵 LOW

#### `esbuild` (transitive)
- **GHSA-g7r4-m6w7-qqqr** — Arbitrary file read on Windows dev server. Range: `>= 0.27.3 < 0.28.1`  
**Fix available (update astro).**

---

## 2. Outdated Dependencies

| Package | Current spec | Latest | Notes |
|---------|-------------|--------|-------|
| `astro` | `^6.4.8` | `7.3.8` | **1 major version behind — critical + high vulns** |
| `sharp` | `^0.34.5` | `0.35.5` | High vulns in libvips/libheif/librsvg |

---

## 3. Code Security Patterns

- ✅ **No hardcoded secrets or API keys** found.
- ⚠️ **`innerHTML` assignments** detected in `projects/day-030-out-of-africa/main.js`.  
  Most are safe DOM-clearing calls (`el.innerHTML = ""`). One notable case:  
  ```js
  // line 1908
  wrap.innerHTML = marked.parse(md);
  ```
  `md` is fetched from the same-origin `CHANGELOG.md` file — not user-controlled — so XSS risk is low. However, if `CHANGELOG.md` were replaced with attacker-controlled content (e.g., via a supply-chain attack), this would execute arbitrary HTML. The projects folder is frozen after publication, so this is acceptable risk as-is.

- ✅ **No `eval()` calls** found.
- ✅ **No disabled TLS verification** found.
- ✅ **No overly permissive CORS** settings.

---

## 4. Configuration Review

- ✅ `.env`, `.env.production`, and `projects/day-002-music-charts/.env` are gitignored.
- ✅ No Dockerfile present.
- ✅ Cloudflare Pages / Workers deployment — no server-side secrets in committed files.
- ℹ️ `wrangler.jsonc` exposes the KV namespace ID (`d3bd92095a4542698d19734f15ad4bf7`) — this is not a secret (KV namespaces require authenticated API access), but worth noting.

---

## 5. Recommended Actions

### Immediate (Critical)
1. **Upgrade `astro`** from `^6.4.8` → `^7.3.8`.  
   The current version is vulnerable to CVSS 9.8 RCE via AVIF image optimization.  
   Review the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) before upgrading.

### Short-term (High)
2. **Upgrade `sharp`** from `^0.34.5` → `^0.35.5` (if used directly — may also be resolved by the astro upgrade).
3. After upgrading astro and sharp, run `npm audit` again — most transitive fixes (devalue, js-yaml, smol-toml, svgo, etc.) should resolve automatically.

---

*Generated by automated security scan — 2026-10-13*

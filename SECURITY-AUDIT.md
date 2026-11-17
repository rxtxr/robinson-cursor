# Security Audit — robinson-cursor

**Date:** 2026-11-17
**Previous audit:** 2026-10-27
**Tool versions:** npm audit, manual code review

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 10    |
| Moderate | 0     |
| Low      | 1     |
| **Total**| **12**|

---

## 1. Dependency Vulnerabilities — npm

### Critical

| Package | Vulnerability | Advisory |
|---------|--------------|----------|
| `astro` | XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix for CVE-2026-54298) | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) |

> **Impact:** This is a **production runtime XSS** vulnerability in the Astro framework. Attackers who can influence rendered attribute names could inject arbitrary scripts into rendered pages. This site renders project READMEs and user-submitted content — prioritize upgrading.

### High

| Package | Vulnerability | Advisory |
|---------|--------------|----------|
| `devalue` | Svelte devalue: DoS via malformed input | [GHSA-9rgm-9g3h-6x36](https://github.com/advisories/GHSA-9rgm-9g3h-6x36) |
| `js-yaml` | Quadratic CPU consumption in `!!omap` resolution (CVE-2026-59870) | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) |
| `nanoid` | Non-secure generators can loop indefinitely with negative size | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) |
| `postcss` | Attacker-controlled sourceMappingURL reads arbitrary `.map` files | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) |
| `sharp` | Inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) |
| `smol-toml` | DoS via malformed TOML documents | [GHSA-7w5x-hrqm-74c2](https://github.com/advisories/GHSA-7w5x-hrqm-74c2) |
| `source-map-js` | Event-loop DoS via indexed source-map section offsets | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| `svgo` | `removeScripts` plugin leaves some executable scripts intact | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) |
| `vite` | `launch-editor`: `escapeCmdArgs()` omits `%` escaping on Windows | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) |
| `zod` | Memory exhaustion validating oversized constrained collections | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

### Low

| Package | Vulnerability | Advisory |
|---------|--------------|----------|
| `esbuild` | Arbitrary file read when running dev server on Windows | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |

---

## 2. Outdated Dependencies

**Result: No packages more than 1 major version behind.**

---

## 3. Code Security Patterns

### `set:html` with parsed Markdown (Low / Informational)

In `src/pages/projects/[slug].astro` (line 103):
```astro
<div class="readme-content" set:html={readmeContent} />
```

`readmeContent` is produced by `marked.parse(readmeRaw)`, where `readmeRaw` is loaded from committed `README.md` files via `import.meta.glob` at build time. This is **build-time static content**, not runtime user input, so actual XSS risk is low. However, in combination with the Critical `astro` XSS vulnerability above, any malformed attribute names in rendered output could be exploited.

**Action:** Add `marked`'s `sanitize` option (or use `DOMPurify` / `marked-sanitize-html`) to strip unsafe HTML from parsed Markdown, as defense in depth.

### `innerHTML` assignments

Several `innerHTML = '...'` assignments exist in `src/pages/*.astro` and frozen project files (`projects/day-030-out-of-africa/main.js`). All assignments use **static string literals** with no user-controlled data, so XSS risk is negligible. No action needed.

### No hardcoded secrets found

`functions/api/feedback.js` correctly reads `env.RESEND_API_KEY` from Cloudflare Worker environment bindings. No literal API keys found anywhere.

### `.gitignore` correctly excludes:

- `.env`
- `.env.production`
- `projects/day-002-music-charts/.env`

---

## 4. Configuration Review

- **No Dockerfile** present.
- **Cloudflare Pages** deployment: no server-side configuration files committed. Secrets are managed via Cloudflare dashboard environment bindings.
- **No `.env` files committed** to the repository.

---

## Recommended Actions

### Immediate (Critical)

1. **Upgrade `astro`** to fix the XSS vulnerability (GHSA-f48w-9m4c-m7f5):
   ```bash
   npm update astro
   # or for a specific fix version:
   npm install astro@latest
   ```
   This is a **production XSS** — highest priority.

### Short-term (High)

2. **Upgrade `sharp`** to fix bundled libvips CVEs (GHSA-f88m-g3jw-g9cj):
   ```bash
   npm update sharp
   ```

3. **Upgrade `zod`, `js-yaml`, `smol-toml`** (DoS vectors):
   ```bash
   npm update zod js-yaml smol-toml
   ```

4. **Upgrade `postcss`, `source-map-js`, `vite`, `nanoid`** (build tooling):
   ```bash
   npm update postcss source-map-js vite nanoid
   ```

5. **Upgrade `svgo`** — `removeScripts` plugin bypass could affect SVG assets in projects:
   ```bash
   npm update svgo
   ```

### Informational

6. **Add `marked` sanitization** in `src/pages/projects/[slug].astro` as defense in depth:
   ```js
   import { marked } from 'marked';
   import DOMPurify from 'isomorphic-dompurify';
   const readmeContent = readmeRaw
     ? DOMPurify.sanitize(marked.parse(readmeRaw))
     : null;
   ```

---

*Scan performed by Claude Code automated security audit.*

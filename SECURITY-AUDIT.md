# Security Audit — robinson-cursor

**Date:** 2026-09-29
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 6     |
| Moderate | 2     |
| Low      | 2     |

> ⚠️ **Critical findings present.** Astro 6.4.8 has a critical RCE vulnerability (CVSS 9.8) and must be updated. Several high-severity CVEs in transitive dependencies.

---

## 1. Dependency Audit

### npm — 9 vulnerable packages

Run: `npm audit`

#### Critical

| Package | Advisory | CVSS | Description |
|---------|---------|------|-------------|
| `astro` 6.4.8 | GHSA-26w7-cxv4-gfx2 | **9.8** | **Remote code execution through AVIF image optimization** — malformed AVIF triggers out-of-bounds read/write in libvips/sharp; unauthenticated, network-reachable |

Fix: `npm install astro@^7.3.5` (major version bump — review changelog for breaking changes)

#### High

| Package | Advisory | Description |
|---------|---------|-------------|
| `astro` 6.4.8 | GHSA-f48w-9m4c-m7f5 | XSS via unescaped spread attribute names in `renderHTMLElement` |
| `astro` 6.4.8 | GHSA-376h-93r7-7g6f | Authorization bypass — missing path-segment boundary check when stripping configured `base` |
| `js-yaml` (transitive) | GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh | Quadratic CPU consumption in `!!omap` resolution (DoS) |
| `sharp` 0.34.5 | GHSA-g89c-p67h-r497, GHSA-2jg2-4ch7-h545 | Inherited vulnerabilities in libvips (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591) and libheif |
| `smol-toml` (transitive) | GHSA-xxxx | DoS via malformed TOML documents |
| `svgo` (transitive) | GHSA-xxxx, GHSA-xxxx | `removeScripts` plugin leaves executable scripts and links intact (namespace + control-character bypasses) |

#### Moderate

| Package | Advisory | Description |
|---------|---------|-------------|
| `astro` 6.4.8 | GHSA-7pw4-f3q4-r2p2, GHSA-4g3v-8h47-v7g6 | XSS via unescaped `transition:*` directive values and View Transition animation properties |
| `devalue` (transitive) | GHSA-9rgm-9g3h-6x36 | DoS via malformed input (CVSS 5.3) |

#### Low

| Package | Advisory | Description |
|---------|---------|-------------|
| `esbuild` (transitive) | GHSA-g7r4-m6w7-qqqr | Dev server on Windows: arbitrary file read |
| `astro` 6.4.8 | GHSA-7pw4-f3q4-r2p2 | XSS via `transition:*` (low severity variant) |

---

## 2. Outdated Dependencies

| Package | Installed | Latest | Gap |
|---------|-----------|--------|-----|
| `astro` | 6.4.8 | 7.3.5 | **1 major** ⚠️ |
| `marked` | 18.0.4 | 18.0.14 | patch |
| `sharp` | 0.34.5 | latest | check |

> Upgrading astro from 6.x → 7.x resolves all astro-specific CVEs. Review the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) before upgrading.

---

## 3. Code Security Patterns

### innerHTML without sanitization (Low)

**File:** `src/pages/privacy.astro:134`

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

The decoded contact information is inserted as raw HTML via `innerHTML`. While the source data is hardcoded in the page itself (not user input), using `innerHTML` is a footgun — if the encoding/source ever changes to incorporate user-controlled or external data, XSS becomes possible.

**Recommended:** Use `textContent` for plain text, or sanitize with `DOMPurify` if HTML rendering is required:
```js
// Option A: plain text + manual line breaks
lines.forEach(b64 => {
  const span = document.createElement('span');
  span.textContent = xorDecodeBytes(b64, k);
  p.appendChild(span);
  p.appendChild(document.createElement('br'));
});
```

**Other `innerHTML` usages** in `projects/` (day-019, day-030) are consistent with intentional static UI patterns — no user input involved; low risk.

---

## 4. Configuration Review

- **No `.env` files committed** — `.gitignore` correctly excludes `.env`, `.env.production`, and `projects/day-002-music-charts/.env`.
- **No Dockerfile** present.
- **No hardcoded API keys or secrets** found in source files.
- **No wildcard CORS headers** found.

---

## 5. Recommended Actions

### Immediate (Critical)

1. **Upgrade astro to v7.x** — resolves the critical RCE (CVSS 9.8) and all 5 astro CVEs:
   ```bash
   npm install astro@^7.3.5
   # Review https://docs.astro.build/en/guides/upgrade-to/v7/ for breaking changes
   npm run build  # verify build still passes
   ```

### Short-term (High)

2. **Upgrade `sharp`** to get patched libvips/libheif:
   ```bash
   npm install sharp@latest
   ```
3. **Update `marked`** to latest patch (18.0.14):
   ```bash
   npm install marked@latest
   ```
4. Run `npm audit fix` after the astro upgrade to resolve remaining transitive issues.

### Medium-term

5. **Replace `innerHTML` in `privacy.astro:134`** with `textContent`-based rendering (see section 3).
6. Consider adding a `npm audit` step to CI (Cloudflare Pages build) so new CVEs are caught before deployment.

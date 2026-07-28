# Security Audit — robinson-cursor

**Date:** 2026-07-28
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-07-11

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 4     |
| Moderate | 0     |
| Low      | 1     |

> ⚠ **4 High-severity findings.** New: postcss path traversal, sharp libvips CVEs, svgo removeScripts bypass. Astro advisory set updated. vite and js-yaml resolved.

---

## Changes Since Last Audit (2026-07-11)

| Status       | Finding |
|--------------|---------|
| ✅ RESOLVED  | `vite 7.0.0–7.3.x` — NTLMv2, fs.deny bypass HIGH advisories — no longer flagged |
| ✅ RESOLVED  | `js-yaml 4.0.0–4.1.1` — Quadratic DoS MODERATE (GHSA-h67p-54hq-rp68) — no longer flagged |
| 🆕 NEW HIGH  | `postcss ≤8.5.17` — Path Traversal via sourceMappingURL (GHSA-r28c-9q8g-f849) |
| 🆕 NEW HIGH  | `sharp <0.35.0` — libvips CVEs: CVE-2026-33327/33328/35590/35591 (GHSA-f88m-g3jw-g9cj) |
| 🆕 NEW HIGH  | `svgo 4.0.0–4.0.1` — removeScripts bypass leaves executable script elements (GHSA-2p49-hgcm-8545) |
| ♻ UPDATED   | `astro ≤7.0.9` — 3 XSS advisories (expanded from 2; now includes GHSA-4g3v-8h47-v7g6, GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2) |
| ♻ PERSISTS  | `esbuild 0.27.3–0.28.0` — Arbitrary file read on Windows dev server (GHSA-g7r4-m6w7-qqqr) — LOW |
| ♻ PERSISTS  | `innerHTML` in `day-007-visualaizer/script.js:76` — unfixed |
| ♻ PERSISTS  | `innerHTML` with XOR-decoded contact in `src/pages/privacy.astro:134` — unfixed |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Total advisories:** 5 packages (4 high, 0 moderate, 1 low)

---

### HIGH — astro ≤ 7.0.9: Three XSS Vulnerabilities ♻ (updated advisory set)

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | 6.4.8 |
| Advisories | GHSA-4g3v-8h47-v7g6, GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2 |
| CWE        | CWE-79 (XSS) |
| Fix        | `npm install astro@^7.1.4` (major version bump 6 → 7) |

1. **GHSA-4g3v-8h47-v7g6** — Reflected XSS via unescaped View Transition animation properties (affects ≥2.9.0 ≤7.0.9)
2. **GHSA-f48w-9m4c-m7f5** — XSS via unescaped spread attribute names in `renderHTMLElement` (incomplete fix for CVE-2026-54298; affects <7.0.6)
3. **GHSA-7pw4-f3q4-r2p2** — XSS via unescaped `transition:*` directive values on hydrated islands (affects ≥3.10.0 <7.0.4)

**Exploitability for this site:** View Transitions, spread attributes, and transition directives are core Astro features. Review whether any component passes user-controlled values through these mechanisms. Even without dynamic user input, upgrading is recommended.

---

### HIGH — postcss ≤ 8.5.17: Path Traversal in Source Map Auto-Loading 🆕

| Field      | Value |
|------------|-------|
| Package    | `postcss` |
| Advisory   | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) |
| CWE        | CWE-22 (Path Traversal) |
| CVSS Score | 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N) |
| Fix        | `npm audit fix` (non-breaking) |

**Description:** `sourceMappingURL` comments can be crafted to trigger path traversal, leading to arbitrary `.map` file disclosure. Indirect dependency of `astro`. No production impact on Cloudflare Pages static builds, but affects any tooling that processes CSS with postcss.

---

### HIGH — sharp < 0.35.0: libvips Inherited CVEs 🆕

| Field      | Value |
|------------|-------|
| Package    | `sharp` |
| Installed  | 0.34.5 |
| Advisory   | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) |
| CVEs       | CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 |
| Fix        | `npm install sharp@^0.35.3` |

**Description:** Multiple vulnerabilities inherited from the bundled libvips image processing library. `sharp` is a devDependency used for thumbnail optimization (`npm run optimize-thumbs`). Not deployed to Cloudflare Pages.

**Note:** This is also a major-version-adjacent upgrade (0.34 → 0.35). Review the sharp changelog for any breaking API changes in the `optimize-thumbs.mjs` script.

---

### HIGH — svgo 4.0.0–4.0.1: removeScripts Plugin Bypass 🆕

| Field      | Value |
|------------|-------|
| Package    | `svgo` |
| Advisory   | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) |
| CWE        | CWE-79, CWE-184 |
| CVSS Score | 8.2 (AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N) |
| Fix        | `npm audit fix` (non-breaking) |

**Description:** The `removeScripts` SVGO plugin fails to remove certain executable script elements, leaving SVG files with XSS potential even after sanitization. Indirect dependency. Relevant only if SVGs from untrusted sources are processed; author-controlled SVGs are not at risk.

---

### LOW — esbuild 0.27.3–0.28.0: Arbitrary File Read on Windows Dev Server ♻

| Field      | Value |
|------------|-------|
| Package    | `esbuild` |
| Advisory   | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| CVSS Score | 2.5 (local, Windows-only) |
| Fix        | Upgrade astro (esbuild is a transitive dep); resolved at astro 7.x |

**Description:** Path traversal on the esbuild dev server on Windows. Dev environment only.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated` + `package-lock.json`

| Package  | In package.json | Wanted (lock) | Latest  | Status |
|----------|-----------------|---------------|---------|--------|
| `astro`  | `^6.4.8`        | 6.4.8         | 7.1.4   | 1 major version behind ⚠ (has HIGH vulns) |
| `sharp`  | `^0.34.5`       | 0.34.5        | 0.35.3  | 1 minor behind ⚠ (has HIGH CVEs) |
| `marked` | `^18.0.0`       | 18.0.7        | 18.0.7  | Current ✅ |

**astro 6.x → 7.x:** Required to fix the 3 XSS advisories above. The fix is a major version bump; review the [Astro 6→7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) before upgrading.

**sharp 0.34 → 0.35:** Fixes all 4 libvips CVEs. Check `scripts/optimize-thumbs.mjs` for any breaking API usage after upgrade.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with `marked.parse()` on Fetched Markdown 🆕

**File:** `projects/day-030-out-of-africa/main.js:1908`
**Severity:** Low

```js
const [md, marked] = await Promise.all([
  fetch("CHANGELOG.md", { cache: "no-cache" }).then(r => r.text()),
  loadMarked()
]);
wrap.innerHTML = marked.parse(md);
```

`CHANGELOG.md` is fetched from the same origin (`/embed/day-030-out-of-africa/CHANGELOG.md`). If this file is ever replaced with attacker-controlled content (e.g., via a compromised deploy), the `marked.parse()` output is injected directly into the DOM without sanitization, enabling XSS.

**Recommended action:** Pass `marked` output through `DOMPurify.sanitize()` before assignment, or use the `sanitize` option available in newer `marked` versions (though the dedicated sanitizer is preferred).

---

### LOW — `innerHTML` with External Track Metadata ♻

**File:** `projects/day-007-visualaizer/script.js:76-78`
**Severity:** Low (persists from 2026-04-14 audit)

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

Data is sourced from local `tracks.json`. Low risk as currently implemented.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` against an `https://` allowlist before constructing the anchor.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Severity:** Low (persists from 2026-04-14 audit)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source data is a build-time constant. No runtime attack surface.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **Committed `.env` files:** None found.
- **`wrangler.jsonc`:** Contains a KV namespace ID (`d3bd92095a4542698d19734f15ad4bf7`) — this is a non-secret Cloudflare resource identifier, safe to commit.
- **CORS:** Not applicable — static site + Cloudflare Workers. No permissive CORS headers found.
- **Hardcoded secrets:** None found.

---

## Recommended Actions (Priority Order)

| Priority | Action |
|----------|--------|
| 🔴 High | `npm install astro@^7.1.4` — fixes 3 XSS CVEs in astro and the esbuild LOW. Review Astro 6→7 migration guide first. Run `astro build` and smoke-test. |
| 🔴 High | `npm install sharp@^0.35.3` — fixes 4 libvips CVEs (devDependency only). |
| 🟡 Medium | `npm audit fix` — fixes postcss (HIGH) and svgo (HIGH) without breaking changes. |
| 🟢 Low | In `day-007-visualaizer/script.js:76`, replace `innerHTML` with `textContent` for track metadata fields. |
| 🟢 Low | In `day-030-out-of-africa/main.js:1908`, sanitize `marked.parse()` output before `innerHTML` assignment. |
| 🟢 Low | In `privacy.astro:134`, replace `innerHTML` with DOM node construction. |

Running all three npm commands resolves all 5 advisories:
```
npm install astro@^7.1.4 sharp@^0.35.3 && npm audit fix
```

---

*Scan completed: 2026-07-28 | Tool versions: npm audit (npm 10.x)*

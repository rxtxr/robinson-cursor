# Security Audit — robinson-cursor

**Date:** 2026-05-26
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-05-19

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 0     |
| Moderate | 0     |
| Low      | 2     |

> All High and Moderate vulnerabilities flagged in the 2026-05-19 audit have been resolved. Two Low-severity code pattern findings persist.

---

## Changes Since Last Audit (2026-05-19)

| Status      | Finding |
|-------------|---------|
| ✅ RESOLVED | `defu ≤ 6.1.4` — Prototype Pollution (GHSA-737v-mqg7-c878) |
| ✅ RESOLVED | `devalue 5.6.3–5.8.0` — DoS via sparse array (GHSA-77vg-94rm-hx3p) |
| ✅ RESOLVED | `vite 7.0.0–7.3.1` — 3 HIGH advisories (path traversal, fs.deny bypass, WebSocket file read) |
| ✅ RESOLVED | `astro ≤ 6.1.9` — XSS in `define:vars` (GHSA-j687-52p2-xcff) |
| ✅ RESOLVED | `astro ≤ 6.1.9` — Server island parameter replay (GHSA-xr5h-phrj-8vxv) |
| ✅ RESOLVED | `postcss < 8.5.10` — XSS via unescaped `</style>` (GHSA-qx2v-qp2m-jg93) |
| ✅ RESOLVED | `marked` 1 major version behind (updated to 18.0.4) |
| ♻ PERSISTS | `innerHTML` in `projects/day-007-visualaizer/script.js:76` |
| ♻ PERSISTS | `innerHTML` in `src/pages/privacy.astro:134` |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit`
**Lock file:** `package-lock.json`
**Installed versions:** `astro` 6.3.5, `marked` 18.0.4
**Result:** ✅ No known vulnerabilities found (0 advisories)

All previously flagged CVEs have been resolved by the lockfile updates. No action required.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package  | Wanted  | Latest  | Status |
|----------|---------|---------|--------|
| `astro`  | 6.3.7   | 6.3.7   | ✅ Current |
| `marked` | 18.0.4  | 18.0.4  | ✅ Current |

All tracked dependencies are at their latest versions. No outdated packages found.

---

## 3. Code Security Patterns

### LOW — `innerHTML` with Unsanitized Track Data ♻

**File:** `projects/day-007-visualaizer/script.js:76`
**Severity:** Low (persists from 2026-04-14 and 2026-05-19 audits)

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

`track.licenseUrl`, `track.license`, and `track.artist` come from `tracks.json` (fetched locally from a build-time static file). Current risk is low since the data source is under project control. If this data source ever becomes externally fed or user-supplied, stored XSS is possible.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` against an `https://` prefix allowlist before building the anchor element.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`
**Severity:** Low (persists from 2026-04-14 and 2026-05-19 audits)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

The source data (`encodedContact`) is a build-time constant; no runtime attack surface exists. However, using `innerHTML` for content that is not required to contain HTML markup is unnecessarily risky if the source data ever changes or is moved to an editable location.

**Recommended action:** Replace with explicit DOM construction — `textContent` per line and `document.createElement('br')` separators — to eliminate the `innerHTML` dependency entirely.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **`.env` committed:** No tracked `.env` files found.
- **`wrangler.jsonc`:** Contains only the KV namespace binding ID (not a secret) and deployment name. No credentials present.
- **CORS:** Not applicable — static site deployed on Cloudflare Pages.
- **Hardcoded secrets:** None found. `RESEND_API_KEY` is loaded from Cloudflare Pages environment variables at runtime.
- **Hardcoded email:** `functions/api/feedback.js:59` contains `"mareisen@pm.me"` as a fallback notification address. This is a default config value, not a credential, and already present in comments. Low/informational.

---

## Recommended Actions (Priority Order)

1. **[Low]** In `projects/day-007-visualaizer/script.js`, replace `innerHTML` with `textContent` and explicit DOM node construction for unsanitized track metadata fields (`track.license`, `track.artist`, `track.licenseUrl`).
2. **[Low]** In `src/pages/privacy.astro`, replace `innerHTML` with DOM node construction (`textContent` + `createElement('br')`).

> **Note:** These two findings have now appeared in three consecutive audits (2026-04-14, 2026-05-19, 2026-05-26). If the risk is intentionally accepted, document the decision and suppress future findings for these specific locations.

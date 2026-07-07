# Security Audit — robinson-cursor

**Date:** 2026-07-07
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)
**Previous audit:** 2026-05-19

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Moderate | 2     |
| Low      | 1     |
| Code / Config | 2 |

> ⚠ **2 HIGH-severity findings. High-severity findings persist since previous audit (2026-05-19). Action required.**

---

## Changes Since Last Audit (2026-05-19)

| Status | Finding |
|--------|---------|
| 🆕 NEW HIGH | `astro < 6.4.6` — Host header SSRF in prerendered error page (GHSA-2pvr-wf23-7pc7) |
| 🆕 NEW HIGH | `vite 7.0.0–7.3.4` — `server.fs.deny` bypass on Windows (GHSA-fx2h-pf6j-xcff) |
| 🆕 NEW MOD | `astro < 6.4.6` — XSS via unescaped spread prop attribute names (GHSA-jrpj-wcv7-9fh9) |
| 🆕 NEW MOD | `js-yaml 4.0.0–4.1.1` — Quadratic DoS via YAML merge keys (GHSA-h67p-54hq-rp68) |
| 🆕 NEW LOW | `esbuild 0.27.3–0.28.0` — File read on Windows dev server (GHSA-g7r4-m6w7-qqqr) |
| ♻ PERSISTS | `innerHTML` in `src/pages/privacy.astro` — flagged 2026-04-14, unfixed |
| ♻ PERSISTS | `astro` 1 major version behind (v6 vs v7) |

> **Note:** All npm CVEs from the May 2026 audit (`defu`, `devalue`, previous `vite` chain) appear resolved in the current lock file. New CVEs introduced by the updated astro/vite range.

---

## 1. Dependency Vulnerabilities (npm audit)

### HIGH

#### GHSA-2pvr-wf23-7pc7 — astro < 6.4.6: Host header SSRF in prerendered error page fetch
- **Package:** `astro` (current: `^6.1.1`)
- **CVSS:** 7.5 (High)
- **CWE:** CWE-20 (Improper Input Validation), CWE-918 (SSRF)
- **Impact:** A crafted `Host` header on a request to a prerendered error page causes the Astro server to make an outbound HTTP request to an attacker-controlled host. This can expose internal network topology, bypass firewall rules, or leak metadata in cloud environments.
- **Fix:** Upgrade `astro` to `^6.4.8` (within the existing v6 major):
  ```bash
  npm install astro@^6.4.8
  ```
- **Advisory:** https://github.com/advisories/GHSA-2pvr-wf23-7pc7

#### GHSA-fx2h-pf6j-xcff — vite 7.0.0–7.3.4: `server.fs.deny` bypass on Windows alternate paths
- **Package:** `vite` (transitive via `astro`)
- **CVSS:** High
- **CWE:** CWE-22 (Path Traversal), CWE-200 (Information Exposure)
- **Impact:** The `server.fs.deny` allowlist is bypassed via Windows alternate path representations (short paths, drive-letter variations), allowing the dev server to serve files outside the project root.
- **Note:** Exploitable only on Windows during `astro dev`. Cloudflare Pages production builds are not affected.
- **Fix:** Upgrade `astro` to `^6.4.8` (brings a patched vite transitively).
- **Advisory:** https://github.com/advisories/GHSA-fx2h-pf6j-xcff

### MODERATE

#### GHSA-jrpj-wcv7-9fh9 — astro < 6.4.6: XSS via unescaped attribute names in spread props
- **Package:** `astro`
- **CVSS:** 4.2 (Moderate)
- **CWE:** CWE-79 (Cross-Site Scripting)
- **Impact:** Astro components using spread props (`{...attrs}`) with attacker-controlled attribute keys may render unescaped HTML attribute names, enabling XSS in rendered pages.
- **Fix:** Upgrade `astro` to `^6.4.8`.
- **Advisory:** https://github.com/advisories/GHSA-jrpj-wcv7-9fh9

#### GHSA-h67p-54hq-rp68 — js-yaml 4.0.0–4.1.1: Quadratic-complexity DoS via YAML merge keys
- **Package:** `js-yaml` (transitive via `astro`)
- **CVSS:** 5.3 (Moderate)
- **CWE:** CWE-407 (Algorithmic Complexity)
- **Impact:** Parsing a YAML document with deeply nested `<<` merge key aliases causes quadratic CPU growth, enabling DoS.
- **Note:** This project parses only author-controlled YAML at build time. No user-supplied YAML is processed. Exploitability is low.
- **Fix:** Upgrade `astro` to `^6.4.8`.
- **Advisory:** https://github.com/advisories/GHSA-h67p-54hq-rp68

### LOW

#### GHSA-g7r4-m6w7-qqqr — esbuild 0.27.3–0.28.0: Arbitrary file read on Windows dev server
- **Package:** `esbuild` (transitive via `astro`)
- **CVSS:** 2.5 (Low)
- **CWE:** CWE-22 (Path Traversal)
- **Impact:** On Windows, the esbuild dev server can be made to read arbitrary files via crafted request paths. Production builds are not affected.
- **Fix:** Upgrade `astro` to `^6.4.8`.
- **Advisory:** https://github.com/advisories/GHSA-g7r4-m6w7-qqqr

---

## 2. Outdated Dependencies

| Package | In `package.json` | Wanted | Latest |
|---------|-------------------|--------|--------|
| `astro` | `^6.1.1` | 6.4.8 | **7.0.6** |

All current CVEs are fixed within the v6 range (`npm install astro@^6.4.8`). A separate upgrade to Astro v7 should be planned after reviewing the migration guide.

---

## 3. Code Security Patterns

### MODERATE — `innerHTML` set from XOR-decoded hardcoded data ♻ (persists from 2026-04-14)

**File:** `src/pages/privacy.astro`, line 134
```javascript
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```
The decoded content comes from a build-time constant (`encodedContact`) obfuscated with XOR, not from user input. Current risk is low — the content is fully developer-controlled.

If the encoding ever shifts to accept user-supplied input or server-fetched values, this becomes a direct XSS vector. This finding has been open since 2026-04-14 with no fix applied.

**Recommendation:** Replace with `textContent`-based DOM construction:
```javascript
const a = document.createElement('a');
a.href = `mailto:${decodedEmail}`;
a.textContent = decodedEmail;
el.appendChild(a);
```

### LOW — `innerHTML = marked.parse(md)` from a fetched static file (day-030)

**File:** `projects/day-030-out-of-africa/main.js`, line 1908
```javascript
wrap.innerHTML = marked.parse(md);
// md = await fetch("CHANGELOG.md").then(r => r.text())
```
Content comes from `CHANGELOG.md` (a developer-authored static file) — not user input. Risk is low in current form. The `marked` library is loaded from a CDN URL (`cdn.jsdelivr.net/npm/marked@12/...`) without an integrity hash, meaning the version could change silently.

**Recommendation:** Add a `integrity` attribute with a subresource integrity (SRI) hash to the CDN `<script>` tag, or bundle `marked` locally via `package.json`.

---

## 4. Configuration Review

- **`.env` in `.gitignore`:** ✅ `.env`, `.env.production`, and `projects/day-002-music-charts/.env` are gitignored.
- **No `.env` files committed:** ✅ No tracked `.env` files found in working tree.
- **No Dockerfile** in repository. ✅
- **`functions/api/feedback.js`:** ✅ Input validated and clipped before KV storage. IP/country recorded server-side. `waitUntil` used correctly for Resend notifications.
- **Hardcoded secrets:** None found. ✅
- **KV namespace ID in `wrangler.jsonc`:** The binding ID (`d3bd92095a4542698d19734f15ad4bf7`) is public. KV namespace IDs are not credentials, but note this is visible to anyone with repo access.

---

## Recommended Actions (Priority Order)

1. **[HIGH — Immediate]** Upgrade `astro` to at least `6.4.8`:
   ```bash
   npm install astro@^6.4.8
   npm audit
   ```
   This single upgrade resolves **all 5 npm CVEs** (GHSA-2pvr-wf23-7pc7, GHSA-fx2h-pf6j-xcff, GHSA-jrpj-wcv7-9fh9, GHSA-h67p-54hq-rp68, GHSA-g7r4-m6w7-qqqr). Run `astro build` locally after upgrading to confirm the build still passes.

2. **[MODERATE — Code]** Fix `privacy.astro` line 134: replace `innerHTML` with `textContent` / explicit DOM construction. This finding has been open since 2026-04-14 (3 audits, unfixed).

3. **[LOW — Code]** In `day-030/main.js`, add an SRI integrity hash to the CDN-loaded `marked` script tag, or import `marked` from the project's local `node_modules` instead.

4. **[Plan]** After resolving current CVEs, review the [Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) and schedule an upgrade to stay on a supported major version.

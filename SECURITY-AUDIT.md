# Security Audit — robinson-cursor

**Date:** 2026-05-19  
**Auditor:** Automated weekly security scan  
**Package manager:** npm (Node.js / Astro)  
**Previous audit:** 2026-04-14

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 3     |
| Medium   | 2     |
| Low      | 2     |

> ⚠ **High-severity findings persist from the 2026-04-14 audit (unfixed). One new HIGH and two new MODERATE vulnerabilities found since last scan.**

---

## Changes Since Last Audit (2026-04-14)

| Status      | Finding |
|-------------|---------|
| 🆕 NEW HIGH | `devalue 5.6.3–5.8.0` — DoS via sparse array deserialization (GHSA-77vg-94rm-hx3p) |
| 🆕 NEW MOD  | `astro <=6.1.9` — XSS in `define:vars` via incomplete `</script>` sanitization (GHSA-j687-52p2-xcff) |
| 🆕 NEW MOD  | `astro <=6.1.9` — Server island encrypted parameters vulnerable to replay (GHSA-xr5h-phrj-8vxv) |
| 🆕 NEW MOD  | `postcss <8.5.10` — XSS via unescaped `</style>` in CSS stringify output (GHSA-qx2v-qp2m-jg93) |
| ♻ PERSISTS | `defu <=6.1.4` — Prototype Pollution HIGH (GHSA-737v-mqg7-c878) — flagged 2026-04-14, **not yet fixed** |
| ♻ PERSISTS | `vite 7.0.0–7.3.1` — 3 HIGH advisories (GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583) — flagged 2026-04-14, **not yet fixed** |
| ♻ PERSISTS | `marked` 1 major version behind (v17 vs v18) |
| ♻ PERSISTS | `innerHTML` in `day-007-visualaizer/script.js` |
| ♻ PERSISTS | `innerHTML` in `src/pages/privacy.astro` |

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit` (npm 10.x)  
**Lock file:** `package-lock.json`  
**Total advisories:** 5 packages (3 high, 2 moderate)

---

### HIGH — defu: Prototype Pollution ♻ (persists from 2026-04-14)

| Field      | Value |
|------------|-------|
| Package    | `defu` |
| Installed  | ≤ 6.1.4 |
| Advisory   | [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878) |
| CWE        | CWE-1321 (Prototype Pollution) |
| CVSS Score | 7.5 (High) — CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N |
| Fix        | `npm audit fix` |

**Description:** `defu` allows prototype pollution via the `__proto__` key in a defaults argument. An attacker who can control input to `defu()` can pollute `Object.prototype`, potentially affecting all objects in the application. Indirect dependency of `astro`. **This was flagged in the April 14 audit and has not been fixed.**

---

### HIGH — devalue: DoS via Sparse Array Deserialization 🆕

| Field      | Value |
|------------|-------|
| Package    | `devalue` |
| Installed  | 5.6.3 – 5.8.0 |
| Advisory   | [GHSA-77vg-94rm-hx3p](https://github.com/advisories/GHSA-77vg-94rm-hx3p) |
| CWE        | CWE-770 (Uncontrolled Resource Consumption) |
| CVSS Score | 7.5 (High) — CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H |
| Fix        | `npm audit fix` |

**Description:** `devalue` (used by `astro` for server-side serialization) fails to properly bound memory allocation when deserializing sparse arrays. A malicious payload can trigger unbounded memory growth, causing a denial-of-service crash. This is a **new** finding not present in the April 2026 audit.

---

### HIGH — vite: Multiple Vulnerabilities ♻ (persists from 2026-04-14)

| Field      | Value |
|------------|-------|
| Package    | `vite` |
| Installed  | 7.0.0 – 7.3.1 |
| Fix        | `npm audit fix` |

Indirect dependency of `astro`. **All three advisories were flagged in the April 14 audit and have not been fixed.**

#### 1. Path Traversal in Optimized Deps `.map` Handling
- **Advisory:** [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)
- **CWE:** CWE-22, CWE-200
- **Description:** Vite dev server improperly handles `.map` file requests, allowing path traversal to read arbitrary files.

#### 2. `server.fs.deny` Bypass with Queries
- **Advisory:** [GHSA-v2wj-q39q-566r](https://github.com/advisories/GHSA-v2wj-q39q-566r)
- **CWE:** CWE-180, CWE-284
- **Description:** The `server.fs.deny` restriction can be bypassed by appending query parameters to requests.

#### 3. Arbitrary File Read via Dev Server WebSocket
- **Advisory:** [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583)
- **CWE:** CWE-200, CWE-306
- **Description:** The Vite development server WebSocket handler can be exploited to read arbitrary files without authentication.

> **Note:** All three vite advisories affect the dev server only (`astro dev`) and do not impact Cloudflare Pages production deployments.

---

### MODERATE — astro: XSS in `define:vars` 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | ≤ 6.1.9 |
| Advisory   | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) |
| CWE        | CWE-79 (XSS) |
| CVSS Score | 6.1 (Moderate) — CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N |
| Fix        | `npm audit fix` (upgrades astro to ≥ 6.1.10) |

**Description:** Astro's `define:vars` directive does not fully sanitize the `</script>` closing tag sequence. A carefully crafted value injected into a `define:vars` script block could allow a stored XSS attack if user-controlled data is passed to `define:vars`. Review project usage of `define:vars` to assess exploitability.

---

### MODERATE — astro: Server Island Encrypted Parameter Replay 🆕

| Field      | Value |
|------------|-------|
| Package    | `astro` |
| Installed  | ≤ 6.1.9 |
| Advisory   | [GHSA-xr5h-phrj-8vxv](https://github.com/advisories/GHSA-xr5h-phrj-8vxv) |
| CWE        | CWE-79, CWE-323 |
| CVSS Score | 6.1 (Moderate) |
| Fix        | `npm audit fix` (same upgrade as above) |

**Description:** Encrypted props passed to Astro server islands may be replayed across components or requests if the nonce/key rotation is insufficient. Exploitability depends on use of server islands with sensitive props.

> **Note:** This site does not appear to use Astro server islands currently. Risk is low but the upgrade is still recommended.

---

### MODERATE — postcss: XSS via Unescaped `</style>` in CSS Output 🆕

| Field      | Value |
|------------|-------|
| Package    | `postcss` |
| Installed  | < 8.5.10 |
| Advisory   | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) |
| CWE        | CWE-79 (XSS) |
| CVSS Score | 6.1 (Moderate) — CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N |
| Fix        | `npm audit fix` |

**Description:** PostCSS does not escape `</style>` sequences in its CSS stringify output. If user-controlled CSS content (e.g., from a CMS or dynamic styles) is processed by PostCSS and injected into a `<style>` block, XSS is possible. For this static site with no dynamic CSS pipeline, exploitability is low — but the patch is safe to apply.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated` + package-lock.json inspection

| Package  | In package.json | Latest  | Status |
|----------|-----------------|---------|--------|
| `marked` | ^17.0.5         | 18.0.4  | **1 major version behind** ⚠ |
| `astro`  | ^6.1.1          | 6.3.5   | 2 minor versions behind ⚠ (multiple CVEs in 6.1.x) |

**`marked` 17 → 18:** Still one major version behind as noted in the April 14 audit. Major releases may contain security hardening not backported to v17.

**`astro` 6.1.1 → 6.3.5:** This is no longer just a patch — running `npm audit fix` is required to resolve the XSS and replay CVEs in astro. The wanted/latest version is 6.3.5.

---

## 3. Code Security Patterns

### LOW — `innerHTML` Assignment with External Track Data ♻

**File:** `projects/day-007-visualaizer/script.js:76-78`  
**Severity:** Low (carried over from 2026-04-14 audit)

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

`track.licenseUrl`, `track.license`, and `track.artist` are sourced from `tracks.json` (fetched locally). If the data source ever becomes external or user-controlled, this enables stored XSS. Currently low risk.

**Recommended action:** Use `textContent` for `track.license` and `track.artist`; validate `track.licenseUrl` against an `https://` allowlist before constructing the anchor.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data ♻

**File:** `src/pages/privacy.astro:134`  
**Severity:** Low (carried over from 2026-04-14 audit)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

The source data is a build-time constant; there is no runtime attack surface. However, `innerHTML` is unnecessarily risky if the decoded content changes.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **`.env` committed:** No tracked `.env` files found.
- **`wrangler.jsonc`:** No secrets; contains only deployment name and compatibility date.
- **CORS:** Not applicable — static site deployed on Cloudflare Pages.
- **Hardcoded secrets:** None found.

---

## Recommended Actions (Priority Order)

1. **[High — Immediate]** Run `npm audit fix` to patch `defu`, `devalue`, `vite`, `astro`, and `postcss`. These were flagged on April 14 and remain unpatched 35 days later. Run `astro build` and test locally after the update.
2. **[High]** Update `astro` in `package.json` from `^6.1.1` to `^6.3.5` and run `npm install` — `npm audit fix` should handle this, but confirm the version constraint.
3. **[Medium]** Update `marked` from `^17.0.5` to `^18.0.0` in `package.json` and review the [marked v18 changelog](https://github.com/markedjs/marked/releases) for breaking changes.
4. **[Low]** In `day-007-visualaizer/script.js`, replace `innerHTML` with `textContent` for unsanitized track metadata fields.
5. **[Low]** In `privacy.astro`, replace `innerHTML` with DOM node construction.

# Security Audit — robinson-cursor

**Date:** 2026-04-14  
**Auditor:** Automated weekly security scan  
**Package manager:** npm (Node.js / Astro)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Medium   | 0     |
| Low      | 2     |

> ⚠ **New high-severity findings since last audit (2026-03-31).** Two packages have known CVEs requiring immediate attention.

---

## 1. Dependency Audit (npm audit)

**Tool:** `npm audit` (npm 10.9.7)  
**Lock file:** `package-lock.json`  
**Total advisories:** 4 (across 2 packages)

### HIGH — defu: Prototype Pollution

| Field       | Value |
|-------------|-------|
| Package     | `defu` |
| Installed   | 6.1.4 |
| Affected    | ≤ 6.1.4 |
| Advisory    | [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878) |
| CWE         | CWE-1321 (Prototype Pollution) |
| CVSS Score  | 7.5 (High) — CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N |
| Fix         | Available via `npm audit fix` |

**Description:** `defu` allows prototype pollution via the `__proto__` key in a defaults argument. An attacker who can control the input to a `defu()` call can pollute `Object.prototype`, potentially affecting all objects in the application. `defu` is an indirect dependency pulled in by `astro`.

---

### HIGH — vite: Multiple Vulnerabilities (3 advisories)

| Field       | Value |
|-------------|-------|
| Package     | `vite` |
| Installed   | 7.3.1 |
| Affected    | 7.0.0 – 7.3.1 |
| Fix         | Available via `npm audit fix` |

`vite` is an indirect dependency pulled in by `astro`.

#### 1. Path Traversal in Optimized Deps `.map` Handling
- **Advisory:** [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)
- **Severity:** Moderate
- **CWE:** CWE-22 (Path Traversal), CWE-200 (Exposure of Sensitive Information)
- **Description:** The Vite dev server improperly handles `.map` file requests for optimized dependencies, potentially allowing path traversal to read arbitrary files from the filesystem.

#### 2. `server.fs.deny` Bypass with Queries
- **Advisory:** [GHSA-v2wj-q39q-566r](https://github.com/advisories/GHSA-v2wj-q39q-566r)
- **Severity:** High
- **CWE:** CWE-180, CWE-284 (Improper Access Control)
- **Description:** The `server.fs.deny` restriction can be bypassed by appending query parameters to requests, allowing access to files that should be blocked.

#### 3. Arbitrary File Read via Dev Server WebSocket
- **Advisory:** [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583)
- **Severity:** High
- **CWE:** CWE-200, CWE-306
- **Description:** The Vite development server's WebSocket handler can be exploited to read arbitrary files from the host filesystem without authentication.

> **Note:** All three vite vulnerabilities affect the **development server only** (`astro dev`) and do not affect production builds or Cloudflare Pages deployments. Risk is limited to developer machines during local development.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated` + `package-lock.json` inspection

| Package  | Installed | Wanted | Latest | Status                          |
|----------|-----------|--------|--------|---------------------------------|
| `marked` | 17.0.5    | 17.0.6 | 18.0.0 | **1 major version behind** ⚠    |
| `astro`  | 6.1.1     | 6.1.6  | 6.1.6  | Minor patch behind              |

**`marked` 17 → 18:** The package has crossed a major version boundary. Major versions may include security improvements not backported to v17. Upgrading is recommended.

---

## 3. Code Security Patterns

### LOW — `innerHTML` Assignment with External Track Data

**File:** `projects/day-007-visualaizer/script.js:76-78`  
**Severity:** Low

```js
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

`track.licenseUrl`, `track.license`, and `track.artist` are sourced from `tracks.json` (loaded via `fetch('tracks.json')`). If `tracks.json` is ever served from an untrusted or externally-controlled source, this pattern enables stored XSS. The file is currently local and static, making exploitability low.

**Recommended action:** Use `textContent` for plain text fields and validate `track.licenseUrl` against an `https://` allowlist before constructing links.

---

### LOW — `innerHTML` with XOR-Decoded Contact Data

**File:** `src/pages/privacy.astro:134`  
**Severity:** Low (carried over from 2026-03-31 audit)

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Contact data is XOR-obfuscated at build time and decoded in the browser. The source data is a build-time constant, so there is no runtime attack surface. However, `innerHTML` is unnecessarily risky if the decoded content ever includes HTML-special characters or if the data source changes.

**Recommended action:** Replace with `textContent` + explicit `<br>` DOM nodes.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded.
- **`.env` committed:** No tracked `.env` files found.
- **`wrangler.jsonc`:** No secrets detected; contains only deployment name and compatibility date.
- **CORS:** No server-side CORS configuration (static site / Cloudflare Pages).

---

## Recommended Actions (Priority Order)

1. **[High]** Run `npm audit fix` to update `defu` and `vite` to patched versions. Verify `astro` build remains functional after the update.
2. **[High]** Update `marked` from `^17.0.5` to `^18.0.0` in `package.json`, run `npm install`, and review the [marked v18 changelog](https://github.com/markedjs/marked/releases) for breaking changes.
3. **[Low]** In `day-007-visualaizer/script.js`, replace `innerHTML` with `textContent` for unsanitized track metadata fields.
4. **[Low]** In `privacy.astro`, replace `innerHTML` with DOM node construction.
5. **[Low]** Update `astro` from `6.1.1` to `6.1.6` for latest patch fixes.

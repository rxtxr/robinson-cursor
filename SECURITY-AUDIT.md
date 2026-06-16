# Security Audit — robinson-cursor

**Date:** 2026-06-16  
**Auditor:** Automated weekly security scan  
**Package manager:** npm (Node.js / Astro)  
**Previous audit:** 2026-05-19

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 3     |
| Moderate | 1     |
| Low      | 0     |
| **Total**| **4** |

No critical vulnerabilities. All high-severity findings are in the **build toolchain** (esbuild/vite bundled transitively via astro) and primarily relevant when running the dev server. The `js-yaml` moderate finding is a build-time DoS risk, not a runtime issue.

---

## 1. Dependency Audit — npm

`npm audit` reported **4 vulnerabilities** (0 critical, 3 high, 1 moderate, 0 low).

### HIGH

#### esbuild — GHSA-gv7w-rqvm-qjhr (CVSS 8.1)
- **Title:** Missing binary integrity verification in Deno module enables RCE via NPM_CONFIG_REGISTRY
- **Affected:** esbuild 0.17.0–0.28.0 (bundled transitively via astro → vite)
- **CWE:** CWE-426 (Untrusted Search Path), CWE-494 (Download of Code Without Integrity Check)
- **Fix:** `npm install astro@latest` — pulls in a patched esbuild version

#### vite — GHSA-fx2h-pf6j-xcff
- **Title:** `server.fs.deny` bypass via Windows alternate data stream paths
- **Affected:** vite 7.0.0–7.3.4 (bundled transitively via astro)
- **Fix:** `npm install astro@latest` — pulls in vite ≥ 7.3.5

#### astro — GHSA-gv7w-rqvm-qjhr (via esbuild/vite chain)
- **Affected:** astro 2.5.0–7.0.0-alpha.1 (current: ^6.1.1)
- **Fix:** `npm install astro@latest`

### MODERATE

#### js-yaml — GHSA-h67p-54hq-rp68 (CVSS 5.3)
- **Title:** Quadratic-complexity DoS via repeated YAML merge key aliases
- **Affected:** js-yaml ≤ 4.1.1 (transitive via astro build pipeline)
- **CWE:** CWE-407 (Algorithmic Complexity)
- **Impact:** Build-time only — not exploitable in production unless YAML is parsed from untrusted user input at runtime (it is not)
- **Fix:** `npm install astro@latest` (pulls in a patched js-yaml)

---

## 2. Outdated Dependencies

| Package | Pinned Range | Installed | Latest Available |
|---------|-------------|-----------|------------------|
| astro   | ^6.1.1      | 6.1.x     | 6.4.7            |
| marked  | ^18.0.0     | 18.0.x    | 18.0.5           |

Run `npm install` to update to the latest within the existing semver ranges.

---

## 3. Code Security Patterns

### marked.parse() + innerHTML (projects/day-030-out-of-africa/main.js:1908)

```js
const md = await fetch("CHANGELOG.md", { cache: "no-cache" }).then(r => r.text());
wrap.innerHTML = marked.parse(md);
```

`md` is fetched from a **same-origin static file** (`CHANGELOG.md`) committed to the repo — not user input. The XSS risk is **currently low** because the data source is fully controlled.

However, `marked` does not sanitize HTML by default. If the data source ever changes to user-supplied or third-party content, this becomes a critical XSS vector. Consider adding `marked.use({ hooks: { postprocess: html => DOMPurify.sanitize(html) } })` as a precautionary measure.

### innerHTML clearings — No Issue

The remaining `innerHTML` usages in `day-030-out-of-africa/main.js` are either:
- Clearing containers (`innerHTML = ""`)
- Assigning hard-coded template literals with no user data

These are safe.

### innerHTML in day-019-essentia-live (index.html:345)

Assigns a static loading message string. Safe.

### feedback.js API endpoint (functions/api/feedback.js) — Well Implemented

Input validation is solid:
- Type whitelist via `VALID_TYPES` Set
- All string fields clipped to maximum lengths
- API key loaded from environment (`env.RESEND_API_KEY`), not hardcoded
- Rate limiting deferred to Cloudflare edge — acceptable for current usage

### API Keys — No Issues Found

`RESEND_API_KEY` is read from Cloudflare Pages environment bindings at runtime. No secrets found hardcoded in any `.js`, `.ts`, or `.astro` source file. `.env` and `.env.production` are in `.gitignore`.

---

## 4. Configuration Review

- **`.gitignore`:** `.env`, `.env.production`, and `projects/day-002-music-charts/.env` are all excluded. No `.env` files are tracked in git.
- **`wrangler.jsonc`:** No secrets hardcoded; uses Cloudflare KV bindings by name.
- **Docker:** No Dockerfile present — not applicable.
- **Projects isolation:** Each project in `projects/` is a self-contained directory with no shared state, consistent with the isolation rule in CLAUDE.md.

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| HIGH | `npm install astro@latest` — resolves esbuild, vite, js-yaml findings in one command |
| LOW | `npm install` — updates astro and marked to latest within current semver ranges |
| LOW | Consider adding `DOMPurify` to `day-030-out-of-africa/main.js` for `marked.parse()` output (precautionary, current risk is low) |

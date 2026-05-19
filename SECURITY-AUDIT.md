# Security Audit — robinson-cursor

**Date:** 2026-05-12
**Auditor:** Automated weekly security scan
**Package manager:** npm (Node.js / Astro)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Medium   | 2     |
| Low      | 2     |

> ⚠ **High-severity findings persist since last audit (2026-04-14).** `defu` prototype pollution and `vite` file-read CVEs remain unpatched and require immediate attention.

---

## 1. Dependency Audit

`npm audit` found **4 vulnerabilities (2 high, 2 moderate)**:

### HIGH

| Package | Installed range | Advisory | CVSS | CWE |
|---------|-----------------|----------|------|-----|
| `defu` | ≤6.1.4 | [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878) | 7.5 | CWE-1321: Prototype pollution via `__proto__` key |
| `vite` | 7.0.0–7.3.1 | [GHSA-v2wj-q39q-566r](https://github.com/advisories/GHSA-v2wj-q39q-566r) | — | CWE-180/284: `server.fs.deny` bypassed with URL queries |
| `vite` | 7.0.0–7.3.1 | [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583) | — | CWE-200/306: Arbitrary file read via dev server WebSocket |

**defu:** An attacker who can control input to a `defu()` call can pollute `Object.prototype`. `defu` is an indirect dependency of `astro`.

**vite (HIGH advisories):** Both affect the **development server only** (`astro dev`). They allow other browser tabs (or network-adjacent attackers) to read arbitrary files from the developer's filesystem during a local dev session. Not present in production builds.

### MODERATE

| Package | Range | Advisory | CVSS | CWE |
|---------|-------|----------|------|-----|
| `astro` | <6.1.6 | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) | 6.1 | CWE-79: XSS in `define:vars` via incomplete `</script>` tag sanitization |
| `postcss` | <8.5.10 | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | 6.1 | CWE-79: XSS via unescaped `</style>` in CSS stringify output |

**Fix for all four:** `npm audit fix` (no breaking changes required).

---

## 2. Outdated Dependencies

| Package | Wanted | Latest | Gap |
|---------|--------|--------|-----|
| `marked` | 17.0.6 | 18.0.3 | **1 major version behind** |

`astro` resolves within the `^6.1.1` spec to 6.3.1, but the lock file may pin an older vulnerable version. Running `npm audit fix` will also update this.

---

## 3. Code Security Patterns

### LOW — `src/pages/projects/[slug].astro:103`: `marked` output rendered with `set:html`

```astro
const readmeContent = readmeRaw ? marked.parse(readmeRaw) : null;
// ...
<div class="readme-content" set:html={readmeContent} />
```

`marked` does not sanitize HTML by default. All README files are developer-controlled and bundled at static build time, so the immediate risk is low. If the source of README content ever becomes runtime or user-controlled, this becomes a direct XSS vector.

**Recommended:** Add a sanitizer (e.g., `sanitize-html` at build time) or configure `marked` with a custom renderer that escapes raw HTML.

### LOW — `src/pages/privacy.astro:134`: `innerHTML` with XOR-decoded data

```js
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

The decoded content is derived from hardcoded encoded data embedded in the file itself — not user input. Risk is low in current form. If the decoded value is plain text, `textContent` + explicit `<br>` DOM nodes would be safer.

---

## 4. Configuration Review

- **Dockerfile:** Not present (deployed via Cloudflare Workers / `wrangler`).
- **`.env` / `.env.production` in `.gitignore`:** Yes — both correctly excluded. Project-level `.env` files (e.g., `projects/day-002-music-charts/.env`) also excluded.
- **No `.env` files committed:** Confirmed.
- **`wrangler.jsonc`:** KV namespace ID is a non-sensitive resource identifier. No secrets detected.
- **CORS:** No server-side CORS configuration needed (static Astro build served by Cloudflare).

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| 🔴 HIGH | Run `npm audit fix` to patch `defu` prototype pollution and `vite` file-read CVEs |
| 🟡 MEDIUM | Verify `astro` ≥6.1.6 and `postcss` ≥8.5.10 after `npm audit fix` |
| 🟢 LOW | Upgrade `marked` to v18 (`npm install marked@^18`) and review changelog |
| 🟢 LOW | Add HTML sanitization to `marked` output in `src/pages/projects/[slug].astro` |
| 🟢 LOW | Replace `p.innerHTML` with `textContent` in `src/pages/privacy.astro:134` |

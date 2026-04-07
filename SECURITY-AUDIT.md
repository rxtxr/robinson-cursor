# Security Audit Report — robinson-cursor

**Date:** 2026-04-07
**Auditor:** Automated weekly security scan
**Branch scanned:** `main` (commit `50fc270`)
**Previous audit:** 2026-03-31 (0 High findings)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Medium   | 0     |
| Low      | 2     |
| Info     | 2     |

> **⚠ NEW since last audit (2026-03-31):** 2 High severity vulnerabilities have been introduced via transitive dependency updates — `vite` and `defu` both have active CVEs. Immediate dependency update recommended.

---

## 1. Dependency Audit

**Tool:** `npm audit`
**Lock file:** `package-lock.json`

```
# npm audit report

defu  <=6.1.4
Severity: high
defu: Prototype pollution via `__proto__` key in defaults argument
→ https://github.com/advisories/GHSA-737v-mqg7-c878

vite  7.0.0 - 7.3.1
Severity: high
Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling
→ https://github.com/advisories/GHSA-4w7w-66w2-5vf9
Vite: `server.fs.deny` bypassed with queries
→ https://github.com/advisories/GHSA-v2wj-q39q-566r
Vite Vulnerable to Arbitrary File Read via Vite Dev Server WebSocket
→ https://github.com/advisories/GHSA-p9ff-h696-f583

2 high severity vulnerabilities
```

### HIGH — defu ≤ 6.1.4: Prototype Pollution (GHSA-737v-mqg7-c878)

**Installed version:** `6.1.4` (transitive dependency via `astro`)
**CVE:** GHSA-737v-mqg7-c878
**Severity:** High

`defu` allows prototype pollution via a `__proto__` key in the defaults argument. An attacker who can influence input to `defu()` calls could inject arbitrary properties onto `Object.prototype`, potentially bypassing security checks or corrupting application state.

**Fix:** Run `npm audit fix` — this should update `defu` to a patched version.

### HIGH — vite 7.0.0–7.3.1: Multiple Path Traversal / File Read CVEs

**Installed version:** `7.3.1` (dev dependency via `astro`)
**CVEs:**
- **GHSA-4w7w-66w2-5vf9** — Path traversal in optimized deps `.map` handling: allows reading arbitrary source map files outside the project root.
- **GHSA-v2wj-q39q-566r** — `server.fs.deny` bypass via URL query strings: configured file-access restrictions can be circumvented.
- **GHSA-p9ff-h696-f583** — Arbitrary file read via dev server WebSocket: allows reading files outside the configured root during local development.

**Impact context:** These vulnerabilities affect the **Vite development server** (`vite dev`). The production build is not directly affected, but these flaws expose local source files and potentially credentials (`.env`, private keys) to anyone with network access to the dev server.

**Fix:** Run `npm audit fix` to update Vite to a patched release (≥ 7.3.2).

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package | Installed | Wanted | Latest | Notes |
|---------|-----------|--------|--------|-------|
| astro   | 6.1.1     | 6.1.4  | 6.1.4  | 3 patches behind |
| marked  | 17.0.5    | 17.0.6 | 18.0.0 | ⚠ 1 major version behind |

**`marked` major version lag:** `marked` is at `17.0.5` while `18.0.0` is now available. A major version bump may include breaking API changes and/or security improvements. Review the [marked changelog](https://github.com/markedjs/marked/releases) before upgrading.

---

## 3. Code Security Patterns

### LOW — innerHTML Assignment with Decoded Data (persists from 2026-03-31 audit)

**File:** `src/pages/privacy.astro:134`
**Status:** ⚠ Unresolved from previous audit

```javascript
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source data is a build-time constant (not user input), so XSS risk is currently low. However, `innerHTML` is a risky pattern that silently enables injection if the data source ever changes.

**Recommended fix:** Use `textContent` + `document.createElement('br')` to construct the DOM safely:
```javascript
const p = document.createElement('p');
lines.map(b64 => xorDecodeBytes(b64, k)).forEach((text, i) => {
  if (i > 0) p.appendChild(document.createElement('br'));
  p.appendChild(document.createTextNode(text));
});
el.appendChild(p);
```

### LOW — XOR Key Hardcoded in Source (persists from 2026-03-31 audit)

**File:** `src/pages/privacy.astro:8`
**Status:** ⚠ Unresolved from previous audit

```javascript
const key = 'rc365vibe';
```

The XOR key for contact obfuscation is in plaintext source and compiled JS bundles. This is by design (bot-harvesting protection, not real encryption) but should be documented to prevent future misuse.

**Recommended action:** Add a comment: `// Anti-harvest obfuscation only — not a security credential`.

---

## 4. Configuration Review

### INFO — .env files correctly excluded

`.env` and `.env.production` are listed in `.gitignore`. No `.env` files are tracked by git.

### INFO — Static site, no server-side attack surface

`astro.config.mjs` configures static output — no server-side routes or API endpoints exposed in production.

---

## Recommended Actions

| Priority | Action |
|----------|--------|
| **High** | Run `npm audit fix` to patch `vite` (→ ≥ 7.3.2) and `defu`. Eliminates 4 active CVEs. |
| **High** | Verify `npm audit` reports 0 vulnerabilities after fix. |
| Medium | Evaluate `marked` v18.0.0 upgrade — review changelog for breaking changes and security notes. |
| Low | Replace `innerHTML` in `privacy.astro:134` with `textContent` + DOM construction. |
| Low | Add clarifying comment to XOR key in `privacy.astro:8`. |
| Info | Run `npm update astro` to pick up latest patch (6.1.1 → 6.1.4). |

# Security Audit Report — robinson-cursor

**Date:** 2026-03-31
**Auditor:** Automated weekly security scan
**Branch scanned:** `main` (commit `997fd87`)

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 0     |
| Medium   | 0     |
| Low      | 2     |
| Info     | 1     |

---

## 1. Dependency Audit

**Tool:** `npm audit`
**Lock file:** `package-lock.json`

```
found 0 vulnerabilities
```

All npm dependencies (323 total, including transitive) are free of known CVEs.

---

## 2. Outdated Dependencies

**Tool:** `npm outdated`

| Package | Current | Wanted | Latest | Notes |
|---------|---------|--------|--------|-------|
| astro   | 6.1.1   | 6.1.2  | 6.1.2  | 1 patch behind |
| marked  | 17.0.5  | 17.0.5 | 17.0.5 | ✅ Current |

**Action:** Run `npm update astro` to pick up the latest patch release. No major-version lag detected.

---

## 3. Code Security Patterns

### LOW — innerHTML Assignment with XOR-Decoded Data

**File:** `src/pages/privacy.astro:134`
**Severity:** Low

```javascript
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

The decoded strings (contact name, address, email) are set via `innerHTML`. The source data (`encodedContact`) is a build-time constant derived from hardcoded strings in the Astro frontmatter, so no user-controlled input reaches this call today. However, using `innerHTML` is a risky pattern that can silently introduce XSS if the data source ever changes (e.g., fetched from an API).

**Recommended fix:** Use `textContent` + DOM construction instead:
```javascript
const p = document.createElement('p');
lines.map(b64 => xorDecodeBytes(b64, k)).forEach((text, i) => {
  if (i > 0) p.appendChild(document.createElement('br'));
  p.appendChild(document.createTextNode(text));
});
el.appendChild(p);
```

This eliminates the HTML injection surface entirely while preserving the `<br>`-separated layout.

### LOW — Contact Data Obfuscated with Hardcoded XOR Key (Security Through Obscurity)

**File:** `src/pages/privacy.astro:8`
**Severity:** Low

```javascript
const key = 'rc365vibe';
```

The XOR key used to "hide" contact details is embedded in plaintext in the source file and will be present (split into `keyParts`) in the built JavaScript bundle. Anyone inspecting the page source or the compiled output can trivially reconstruct the contact information. This is by design for GDPR bot-harvesting protection, but should be understood as obfuscation only, not encryption.

**Recommended action:**
- This is an accepted trade-off for contact anti-harvesting. No action required if the intent is purely to deter automated scraping.
- Document the intent explicitly with a comment (e.g., `// Anti-harvest obfuscation only — not a security secret`) so future maintainers don't mistake this for real encryption.
- Do not reuse this key or pattern for anything that actually needs to be secret.

---

## 4. Configuration Review

### INFO — .env files correctly excluded

Both `.env` and `.env.production` are listed in `.gitignore`. The `projects/day-002-music-charts/.env` is also explicitly excluded. No `.env` files are tracked by git.

### INFO — No Dockerfile found

No container configuration to review.

### INFO — Static site, no server-side attack surface

`astro.config.mjs` configures `output: 'static'` — the site generates no server-side routes or API endpoints, significantly limiting the attack surface.

---

## Recommended Actions

1. **[Low]** Replace `innerHTML` in `privacy.astro:134` with `textContent` + DOM nodes to eliminate the HTML injection pattern.
2. **[Low]** Add a comment to the XOR key in `privacy.astro` clarifying it is anti-harvest obfuscation, not a security credential.
3. **[Info]** Run `npm update astro` to update from 6.1.1 → 6.1.2.

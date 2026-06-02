# Security Audit — 2026-06-02

**Repository:** rxtxr/robinson-cursor  
**Scan date:** 2026-06-02  
**Auditor:** Automated weekly security scan  
**Previous audit:** 2026-05-19

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 3 |
| 🟡 Moderate | 5 |
| 🔵 Low | 2 |
| **Total** | **10** |

> ⚠ **High-severity findings persist from the 2026-05-19 audit (unfixed). One new MODERATE vulnerability found in `projects/day-023-mutagen`.**

---

## Changes Since Last Audit (2026-05-19)

| Status | Finding |
|--------|---------|
| ♻ PERSISTS | `defu ≤ 6.1.4` — Prototype Pollution HIGH (GHSA-737v-mqg7-c878) |
| ♻ PERSISTS | `devalue 5.6.3–5.8.0` — DoS via sparse array HIGH (GHSA-77vg-94rm-hx3p) |
| ♻ PERSISTS | `vite 7.0.0–7.3.1` — 3 HIGH advisories — flagged 2026-05-19, **not yet fixed** |
| ♻ PERSISTS | `astro ≤ 6.1.9` — XSS in `define:vars` (GHSA-j687-52p2-xcff) |
| ♻ PERSISTS | `astro ≤ 6.1.9` — Server island replay (GHSA-xr5h-phrj-8vxv) |
| ♻ PERSISTS | `postcss < 8.5.10` — XSS (GHSA-qx2v-qp2m-jg93) |
| ♻ PERSISTS | `marked` 1 major version behind (v17 vs v18) |
| ♻ PERSISTS | `innerHTML` in `day-007-visualaizer/script.js` |
| ♻ PERSISTS | `innerHTML` in `src/pages/privacy.astro` |
| 🆕 NEW MOD | `vite ≤ 6.4.1` + `esbuild ≤ 0.24.2` in `projects/day-023-mutagen` |

> **Note on root package audit:** Root `node_modules/` was not present in the scan environment. The vulnerabilities listed under the root package are carried forward from the 2026-05-19 scan. Run `npm install && npm audit` locally to confirm current state.

---

## 1. Dependency Audit

### Root (`package.json`) — npm audit (carried from 2026-05-19)

**3 high, 3 moderate vulnerabilities (unresolved from prior audit).**

#### 🟠 HIGH — defu: Prototype Pollution ♻ (persists from 2026-05-19)

| Field | Value |
|-------|-------|
| Package | `defu` |
| Installed | ≤ 6.1.4 |
| Advisory | [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878) |
| CWE | CWE-1321 (Prototype Pollution) |
| CVSS | 7.5 High |
| Fix | `npm audit fix` |

`defu` allows prototype pollution via `__proto__` in a defaults argument — indirect dependency of `astro`. Flagged May 19; **still not fixed** (>14 days).

#### 🟠 HIGH — devalue: DoS via Sparse Array ♻ (persists from 2026-05-19)

| Field | Value |
|-------|-------|
| Package | `devalue` |
| Installed | 5.6.3–5.8.0 |
| Advisory | [GHSA-77vg-94rm-hx3p](https://github.com/advisories/GHSA-77vg-94rm-hx3p) |
| CWE | CWE-770 (Uncontrolled Resource Consumption) |
| CVSS | 7.5 High |
| Fix | `npm audit fix` |

#### 🟠 HIGH — vite: Multiple Vulnerabilities ♻ (persists from 2026-05-19)

| Package | Installed | Advisories |
|---------|-----------|------------|
| `vite` | 7.0.0–7.3.1 | GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583 |

Path traversal, `server.fs.deny` bypass, arbitrary file read via WebSocket. All affect the dev server only. Fix: `npm audit fix`.

#### 🟡 MODERATE — astro: XSS in `define:vars` ♻ (persists from 2026-05-19)

| Field | Value |
|-------|-------|
| Package | `astro ≤ 6.1.9` |
| Advisory | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) |
| CVSS | 6.1 Moderate |
| Fix | `npm audit fix` (upgrades astro to ≥ 6.1.10) |

#### 🟡 MODERATE — astro: Server Island Encrypted Parameter Replay ♻ (persists from 2026-05-19)

| Field | Value |
|-------|-------|
| Package | `astro ≤ 6.1.9` |
| Advisory | [GHSA-xr5h-phrj-8vxv](https://github.com/advisories/GHSA-xr5h-phrj-8vxv) |
| CVSS | 6.1 Moderate |
| Fix | `npm audit fix` |

#### 🟡 MODERATE — postcss: XSS via Unescaped `</style>` ♻ (persists from 2026-05-19)

| Field | Value |
|-------|-------|
| Package | `postcss < 8.5.10` |
| Advisory | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) |
| CVSS | 6.1 Moderate |
| Fix | `npm audit fix` |

---

### `projects/day-023-mutagen/package.json` — npm audit 🆕

**2 new moderate vulnerabilities found.**

#### 🟡 MODERATE — CVE: GHSA-4w7w-66w2-5vf9

| Field | Value |
|-------|-------|
| Package | `vite` ≤ 6.4.1 (package.json specifies `^5.4.10`) |
| Title | Vite — Path Traversal in Optimized Deps `.map` Handling |
| CWE | CWE-22, CWE-200 |
| Fix | Upgrade `vite` to `^6.4.2` in `projects/day-023-mutagen/package.json` |

#### 🟡 MODERATE — CVE: GHSA-67mh-4wv8-2f99

| Field | Value |
|-------|-------|
| Package | `esbuild` ≤ 0.24.2 (transitive via vite) |
| Title | esbuild dev server allows any website to send requests and read responses |
| CVSS | 5.3 Moderate |
| Fix | Upgrade `vite` (pulls in fixed esbuild) |

### Python (`projects/day-002-music-charts/scripts/requirements.txt`) — pip audit

✅ **No known vulnerabilities found.**

---

## 2. Outdated Dependencies

| Package | In `package.json` | Latest | Gap |
|---------|-------------------|--------|-----|
| `marked` | ^17.0.5 | 18.0.4 | **1 major version behind** ⚠ |
| `astro` | ^6.1.1 | 6.4.2 | 3 minor versions (CVEs unfixed) ⚠ |
| `vite` (day-023-mutagen) | ^5.4.10 | 8.0.16 | **3 major versions behind** ⚠ |

---

## 3. Code Security Patterns

### 🔵 LOW — `innerHTML` Assignment with External Track Data ♻ (persists from 2026-05-19)

**File:** `projects/day-007-visualaizer/script.js:76`

```javascript
lic.innerHTML = track.licenseUrl
  ? `<a href="${track.licenseUrl}" target="_blank">${track.license}</a> — ${track.artist}`
  : `${track.license} — ${track.artist}`;
```

`track.licenseUrl`, `track.license`, and `track.artist` come from locally parsed audio file metadata (ID3 tags). A crafted file with `<script>` tags in its metadata could execute XSS. Currently low risk (offline/local files), but not patched for 49 days.

**Fix:** Use `textContent` for plain text fields; use `setAttribute('href', …)` for anchor href.

### 🔵 LOW — `innerHTML` with XOR-Decoded Contact Data ♻ (persists from 2026-05-19)

**File:** `src/pages/privacy.astro:134`

```javascript
p.innerHTML = lines.map(b64 => xorDecodeBytes(b64, k)).join('<br>');
```

Source data is a build-time constant — no runtime attack surface. Recommend replacing with `textContent` + explicit DOM nodes.

### ✅ `innerHTML` in `projects/day-029-1919-1-337/main.js:342` — Handled Correctly

```javascript
errorEl.innerHTML = `...${escapeHtml(msg)}...`;
```

User-controlled value (`msg`) is escaped with `escapeHtml()` before injection. No action needed.

### 🟡 MODERATE — Wildcard CORS in `projects/day-019-essentia-live/server.py`

```python
self.send_header('Access-Control-Allow-Origin', '*')
```

Local development server only. Acceptable for this context. No action needed unless deployed.

---

## 4. Configuration Review

- **Dockerfile:** Not present.
- **`.env` / `.env.production` in `.gitignore`:** Yes ✅
- **`.env` committed:** No ✅
- **Hardcoded secrets:** None found ✅

---

## 5. Recommended Actions (Priority Order)

### Immediate (High — overdue from 2026-05-19)

1. **Run `npm audit fix` at the repository root.** This resolves `defu` (prototype pollution), `devalue` (DoS), `vite` (path traversal + file read), `astro` (XSS + replay), and `postcss` (XSS). These findings are 14+ days old with no fix applied.
   ```bash
   npm install && npm audit fix
   astro build   # verify no regressions
   ```

2. **Upgrade `astro` explicitly** — `npm audit fix` may not bump `^6.1.1` to `6.4.2`. Set it directly:
   ```bash
   npm install astro@^6.4.2
   ```

### Short-term (Moderate — within 1 week)

3. **Upgrade vite in `projects/day-023-mutagen`:**
   ```bash
   cd projects/day-023-mutagen && npm install --save-dev vite@^6.4.2
   ```

4. **Upgrade `marked` from `^17.0.5` to `^18.0.0`** and review the [v18 changelog](https://github.com/markedjs/marked/releases) for breaking changes.

### Long-term (Hygiene)

5. Replace `innerHTML` in `day-007-visualaizer/script.js:76` with safe DOM construction (see detail above).
6. Replace `innerHTML` in `privacy.astro:134` with `textContent` + DOM nodes.
7. Add `npm audit` as a CI step to catch new advisories on each push.

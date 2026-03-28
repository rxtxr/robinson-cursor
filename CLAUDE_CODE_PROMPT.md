# Prompt für Claude Code — robinson-cursor.com Initial Setup

Kopiere diesen Prompt direkt in eine Claude Code Session im Projektverzeichnis.

---

## Prompt

Du hilfst beim Aufbau von **robinson-cursor.com** — einem 365-Tage-Vibecoding-Projekt. Jeden Tag wird ein kleines, im Browser lauffähiges Webprojekt publiziert und archiviert.

Lies zuerst `ROBINSON_CURSOR_CONTEXT.md` im Repository-Root. Alle Entscheidungen folgen den dort definierten Guidelines.

### Aufgabe: Initiales Projekt-Setup

Führe die folgenden Schritte der Reihe nach aus. Frage vor jedem größeren Schritt kurz nach, wenn etwas unklar ist oder du eine Designentscheidung treffen müsstest — führe nicht blind aus.

---

**Schritt 1 — Astro initialisieren**

```bash
npm create astro@latest . -- --template minimal --no-install --no-git
npm install
```

Konfiguriere `astro.config.mjs`:
- Output: `static`
- Base: `/`
- Keine Integrationen außer was explizit gebraucht wird

---

**Schritt 2 — Repository-Struktur anlegen**

Erstelle folgende Verzeichnisse und Basis-Dateien:

```
src/
  pages/
    index.astro
    about.astro
    projects/
      [slug].astro
  components/
    ProjectCard.astro
    Header.astro
    Footer.astro
  layouts/
    Base.astro
  styles/
    global.css
projects/
  .gitkeep
public/
  favicon.svg
_headers               (Cloudflare Pages Security Headers)
.gitignore
CLAUDE.md
```

---

**Schritt 3 — `_headers` für Cloudflare Pages**

Erstelle eine `_headers` Datei im Root mit sinnvollen Security-Headern:
- `X-Frame-Options: SAMEORIGIN` — aber **Ausnahme für `/projects/*`** (dort muss iframe-Einbettung möglich sein)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` mit restriktiven Defaults
- Keine CSP die WebAudio, Canvas oder WebGL blockiert (die Projekte brauchen das)

---

**Schritt 4 — Base Layout**

`src/layouts/Base.astro` — minimales HTML-Skelett mit:
- `<meta charset>`, `<meta viewport>`
- `<title>` als Prop
- `<meta name="description">` als Prop
- Global CSS import
- Header- und Footer-Komponenten
- Kein JavaScript-Framework im Layout

---

**Schritt 5 — Globales CSS**

`src/styles/global.css`:
- CSS Custom Properties für Farben, Typografie, Spacing
- Einen klaren visuellen Ton setzen: dunkel, technisch, minimal — passend zu Cyberpunk/Electronic-Ästhetik
- Kein Framework (kein Tailwind, kein Bootstrap) — reines CSS
- System-Fontstack oder eine einzige Google Font (dokumentiere die Lizenz)
- Responsive Grundlage (mobile-first)

---

**Schritt 6 — Index-Seite**

`src/pages/index.astro`:
- Liest alle `projects/*/meta.json` Dateien zur Build-Zeit
- Zeigt ein Grid aller Projekte, reverse-chronologisch
- Nutzt `ProjectCard.astro` pro Eintrag
- Leere State wenn noch keine Projekte vorhanden

`src/components/ProjectCard.astro`:
- Zeigt: Tagnummer (z.B. `#001`), Titel, Datum, Tags als Badges
- Link zur Detailseite `/projects/[slug]`
- Hover-State

---

**Schritt 7 — Detailseite**

`src/pages/projects/[slug].astro`:
- Statische Pfade aus `projects/*/meta.json` generieren
- Layout: Titel, Datum, Tagnummer, Stack-Liste, Tags
- Beschreibung aus `meta.json`
- README-Inhalt aus `projects/[slug]/README.md` wenn vorhanden (als HTML gerendert)
- Eingebettetes Projekt als `<iframe>` mit `sandbox="allow-scripts allow-same-origin allow-forms"` — src zeigt auf `/projects/[slug]/index.html`
- GitHub-Link wenn in `meta.json` vorhanden
- Lizenzhinweise wenn in `meta.json` vorhanden
- Navigation: zurück zur Übersicht, vorheriges/nächstes Projekt

---

**Schritt 8 — About-Seite**

`src/pages/about.astro`:
- Platzhalter-Inhalt mit klarer Struktur:
  - Was ist das Projekt?
  - Warum?
  - Wie ist es gebaut? (Stack, Infrastruktur)
  - GitHub-Link
- Kein generischer Lorem-ipsum — schreib echten Platzhalter der Ton und Konzept vermittelt

---

**Schritt 9 — Footer mit Imprint**

`src/components/Footer.astro`:
- Imprint-Abschnitt direkt im Footer (kein separates Modal)
- Platzhalter: `[Name] · [Adresse] · [E-Mail] · Angaben gemäß § 5 TMG`
- GitHub-Link
- Projektzähler: "X Projekte / 365"
- Jahr

---

**Schritt 10 — CLAUDE.md anlegen**

Erstelle eine `CLAUDE.md` im Repository-Root. Diese Datei wird von Claude Code in jeder Session gelesen. Inhalt:

```markdown
# CLAUDE.md — robinson-cursor.com

Dieses Repo enthält robinson-cursor.com, ein 365-Tage-Vibecoding-Projekt.

## Kritische Regeln
- Lies ROBINSON_CURSOR_CONTEXT.md für vollständigen Projektkontext
- Projekte in /projects/ sind nach Publikation eingefroren
- Jedes neue Projekt braucht meta.json und README.md
- Keine API Keys im Repo
- Lizenzen aller Libraries in meta.json dokumentieren
- Kapselung: Projekte dürfen sich nicht gegenseitig beeinflussen

## Commits
Format: `day NNN: projekt-name — kurze beschreibung`
Beispiel: `day 001: music-visualizer — webaudio fft canvas visualisierung`

## Deploy
git push main → Cloudflare Pages baut automatisch
Preview: jeder Branch bekommt eigene Preview-URL
```

---

**Schritt 11 — Erstes Beispielprojekt**

Migriere eines der bestehenden Projekte (z.B. den Music Visualizer) als `day-001`:

```
projects/day-001-music-visualizer/
  index.html       ← das lauffähige Projekt
  meta.json        ← Metadaten
  README.md        ← kurze Dokumentation
```

`meta.json` Template:
```json
{
  "day": 1,
  "slug": "day-001-music-visualizer",
  "title": "Music Visualizer",
  "date": "YYYY-MM-DD",
  "description": "Kurze Beschreibung was das Projekt macht.",
  "tags": ["audio", "canvas"],
  "stack": ["Web Audio API", "Canvas 2D"],
  "github": "",
  "status": "complete",
  "license_notes": "Keine externen Abhängigkeiten"
}
```

---

**Schritt 12 — Build & Test**

```bash
npm run build
npm run preview
```

Prüfe:
- Index-Seite zeigt Projekt-Grid
- Detailseite lädt und zeigt iframe
- About-Seite existiert
- Footer mit Imprint sichtbar
- Keine Console-Errors
- Build ohne Warnings

---

### Was du NICHT tun sollst

- Kein Tailwind, kein CSS-Framework installieren
- Kein TypeScript Setup erzwingen (JS reicht)
- Keine Datenbank, kein CMS
- Keine Auth
- Nicht mehr als nötig — das ist ein minimales persönliches Projekt

### Wenn du fertig bist

Gib eine kurze Zusammenfassung:
- Was wurde gebaut
- Welche Entscheidungen wurden getroffen (und warum)
- Was als nächstes sinnvoll wäre
- Offene Punkte die menschliche Entscheidung brauchen (Imprint-Inhalt, finale Farben, etc.)

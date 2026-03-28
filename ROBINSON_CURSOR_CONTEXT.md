# robinson-cursor.com — Projektkontext

## Konzept

Ein 365-Tage-Projekt: jeden Tag ein kleines, im Browser lauffähiges Webprojekt — publiziert, dokumentiert, archiviert. Der Fokus liegt auf "Vibecoding": schnelle kreative Experimente mit Web-Technologien, KI-gestützt entwickelt, täglich veröffentlicht.

**Tone:** Persönlich, technisch-neugierig, ohne Perfektionismus-Anspruch. Die Projekte sind Experimente, keine Produkte.

---

## Technische Infrastruktur

### Hosting
- **Cloudflare Pages** — Git-push triggert automatischen Deploy
- Domain: `robinson-cursor.com` (bereits bei Cloudflare registriert)
- Subpfade: `robinson-cursor.com/projects/day-001/` etc.

### Repository
- GitHub: ein Mono-Repo für alles
- Struktur: Archiv-Site + alle Tagesprojekte in einem Repo

### Framework (Archiv-Site)
- **Astro** — Static Site Generator für die Rahmen-Website
- Tagesprojekte selbst sind framework-agnostisch (plain HTML, p5.js, React, WebAudio, etc.)

---

## Repository-Struktur

```
robinson-cursor/
├── src/                          # Astro Archiv-Site
│   ├── pages/
│   │   ├── index.astro           # Übersichtsseite (Grid aller Projekte)
│   │   ├── about.astro           # About-Seite
│   │   └── projects/
│   │       └── [slug].astro      # Dynamische Detailseite pro Projekt
│   ├── components/
│   │   ├── ProjectCard.astro     # Karte im Grid
│   │   ├── Footer.astro          # Footer mit Imprint-Link
│   │   └── Header.astro
│   └── layouts/
│       └── Base.astro
├── projects/                     # Alle Tagesprojekte
│   ├── day-001-music-visualizer/
│   │   ├── index.html
│   │   ├── meta.json             # Metadaten für Archiv
│   │   └── README.md
│   ├── day-002-303-clone/
│   │   ├── index.html
│   │   ├── meta.json
│   │   └── README.md
│   └── ...
├── public/                       # Statische Assets der Archiv-Site
├── astro.config.mjs
├── package.json
└── CLAUDE.md                     # Kontext für Claude Code Instanzen
```

---

## meta.json — Schema pro Projekt

Jedes Projekt hat eine `meta.json` die von der Archiv-Site gelesen wird:

```json
{
  "day": 1,
  "slug": "day-001-music-visualizer",
  "title": "Music Visualizer",
  "date": "2025-01-01",
  "description": "Ein WebAudio-basierter Echtzeit-Visualisierer.",
  "tags": ["audio", "canvas", "webaudio"],
  "stack": ["Web Audio API", "Canvas 2D"],
  "github": "https://github.com/user/robinson-cursor/tree/main/projects/day-001-music-visualizer",
  "status": "complete",
  "license_notes": "Keine externen Abhängigkeiten"
}
```

---

## Seiten der Archiv-Site

### `/` — Übersichtsseite
- Reverse-chronologisches Grid aller Projekte
- Jede Karte zeigt: Tagnummer, Titel, Screenshot/Preview, Tags
- Filter nach Tags möglich (client-side)
- Neuste Projekte oben

### `/about` — About-Seite
- Kontext des Projekts: was, warum, wie
- Persönliche Stimme
- Link zum GitHub-Repo

### `/projects/[slug]` — Detailseite
- Eingebettetes Projekt als `<iframe>` oder direkter Link
- Titel, Datum, Tagnummer
- Beschreibung / Dokumentation (aus README.md)
- Stack-Liste
- GitHub-Link (wenn vorhanden)
- Tags
- Lizenzhinweise verwendeter Bibliotheken
- Navigation: ← vorheriges Projekt / nächstes Projekt →

### Footer (global)
- Imprint (Impressum gemäß deutschem Recht)
- Link zu GitHub
- Jahr / Projektzähler

---

## Guidelines & Regeln

### Lizenz-Compliance
- Jede externe Bibliothek oder jedes Framework das in einem Tagesprojekt verwendet wird, muss in `meta.json` unter `license_notes` dokumentiert sein
- MIT, Apache 2.0, BSD: frei verwendbar, kein Handlungsbedarf außer Dokumentation
- GPL: nur nach expliziter Prüfung verwenden
- Proprietäre Lizenzen: nicht verwenden
- CDN-Links zu Libraries (z.B. `<script src="https://cdn.jsdelivr.net/...">`) sind erlaubt, aber die Lizenz muss trotzdem in `meta.json` erfasst sein

### Kapselung (Isolation)
- Jedes Tagesprojekt lebt in seinem eigenen Ordner und ist vollständig eigenständig
- Projekte dürfen **keine** globalen CSS-Variablen oder JS-Variablen der Archiv-Site überschreiben
- Jedes Projekt wird in der Detailseite in einem `<iframe sandbox>` eingebettet — keine direkten Script-Injektionen in den Parent
- Shared Libraries (p5.js, Tone.js etc.) werden pro Projekt lokal oder via CDN geladen — kein gemeinsamer Bundle
- Ein kaputtes Tagesprojekt darf die Archiv-Site nicht beeinträchtigen

### Web-Kompatibilität
- Jedes Projekt muss im Browser funktionieren (kein Node-only Code)
- Mobile-Kompatibilität: mindestens nicht kaputt auf kleinen Screens; idealerweise responsive
- Kein Flash, kein Java Applet, keine Browser-Plugins
- WebAssembly ist erlaubt
- Web Audio API, WebGL, Canvas, WebRTC: alle erlaubt

### Framework-Agnostizität
- Tagesprojekte können sein: plain HTML/JS, React, Vue, Svelte, p5.js, Three.js, Tone.js, oder was auch immer das Experiment erfordert
- Die Archiv-Site (Astro) weiß nichts über das Framework der einzelnen Projekte — sie liest nur `meta.json` und `README.md`
- Kein Zwang zu einem bestimmten Stack pro Tag

### Security
- Keine API Keys, Tokens oder Credentials im Repository (auch nicht in Kommentaren)
- `.env` ist in `.gitignore`
- Externe Ressourcen nur von vertrauenswürdigen CDNs (jsdelivr, unpkg, cdnjs)
- `<iframe sandbox="allow-scripts allow-same-origin">` für eingebettete Projekte
- Content Security Policy Header über `_headers` Datei für Cloudflare Pages
- Kein `eval()` außer es ist dokumentiert und begründet

### Update-Strategie
- Astro und Core-Dependencies: Update bei Major-Versionen nur nach expliziter Entscheidung
- Tagesprojekte sind eingefroren — sie werden nach Publikation nicht mehr aktualisiert außer bei Security-Problemen
- `package.json` im Root nur für Astro-Dependencies der Archiv-Site
- Tagesprojekte haben kein eigenes `package.json` außer es ist explizit nötig

### Deployment
- Jeder Push auf `main` triggert einen Cloudflare Pages Deploy
- Preview Deployments bei Pull Requests (automatisch über Cloudflare)
- Build Command: `npm run build`
- Output Directory: `dist`
- Node Version: aktuelles LTS

---

## Täglicher Workflow

```bash
# Neues Tagesprojekt anlegen
mkdir projects/day-042-project-name
cd projects/day-042-project-name

# Pflichtdateien
touch index.html
touch meta.json
touch README.md

# Entwickeln...

# Committen und deployen
git add .
git commit -m "day 042: project-name — kurze Beschreibung"
git push
# → Cloudflare baut und deployt automatisch
```

---

## Imprint (Impressum)

Wird als statische Seite oder Footer-Komponente integriert. Inhalt wird vom Projektinhaber bereitgestellt. Platzhalter bis zur finalen Fassung:

```
Angaben gemäß § 5 TMG
[Name]
[Adresse]
[E-Mail]
```

---

## Erstes Setup — Checkliste

- [ ] GitHub Repo anlegen: `robinson-cursor`
- [ ] Astro initialisieren: `npm create astro@latest`
- [ ] Cloudflare Pages verbinden (GitHub Integration)
- [ ] Custom Domain `robinson-cursor.com` in Cloudflare Pages konfigurieren
- [ ] `CLAUDE.md` im Repo-Root anlegen (Kontext für Claude Code)
- [ ] Basis-Seitenstruktur (Index, About, Detail-Template, Footer/Imprint)
- [ ] Erstes Tagesprojekt migrieren (day-001)
- [ ] Deploy testen

---

## Kontext für KI-Agenten

Dieses Projekt wird mit Unterstützung von Claude Code entwickelt. Jede Claude-Code-Session sollte folgendes beachten:

1. **Kapselung immer prüfen** — Tagesprojekte dürfen sich nicht gegenseitig beeinflussen
2. **meta.json aktualisieren** — bei jedem neuen Projekt
3. **Lizenzen dokumentieren** — jede neue Library in `license_notes`
4. **Kein Over-Engineering** — das Projekt ist ein persönliches Experiment, nicht ein SaaS-Produkt
5. **Kleine Commits** — ein Commit pro Tagesprojekt, klare Messages
6. **README.md pro Projekt** — kurze Erklärung was es tut und wie es gebaut wurde

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

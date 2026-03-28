# Day 000 — Template

Strukturvorlage für neue Tagesprojekte.

## Verzeichnisstruktur

```
projects/day-NNN-projekt-name/
  index.html       ← das lauffähige Projekt (Pflicht)
  meta.json        ← Metadaten für die Archiv-Site (Pflicht)
  README.md        ← Dokumentation (Pflicht)
  style.css        ← optional, eigenes CSS
  script.js        ← optional, eigenes JS
  assets/          ← optional, Bilder/Audio/etc.
```

## meta.json — alle Felder

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|------------|
| `day` | number | ja | Tagnummer (1-365) |
| `slug` | string | ja | Ordnername, z.B. `day-001-music-visualizer` |
| `title` | string | ja | Anzeigename |
| `date` | string | ja | Publikationsdatum (YYYY-MM-DD) |
| `description` | string | ja | Kurzbeschreibung (1-2 Sätze) |
| `tags` | string[] | ja | Themen-Tags |
| `stack` | string[] | ja | Verwendete Technologien |
| `github` | string | nein | Link zum Quellcode |
| `status` | string | ja | `complete`, `wip`, oder `template` |
| `license_notes` | string | ja | Lizenzhinweise zu externen Dependencies |

## Neues Projekt anlegen

```bash
cp -r projects/day-000-template projects/day-NNN-projekt-name
# meta.json anpassen
# index.html mit Experiment füllen
# README.md schreiben
```

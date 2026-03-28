# Day 000 — Template

Structural template for new daily projects.

## Directory Structure

```
projects/day-NNN-project-name/
  index.html       ← the runnable project (required)
  meta.json        ← metadata for the archive site (required)
  README.md        ← documentation (required)
  style.css        ← optional, custom CSS
  script.js        ← optional, custom JS
  assets/          ← optional, images/audio/etc.
```

## meta.json — all fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `day` | number | yes | Day number (1-365) |
| `slug` | string | yes | Folder name, e.g. `day-001-music-visualizer` |
| `title` | string | yes | Display name |
| `date` | string | yes | Publication date (YYYY-MM-DD) |
| `description` | string | yes | Short description (1-2 sentences) |
| `tags` | string[] | yes | Topic tags |
| `stack` | string[] | yes | Technologies used |
| `github` | string | no | Link to source code |
| `status` | string | yes | `complete`, `wip`, or `template` |
| `license_notes` | string | yes | License notes for external dependencies |

## Creating a new project

```bash
cp -r projects/day-000-template projects/day-NNN-project-name
# edit meta.json
# build the experiment in index.html
# write README.md
```

# FN_2E8A.PIF

Found on a 5.25" floppy labeled "DO NOT SHIP". Provenance unknown.

## What it does

Destroys the website. Clicking the project tile on the index page or the run button on the detail page triggers a multi-phase DOM destruction sequence: chromatic aberration, text corruption (unicode mimics, mojibake, zalgo), geometric distortion, scanline tearing, signal noise, and element dissolution. After total signal loss, a fake terminal recovery boots up — running `git fsck`, `git reset --hard`, restoring files, and rebuilding the site with absurd build tasks. The site is then "redeployed" and the detail page reappears intact.

## How it works

- **Self-destruct engine** injected into `index.astro` and `[slug].astro` via client-side scripts, activated only for day-015
- **Text corruption** replaces characters with unicode lookalikes (phase 1), mojibake/block elements (phase 2), and full zalgo + cyrillic chaos (phase 3)
- **Terminal restoration** (`index.html`) types fake git commands with realistic output, shuffles absurd build progress lines from a pool of 25
- **No dependencies** — pure vanilla JS, CSS animations, and a noise canvas

## Tech notes

- Embed served in dev mode via Vite middleware in `astro.config.mjs`
- Custom `statusLabel` field in `meta.json` renders "DANGER" instead of "work in progress"
- `color-scheme: dark` meta tag prevents white flash during page transitions

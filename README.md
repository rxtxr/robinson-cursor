# robinson-cursor.com

365 days of experiments — one browser experiment per day.

## What is this?

A daily coding challenge: every day a small, self-contained web project gets built, published, and archived. Generative graphics, synthesizers, visualizers, interactive tools — anything that runs in a browser.

## Stack

- **Archive site:** [Astro](https://astro.build) (static)
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com)
- **Daily projects:** Framework-agnostic (plain HTML/JS, Canvas, WebAudio, WebGL, p5.js, Three.js, etc.)

## Development

```bash
npm install
npm run dev        # dev server at localhost:4321
npm run build      # production build to ./dist/
npm run preview    # preview production build
```

## Adding a project

```bash
cp -r projects/day-000-template projects/day-NNN-project-name
# edit meta.json, build index.html, write README.md
git add . && git commit -m "day NNN: project-name — short description"
git push
```

## License

[MIT](LICENSE) — Marius Bruns

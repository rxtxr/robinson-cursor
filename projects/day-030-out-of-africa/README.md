# day 030 — Out of Africa

An exploratory time-and-space visualization of the early human journey out of Africa.

> **Status: in-progress.** This commit is the design + research phase. No runtime yet.

## What it will be

An interactive map+timeline that plays back the currently-accepted scientific picture of *Homo sapiens* dispersal — from the first fossils in Africa (~315,000 years ago) to the peopling of the remote Pacific (~1280 CE). The visualization auto-plays through deep time but can be paused and explored. Every milestone — fossil site, branching event, admixture event, technological leap, climate context — opens a panel with primary references: peer-reviewed paper, Wikipedia article, educational video.

## What this folder contains today

- **DESIGN.md** — concept, UX, visualization approach, open design questions
- **PLAN.md** — phased project plan, milestones, scope guardrails
- **RESEARCH.md** — research notes on the science (seeded by web research, to be refined)
- **SOURCES.md** — curated reference list (papers, Wikipedia, video) per milestone
- **data/** — empty for now; will hold `events.json`, `regions.json`, `sources.json`

## Why a multi-day project

The other 365-day projects are usually shipped in a day. This one isn't, because the value lives in the *referenced science* — and getting that right (real DOIs, real Wikipedia links, real videos, accurate uncertainty ranges) is the work. A glossy map with made-up dates would be the opposite of the point.

## Next session

Pick the visualization stack (likely D3 + a globe/map projection, or Three.js if a 3D globe wins) and start building from `data/events.json` once the research is locked.

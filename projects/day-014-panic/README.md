# Day 014 — pAInic!

Reverse-engineered recreation of the plasma effect from Future Crew's **Panic** demo (1992).

I'm just playing around with AI, vibing with music and visuals, purely for relaxation — but these guys, they really knew what they were doing. Like, *really*. This demo, one of the greatest of all time, has been inspiring me for over 30 years. A deep bow to so much technical skill and creativity. To me, Future Crew belongs in the canon of digital art.

## What it does

- **Plasma effect** using copper raster bars, palette cycling, and per-scanline X-distortion
- **7 animation variables** (`palp1-3`, `spos1-4`) extracted from the original `PANIC.EXE` binary
- **Music** played directly from the original S3M module (Scream Tracker 3) via Web Audio API
- **Live remastering** controls: EQ, compressor, reverb, per-instrument mix
- **Tunable parameters** for all visual aspects via UI panel

## How it was made

1. Analyzed screenshots and video captures of the original DOS demo
2. Downloaded `PANIC.EXE` and extracted symbols using `strings` — found `PLASMA.C`, `COPPER.ASM`, `DISTORT.ASM`, and variable names (`palp1-3`, `spos1-4`, `r_sini`, `g_sini`, `b_sini`)
3. Extracted the embedded S3M music module from the EXE at byte offset 55076
4. Clean-room reimplemented the plasma algorithm based on the discovered architecture
5. Iteratively compared rendered frames against the original using ffmpeg frame extraction

## Credits & Licenses

### Original Demo
- **Panic** (1992) by [Future Crew](https://en.wikipedia.org/wiki/Future_Crew)
- Code: Wildfire (Arto Vuori), PSI (Sami Tammilehto), Trug (Mika Tuomi)
- Music: Purple Motion (Jonne Valtonen)
- Graphics: Pixel (Mikko Iho)
- 3D objects: Abyss (Jussi Laakkonen)
- The original demo is freeware, released at The Party 1992

### webaudio-mod-player
- By Noora Halme et al.
- [MIT License](https://opensource.org/licenses/MIT)
- [GitHub](https://github.com/electronoora/webaudio-mod-player)
- Files: `player.js`, `st3.js`, `utils.js`

### This project
- Plasma effect: clean-room reimplementation, not a decompilation
- S3M module: extracted from `PANIC.EXE` for educational/preservation purposes

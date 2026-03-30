# Day 003 — CRT//IMG Monochrome Processor

Interactive image processor that converts any image into a monochrome CRT monitor aesthetic. Drag & drop an image, tweak the parameters, download the result.

## Features

- **4 color palettes:** Phosphor Green, Amber, Paper White, Cyan
- **Adjustments:** Brightness, contrast, gamma, saturation
- **CRT effects:** Scanlines, bloom, noise, pixel scaling
- **Dithering:** Floyd-Steinberg dithering for authentic 1-bit look
- **Halftone:** Dot-pattern alternative to dithering
- **Resample mode:** Dithers at full resolution, multi-step downscales, and re-thresholds for a clean 2-color result with organic line structures
- **Invert** toggle
- **Luminance histogram** for real-time feedback
- **Indexed PNG export:** 1-bit palette PNG with minimal file size

## How it works

Images are loaded into a Canvas, converted to luminance values, and processed through a pipeline of brightness/contrast/gamma adjustments. Floyd-Steinberg error diffusion dithering quantizes the result to two tones. The output is colorized with the selected phosphor palette and composited with scanlines, bloom, and noise effects.

In **resample mode**, the image is dithered at full source resolution, scanlines are baked into the binary pixels, then multi-step downscaled and re-thresholded — producing clean 2-color output with natural horizontal structures from the dithering algorithm itself.

Export uses an inline indexed PNG encoder (1-bit palette, zlib via CompressionStream) for tiny file sizes.

All processing happens client-side — no data leaves the browser.

## Controls

- **Drag & drop** or click to load an image
- Adjust sliders in the sidebar
- Toggle dithering/halftone/invert/resample
- Click **Download PNG** to export as indexed PNG

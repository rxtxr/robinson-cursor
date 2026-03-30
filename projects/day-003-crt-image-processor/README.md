# Day 003 — CRT//IMG Monochrome Processor

Interactive image processor that converts any image into a monochrome CRT monitor aesthetic. Drag & drop an image, tweak the parameters, download the result.

## Features

- **4 color palettes:** Phosphor Green, Amber, Paper White, Cyan
- **Adjustments:** Brightness, contrast, gamma, saturation
- **CRT effects:** Scanlines, vignette, bloom, noise, pixel scaling
- **Dithering:** Floyd-Steinberg dithering for authentic 1-bit look
- **Halftone:** Dot-pattern alternative to dithering
- **Invert** toggle
- **Luminance histogram** for real-time feedback
- **PNG export** at original resolution

## How it works

Images are loaded into a Canvas, converted to luminance values, and processed through a pipeline of brightness/contrast/gamma adjustments. Floyd-Steinberg error diffusion dithering quantizes the result to two tones. The output is colorized with the selected phosphor palette and composited with scanlines, bloom (blurred screen overlay), and vignette effects.

All processing happens client-side — no data leaves the browser.

## Controls

- **Drag & drop** or click to load an image
- Adjust sliders in the sidebar
- Toggle dithering/halftone/invert
- Click **Download PNG** to export

## Origin

Extracted from the [greyskull](https://github.com/rxtxr/greyskull) project's CRT image processing toolchain.

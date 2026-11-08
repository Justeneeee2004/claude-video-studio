# Claude_Video — design spec (2026-10-18)

Status: built autonomously under stated assumptions. The user was not available for the
brainstorming approval gate; correct anything below and the setup adapts.

## Intent (what the user asked)

- Create `C:\Users\My Pc\Claude_Video` and set up "the files, skills and other needs
  for video editing", maximizing Claude's motion/animation strengths to produce
  **marketing videos**.

## Assumptions (not stated by the user)

1. "Claude motion effects" = Claude writing motion graphics as code. Engine: **Remotion**
   (React video). It is the only mainstream video tool Claude can drive end-to-end
   (write → preview → render) with deterministic output, and it ships official agent skills.
2. Marketing videos = product promos, social reels/ads, logo stings, screenshot
   showcases (the earlier BitterScan promo was a screenshot slideshow built via
   CapCutAPI; that MCP now times out, so this replaces it).
3. Formats: 16:9 (1920x1080), 9:16 (1080x1920), 1:1 (1080x1080). 30 fps fixed.
4. Brand is generic (indigo/cyan dark) until real brand assets are dropped in.
5. Footage editing (trim/concat/convert) is secondary → FFmpeg scripts, not a full NLE.

## Success criteria

- `npx remotion studio` opens; every composition previews.
- `npx remotion render ProductPromo ...` produces a valid MP4 (verified by ffprobe).
- One props JSON renders all three social formats via one script.
- Claude in this folder has: official Remotion skills + custom marketing/motion/QA skills,
  a CLAUDE.md with rules, a brief template, and reusable motion primitives.

## Architecture

```
Claude_Video/
  CLAUDE.md                 rules + workflow for Claude
  .claude/skills/           12 official remotion-* skills + custom skills
  .claude/settings.json     permission allowlist (remotion, ffmpeg, node)
  briefs/                   TEMPLATE.md + example brief + props JSON
  assets/                   RAW sources (not served)
  remotion/                 Remotion project (served assets live in remotion/public)
    src/theme     brand tokens + fonts
    src/lib       motion presets, formats/safe areas, asset helper
    src/layers    backdrops/overlays (gradient, orbs, grain, vignette, light leak, shine)
    src/elements  reusable Interactive elements (Headline, KineticText, Counter, DeviceFrame, CTA...)
    src/scenes    Hook / Problem / Solution / Feature / Proof / CTA / LogoSting
    src/compositions ProductPromo 16:9, SocialReel 9:16, SquareAd 1:1,
                     ScreenshotShowcase, CaptionedClip, Thumbnail still
    src/captions  BasicCaptions (official) + KineticCaptions (word highlight)
  scripts/                  PowerShell: studio, render, render-social, stills, probe, ffmpeg/*
  output/                   renders, stills, social exports
```

Data flow: brief (md) → props JSON (zod schema in `src/compositions/schema.ts`) →
composition → Studio preview → `remotion render` → `output/` → QA (ffprobe + stills).

## Key decisions

- Follow Remotion 4.0.536 interactivity conventions (Interactive.create, Track /
  TransitionSeries, inline `interpolate()` in `style`, `scale/translate/rotate`),
  so Studio can edit what Claude writes.
- Brand tokens are defaults; composition props override colors per video.
- WebGL effects (`@remotion/effects`) only in optional overlay layers; base scenes use CSS
  so preview works on any machine. `--gl=angle` set in config for renders.
- Captions: official `BasicCaptions` + `KineticCaptions`; transcription via
  `@remotion/whisper-webgpu` script (local GPU, no API key).
- Music/VO are optional props; no bundled audio (licensing).

## Out of scope (v1)

- Remotion Lambda / cloud rendering, Player SaaS embedding.
- CapCut MCP repair (separate stack at `C:\Users\My Pc\capcut-stack`).
- Real brand assets, licensed music.

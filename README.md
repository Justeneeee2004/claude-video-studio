# Claude_Video

Marketing videos as code. Remotion project + Claude Code skills + render scripts.
Open this folder in Claude Code; `CLAUDE.md` holds the rules and workflow.

## Quick start

```powershell
cd remotion
npx remotion studio            # opens http://localhost:3000 — preview every composition
```

Render the example (SkedAI demo props) to all social formats:

```powershell
.\scripts\render-social.ps1 -Props briefs\example-skedai.props.json
# → output\social\example-skedai-16x9.mp4, -9x16.mp4, -1x1.mp4
```

## Make a new video

1. Copy `briefs/TEMPLATE.md` → `briefs/<slug>.md`, fill it in (or ask Claude to draft it).
2. Ask Claude: "turn briefs/<slug>.md into props and preview it" — it writes
   `briefs/<slug>.props.json` and opens Studio.
3. Drop real assets into `remotion/public/` (screenshots, logo, music), set their paths in the props.
4. Iterate in Studio (click any element to edit text/colors/keyframes; changes write back to code).
5. Render: `.\scripts\render-social.ps1 -Props briefs\<slug>.props.json`.
6. QA before publishing: `.\scripts\qa.ps1 -File output\social\<slug>-16x9.mp4 -Props briefs\<slug>.props.json -Comp ProductPromo`, then open the contact sheet it writes and watch the video once.

## What's inside

| Path                        | What                                                        |
|-----------------------------|-------------------------------------------------------------|
| `remotion/src/compositions` | ProductPromo (16:9), SocialReel (9:16), SquareAd (1:1), ScreenshotShowcase, CaptionedClip, Thumbnail |
| `remotion/src/scenes`       | Hook · Problem · Solution · Features · Proof · CTA · LogoSting |
| `remotion/src/elements`     | KineticText, Counter, DeviceFrame, CtaButton, LowerThird, … |
| `remotion/src/layers`       | gradient, orbs, grain, vignette, light leak, shine sweep    |
| `.claude/skills`            | 12 official `remotion-*` skills (create, markup, captions, render, …) |
| `briefs/`                   | TEMPLATE + two worked examples (SkedAI props, Smile Dental plan) |
| `scripts/`                  | studio, render, render-social, stills, probe, qa, `ffmpeg/*` |
| `assets/`                   | raw sources (not served); copy what you use to `remotion/public/` |

## Client projects

The `Rallyo*` compositions in `remotion/src` (a 62 s Facebook reel and an 8-card carousel) are kept as a
worked example of the pipeline, but their media is not in this repo: product screenshots, fonts, music and
SFX under `remotion/public/rallyo/`, raw captures under `assets/screenshots/rallyo/`, and the working briefs
`briefs/rallyo-*` stay local (see `.gitignore`). The code type-checks without them; rendering those
compositions needs the local assets.

## Requirements

Node ≥ 20 (24 installed), FFmpeg on PATH (8.1 installed), Chrome (Studio preview).
Remotion is free for individuals and teams of up to 3; larger companies need a license.

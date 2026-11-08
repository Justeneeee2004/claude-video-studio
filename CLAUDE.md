# Claude_Video — marketing videos as code

Purpose: produce marketing videos (product promos, social reels/ads, logo stings, screenshot
showcases, captioned clips) with Remotion. Claude writes/edits compositions, Remotion Studio
previews them, `npx remotion render` exports MP4. Design spec:
`docs/superpowers/specs/2026-10-18-claude-video-design.md`.

## Stack (installed, verified 2026-10-18)

- Remotion 4.0.536 · React 19 · TypeScript · Tailwind v4 (rspack). Project: `remotion/`
- Packages: `@remotion/media` (Video/Audio), `transitions`, `effects` (WebGL), `google-fonts`
  (Sora display + Inter body), `captions`, `rough-notation` (highlights/strikes), `shapes`,
  `paths`, `noise`, `motion-blur`, `layout-utils`, `zod-types`, `whisper-webgpu` + `mediabunny`
- FFmpeg 8.1 on PATH (also `npx remotion ffmpeg|ffprobe`). Node 24. fps is 30 everywhere.
- Studio: http://localhost:3000 when running.

## Map

```
briefs/            TEMPLATE.md, example-skedai.md, example-skedai.props.json  (brief → props)
remotion/src/
  theme/           brand.ts (tokens), fonts.ts
  lib/             motion.ts (EASE/SPRING/helpers), formats.ts (sizes + safeArea), assets.ts
  layers/          GradientBackdrop, AmbientOrbs, GrainOverlay, VignetteOverlay (CSS)
                   LightLeakOverlay (WebGL), ShineSweep (CSS band)
  elements/        Headline, Subline, Badge, CtaButton, Card, LowerThird, LogoLockup,
                   DeviceFrame (phone/browser), Counter, KineticText, ProgressBar,
                   StarRating, PainRow, FeatureCard   — all Interactive.create, layout "none"
  scenes/          Hook, Problem, Solution, Feature, Proof, Cta, LogoSting — layout "absolute-fill",
                   responsive to 16:9 / 9:16 / 1:1 via safeArea()
  compositions/    schema.ts (promoSchema = one props shape for all social formats)
                   ProductPromo 1920x1080 810f · SocialReel 1080x1920 399f · SquareAd 1080x1080 291f
                   ScreenshotShowcase (calculateMetadata) · CaptionedClip · Thumbnail (Still)
  captions/        basic-captions.tsx (official, unchanged) · KineticCaptions.tsx (word highlight)
  Root.tsx         Folders: Marketing / Stills / Scenes / Elements (connected compositions)
remotion/public/   served assets → staticFile(); raw sources live in assets/
remotion/scripts/transcribe.mts   media → Caption[] JSON (local Whisper, WebGPU)
scripts/           studio.ps1, render.ps1, render-social.ps1, stills.ps1, probe.ps1, qa.ps1, ffmpeg/*.ps1
output/            renders/, stills/, social/
```

## Commands (run inside `remotion/` unless noted)

```powershell
npx remotion studio                                   # preview + visual editing
npm run typecheck ; npx eslint src                    # before every render
npx remotion render ProductPromo ../output/renders/x.mp4 --props=../briefs/x.props.json
npx remotion render ProductPromo ../output/stills/x --frames=30,200,480 --image-format=png
npx remotion still Thumbnail ../output/stills/thumb.png
node scripts/transcribe.mts public/footage/clip.mp4 captions/clip.json small.en
# from repo root:
.\scripts\render-social.ps1 -Props briefs\example-skedai.props.json   # 16:9 + 9:16 + 1:1
.\scripts\stills.ps1 -Comp SocialReel -Frames "30,140,250,360"
.\scripts\probe.ps1 -File output\renders\x.mp4
```

## Workflow: brief → video

1. Write `briefs/<slug>.md` from `briefs/TEMPLATE.md`; study `briefs/example-skedai.md` (props
   example) and `briefs/example-smile-dental-reel.md` (full planning example from a vague ask).
   Structure: hook (≤ 8 words, first 2 s) → problem → solution → how it works → proof → CTA.
   Keep stats/testimonials REAL; mark unknowns `(placeholder)` and never publish them.
2. Write `briefs/<slug>.props.json` matching `promoSchema` (`remotion/src/compositions/schema.ts`).
   Copy screenshots/logo/music into `remotion/public/...` and reference by relative path.
3. Start Studio, open the composition, iterate. Load `remotion-markup` when writing or changing
   animation and copy the patterns in `scenes/` + `lib/motion.ts`. New scene = new file in
   `scenes/` + connected composition in Root.
4. Render: `scripts/render-social.ps1` (all formats) or `scripts/render.ps1 -Comp ...`.
5. QA: `.\scripts\qa.ps1 -File output\social\<slug>-16x9.mp4 -Props briefs\<slug>.props.json -Comp ProductPromo`
   (streams, decode, black/frozen, flash frames, placeholder text, missing assets, stale render,
   contact sheet). Open the contact sheet, watch the MP4 once end to end, then publish.
   Never publish while any `(placeholder)` text, empty `screenshotSrc`/`logoSrc`, or
   unlicensed music remains.

## Rules (non-negotiable)

- Animate only with `useCurrentFrame()` + `interpolate()` / `spring()`. No CSS `transition`,
  no `animation`, no Tailwind `animate-*`. They do not render.
- Timing in frames via `fps` from `useVideoConfig()`; keep values integer at 30 fps
  (multiples of 0.1 s). Non-integer `from`/`durationInFrames` break Sequences.
- Keep `<Composition durationInFrames>` in Root in sync with TransitionSeries math:
  total = Σ scene frames − Σ transition frames (overlays do not shorten).
- Studio-editable code: `interpolate()` inline in `style`, literal easings/ranges,
  `scale` / `translate` / `rotate` (not `transform`), `name` on every element,
  `defaultProps` as an inline object literal. Never name a custom prop `from`, `to`,
  `durationInFrames`, `name`, `style`, `width`, `height` — they collide with timing props.
- Motion defaults: enters `Easing.bezier(0.16, 1, 0.3, 1)` or `Easing.spring({damping: 200})`,
  exits `Easing.bezier(0.7, 0, 0.84, 0)`, scale animations add `output: "perceptual-scale"`,
  stagger 2–4 f per word/char and 6 f per card/block, durations micro 6f / fast 12f /
  base 18f / hero 45f, no baked-in exits (TransitionSeries cuts). See `lib/motion.ts`.
- Video, not web: one idea per scene; hook in the first 2 s; CTA on screen ≥ 3 s;
  headline ≥ 84 px and support text ≥ 44 px at 1080 base; respect `safeArea()`;
  assume muted autoplay (text or captions carry the message).
- Brand tokens: `theme/brand.ts` are defaults; per-video colors come from props.
- WebGL effects (`@remotion/effects`) only in overlay layers; renders use `--gl=angle`
  (set in `remotion.config.ts`). Base scenes stay CSS so previews work anywhere.
- Assets: only files you have rights to. CC-BY music needs credit in the description.
  Raw sources in `assets/`, served copies in `remotion/public/`.
- Remotion license: free for individuals and companies ≤ 3 people; larger teams need a
  company license (remotion.pro).

## Which skill when

| Need                                         | Load                                   |
|----------------------------------------------|----------------------------------------|
| Plan a video from a vague ask / write a brief| `briefs/TEMPLATE.md` + `briefs/example-*.md` |
| Write/adjust animation, choose easing/timing | `remotion-markup` + `lib/motion.ts` + copy a sibling scene |
| New composition/scene, Studio structure      | `remotion-create`, `remotion-interactivity` |
| Captions / transcription                     | `remotion-captions` (+ scripts/transcribe.mts) |
| Trim/convert/concat footage, loudness        | `scripts/ffmpeg/README.md`, `remotion-markup` (ffmpeg.md) |
| Export MP4 / stills                          | `remotion-render`                      |
| Confirm a render is publishable              | `scripts/qa.ps1` (automated) + watch it once |
| Look up a Remotion API                       | `remotion-docs` (append `.md` to doc URLs) |

## Other tools in this workspace

- `higgsfield` MCP (AI video/b-roll generation) — needs auth; use for footage we don't have.
- `canva` MCP — static assets (logos, thumbnails) if needed.
- `capcut` MCP (`C:\Users\My Pc\capcut-stack`) — legacy CapCut draft pipeline; currently
  times out on connect. This Remotion project replaces it.

<!-- Worked example: a full plan produced from a one-line client ask ("more online bookings, make it look modern")
     for a fictional clinic, using only this project (no custom skill). Use it as the model for turning a vague
     request into scenes, exact copy, timing, real-numbers-only proof, props JSON and a QA gate. -->

# Smile Dental — "Skip the call" · 15-second Instagram Reel (9:16) — scene plan

Status: plan only. Nothing inside `C:\Users\My Pc\Claude_Video` was modified.
Built for the studio's `SocialReel` pipeline (`promoSchema` → 1080x1920 @ 30 fps), extended from the
stock 13.3 s to exactly **15.0 s (450 frames)** by re-timing the four stock scenes and inserting the
Proof scene that `ProductPromo` already has.

---

## Assumptions (the client only said "more online bookings, make it look modern")

1. **Objective:** conversions — move bookings from phone calls to `book.smiledental.ph`. Success metric:
   share of appointments booked online (baseline vs. 30 days after launch) plus link clicks. Organic Reels
   cannot carry a clickable link, so the URL must be legible on screen and repeated in the caption and
   bio; if the Reel is boosted as an ad, the ad's "Book Now" button carries the link.
2. **Audience:** Metro Cebu residents, 20–45, mobile-first, booking routine dental work (cleaning,
   fillings, braces/aligner consults, whitening). Pain in their words: "Line is busy, I'm on hold, they
   say call back during clinic hours." Objection to overcome: "If I book online, will anyone actually
   see it? Is it really confirmed?"
3. **Product (each line must be verified against the real page; swap wording if false):** branch picker
   (3 branches), service + date/time picker that shows open slots, instant confirmation by SMS or
   Messenger, page accepts bookings 24/7, no app download, free to book. Branch names were not given, so
   they are never typed on screen; they will appear naturally in the real screenshot.
4. **No data was provided**, so no performance claims are invented ("40% faster", "most trusted",
   "No. 1 in Cebu"). Only verifiable facts are shown as numbers: **3 branches** and **24/7**. A slot for
   a real Google rating / review quote exists and auto-hides when it is not supplied.
5. **Language:** English (Cebu Instagram audience reads English; keeps one cut reusable for all three
   branches). One optional Bisaya sub-line variant is offered for A/B testing, flagged for a
   native-speaker check.
6. **Sound:** muted autoplay assumed — text carries 100% of the message. Music is optional (client-licensed
   or royalty-free; the studio bundles none). No voice-over, therefore no captions.
7. **Brand:** no brand kit received. "Modern" is interpreted as the studio's house look (dark gradient,
   ambient orbs, glass cards, Sora/Inter type) recoloured to a dental teal/mint palette. Logo is the
   generated "S" monogram until a PNG arrives. If the real brand is light/white, see "Open items".
8. **Assets:** none received. One phone screenshot of the real booking page is required (a second,
   the confirmation screen, is optional). Screenshots use a dummy patient name, never a real patient.
9. **Compliance:** no patient data, no clinical/outcome claims, booking claims only. Every number shown
   must be substantiable (Ad Standards Council norms).

---

## Brief in house format (mirrors `briefs/TEMPLATE.md`)

| Section | Answer |
|---|---|
| Objective | Online bookings (closest template value: signups) |
| Primary CTA | "Book now at book.smiledental.ph" |
| Success metric | % of appointments booked online; Reel link clicks |
| Audience | Metro Cebu, 20–45, mobile-first dental patients |
| Pain | "Busy line, on hold, call back tomorrow" |
| Objection | "Will they see my online booking? Is it confirmed?" |
| Product | Smile Dental online booking page |
| Value prop (<= 12 words) | Book your dentist online. No call needed. |
| Proof points | 1. Pick your branch 2. Choose service & time 3. Get confirmed instantly |
| Proof (real only) | 3 branches (real), 24/7 (confirm), Google rating/quote (client to supply or omit) |
| Platform / format | Instagram Reels 9:16 (1:1 and 16:9 render free from the same props) |
| Length | 15 s exactly |
| Sound | Music optional; text-only safe; captions: no |
| Hook | "Still calling to book your dentist?" |
| Tone | Modern, friendly, effortless |
| Brand | Teal/mint dark (assumed); logo PNG to request |
| Assets | 1–2 screenshots + logo (to request); no footage |

---

## Timeline at a glance

Composition: `TransitionSeries` in the `SocialReel` pattern, 1080x1920, 30 fps, **450 frames = 15.0 s**.
Scene frames 84 + 102 + 108 + 84 + 120 = 498, minus 4 transitions x 12 frames = 450.

| # | Scene | Component (existing) | Visible window | Frames | Transition out |
|---|---|---|---|---|---|
| 1 | Hook | `HookScene` | 0.0–2.8 s | 0–84 | slide from-bottom, 12 f |
| 2 | Solution | `SolutionScene` | 2.4–5.8 s | 72–174 | fade, 12 f |
| 3 | How it works | `FeatureScene` | 5.4–9.0 s | 162–270 | wipe from-left, 12 f |
| 4 | Proof | `ProofScene` | 8.6–11.4 s | 258–342 | fade, 12 f |
| 5 | CTA | `CtaScene` | 11.0–15.0 s | 330–450 | none (holds; loops back to the hook) |

Cut points for SFX whooshes: frames 72, 162, 258, 330. Windows overlap by 0.4 s because transitions
blend the two scenes.

---

## Scene by scene

### Scene 1 — Hook (0.0–2.8 s · 84 frames)

**On-screen text (exact):**
- Kicker badge: `SMILE DENTAL · CEBU`
- Headline, 104 px, word-by-word: `Still calling to book your dentist?` — accent word in mint: `calling`
- Sub-line, 44 px: `Busy line. On hold. “Call back tomorrow.”`

**Visual:** dark teal gradient (#071923 → #0E3A47) with two slow ambient orbs (teal + mint), light film
grain and a vignette. Copy is left-aligned inside the 9:16 safe area (240 px top, 420 px bottom, 72 px
sides) so nothing sits under the Reels username bar or the caption stack; lines break before the
right-hand icon rail.

**Motion:** kicker fades and rises 0–0.4 s; headline words rise 44 px and un-tilt from 0.2 s with a
3-frame stagger and 14-frame enter (fully landed by ~1.2 s); sub-line fades up 1.1–1.6 s. The viewer
reads a question first and the pain second; the hook is complete inside 2 s.

**Transition out:** slide from-bottom, 12 frames — the booking page physically pushes the old way
off the top of the screen.

**Sound:** none required. If music is used it starts here with a 1-s fade-in.

---

### Scene 2 — Solution (2.4–5.8 s · 102 frames)

**On-screen text (exact):**
- Logo lockup: `Smile Dental` (gradient "S" monogram until the logo PNG is supplied)
- Tagline, 80 px, word-by-word: `Book online. No call needed.`
- On the phone screen: the real screenshot of `book.smiledental.ph` showing branch, service and
  date/time pickers. No extra overlay text on the screen.

**Visual:** stacked layout — lockup and tagline on top, a phone mockup (`DeviceFrame`, 430x880 scaled
0.8, about 344x704 px) centred below, teal/mint orbs behind, grain and vignette.

**Motion:** lockup fades up 0–0.4 s; tagline words from 0.3 s; phone fades in 0.5–0.9 s while rising
140 px and straightening from -6° to 0° (0.5–1.4 s); a glass shine sweeps across the screen 1.6–2.4 s;
about 1 s of hold so the page is recognisable.

**Transition out:** fade, 12 frames.

---

### Scene 3 — How it works (5.4–9.0 s · 108 frames)

**On-screen text (exact):**
- Title, 72 px: `Three taps. Done.`
- Card 01: `Pick your branch` — `Whichever is closest to you`
- Card 02: `Choose service & time` — `Only open slots are shown`
- Card 03: `Get confirmed instantly` — `By SMS or Messenger`

**Visual:** three full-width glass cards stacked, each with a mint numbered chip (01 / 02 / 03), 44 px
card titles, 32 px descriptions, on the same gradient.

**Motion:** title fades up 0–0.4 s; cards rise 48 px, fade and scale 0.92→1 at 0.3–0.8 s, 0.5–1.0 s
and 0.7–1.2 s; roughly 2.4 s of hold, enough to read 20 words at mobile pace.

**Transition out:** wipe from-left, 12 frames — the same wipe `ProductPromo` uses into Proof, so the
16:9 and 9:16 cuts feel like one family.

**Sound (optional):** `ding.wav` at frame 192 (card 03 lands) — the "confirmed" moment.

**Verify:** "Three taps" must match the real page's step count. If it is four, the title becomes
`Four taps. Done.` and the card copy stays.

---

### Scene 4 — Proof (8.6–11.4 s · 84 frames)

**On-screen text (exact):**
- Stat 1, 112 px, mint, counts 0→3: `3` — label `branches across Cebu`
- Stat 2, 112 px, white, counts 0→24 then suffix: `24/7` — label `open for online booking`
- Review card, ONLY if real data is supplied: five stars, `“<real public review quote>”`,
  `— <first name>, Google review`

**Visual:** two large count-up numbers stacked, optional glass testimonial card below, gradient
reversed (lighter teal at the top) for contrast with the previous scene.

**Motion:** stat 1 block fades up 0–0.4 s and counts over 1.5 s (no-bounce spring); stat 2 follows
0.2 s later; the card (if present) rises 1.2–1.7 s.

**Transition out:** fade, 12 frames.

**Rules:** if no real rating/quote exists at publish time, `quote` stays empty and the card does not
render — the scene still works with the two stats. Never ship anything marked "(placeholder)".

---

### Scene 5 — CTA (11.0–15.0 s · 120 frames)

**On-screen text (exact):**
- Logo lockup: `Smile Dental`
- Headline, 88 px, centred: `Skip the call. Book online.`
- Button: `Book now →` (the arrow is added by the button component; the label prop is `Book now`)
- URL, 44 px bold: `book.smiledental.ph`
- Note, 30 px: `No app needed. Free to book.`

**Visual:** centred stack; teal pill button with a soft glow; orbs; vignette. The final frame holds so
the loop returns straight to the hook.

**Motion:** lockup 0–0.4 s; headline words from 0.1 s; button fades in 0.7–0.9 s and pops 0.6→1 on a
spring (0.7–1.2 s); shine sweep 1.3–1.9 s; single pulse to 1.05 at 2.0–2.6 s; URL fades in 1.4–1.9 s;
note 1.8–2.3 s. Button is fully on screen for about 3.3 s and the URL for about 3.1 s (rule: CTA >= 3 s).

**Transition:** none (end of video). Music, if any, fades out over the last 2 s.

---

## Hook, CTA, numbers — summary and options

**Hook (chosen): `Still calling to book your dentist?`** — a question in the viewer's words that names
the exact behaviour the client wants to replace. "calling" is the accent word so the eye lands on it.
Alternatives to A/B test with the same build (only props change):
- B, benefit-first: `Book your dentist in three taps.` (accent: `three taps`)
- C, Bisaya sub-line, headline stays English: `Dili na kinahanglan motawag.` ("No need to call
  anymore.") — have a native speaker confirm the phrasing before use.
- D, strike-through opener using `ProblemScene` (three "call" pains crossed out in red): stronger
  visual, but the row type is 50 px (below the 84 px headline rule) and it spends 3+ s on the
  negative. Not chosen for a 15-s cut.

**CTA (chosen):** headline `Skip the call. Book online.` + button `Book now →` + `book.smiledental.ph`
+ `No app needed. Free to book.` The note exists to remove the two remaining frictions (install an app,
pay something). The URL is short enough to be typed from memory, which matters because organic Reels
cannot link.

**Numbers, stats and testimonials:**

| Shown | Where | Status | Source / action |
|---|---|---|---|
| `3` branches across Cebu | Scene 4, stat 1 | REAL | Client statement (3 branches) |
| `24/7` open for online booking | Scene 4, stat 2 | REAL if the page accepts bookings at any hour. If staff confirm manually, label becomes `book anytime — confirmed during clinic hours` | Client to confirm |
| `Three taps. Done.` | Scene 3 title | VERIFY by walking the real flow | Implementer |
| `Get confirmed instantly` / `By SMS or Messenger` | Scene 3, card 03 | VERIFY the page sends an automatic confirmation and on which channel | Client to confirm |
| Google rating / review quote | Scene 4 card | NOT SHOWN unless the clinic supplies one real public review (quote, first name, branch) and its current Google rating | Client; otherwise card is omitted |
| `No app needed. Free to book.` | Scene 5 note | VERIFY (web page, no booking fee) | Client to confirm |

Deliberately not used: "X% faster", "most trusted", "No. 1 in Cebu", invented quotes, invented patient
counts. The project rule is real numbers only, and none were given.

---

## Sound

- Muted-first: every message is on screen; nothing depends on audio.
- Music (optional): upbeat, light percussion, 100–120 BPM, licensed by the client or royalty-free with
  credit in the caption. `musicSrc: "music/<track>.mp3"` plays at 0.35 with the built-in 1-s fade-in
  and 2-s fade-out.
- SFX (optional): `whoosh.wav` at the four cut points (72, 162, 258, 330); `ding.wav` at frame 192 for
  the confirmation card. Keep SFX at 0.5 so they sit under the music.
- Deliver at -14 LUFS integrated, -1.5 dBTP (`scripts/ffmpeg/normalize-audio.ps1`).

---

## Colour, type, layout

- Palette (assumed; replace with brand hex codes if a guide exists): `bg #071923`, `bg2 #0E3A47`,
  `primary #0D9488` (button; white label about 4.1:1), `accent #2DD4BF` (accent words, chips,
  counters), `danger #FB7185` (unused in this cut, required by the schema).
- Type: Sora 700/800 for headlines and numbers, Inter 500 for support (house fonts, loaded already).
- Sizes meet the house rule at 1080 base: headlines 104 / 80 / 72 / 112 / 88 px (>= 84 except the
  72 px feature title, which is a section label above 44 px card titles); support >= 44 px; the CTA
  note is 30 px by design (tertiary) — keep it to one short line.
- Safe area: all five scenes use `safeArea()` for vertical (240 top / 420 bottom / 72 sides). QA the
  hook at frame 60 for any word under the Reels right-hand icon rail.

---

## Assets to request from Smile Dental

1. Logo PNG, transparent, >= 512 px tall → `remotion/public/brand/smile-dental.png`
2. Screenshot A: the booking page on a phone with branch, service and time visible, captured at
   860x1760 (2x of the 430x880 device) → `remotion/public/screenshots/smiledental-booking.png`
3. Screenshot B (optional, for a 1:1 or ad variant): the confirmation screen with a dummy name
4. Confirmation of: number of steps, confirmation channel (SMS / Messenger), 24/7 behaviour, no booking fee
5. Optional: one real public Google review (quote, first name, branch) and the current Google rating
6. Optional: a licensed music track

---

## Build notes (for the implementer; nothing changed yet)

- New composition `SmileReel` = copy of `remotion/src/compositions/SocialReel.tsx` with scene durations
  84 / 102 / 108 / 84 / 120 frames, a `ProofScene` inserted after Features, transitions
  slide-from-bottom / fade / wipe-from-left / fade (12 f each), four whoosh cut points (72, 162, 258,
  330). Register in `Root.tsx` with `durationInFrames={450}`, `fps={30}`, 1080x1920.
- Props file `briefs/smile-dental-reel.props.json` (draft below). The same props also render 1:1
  (`SquareAd`) and 16:9 (`ProductPromo`) via `scripts/render-social.ps1` for FB feed and the website;
  `pains`/`problemTitle` are only used by the 16:9 cut.
- Render: `.\scripts\render.ps1 -Comp SmileReel -Props briefs\smile-dental-reel.props.json
  -Out output\social\smile-dental-reel-9x16.mp4` (`render-social.ps1` only knows the three stock
  compositions; add `SmileReel` to its target list if the 1:1 / 16:9 variants are wanted in one go).
  `npm run typecheck ; npx eslint src` before the render.
- Reels cover frame: frame 60 (hook fully landed).
- QA gate: `.\scripts\qa.ps1 -File output\social\smile-dental-reel-9x16.mp4
  -Props briefs\smile-dental-reel.props.json -ExpectSeconds 15 -Comp SmileReel`. It FAILS on any
  "placeholder / lorem / TODO / replace with" text in the props and on a missing `logoSrc` /
  `screenshotSrc` file; it WARNS on an empty `musicSrc` and on a silent track (both expected for a
  muted-autoplay cut); it checks 30 fps / h264, decode errors, black or frozen segments, flash frames,
  stale renders, and writes `smile-dental-reel-9x16.contact.png` (one frame per second). Open the
  contact sheet, check safe areas and the right-hand icon rail, then watch the MP4 once end to end.
- Extra stills for the hook/CTA check: `.\scripts\stills.ps1 -Comp SmileReel -Frames "30,120,220,300,400"`.

---

## Draft props (matches `remotion/src/compositions/schema.ts`)

```json
{
  "brandName": "Smile Dental",
  "logoSrc": "brand/smile-dental.png",
  "kicker": "Smile Dental · Cebu",
  "headline": "Still calling to book your dentist?",
  "accentWords": "calling",
  "sub": "Busy line. On hold. “Call back tomorrow.”",
  "problemTitle": "The old way",
  "pains": [
    "Call during clinic hours",
    "Wait on hold",
    "Call back tomorrow"
  ],
  "productName": "Smile Dental",
  "tagline": "Book online. No call needed.",
  "screenshotSrc": "screenshots/smiledental-booking.png",
  "deviceVariant": "phone",
  "featureTitle": "Three taps. Done.",
  "features": [
    { "title": "Pick your branch", "desc": "Whichever is closest to you" },
    { "title": "Choose service & time", "desc": "Only open slots are shown" },
    { "title": "Get confirmed instantly", "desc": "By SMS or Messenger" }
  ],
  "stat1": { "value": 3, "suffix": "", "label": "branches across Cebu" },
  "stat2": { "value": 24, "suffix": "/7", "label": "open for online booking" },
  "quote": "",
  "author": "",
  "ctaHeadline": "Skip the call. Book online.",
  "ctaLabel": "Book now",
  "url": "book.smiledental.ph",
  "note": "No app needed. Free to book.",
  "musicSrc": "",
  "sfxEnabled": true,
  "primary": "#0D9488",
  "accent": "#2DD4BF",
  "bg": "#071923",
  "bg2": "#0E3A47",
  "danger": "#FB7185"
}
```

`quote` and `author` stay empty unless a real review is supplied; an empty `quote` removes the card.

---

## Open items / risks

- Light-theme variant: the scenes hard-code light text (#F9FAFB) and white-glass surfaces. A bright
  white brand look needs a text-colour prop on Headline / Subline / KineticText / Card (small change);
  not assumed here.
- The CTA note (30 px) sits below the 44 px support rule; acceptable as tertiary text, or raise to
  36 px in `CtaScene`.
- `SocialReel` hard-codes three whoosh cut points; the five-scene cut needs four.
- The Counter shows `3` after ticking 0, 1, 2 — fine, but if it reads slow, drop `countFrames` to 30.
- Bisaya variant C needs a native check before it is ever rendered.

---

## My process

**Files consulted (all read-only, nothing modified):**
- `C:\Users\My Pc\Claude_Video\CLAUDE.md` — house rules: hook in the first 2 s, CTA on screen >= 3 s,
  one idea per scene, headline >= 84 px / support >= 44 px, respect `safeArea()`, assume muted
  autoplay, real stats only with "(placeholder)" never published, Studio-editable motion conventions.
- `briefs/TEMPLATE.md`, `briefs/example-skedai.md`, `briefs/example-skedai.props.json` — the house brief
  format and a worked example (I mirrored its section order and scene table).
- `remotion/src/compositions/SocialReel.tsx`, `SquareAd.tsx`, `ProductPromo.tsx`, `schema.ts`,
  `Root.tsx` — the 9:16 scene order and frame math (SocialReel is 399 f; ProductPromo is the only cut
  with a Proof scene, which I borrowed), the single props shape, registered durations.
- `remotion/src/scenes/*` (Hook, Solution, Feature, Proof, Cta, Problem, LogoSting) — the exact text
  slots each scene exposes and its inline keyframes, so every "Motion" line above matches what the
  code will actually do (e.g. ProblemScene strikes start at 2.3 s, which is why option D is rejected
  for a 15-s cut; CtaScene's button appears at 0.7 s, which sets the 4.0 s CTA length).
- `remotion/src/elements/*` (Counter, CtaButton, KineticText, DeviceFrame, FeatureCard, StarRating,
  Card, LogoLockup, Badge, Subline, Headline) — sizes (phone 430x880, button 44 px, note 30 px), the
  auto-appended arrow on the button, Counter prefix/suffix behaviour behind `24/7`.
- `remotion/src/lib/formats.ts` — the 9:16 safe area (240 / 420 / 72) used in every scene.
- `remotion/src/lib/motion.ts`, `theme/brand.ts`, `theme/fonts.ts` — easing presets, default palette, Sora/Inter.
- `docs/superpowers/specs/2026-10-18-claude-video-design.md` — the studio's intent (formats, 30 fps,
  brand-as-props, no bundled audio).
- `.claude/skills/remotion-create/SKILL.md` and `video-layout.md` — "design a video, not a webpage":
  one focal element per scene, 84 / 44 px minimums at 1080 wide.
- `.claude/skills/remotion-markup/transitions.md`, `timing.md`, `sfx.md`, `audio.md` — TransitionSeries
  duration math (sum of scenes minus overlaps), available transitions (fade / slide / wipe), stock SFX
  URLs (whoosh, ding).
- `scripts/render-social.ps1`, `render.ps1`, `stills.ps1`, `scripts/ffmpeg/README.md` — how the cut
  will be rendered, and the -14 LUFS loudness target.
- `scripts/qa.ps1` (appeared mid-task together with a CLAUDE.md update) — the automated publish gate;
  its placeholder regex and asset checks shaped the props draft (no "placeholder" wording anywhere,
  real file paths for logo and screenshot, empty `quote` instead of a dummy review).
- `output/stills/SocialReel/*.png` and `output/stills/ProductPromo/element-200.png`, `element-620.png`
  — rendered frames of the hook, solution, features, CTA, problem and proof scenes, so the visual
  descriptions match the real look (left-aligned copy, glass cards, count-up numbers).

**Skills:** the project's CLAUDE.md routes "plan a video from a vague ask / write a brief" to a
`marketing-video` skill and motion work to `motion-design`. Neither exists on disk (searched
`Claude_Video/.claude/skills`, `~/.claude/skills`, the profile skills folder and the synced skill
bundles); only the twelve official `remotion-*` skills are installed. The CLAUDE.md was updated while I
worked: the former `video-qa` skill reference is now `scripts/qa.ps1`, which does exist and is used
above. For the missing two I substituted the brief template, the example brief, the CLAUDE.md rules and
the Remotion skill notes listed above.
General-purpose UI/design skills (`frontend-design`, `ui-ux-pro-max`, etc.) were not loaded — this is a
video plan, not an interface. `healthcare-phi-compliance` was not loaded either; no patient data is
involved, but the "dummy name on screenshots" rule is applied anyway.

**Why these choices:**
- *Hook:* a problem-first question in the viewer's own words, because the client's goal is literally
  "stop calling, book online" — naming "calling" in the first second is both the pattern interrupt and
  the setup for the pivot. It is fully legible by ~1.2 s, inside the house "hook < 2 s" rule. The
  benefit-first and Bisaya variants are kept as prop-only A/B swaps.
- *Length and structure:* the client asked for 15 s, which is also the length at which Reels ads get
  full plays and organic Reels keep high completion (and the loop lands on the hook). Five beats
  (hook → solution → how → proof → CTA) at 2.8 / 3.4 / 3.6 / 2.8 / 4.0 s give each scene one idea,
  keep the CTA on screen > 3 s, and total exactly 450 frames. The Problem scene from the 16:9 promo
  was folded into the hook's sub-line rather than spending 3+ s on the negative.
- *Text amount:* muted autoplay means the copy is the script. About 65 words across 15 s
  (roughly 4 words/second including hold time), no scene over 20 words, headlines of 3–6 words at
  >= 72 px so each frame can be read in one glance on a phone with the Reels UI overlaid.
- *Stats:* no data was supplied and the house rule is real numbers only, so the plan shows the two
  facts that are certain (3 branches, 24/7), turns the "is it confirmed?" objection into a feature
  card instead of a fabricated claim, and reserves a review card that renders only if the clinic
  provides a real public review. Everything else is a verify-with-client item listed in one table.

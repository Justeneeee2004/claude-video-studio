/**
 * Rallyo pre-launch reel v2.3 (round 4, 62 s cut): the single source of timing constants (brief sections 4, 5, 6,
 * 7; players chapter spec briefs/rallyo-players-chapter.md sections 1, 3, 4, 7 and 10).
 * 1080x1920 · 30 fps · exactly 1860 frames (31 bars of 60 f). Visual-only: music #3 (one pre-rendered 62 s edit
 * file) + SFX, no voice, no captions. Every value is an integer frame; every scene length, cut and transition sits
 * on the 15 f beat grid and every SFX cue on the 3 f grid. The assertions at the bottom run at import
 * time (Studio and render) and throw if anyone edits a number out of sync with the brief.
 *
 * Round 4: frames 0–1020 are unchanged (hook, brand drop, CH01, S3–S9, the CH02 panel). The single 180 f `players`
 * scene became four scenes (S10a find 1020–1125, S10b join + pay 1110–1215, S10c Player ID 1200–1335, S10d live +
 * results 1320–1560), and the offer and CTA moved by exactly +360 (FREE on 1560, `rallyo.ph` on 1710, button 1800).
 *
 * Scene components keep their *local* keyframes as inline literals (Studio-editable); the `CUES`
 * table mirrors the brief's key local beats for QA and cross-file sync. This module has no imports
 * (Node can run it directly: `node src/lib/rallyo-timeline.ts` exercises every assert).
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 1860;
/** Every non-cut transition is 15 f (one beat). Hard cuts are 0 f. */
export const TRANSITION_FRAMES = 15;

/** FRONT easing for the built-in slide / wipe cuts: Easing.bezier(...FRONT_BEZIER) (brief 5.2). */
export const FRONT_BEZIER = [0.22, 1, 0.36, 1] as const;

export type SceneId =
  | "hook"
  | "reveal"
  | "publish"
  | "share"
  | "approve"
  | "checkIn"
  | "upNext"
  | "whoWon"
  | "tournament"
  | "playersFind"
  | "playersJoin"
  | "playersId"
  | "playersLive"
  | "offer"
  | "cta";

/**
 * Transition OUT of a scene (into the next one).
 * - Custom presentations (`src/transitions/`): circleReveal, zoomThrough, whip, limeFlood. linearTiming,
 *   the easing lives inside the presentation.
 * - Built-ins (`@remotion/transitions`): slide, wipe (FRONT-eased timing), pushCut (linear timing).
 * - `cut`: hard cut, no Transition element (S2 → S3, S9 → S10a, hidden under the ChapterWipe overlays).
 * - `none`: the last scene holds. `iris` and `fade` stay available but are unused in v2.3.
 */
export type CutKind =
  | { readonly type: "circleReveal"; readonly frames: number; readonly timing: "linear" }
  | { readonly type: "zoomThrough"; readonly frames: number; readonly timing: "linear" }
  | { readonly type: "whip"; readonly frames: number; readonly timing: "linear" }
  | { readonly type: "limeFlood"; readonly frames: number; readonly timing: "linear" }
  | { readonly type: "pushCut"; readonly frames: number; readonly timing: "linear" }
  | {
      readonly type: "slide";
      readonly direction: "from-bottom" | "from-right" | "from-left" | "from-top";
      readonly frames: number;
      readonly timing: "front";
    }
  | { readonly type: "wipe"; readonly direction: "from-left" | "from-right"; readonly frames: number; readonly timing: "front" }
  | { readonly type: "iris"; readonly frames: number; readonly timing: "linear" }
  | { readonly type: "fade"; readonly frames: number; readonly timing: "linear" }
  | { readonly type: "cut"; readonly frames: 0 }
  | { readonly type: "none"; readonly frames: 0 };

export type SceneSpec = {
  readonly index: number;
  readonly id: SceneId;
  /** Component exported from src/scenes/rallyo/<component>.tsx */
  readonly component: string;
  readonly label: string;
  readonly frames: number;
  /** Absolute start frame in RallyoPrelaunch. */
  readonly start: number;
  /** Absolute end frame (start + frames). */
  readonly end: number;
  readonly out: CutKind;
};

const T = TRANSITION_FRAMES;

const SCENE_DEFS: readonly Omit<SceneSpec, "index" | "start" | "end">[] = [
  { id: "hook", component: "ChatChaosScene", label: "S1 Hook: GC chaos", frames: 135, out: { type: "circleReveal", frames: T, timing: "linear" } },
  { id: "reveal", component: "RevealScene", label: "S2 Brand drop: Relax, host", frames: 120, out: { type: "cut", frames: 0 } },
  { id: "publish", component: "PublishScene", label: "S3 01 · Publish", frames: 120, out: { type: "zoomThrough", frames: T, timing: "linear" } },
  {
    id: "share",
    component: "ShareScene",
    label: "S4 Share: one post",
    frames: 135,
    out: { type: "slide", direction: "from-right", frames: T, timing: "front" },
  },
  {
    id: "approve",
    component: "ApproveScene",
    label: "S5 Approve + payment",
    frames: 105,
    out: { type: "wipe", direction: "from-left", frames: T, timing: "front" },
  },
  { id: "checkIn", component: "CheckInScene", label: "S6 Check-in by code", frames: 105, out: { type: "whip", frames: T, timing: "linear" } },
  { id: "upNext", component: "UpNextScene", label: "S7 Up next, automatic", frames: 120, out: { type: "pushCut", frames: T, timing: "linear" } },
  {
    id: "whoWon",
    component: "WhoWonScene",
    label: "S8 Who won → podium",
    frames: 120,
    out: { type: "slide", direction: "from-bottom", frames: T, timing: "front" },
  },
  { id: "tournament", component: "TournamentScene", label: "S9 Tournament day", frames: 165, out: { type: "cut", frames: 0 } },
  // 02 FOR PLAYERS (round 4, players spec section 1): four beats joined by built transitions, one rail dot per arrival.
  {
    id: "playersFind",
    component: "PlayersFindScene",
    label: "S10a 02 · Find a game",
    frames: 105,
    out: { type: "slide", direction: "from-right", frames: T, timing: "front" },
  },
  {
    id: "playersJoin",
    component: "PlayersJoinScene",
    label: "S10b Join, pay the host",
    frames: 105,
    out: { type: "wipe", direction: "from-left", frames: T, timing: "front" },
  },
  { id: "playersId", component: "PlayersIdScene", label: "S10c Player ID", frames: 135, out: { type: "whip", frames: T, timing: "linear" } },
  {
    id: "playersLive",
    component: "PlayersLiveScene",
    label: "S10d You're up → rank → free",
    frames: 240,
    out: { type: "limeFlood", frames: T, timing: "linear" },
  },
  {
    id: "offer",
    component: "OfferScene",
    label: "S11 Offer: free during pre-launch",
    frames: 165,
    out: { type: "slide", direction: "from-bottom", frames: T, timing: "front" },
  },
  { id: "cta", component: "RallyoCtaScene", label: "S12 CTA: rallyo.ph", frames: 165, out: { type: "none", frames: 0 } },
];

const buildScenes = (): SceneSpec[] => {
  const out: SceneSpec[] = [];
  let start = 0;
  SCENE_DEFS.forEach((def, index) => {
    out.push({ ...def, index, start, end: start + def.frames });
    start = start + def.frames - def.out.frames;
  });
  return out;
};

/** The 15 scenes in order, with absolute start/end. start(n+1) = start(n) + frames(n) − out(n).frames. */
export const SCENES: readonly SceneSpec[] = buildScenes();

const byId = (id: SceneId): SceneSpec => {
  const found = SCENES.filter((s) => s.id === id)[0];
  if (!found) {
    throw new Error(`rallyo-timeline: unknown scene ${id}`);
  }
  return found;
};

/** Lookup by id: SCENE.publish.start === 240, SCENE.publish.frames === 120. */
export const SCENE: { readonly [K in SceneId]: SceneSpec } = {
  hook: byId("hook"),
  reveal: byId("reveal"),
  publish: byId("publish"),
  share: byId("share"),
  approve: byId("approve"),
  checkIn: byId("checkIn"),
  upNext: byId("upNext"),
  whoWon: byId("whoWon"),
  tournament: byId("tournament"),
  playersFind: byId("playersFind"),
  playersJoin: byId("playersJoin"),
  playersId: byId("playersId"),
  playersLive: byId("playersLive"),
  offer: byId("offer"),
  cta: byId("cta"),
};

/** Brief section 4 start table (asserted below; players spec section 1). */
export const SCENE_STARTS = [0, 120, 240, 345, 465, 555, 645, 750, 855, 1020, 1110, 1200, 1320, 1545, 1695] as const;

/** Absolute frames where each scene after the first starts (= every cut point, transition or hard cut). */
export const CUTS: readonly number[] = SCENES.slice(1).map((s) => s.start);

/** The transition kind for each cut, CUT_KINDS[i] = SCENES[i].out (i = 0..13). */
export const CUT_KINDS: readonly CutKind[] = SCENES.slice(0, -1).map((s) => s.out);

export type FrameWindow = {
  /** First frame (inclusive). */
  readonly start: number;
  /** First frame after the window (exclusive). */
  readonly end: number;
};

/**
 * The twelve 15 f transition windows, [start, end): 120, 345, 465, 555, 645, 750, 855, 1110, 1200, 1320, 1545,
 * 1695 (+15). The brief writes them inclusive (120–134 …). Both scenes' supers may co-exist inside them.
 */
export const TRANSITION_WINDOWS: readonly FrameWindow[] = SCENES.slice(0, -1)
  .map((s, i) => ({ s, next: SCENES[i + 1] }))
  .filter(({ s }) => s.out.frames > 0)
  .map(({ s, next }) => ({ start: next.start, end: next.start + s.out.frames }));

export const inTransitionWindow = (frame: number): boolean =>
  TRANSITION_WINDOWS.some((w) => frame >= w.start && frame < w.end);

/** Absolute frame → the scene that owns it (the incoming scene during a transition) + local frame. */
export const sceneAt = (frame: number): { readonly scene: SceneSpec; readonly local: number } => {
  let scene = SCENES[0];
  for (const s of SCENES) {
    if (frame >= s.start) {
      scene = s;
    }
  }
  return { scene, local: frame - scene.start };
};

/** Scene-local frame of an absolute frame for a given scene (may be negative or past its end). */
export const localOf = (id: SceneId, abs: number): number => abs - SCENE[id].start;

// ---------------------------------------------------------------------------------------------
// Music grid (brief section 7): exactly 120 BPM, 1 beat = 15 f, 1 bar = 60 f, bar lines at 60k.
// Track #3 starts 4.00 s in, so the drop (8.00 s) lands on f120 and every track bar line on 60k.
// ---------------------------------------------------------------------------------------------

export const BPM = 120;
export const BEAT = (FPS * 60) / BPM; // 15
export const BAR = BEAT * 4; // 60
/** The music drop (kick + bass enter, source 8.00 s) on the circleReveal burst. */
export const DROP = 120;
export const BAR_OFFSET = DROP % BAR; // 0
/** The track's pickup hit (source 7.50 s) = the lime strike through the hook's line 2. */
export const PICKUP = 105;
/** Part C enters on a section-D downbeat (source 100.00 s) with the FREE slam (round 4: +360). */
export const SLAM = 1560;
/** One beat of digital silence baked into rallyo-edit-62s.wav ([start, end)) = the limeFlood window. */
export const DROPOUT = [1545, 1560] as const;
/** The track's last downbeat (source 108.00 s): the button ending, 2 s before the end. */
export const BUTTON = 1800;

export const beatFrame = (beat: number): number => beat * BEAT;
export const beatOf = (frame: number): number => frame / BEAT;
export const isOnBeat = (frame: number): boolean => (frame - BAR_OFFSET) % BEAT === 0;
export const isOnBar = (frame: number): boolean => (frame - BAR_OFFSET) % BAR === 0;
export const snapToBeat = (frame: number, mode: "ceil" | "floor" | "round" = "ceil"): number => {
  const b = (frame - BAR_OFFSET) / BEAT;
  const snapped = mode === "ceil" ? Math.ceil(b) : mode === "floor" ? Math.floor(b) : Math.round(b);
  return snapped * BEAT + BAR_OFFSET;
};

/** The brief's bar.beat notation: bar = ⌊f/60⌋, beat = ⌊(f mod 60)/15⌋ + 1, offset = frames after that beat. */
export const barBeat = (frame: number): { readonly bar: number; readonly beat: number; readonly offset: number } => {
  const f = frame - BAR_OFFSET;
  const bar = Math.floor(f / BAR);
  const inBar = f - bar * BAR;
  const beat = Math.floor(inBar / BEAT) + 1;
  return { bar, beat, offset: inBar - (beat - 1) * BEAT };
};

/** "12.3 + 9 f" style label (QA stills, contract). */
export const barBeatLabel = (frame: number): string => {
  const { bar, beat, offset } = barBeat(frame);
  return offset === 0 ? `${bar}.${beat}` : `${bar}.${beat} + ${offset} f`;
};

/**
 * How rallyo-edit-62s.wav maps reel frames to track #3 seconds (brief 7.2, players spec section 6). Documentation +
 * QA only: the file carries every fade, the drop-out, the seam and the gain, and plays from f0 at volume 1.
 * A: source = 4.00 + f/30 for f < 1545 (A ends at 55.50 s, faded 1542–1545); silence 1545–1560;
 * C: source = 48.00 + f/30 for f ≥ 1560 (enters on 100.00 s = section D, last downbeat 108.00 s on f1800, fade
 * 1830–1860). The seam jumps +44.00 s = 22 whole bars on the bar line 1560, behind one beat of silence.
 */
export const MUSIC_EDIT = {
  frames: TOTAL_FRAMES,
  sampleRate: 48000,
  samples: 2976000,
  partA: { start: 0, end: DROPOUT[0], sourceOffsetSeconds: 4 },
  dropout: DROPOUT,
  partC: { start: SLAM, end: TOTAL_FRAMES, sourceOffsetSeconds: 48 },
  pickup: PICKUP,
  drop: DROP,
  finalHit: BUTTON,
  fadeOut: [1830, 1860] as const,
} as const;

/** Track #3 source seconds heard at a reel frame, or null inside the drop-out. */
export const trackSecondsAt = (frame: number): number | null => {
  if (frame >= MUSIC_EDIT.dropout[0] && frame < MUSIC_EDIT.dropout[1]) {
    return null;
  }
  const offset = frame >= MUSIC_EDIT.partC.start ? MUSIC_EDIT.partC.sourceOffsetSeconds : MUSIC_EDIT.partA.sourceOffsetSeconds;
  return offset + frame / FPS;
};

// ---------------------------------------------------------------------------------------------
// Chapter overlays (brief 5.3, section 6): top-level, outside the TransitionSeries.
// Z-order: scenes < ChapterRail 01/02 < ChapterWipe 01/02 < ReelsGuide.
// ---------------------------------------------------------------------------------------------

export type RailRect = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

/** Rail band y 1170–1236 (radius 33). Fallback band y 1100–1166 (open item e). */
export const RAIL_TOP = 1170;
export const RAIL_TOP_FALLBACK = 1100;
export const RAIL_H = 66;

/** One dot per host feature: S3 … S9 arrivals. */
export const RAIL01_DOTS = [276, 345, 465, 555, 645, 750, 855] as const;
/** One dot per player beat: S10a (hand-off + 3), S10b (slide), S10c (wipe), S10d (whip). */
export const RAIL02_DOTS = [1056, 1110, 1200, 1320] as const;

export const OVERLAYS = {
  /** ChapterWipe 01: rise 228–240 (cubic in), full cover 240–258 (`01` slam on bar 4), collapse 258–273, hand-off 273. */
  ch01: { start: 228, frames: 48, cover: 240, collapse: [258, 273] as const, handoff: 273 },
  /** ChapterWipe 02: rise 1008–1020, full cover 1020–1038 (`02` slam on bar 17), collapse 1038–1053, hand-off 1053. */
  ch02: { start: 1008, frames: 48, cover: 1020, collapse: [1038, 1053] as const, handoff: 1053 },
  /** ChapterRail 01 `01 · HOSTS`: x 72–496 (label + 7 dots), unmounts at 1020 under CH02 full cover. */
  rail01: { start: 273, end: 1020, rect: { x: 72, y: RAIL_TOP, w: 424, h: RAIL_H } as RailRect, dots: RAIL01_DOTS, fadeOut: null },
  /**
   * ChapterRail 02 `02 · PLAYERS` + 4 dots (round 4): x 72–466 (28 + 226 label + 24 + 4 × 14 + 3 × 10 + 30 = 394),
   * one dot per beat arrival (S10a hand-off + 3, then the slide, wipe and whip), retracts 1536–1542 with
   * `FREE FOR PLAYERS.` before the zoom into lime.
   */
  rail02: {
    start: 1053,
    end: 1542,
    rect: { x: 72, y: RAIL_TOP, w: 394, h: RAIL_H } as RailRect,
    dots: RAIL02_DOTS,
    fadeOut: [1536, 1542] as const,
  },
} as const;

/** ChapterWipe local frames (both chapters): rise 0–12, cover 12–30, collapse 30–45, nothing after 45. */
export const CHAPTER_WIPE_LOCAL = { rise: [0, 12] as const, cover: 12, collapse: [30, 45] as const, forFades: [30, 36] as const, dotIn: [39, 45] as const, handoff: 45 };

// ---------------------------------------------------------------------------------------------
// Key local cues per scene (brief section 6). Scenes write these as inline literals; this table is
// the cross-check (QA stills, SFX alignment, contract doc). [a, b] = local frame range.
// ---------------------------------------------------------------------------------------------

export const CUES = {
  hook: {
    headlineWords: [3, 6, 9, 12, 15, 18],
    headlineLanded: 30,
    bubbles: [9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 66, 69, 72, 75, 78, 81, 84, 87],
    unreadBy: 87,
    push: [0, 108],
    rush: [87, 108],
    strike: [105, 117],
    freeze: [108, 120],
    shakePeriod: 3,
    out: 120,
  },
  reveal: {
    circleIn: [0, 15],
    headlineWords: [9, 12],
    headlineLanded: 24,
    laptopRise: [15, 45],
    phoneIn: [21, 51],
    lockupSlam: [30, 39],
    logoRing: [30, 42],
    badgePop: [51, 60],
    shine: [60, 84],
    drift: [15, 120],
    chapterRise: [108, 120],
  },
  publish: {
    underCover: [0, 18],
    phoneFloat: [9, 33],
    chipIn: [18, 28],
    spotlightIn: [24, 30],
    hops: [30, 45, 60],
    headlineWords: [37, 39, 41],
    headlineLanded: 50,
    veilOut: [63, 69],
    scrollWhip: [66, 81],
    fingerDot: 84,
    tapPublish: 90,
    chipStrike: 93,
    drift: [96, 105],
    out: 105,
  },
  share: {
    arrival: [0, 15],
    chipIn: [9, 19],
    fingerDot: 24,
    headlineWords: [28, 30, 32, 34],
    headlineLanded: 43,
    tapShare: 30,
    swipeToChat: [33, 45],
    cameraFull: [33, 51],
    postPop: 45,
    underlines: [60, 75, 90],
    chipStrike: 93,
    urlUnderline: [105, 114],
    out: 120,
  },
  approve: {
    slideIn: [0, 15],
    chipIn: [2, 12],
    headlineWords: [21, 23, 25],
    headlineLanded: 34,
    fingerDot: 24,
    tapReview: 30,
    sheetSwipe: [33, 45],
    highlighter: [54, 63],
    highlighter2: [60, 69],
    fingerDot2: 69,
    tapApprove: 75,
    chipStrike: 78,
    out: 90,
  },
  checkIn: {
    wipeIn: [0, 15],
    chipIn: [2, 12],
    ringCount: [12, 24],
    headlineWords: [21, 23, 25],
    headlineLanded: 34,
    cameraB: [27, 39],
    tileIn: [39, 51],
    connector: [48, 60],
    fingerDot: 54,
    tapCheckIn: 60,
    chipStrike: 66,
    out: 90,
  },
  upNext: {
    whipIn: [0, 15],
    headlineWords: [12, 14, 16],
    headlineLanded: 25,
    phoneExit: [12, 24],
    cameraColumn: [12, 24],
    supportWords: [24, 26, 28, 30],
    supportLanded: 39,
    box: [33, 45],
    cursor: [36, 54],
    ringNextCourt: [45, 57],
    click: 60,
    cameraCourt1: [66, 90],
    drift: [90, 105],
    out: 105,
  },
  whoWon: {
    pushCutIn: [0, 15],
    flash: 9,
    chipIn: [9, 19],
    tapCard: 15,
    headlineWords: [28, 30],
    headlineLanded: 39,
    state2: 30,
    cameraStates: [30, 42],
    fingerDot: 39,
    tapGameOver: 45,
    state3: 48,
    highlighter: [54, 63],
    highlighter2: [57, 66],
    swipeToPodium: [69, 81],
    podiumRise: [81, 90],
    confetti: [81, 105],
    chipStrike: 93,
    out: 105,
  },
  tournament: {
    slideIn: [0, 15],
    chipIn: [2, 12],
    cameraBar: [9, 21],
    h1Words: [21, 23, 25],
    h1Landed: 34,
    cursorIn: [24, 33],
    pushIn: [24, 36],
    ringAutoCall: [45, 54],
    hoverNoClick: [33, 57],
    swipeToBracket: [60, 72],
    boxQf: [81, 93],
    h1Out: [88, 94],
    h2Words: [94, 96, 98],
    h2Landed: 107,
    connector: [90, 105],
    panToSf: [90, 102],
    rowFlash: [102, 114],
    boxSfSlot: [108, 120],
    chipStrike: 120,
    drift: [120, 153],
    chapterRise: [153, 165],
  },
  // Players chapter (players spec section 4; local = abs − scene start).
  playersFind: {
    underCover: [0, 18],
    phoneFloat: [12, 33],
    osmCredit: [24, 30],
    h1Words: [21, 23, 25],
    h1Landed: 34,
    drift: [33, 51],
    pinPulses: [42, 45],
    swipeToPreview: [51, 63],
    cameraP: [51, 63],
    drift2: [63, 105],
    fingerDot: 72,
    tapRequest: 75,
    press: [75, 81],
    hold: [81, 90],
    out: 90,
  },
  playersJoin: {
    slideIn: [0, 15],
    headlineWords: [6, 8, 10, 12],
    headlineLanded: 21,
    supportWords: [18, 20, 22],
    supportLanded: 31,
    highlighter: [24, 36],
    highlighter2: [30, 39],
    drift0: [0, 45],
    swipeToReceipt: [45, 57],
    drift: [57, 105],
    ringGcash: [66, 75],
    underlineConfirmed: [75, 84],
    out: 90,
  },
  playersId: {
    wipeIn: [0, 15],
    pushIn: [0, 15],
    headlineWords: [6, 8, 10, 12],
    headlineLanded: 21,
    supportWords: [16, 18, 20, 22, 24, 26],
    supportLanded: 35,
    highlighter: [24, 36],
    fingerDot: 42,
    tapCreate: 45,
    sheetFade: [48, 51],
    sheetRise: [48, 60],
    highlighter2: [69, 78],
    chooserDim: [45, 51],
    chooserOut: [50, 54],
    swipeToCard: [81, 93],
    boxRating: [102, 111],
    drift: [93, 135],
    out: 120,
  },
  playersLive: {
    whipIn: [0, 15],
    upWords: [5, 7],
    upLanded: 16,
    drift: [15, 60],
    glow: [22, 52],
    swipeToStandings: [60, 72],
    upOut: [61, 67],
    upFade: [60, 63],
    rankWords: [64, 66, 68, 70],
    rankLanded: 79,
    rankSupportWords: [76, 78, 80],
    rankSupportLanded: 89,
    boxRallyoOnly: [81, 90],
    rowFlash: [87, 99],
    swipeToPodium: [99, 111],
    podiumRise: [111, 120],
    confetti: [120, 144],
    push: [123, 210],
    rankOut: [143, 149],
    closeWords: [149, 151, 153],
    closeLanded: 162,
    textOut: [210, 216],
    closeOut: [216, 219],
    zoomIntoLime: [216, 225],
    limeFill: [216, 225],
    out: 225,
  },
  offer: {
    floodIn: [0, 15],
    slam: [15, 21],
    heroSubRise: [15, 24],
    heroLanded: 24,
    badgeDrop: [21, 30],
    fanRise: [18, 24, 30, 36, 42],
    fanFrames: 18,
    supportWords: [33, 35, 37, 39, 41],
    supportLanded: 50,
    fanFlashes: [60, 75, 90, 105, 120],
    shine: [75, 99],
    out: 150,
  },
  cta: {
    slideIn: [0, 15],
    logo: [3, 18],
    headlineWords: [3, 5, 7, 9, 11],
    headlineLanded: 20,
    urlSlam: [6, 15],
    supportWords: [21, 23, 25, 27],
    supportLanded: 36,
    shine: [45, 69],
    button: 105,
    hold: [117, 165],
  },
} as const;

/** Chip strike frames, absolute (brief section 9). */
export const CHIP_STRIKES = {
  publish: SCENE.publish.start + CUES.publish.chipStrike, // 333
  share: SCENE.share.start + CUES.share.chipStrike, // 438
  approve: SCENE.approve.start + CUES.approve.chipStrike, // 543
  checkIn: SCENE.checkIn.start + CUES.checkIn.chipStrike, // 621
  whoWon: SCENE.whoWon.start + CUES.whoWon.chipStrike, // 843
  tournament: SCENE.tournament.start + CUES.tournament.chipStrike, // 975
} as const;

/** Landmarks quoted in brief sections 4 and 9 (absolute frames). */
export const LANDMARKS = {
  hookHeadlineLanded: 30,
  pickup: PICKUP,
  drop: DROP,
  ch01: OVERLAYS.ch01.cover,
  ch02: OVERLAYS.ch02.cover,
  slam: SLAM,
  urlLanded: 1710,
  button: BUTTON,
} as const;

// ---------------------------------------------------------------------------------------------
// Reading time (brief section 4). Each super holds max(1.2 s, 0.5 s + 0.33 s × words) + 9 f.
// Words = whitespace tokens with a letter or digit ("·" is not a word; PRE-LAUNCH, IT'S count as one).
// ---------------------------------------------------------------------------------------------

export const READING_MARGIN = 9;

export const countWords = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;

/** Base reading frames, rounded up: 1–2 words 36, 3 → 45, 4 → 55, 5 → 65, 6 → 75, 10 → 114. Integer math. */
export const readingFrames = (words: number): number => Math.max(36, Math.ceil((1500 + 990 * words) / 100));

/** What a super needs on screen: base + 9 f margin (1–2 words 45, 3 → 54, 4 → 64, 5 → 74, 6 → 84). */
export const readingNeed = (words: number): number => readingFrames(words) + READING_MARGIN;

export type SuperKind = "super" | "chip" | "rail";

export type SuperSpec = {
  readonly id: string;
  readonly kind: SuperKind;
  /** The scene (or overlay) that draws it. */
  readonly scene: SceneId | "ch01" | "ch02";
  /** Canonical copy (brief section 2). Props carry the rendered strings; QA compares both. */
  readonly text: string;
  readonly words: number;
  /** First word's enter starts (headlines / supports), absolute. */
  readonly start?: number;
  /** Last word's enter has finished, absolute. */
  readonly landed: number;
  /** First frame it starts to leave or is covered (chips: strike + 12), absolute. */
  readonly until: number;
};

/** Brief section 4 reading-time table (v2.3 English copy; players spec section 3). Every row is asserted at import. */
export const SUPERS: readonly SuperSpec[] = [
  { id: "hookHeadline", kind: "super", scene: "hook", text: "HOSTING OPEN PLAYS? GROUP CHAT CHAOS?", words: 6, start: 3, landed: 30, until: 120 },
  { id: "revealHeadline", kind: "super", scene: "reveal", text: "RELAX, HOST.", words: 2, start: 123, landed: 138, until: 236 },
  { id: "revealLockup", kind: "super", scene: "reveal", text: "Rallyo", words: 1, landed: 159, until: 236 },
  { id: "revealBadge", kind: "super", scene: "reveal", text: "PRE-LAUNCH", words: 1, landed: 180, until: 236 },
  { id: "rail01", kind: "rail", scene: "ch01", text: "01 · HOSTS", words: 2, landed: 273, until: 1020 },
  { id: "publishChip", kind: "chip", scene: "publish", text: "Who's in for Thursday?", words: 4, landed: 268, until: 345 },
  { id: "publishHeadline", kind: "super", scene: "publish", text: "ONE FORM, PUBLISHED.", words: 3, start: 277, landed: 290, until: 345 },
  { id: "shareChip", kind: "chip", scene: "share", text: "When? How much? Who's in?", words: 5, landed: 364, until: 450 },
  { id: "shareHeadline", kind: "super", scene: "share", text: "ONE POST, ANSWERS ALL.", words: 4, start: 373, landed: 388, until: 465 },
  { id: "approveChip", kind: "chip", scene: "approve", text: "Joining! Cash or GCash?", words: 4, landed: 477, until: 555 },
  { id: "approveHeadline", kind: "super", scene: "approve", text: "STRAIGHT TO YOU.", words: 3, start: 486, landed: 499, until: 555 },
  { id: "checkInChip", kind: "chip", scene: "checkIn", text: "How many are here??", words: 4, landed: 567, until: 633 },
  { id: "checkInHeadline", kind: "super", scene: "checkIn", text: "CHECK-IN BY CODE.", words: 3, start: 576, landed: 589, until: 645 },
  { id: "upNextHeadline", kind: "super", scene: "upNext", text: "UP NEXT, AUTOMATIC.", words: 3, start: 657, landed: 670, until: 750 },
  { id: "upNextSupport", kind: "super", scene: "upNext", text: "You send each match.", words: 4, start: 669, landed: 684, until: 750 },
  { id: "whoWonChip", kind: "chip", scene: "whoWon", text: "Who won last night?", words: 4, landed: 769, until: 855 },
  { id: "whoWonHeadline", kind: "super", scene: "whoWon", text: "CLEAR WINNERS.", words: 2, start: 778, landed: 789, until: 855 },
  { id: "tournamentChip", kind: "chip", scene: "tournament", text: "Where's the bracket?", words: 3, landed: 867, until: 987 },
  { id: "tournamentH1", kind: "super", scene: "tournament", text: "TOURNAMENT? AUTO-CALL ON.", words: 3, start: 876, landed: 889, until: 943 },
  { id: "tournamentH2", kind: "super", scene: "tournament", text: "WINNERS MOVE UP.", words: 3, start: 949, landed: 962, until: 1017 },
  { id: "rail02", kind: "rail", scene: "ch02", text: "02 · PLAYERS", words: 2, landed: 1053, until: 1536 },
  // Players chapter (spec section 3). Beat 4 has zero slack by construction: four supers fill 1325–1536 exactly.
  { id: "playersFindH1", kind: "super", scene: "playersFind", text: "FIND A GAME.", words: 3, start: 1041, landed: 1054, until: 1110 },
  { id: "playersJoinHeadline", kind: "super", scene: "playersJoin", text: "JOIN, PAY THE HOST.", words: 4, start: 1116, landed: 1131, until: 1200 },
  { id: "playersJoinSupport", kind: "super", scene: "playersJoin", text: "GCash or cash.", words: 3, start: 1128, landed: 1141, until: 1200 },
  { id: "playersIdHeadline", kind: "super", scene: "playersId", text: "NO APP. NO PASSWORD.", words: 4, start: 1206, landed: 1221, until: 1320 },
  { id: "playersIdSupport", kind: "super", scene: "playersId", text: "Player ID in about 20 seconds.", words: 6, start: 1216, landed: 1235, until: 1320 },
  { id: "playersUp", kind: "super", scene: "playersLive", text: "YOU'RE UP!", words: 2, start: 1325, landed: 1336, until: 1381 },
  { id: "playersRankHeadline", kind: "super", scene: "playersLive", text: "SEE WHERE YOU RANK.", words: 4, start: 1384, landed: 1399, until: 1463 },
  { id: "playersRankSupport", kind: "super", scene: "playersLive", text: "Rallyo ratings only.", words: 3, start: 1396, landed: 1409, until: 1463 },
  { id: "playersClose", kind: "super", scene: "playersLive", text: "FREE FOR PLAYERS.", words: 3, start: 1469, landed: 1482, until: 1536 },
  // S11 / S12: unchanged copy and local timing, +360.
  { id: "offerHero", kind: "super", scene: "offer", text: "FREE DURING PRE-LAUNCH.", words: 3, start: 1560, landed: 1569, until: 1695 },
  { id: "offerBadge", kind: "super", scene: "offer", text: "FOR HOSTS", words: 2, landed: 1575, until: 1695 },
  { id: "offerSupport", kind: "super", scene: "offer", text: "Open plays, tournaments, every feature.", words: 5, start: 1578, landed: 1595, until: 1695 },
  { id: "ctaUrl", kind: "super", scene: "cta", text: "rallyo.ph", words: 1, start: 1701, landed: 1710, until: 1860 },
  { id: "ctaHeadline", kind: "super", scene: "cta", text: "USE RALLYO WHILE IT'S FREE.", words: 5, start: 1698, landed: 1715, until: 1860 },
  { id: "ctaSupport", kind: "super", scene: "cta", text: "Website. No app needed.", words: 4, start: 1716, landed: 1731, until: 1860 },
];

export const superById = (id: string): SuperSpec => {
  const found = SUPERS.filter((s) => s.id === id)[0];
  if (!found) {
    throw new Error(`rallyo-timeline: unknown super ${id}`);
  }
  return found;
};

/** Co-landing static cards: all words, no extra margin, from the first landed layer (brief section 4). */
export const CUMULATIVE = [
  { id: "offer", supers: ["offerBadge", "offerHero", "offerSupport"], start: 1569, until: 1695, words: 10 },
  { id: "cta", supers: ["ctaHeadline", "ctaUrl", "ctaSupport"], start: 1710, until: 1860, words: 10 },
] as const;

/** Each chip lands ≥ 9 f before its headline's first word starts. */
export const CHIP_HEADLINE_PAIRS = [
  ["publishChip", "publishHeadline"],
  ["shareChip", "shareHeadline"],
  ["approveChip", "approveHeadline"],
  ["checkInChip", "checkInHeadline"],
  ["whoWonChip", "whoWonHeadline"],
  ["tournamentChip", "tournamentH1"],
] as const;

/**
 * Text layers on screen, [start, end) absolute (brief section 4 "Text layers"). Asserted: never more than
 * 3 at any frame outside TRANSITION_WINDOWS. The rail counts. The OSM credit is a legal attribution
 * (exempt from size and reading rules) but counts here. Declared hand-off exception (players spec section 3):
 * S10a h1 starts at 1041, 12 f before the CH02 type has become the rail (1053): flying type + h1 + credit = 3.
 */
export const LAYERS: readonly { readonly id: string; readonly start: number; readonly end: number }[] = [
  { id: "S1 headline", start: 3, end: 135 },
  { id: "S2 headline", start: 123, end: 240 },
  { id: "S2 lockup", start: 150, end: 240 },
  { id: "S2 badge", start: 171, end: 240 },
  { id: "CH01 type", start: 240, end: 273 },
  { id: "Rail 01", start: 273, end: 1020 },
  { id: "S3 chip", start: 258, end: 354 },
  { id: "S3 headline", start: 277, end: 354 },
  { id: "S4 chip", start: 354, end: 480 },
  { id: "S4 headline", start: 373, end: 480 },
  { id: "S5 chip", start: 467, end: 570 },
  { id: "S5 headline", start: 486, end: 570 },
  { id: "S6 chip", start: 557, end: 660 },
  { id: "S6 headline", start: 576, end: 660 },
  { id: "S7 headline", start: 657, end: 765 },
  { id: "S7 support", start: 669, end: 765 },
  { id: "S8 chip", start: 759, end: 870 },
  { id: "S8 headline", start: 778, end: 870 },
  { id: "S9 chip", start: 857, end: 1020 },
  { id: "S9 h1", start: 876, end: 949 },
  { id: "S9 h2", start: 949, end: 1020 },
  { id: "CH02 type", start: 1020, end: 1053 },
  { id: "Rail 02", start: 1053, end: 1542 },
  { id: "S10a OSM credit", start: 1044, end: 1125 }, // draft v5: fades in 1044–1050, y 524–552 above the stage
  { id: "S10a h1", start: 1041, end: 1125 },
  { id: "S10b headline", start: 1116, end: 1215 },
  { id: "S10b support", start: 1128, end: 1215 },
  { id: "S10c headline", start: 1206, end: 1335 },
  { id: "S10c support", start: 1216, end: 1335 },
  { id: "S10d YOU'RE UP!", start: 1325, end: 1387 },
  { id: "S10d rank headline", start: 1384, end: 1469 },
  { id: "S10d rank support", start: 1396, end: 1469 },
  { id: "S10d close", start: 1469, end: 1542 },
  { id: "S11 hero", start: 1560, end: 1710 },
  { id: "S11 badge", start: 1566, end: 1710 },
  { id: "S11 support", start: 1578, end: 1710 },
  { id: "S12 headline", start: 1698, end: 1860 },
  { id: "S12 URL", start: 1701, end: 1860 },
  { id: "S12 support", start: 1716, end: 1860 },
];

export const MAX_TEXT_LAYERS = 3;

/** Text layers visible at an absolute frame (ids). */
export const layersAt = (frame: number): string[] => LAYERS.filter((l) => frame >= l.start && frame < l.end).map((l) => l.id);

/** Big effects (brief 5.8): ≤ 2 starts in any sliding 300 f window, except the declared opening burst (< 360). */
export const BIG_EFFECTS = [
  { id: "circleReveal (drop)", start: 120 },
  { id: "CH01 ChapterWipe", start: 228 },
  { id: "zoomThrough", start: 345 },
  { id: "whip", start: 645 },
  { id: "CH02 ChapterWipe", start: 1008 },
  { id: "whip S10c → S10d", start: 1320 },
  { id: "zoom into lime + limeFlood", start: 1536 },
] as const;

// ---------------------------------------------------------------------------------------------
// SFX (brief 7.5). Files: public/rallyo/sfx/*.wav (paths come from props.sfx, keyed by sound id).
// Tick family (tick.wav): strikeTick, blip, boxTick, ringTick, tileTick, pulseTick.
// Hit family (hit.wav): logoHit, impact, thump, slam. whoosh = whoosh-1.wav (peak ≈ 8–9 f),
// whooshLong = whoosh-2.wav (peak ≈ 11–12 f). Riser: trimBefore 21 + 45 f puts its peak 45 f after the cue.
// ---------------------------------------------------------------------------------------------

export const SFX_SOUNDS = [
  "pop",
  "riser",
  "whoosh",
  "whooshLong",
  "logoHit",
  "shimmer",
  "tap",
  "whip",
  "sendPop",
  "swish",
  "strikeTick",
  "ringPing",
  "swipe",
  "marker",
  "boxTick",
  "click",
  "highlighter",
  "thump",
  "rustle",
  "ringTick",
  "scrollSwish",
  "blip",
  "connector",
  "ding",
  "swell",
  "slam",
  "impact",
  "pulseTick",
  "tileTick",
] as const;
export type SfxSound = (typeof SFX_SOUNDS)[number];

export type SfxCue = {
  /** Absolute start frame (multiple of 3). */
  readonly at: number;
  readonly sound: SfxSound;
  readonly volume: number;
  /** Optional cut length for ranged cues (riser 45, rustle 24, scroll swish 15). */
  readonly frames?: number;
  /** Frames trimmed from the file start (riser: 21, so its 2.22 s peak lands 45 f after the cue). */
  readonly trimBefore?: number;
  readonly note: string;
};

const cue = (at: number, sound: SfxSound, volume: number, note: string, frames?: number, trimBefore?: number): SfxCue => ({
  at,
  sound,
  volume,
  note,
  ...(frames === undefined ? {} : { frames }),
  ...(trimBefore === undefined ? {} : { trimBefore }),
});

const RISER = 45;
const RISER_TRIM = 21;

/**
 * All SFX cues of brief 7.5, in frame order. Draft v3: 104 (it added the 1440, now 1800, impact; accuracy #15).
 * Round 4 (players spec section 7): − 8 old S10 cues + 26 players-chapter cues, S11 / S12 + 360 = 122. Draft v4
 * (v3 accuracy #12): + pops on the paired bubbles at 69 and 81 = 124; (v3 accuracy #11) + a ding under the 1020
 * slam = 125.
 */
export const sfxCues = (): SfxCue[] => {
  const cues: SfxCue[] = [
    // S1 hook
    ...[9, 15, 21, 27, 33, 39, 45, 51, 57, 63].map((at) => cue(at, "pop", 0.3, "S1 bubble pop")),
    ...[66, 72, 78, 84].map((at) => cue(at, "pop", 0.25, "S1 bubble pop (every other)")),
    // Draft v4 (v3 accuracy #12): 69 and 81 pop two bubbles at once and had no sound of their own.
    ...[69, 81].map((at) => cue(at, "pop", 0.2, "S1 paired bubble pop")),
    cue(75, "riser", 0.25, "S1 riser 75-120 (peak on the drop; #3 has no riser)", RISER, RISER_TRIM),
    cue(105, "strikeTick", 0.3, "S1 lime strike (doubles the track's pickup hit)"),
    cue(111, "whoosh", 0.4, "circleReveal pre-roll (peaks ≈ 120 on the drop)"),
    // S2 brand drop + CH01
    cue(150, "logoHit", 0.35, "S2 lockup slam"),
    cue(180, "shimmer", 0.2, "S2 PRE-LAUNCH lands, shine"),
    cue(195, "riser", 0.25, "riser into CH01 (peak ≈ 240)", RISER, RISER_TRIM),
    cue(228, "whooshLong", 0.35, "CH01 panel rise (peaks ≈ 240 with full cover)"),
    cue(240, "impact", 0.45, "CH01 `01` slam on bar 4"),
    cue(258, "swipe", 0.2, "CH01 collapse into the rail"),
    // S3 publish
    ...[270, 285, 300].map((at) => cue(at, "blip", 0.2, "S3 spotlight hop")),
    cue(276, "pop", 0.15, "rail dot 1"),
    cue(306, "scrollSwish", 0.3, "S3 scroll whip", 15),
    cue(330, "tap", 0.4, "S3 tap Publish"),
    cue(333, "strikeTick", 0.3, "S3 chip strike"),
    cue(345, "whooshLong", 0.4, "zoomThrough (peaks ≈ 357)"),
    // S4 share
    cue(375, "tap", 0.4, "S4 tap Share"),
    cue(378, "swipe", 0.3, "S4 swipe to the chat"),
    cue(390, "sendPop", 0.35, "S4 post pops"),
    ...[405, 420, 435].map((at) => cue(at, "marker", 0.2, "S4 answer underline")),
    cue(438, "strikeTick", 0.3, "S4 chip strike"),
    cue(450, "swish", 0.2, "S4 URL underline"),
    cue(456, "whoosh", 0.35, "slide pre-roll (peaks ≈ 465)"),
    // S5 approve
    cue(495, "tap", 0.4, "S5 tap Review"),
    cue(498, "swipe", 0.25, "S5 payment sheet slides up"),
    cue(519, "highlighter", 0.15, "S5 highlighter"),
    cue(540, "tap", 0.4, "S5 tap Approve"),
    cue(543, "strikeTick", 0.3, "S5 chip strike"),
    cue(546, "whoosh", 0.35, "wipe pre-roll (peaks ≈ 555)"),
    // S6 check-in
    cue(567, "ringPing", 0.2, "S6 ring 40 of 42"),
    cue(582, "swish", 0.15, "S6 camera B"),
    cue(585, "whoosh", 0.2, "S6 tile flies in (peaks ≈ 594)"),
    cue(603, "connector", 0.2, "S6 connector"),
    cue(615, "tap", 0.4, "S6 tap Check in"),
    cue(621, "strikeTick", 0.3, "S6 chip strike"),
    cue(633, "whooshLong", 0.4, "whip pre-roll (peaks ≈ 645)"),
    // S7 up next
    cue(657, "swipe", 0.2, "S7 phone exits"),
    cue(678, "boxTick", 0.2, "S7 box"),
    cue(690, "ringTick", 0.2, "S7 ring Next court"),
    cue(705, "click", 0.4, "S7 click Play"),
    cue(711, "swish", 0.15, "S7 camera to Court 1"),
    cue(750, "whoosh", 0.3, "pushCut (peaks ≈ 758-759 with the cut)"),
    cue(759, "impact", 0.3, "pushCut lime flash"),
    // S8 who won
    cue(765, "tap", 0.4, "S8 tap card"),
    cue(795, "tap", 0.4, "S8 tap Mark as game over"),
    cue(804, "highlighter", 0.15, "S8 highlighter"),
    cue(819, "swipe", 0.25, "S8 swipe to podium"),
    cue(840, "thump", 0.35, "S8 podium lands"),
    cue(840, "rustle", 0.15, "S8 confetti", 24),
    cue(843, "strikeTick", 0.3, "S8 chip strike"),
    cue(846, "whoosh", 0.35, "slide pre-roll (peaks ≈ 855)"),
    // S9 tournament + CH02
    cue(900, "ringTick", 0.2, "S9 ring Auto-call"),
    cue(915, "swipe", 0.25, "S9 bracket swipe"),
    cue(936, "boxTick", 0.2, "S9 QF box"),
    cue(945, "connector", 0.25, "S9 connector"),
    cue(960, "ding", 0.35, "S9 winners move up"),
    cue(963, "ringTick", 0.2, "S9 box SF slot"),
    cue(975, "strikeTick", 0.3, "S9 chip strike"),
    cue(975, "riser", 0.25, "riser into CH02 (peak ≈ 1020)", RISER, RISER_TRIM),
    cue(1008, "whooshLong", 0.35, "CH02 panel rise (peaks ≈ 1020)"),
    // Draft v4 (v3 accuracy #11): the 1020 slam sat at groove level by RMS. It now uses FREE's recipe (hit + ding):
    // impact .45 → .50 + ding .40. Offline mix of the 62 s edit + all cues: 1021 RMS −11.3 → −10.9 dB, 400 ms
    // momentary −13.8 → −13.4 LUFS, sample peak −2.1 → −1.8 dBFS (still the reel's maximum), TP −1.8 dBTP before AAC.
    cue(1020, "impact", 0.5, "CH02 `02` slam on bar 17"),
    cue(1020, "ding", 0.4, "CH02 `02` slam ding (FREE's hit + ding recipe)"),
    cue(1038, "swipe", 0.2, "CH02 collapse into the rail"),
    // S10a find a game (players spec section 4 / 7)
    cue(1056, "pop", 0.15, "rail 02 dot 1"),
    ...[1062, 1065].map((at) => cue(at, "blip", 0.15, "S10a pin pulse (Carmen, Tagum)")),
    cue(1071, "swipe", 0.25, "S10a map → preview"),
    cue(1095, "tap", 0.4, "S10a tap Request to join"),
    cue(1101, "whoosh", 0.35, "slide pre-roll (peaks ≈ 1110)"),
    // S10b join + pay the host
    cue(1134, "highlighter", 0.15, "S10b cash note"),
    cue(1155, "swipe", 0.25, "S10b swipe to the GCash receipt"),
    cue(1176, "ringTick", 0.2, "S10b ring GCash"),
    cue(1185, "marker", 0.2, "S10b underline Confirmed by host"),
    cue(1191, "whoosh", 0.35, "wipe pre-roll (peaks ≈ 1200)"),
    // S10c Player ID
    cue(1224, "highlighter", 0.15, "S10c Takes about 20 seconds."),
    cue(1245, "tap", 0.4, "S10c tap Create a Player ID"),
    cue(1248, "swipe", 0.25, "S10c almost-in sheet rises"),
    cue(1269, "highlighter", 0.15, "S10c No password, no app."),
    cue(1281, "swipe", 0.25, "S10c swipe to the Player ID card"),
    cue(1302, "ringPing", 0.2, "S10c ring 4.84 RATING"),
    cue(1308, "whooshLong", 0.4, "whip pre-roll (peaks ≈ 1320)"),
    // S10d live + results + close
    cue(1335, "shimmer", 0.2, "S10d YOU'RE UP! lands"),
    cue(1380, "swipe", 0.25, "S10d swipe to the standings"),
    cue(1401, "boxTick", 0.2, "S10d box RALLYO ONLY"),
    cue(1407, "blip", 0.15, "S10d row 1 flash"),
    cue(1419, "swipe", 0.25, "S10d swipe to the podium (bass fill)"),
    cue(1440, "thump", 0.35, "S10d podium lands (bar 24, section B)"),
    cue(1440, "rustle", 0.15, "S10d confetti", 24),
    cue(1500, "riser", 0.35, "riser into the drop-out (peak ≈ 1545)", RISER, RISER_TRIM),
    // S11 offer (+360)
    cue(1560, "slam", 0.45, "S11 FREE slam (C downbeat)"),
    cue(1560, "ding", 0.35, "S11 FREE ding"),
    cue(1563, "swish", 0.2, "S11 fan rises"),
    cue(1566, "boxTick", 0.2, "S11 badge"),
    ...[1605, 1620, 1635, 1650, 1665].map((at) => cue(at, "tileTick", 0.1, "S11 fan outline flash")),
    cue(1620, "shimmer", 0.2, "S11 shine across FREE"),
    cue(1686, "whoosh", 0.4, "slide pre-roll (peaks ≈ 1695)"),
    // S12 CTA (+360)
    cue(1698, "ringPing", 0.25, "S12 logo ring"),
    cue(1710, "impact", 0.4, "S12 rallyo.ph landed"),
    cue(1740, "shimmer", 0.2, "S12 shine across rallyo.ph"),
    cue(1800, "pulseTick", 0.2, "S12 button ending (track's last downbeat)"),
    cue(1800, "swish", 0.2, "S12 underline slam"),
    // Draft v3 (accuracy #15): the track's last downbeat is no louder than a groove kick, so the button ending did not
    // read as one of the five loudest moments. hit.wav at .40 lifts its peak frame by ≈ 2 dB with TP ≤ −1.5 dBTP.
    cue(1800, "impact", 0.4, "S12 button ending thump (final downbeat)"),
  ];
  return cues.sort((a, b) => a.at - b.at);
};

export const SFX_CUES: readonly SfxCue[] = sfxCues();
export const SFX_CUE_COUNT = 125;

// ---------------------------------------------------------------------------------------------
// Assertions (import time). A failure here means the timeline drifted from the brief.
// ---------------------------------------------------------------------------------------------

const fail = (msg: string): never => {
  throw new Error(`rallyo-timeline: ${msg}`);
};

const assertTimeline = (): void => {
  // Frame arithmetic: Σ 2040 − Σ 180 = 1860 (players spec section 1).
  const sumScenes = SCENES.reduce((acc, s) => acc + s.frames, 0);
  const sumTransitions = SCENES.reduce((acc, s) => acc + s.out.frames, 0);
  if (sumScenes !== 2040) {
    fail(`Σ scene frames = ${sumScenes}, brief says 2040`);
  }
  if (sumTransitions !== 180) {
    fail(`Σ transition frames = ${sumTransitions}, brief says 180`);
  }
  if (sumScenes - sumTransitions !== TOTAL_FRAMES) {
    fail(`Σscenes − Σtransitions = ${sumScenes - sumTransitions}, must be ${TOTAL_FRAMES}`);
  }
  if (SCENES.length !== SCENE_STARTS.length) {
    fail(`${SCENES.length} scenes, brief table has ${SCENE_STARTS.length}`);
  }
  const last = SCENES[SCENES.length - 1];
  if (last.end !== TOTAL_FRAMES || last.out.type !== "none") {
    fail(`last scene ends at ${last.end} (${last.out.type}), must end at ${TOTAL_FRAMES} and hold`);
  }
  SCENES.forEach((s, i) => {
    if (s.start !== SCENE_STARTS[i]) {
      fail(`${s.id} starts at ${s.start}, brief table says ${SCENE_STARTS[i]}`);
    }
    if (s.frames % 3 !== 0 || s.frames % BEAT !== 0) {
      fail(`${s.id} length ${s.frames} is not a multiple of 15 (and 3)`);
    }
    if (s.start % BEAT !== 0) {
      fail(`${s.id} starts at ${s.start}, off the 15 f boundary`);
    }
    if (i < SCENES.length - 1 && s.out.frames !== 0 && s.out.frames !== TRANSITION_FRAMES) {
      fail(`${s.id} transition is ${s.out.frames} f, must be 0 or ${TRANSITION_FRAMES}`);
    }
    if (i < SCENES.length - 1 && s.out.type === "none") {
      fail(`${s.id} has no transition out but is not the last scene`);
    }
  });
  // Every transition starts and ends on a 15 f boundary.
  const expectedWindows = [120, 345, 465, 555, 645, 750, 855, 1110, 1200, 1320, 1545, 1695];
  if (TRANSITION_WINDOWS.length !== expectedWindows.length) {
    fail(`${TRANSITION_WINDOWS.length} transition windows, brief says ${expectedWindows.length}`);
  }
  TRANSITION_WINDOWS.forEach((w, i) => {
    if (w.start !== expectedWindows[i]) {
      fail(`transition window ${i} starts at ${w.start}, brief says ${expectedWindows[i]}`);
    }
    if (w.start % BEAT !== 0 || w.end % BEAT !== 0) {
      fail(`transition ${w.start}-${w.end} is off the 15 f boundary`);
    }
  });
  if (SCENE.reveal.out.type !== "cut" || SCENE.tournament.out.type !== "cut") {
    fail("S2 → S3 and S9 → S10a must be hard cuts under the ChapterWipe overlays");
  }
  const otherCuts = SCENES.filter((s) => s.id !== "reveal" && s.id !== "tournament" && s.id !== "cta" && s.out.type === "cut");
  if (otherCuts.length > 0) {
    fail(`only S2 and S9 may hard-cut; ${otherCuts.map((s) => s.id).join(", ")} also do`);
  }
  // Music landmarks on the grid.
  [DROP, OVERLAYS.ch01.cover, OVERLAYS.ch02.cover, SLAM, BUTTON].forEach((f) => {
    if (!isOnBar(f)) {
      fail(`landmark ${f} is not on a bar line`);
    }
  });
  if (
    DROPOUT[1] !== SLAM ||
    DROPOUT[1] - DROPOUT[0] !== BEAT ||
    SCENE.offer.start !== DROPOUT[0] ||
    SCENE.playersLive.out.type !== "limeFlood" ||
    SCENE.playersLive.end !== SLAM
  ) {
    fail(`drop-out ${DROPOUT[0]}-${DROPOUT[1]} must be the beat before the slam and the limeFlood window`);
  }
  if (SLAM !== 1560 || BUTTON !== 1800 || BUTTON !== TOTAL_FRAMES - 2 * FPS) {
    fail(`slam ${SLAM} / button ${BUTTON}: round 4 puts FREE on 1560 and the final hit 2 s before the end (1800)`);
  }
  // The 62 s edit file: 2 976 000 samples at 48 kHz = exactly TOTAL_FRAMES; A then silence then C, contiguous.
  if (MUSIC_EDIT.samples !== (TOTAL_FRAMES / FPS) * MUSIC_EDIT.sampleRate) {
    fail(`music edit has ${MUSIC_EDIT.samples} samples, the reel needs ${(TOTAL_FRAMES / FPS) * MUSIC_EDIT.sampleRate}`);
  }
  if (MUSIC_EDIT.partA.end !== MUSIC_EDIT.dropout[0] || MUSIC_EDIT.partC.start !== MUSIC_EDIT.dropout[1] || MUSIC_EDIT.partC.end !== TOTAL_FRAMES) {
    fail("music edit parts must run A | drop-out | C to the last frame");
  }
  // C enters on source 100.00 s (section D) and the final hit (108.00 s) lands on the button; the seam is whole bars.
  if (trackSecondsAt(SLAM) !== 100 || trackSecondsAt(BUTTON) !== 108 || trackSecondsAt(DROP) !== 8) {
    fail(`trackSecondsAt: drop ${trackSecondsAt(DROP)} s, slam ${trackSecondsAt(SLAM)} s, button ${trackSecondsAt(BUTTON)} s (need 8 / 100 / 108)`);
  }
  if ((MUSIC_EDIT.partC.sourceOffsetSeconds - MUSIC_EDIT.partA.sourceOffsetSeconds) % 2 !== 0) {
    fail("the A → C seam must jump whole bars (2 s per bar)");
  }
  // Overlays: full cover on the bar, hand-off 45 f after the start, rails continuous.
  [OVERLAYS.ch01, OVERLAYS.ch02].forEach((o) => {
    if (o.start + CHAPTER_WIPE_LOCAL.cover !== o.cover || o.start + CHAPTER_WIPE_LOCAL.handoff !== o.handoff) {
      fail(`ChapterWipe at ${o.start}: cover/hand-off out of sync with its local frames`);
    }
    if (o.start % 3 !== 0 || o.frames % 3 !== 0) {
      fail(`ChapterWipe at ${o.start} is off the 3 f grid`);
    }
  });
  if (OVERLAYS.ch01.cover !== SCENE.publish.start || OVERLAYS.ch02.cover !== SCENE.playersFind.start) {
    fail("the chapter covers must sit on the hard cuts (240, 1020)");
  }
  if (OVERLAYS.rail01.start !== OVERLAYS.ch01.handoff || OVERLAYS.rail02.start !== OVERLAYS.ch02.handoff) {
    fail("each rail must start on its chapter hand-off");
  }
  if (OVERLAYS.rail01.end !== OVERLAYS.ch02.cover) {
    fail("rail 01 must unmount under CH02 full cover (1020)");
  }
  OVERLAYS.rail01.dots.forEach((d) => {
    if (d % 3 !== 0 || d < OVERLAYS.rail01.start || d >= OVERLAYS.rail01.end) {
      fail(`rail 01 dot at ${d} is off grid or outside the rail`);
    }
  });
  OVERLAYS.rail02.dots.forEach((d) => {
    if (d % 3 !== 0 || d < OVERLAYS.rail02.start || d >= OVERLAYS.rail02.fadeOut[0]) {
      fail(`rail 02 dot at ${d} is off grid or outside the rail`);
    }
  });
  // Rail 02: one dot per players beat, on each arrival after the first (S10a's dot is hand-off + 3).
  const beatStarts = [SCENE.playersJoin.start, SCENE.playersId.start, SCENE.playersLive.start];
  if (OVERLAYS.rail02.dots[0] !== OVERLAYS.ch02.handoff + 3 || beatStarts.some((b, i) => OVERLAYS.rail02.dots[i + 1] !== b)) {
    fail(`rail 02 dots ${OVERLAYS.rail02.dots.join(", ")} must be the hand-off + 3 and the S10b / S10c / S10d arrivals`);
  }
  // Rail 02 retracts with the closing line, before the zoom into lime, and is gone before the lime is solid.
  if (
    OVERLAYS.rail02.fadeOut[0] !== superById("playersClose").until ||
    OVERLAYS.rail02.fadeOut[1] !== OVERLAYS.rail02.end ||
    OVERLAYS.rail02.end > SCENE.offer.start ||
    superById("rail02").until !== OVERLAYS.rail02.fadeOut[0]
  ) {
    fail("rail 02 must retract 1536–1542 with FREE FOR PLAYERS. and be gone before the solid lime (1545)");
  }
  [OVERLAYS.rail01.rect, OVERLAYS.rail02.rect].forEach((r) => {
    if (r.w > 480 || r.x + r.w > 552) {
      fail(`rail width ${r.w} exceeds 480 (RAIL_BAND x 72-552)`);
    }
  });
  // Chip strikes (brief section 9).
  const strikes = { publish: 333, share: 438, approve: 543, checkIn: 621, whoWon: 843, tournament: 975 };
  (Object.keys(strikes) as (keyof typeof strikes)[]).forEach((k) => {
    if (CHIP_STRIKES[k] !== strikes[k]) {
      fail(`${k} chip strike at ${CHIP_STRIKES[k]}, brief says ${strikes[k]}`);
    }
  });
  // Reading time: every super holds reading + 9 f.
  SUPERS.forEach((s) => {
    if (countWords(s.text) !== s.words) {
      fail(`${s.id}: "${s.text}" has ${countWords(s.text)} words, table says ${s.words}`);
    }
    const onScreen = s.until - s.landed;
    const need = readingNeed(s.words);
    if (onScreen < need) {
      fail(`${s.id} is readable ${onScreen} f (${s.landed}-${s.until}), needs ${need} f (${s.words} words + ${READING_MARGIN} f)`);
    }
    if (s.start !== undefined && s.start > s.landed) {
      fail(`${s.id} starts after it lands`);
    }
  });
  // Chips: until = strike + 12.
  const chipStrike: Record<string, number> = {
    publishChip: CHIP_STRIKES.publish,
    shareChip: CHIP_STRIKES.share,
    approveChip: CHIP_STRIKES.approve,
    checkInChip: CHIP_STRIKES.checkIn,
    whoWonChip: CHIP_STRIKES.whoWon,
    tournamentChip: CHIP_STRIKES.tournament,
  };
  SUPERS.filter((s) => s.kind === "chip").forEach((s) => {
    if (s.until !== chipStrike[s.id] + 12) {
      fail(`${s.id} until ${s.until}, must be its strike (${chipStrike[s.id]}) + 12`);
    }
  });
  // Cumulative checks (no margin).
  CUMULATIVE.forEach((c) => {
    const parts = c.supers.map(superById);
    const words = parts.reduce((acc, p) => acc + p.words, 0);
    const start = Math.min(...parts.map((p) => p.landed));
    const until = Math.min(...parts.map((p) => p.until));
    if (words !== c.words || start !== c.start || until !== c.until) {
      fail(`cumulative ${c.id}: ${words} words ${start}-${until}, table says ${c.words} words ${c.start}-${c.until}`);
    }
    if (until - start < readingFrames(words)) {
      fail(`cumulative ${c.id} holds ${until - start} f, needs ${readingFrames(words)} f`);
    }
  });
  // Each chip lands ≥ 9 f before its headline's first word.
  CHIP_HEADLINE_PAIRS.forEach(([chipId, headId]) => {
    const chip = superById(chipId);
    const head = superById(headId);
    if (head.start === undefined || chip.landed + READING_MARGIN > head.start) {
      fail(`${chipId} lands ${chip.landed}, must be ≥ 9 f before ${headId} starts (${head.start ?? "?"})`);
    }
  });
  // CH01 hand-off: the S3 headline starts only after the type has become the rail. S10a h1 (1041) is the declared
  // exception, and it may start no earlier than the CH02 collapse (1038).
  if ((superById("publishHeadline").start ?? 0) < OVERLAYS.ch01.handoff) {
    fail("S3 headline starts before the CH01 type has become the rail");
  }
  if ((superById("playersFindH1").start ?? 0) < OVERLAYS.ch02.collapse[0]) {
    fail("S10a h1 starts before the CH02 panel collapses (1038)");
  }
  // ≤ 3 text layers outside the transition windows.
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    if (inTransitionWindow(f)) {
      continue;
    }
    const on = layersAt(f);
    if (on.length > MAX_TEXT_LAYERS) {
      fail(`${on.length} text layers at f${f}: ${on.join(", ")}`);
    }
  }
  // Big-effect budget (sliding 300 f), declared exception: the opening burst before 360.
  BIG_EFFECTS.forEach((e) => {
    const inWindow = BIG_EFFECTS.filter((o) => o.start >= e.start && o.start < e.start + 300).length;
    if (inWindow > 2 && e.start >= 360) {
      fail(`${inWindow} big effects in the 300 f window from ${e.start}`);
    }
  });
  // SFX: SFX_CUE_COUNT cues, 3 f grid, known ids, nothing inside the drop-out (1545–1559), inside the reel.
  if (SFX_CUES.length !== SFX_CUE_COUNT) {
    fail(`${SFX_CUES.length} SFX cues, brief 7.5 lists ${SFX_CUE_COUNT}`);
  }
  const known = new Set<string>(SFX_SOUNDS);
  SFX_CUES.forEach((c) => {
    if (c.at % 3 !== 0 || (c.frames ?? 0) % 3 !== 0 || (c.trimBefore ?? 0) % 3 !== 0) {
      fail(`SFX ${c.sound} at ${c.at} (${c.frames ?? 0} f, trim ${c.trimBefore ?? 0}) is not on the 3 f grid`);
    }
    if (!known.has(c.sound)) {
      fail(`SFX id ${c.sound} is not in SFX_SOUNDS`);
    }
    if (c.at < 0 || c.at >= TOTAL_FRAMES) {
      fail(`SFX ${c.sound} at ${c.at} is outside the reel`);
    }
    if (c.at >= DROPOUT[0] && c.at < DROPOUT[1]) {
      fail(`SFX ${c.sound} at ${c.at} sits inside the drop-out`);
    }
    if (c.frames !== undefined && c.at < DROPOUT[0] && c.at + c.frames > DROPOUT[0]) {
      fail(`SFX ${c.sound} at ${c.at} (${c.frames} f) runs into the drop-out`);
    }
  });
  if (LANDMARKS.urlLanded !== superById("ctaUrl").landed || LANDMARKS.hookHeadlineLanded !== superById("hookHeadline").landed) {
    fail("LANDMARKS out of sync with SUPERS");
  }
};

assertTimeline();

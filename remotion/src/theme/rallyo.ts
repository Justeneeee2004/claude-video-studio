import type React from "react";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/**
 * Rallyo brand tokens + local font loading (brief section 3 "Brand" row, section 5 layout grid).
 * Per-video colors still flow through props (`rallyoSchema.colors`); these are the defaults.
 */
export const RALLYO_COLORS = {
  // brief section 3
  night: "#0B130D",
  nightCard: "#111B14",
  nightRaised: "#16241A",
  court: "#24432F",
  lime: "#C8F23A",
  limeHover: "#DFFF6E",
  limeTint: "#E3F3A6",
  paper: "#EEEFE8",
  ink: "#121812",
  fg: "#EEF1EA",
  fg2: "#C3CBC1",
  dangerSoft: "#F28B7A",
  // brief section 5 (chaos chip, GC chat, post bubble)
  graphite: "#3A423B",
  graphiteBubble: "#2A302B",
  senderGrey: "#8E988F",
  oliveInk: "#3F5A0A",
} as const;

export type RallyoColorKey = keyof typeof RALLYO_COLORS;
export type RallyoColors = { readonly [K in RallyoColorKey]: string };

/** Caption plate / scrim fills (night at 85%). */
export const NIGHT_85 = "rgba(11, 19, 13, 0.85)";

/** CSS font-family names registered below (same names the site uses). */
export const RALLYO_FONTS = {
  /** Archivo variable: weight 100-900, wdth 62-125%, roman + italic, latin + latin-ext (₱). */
  display: "Archivo",
  /** Satoshi 500 / 700 / 900 only (browser maps 400→500, 600→700, 800→900). */
  ui: "Satoshi",
} as const;

/** Type scale from brief section 5 (px at 1080 base). */
export const RALLYO_TYPE = {
  chip: 44,
  headline: 88,
  hookHeadlineMin: 88,
  captions: 60,
  labelPill: 48,
  kickerBadge: 44,
  offerHero: 180,
  offerSub: 132,
  ctaVisit: 96,
  ctaUrlMax: 160,
  ctaSupport: 48,
  wordmark: 112,
} as const;

// Google Fonts' subset ranges (copied from DinkyPickle apps/web/src/styles/fonts.css).
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF";

type FaceSpec = {
  readonly family: string;
  readonly file: string;
  readonly descriptors: FontFaceDescriptors;
};

const FACES: readonly FaceSpec[] = [
  {
    family: RALLYO_FONTS.display,
    file: "rallyo/fonts/Archivo-latin.woff2",
    descriptors: { weight: "100 900", stretch: "62% 125%", style: "normal", unicodeRange: LATIN },
  },
  {
    family: RALLYO_FONTS.display,
    file: "rallyo/fonts/Archivo-latin-ext.woff2",
    descriptors: { weight: "100 900", stretch: "62% 125%", style: "normal", unicodeRange: LATIN_EXT },
  },
  {
    family: RALLYO_FONTS.display,
    file: "rallyo/fonts/Archivo-Italic-latin.woff2",
    descriptors: { weight: "100 900", stretch: "62% 125%", style: "italic", unicodeRange: LATIN },
  },
  {
    family: RALLYO_FONTS.display,
    file: "rallyo/fonts/Archivo-Italic-latin-ext.woff2",
    descriptors: { weight: "100 900", stretch: "62% 125%", style: "italic", unicodeRange: LATIN_EXT },
  },
  {
    family: RALLYO_FONTS.ui,
    file: "rallyo/fonts/Satoshi-Medium.woff2",
    descriptors: { weight: "500", style: "normal" },
  },
  {
    family: RALLYO_FONTS.ui,
    file: "rallyo/fonts/Satoshi-Bold.woff2",
    descriptors: { weight: "700", style: "normal" },
  },
  {
    family: RALLYO_FONTS.ui,
    file: "rallyo/fonts/Satoshi-Black.woff2",
    descriptors: { weight: "900", style: "normal" },
  },
];

let fontsReady: Promise<void> | null = null;
let fontsLoaded = false;

/**
 * Registers every Rallyo face with the FontFace API and blocks rendering until all are loaded.
 * `load()` is called explicitly on every face (latin-ext included), so ₱ never falls back.
 * Runs once per bundle at import time; safe to call again (returns the same promise).
 */
export const loadRallyoFonts = (): Promise<void> => {
  if (fontsReady) {
    return fontsReady;
  }
  if (typeof document === "undefined" || typeof FontFace === "undefined") {
    fontsReady = Promise.resolve();
    return fontsReady;
  }
  const handle = delayRender("Loading Rallyo fonts (Archivo + Satoshi)");
  fontsReady = Promise.all(
    FACES.map((face) => {
      const fontFace = new FontFace(
        face.family,
        `url("${staticFile(face.file)}") format("woff2")`,
        face.descriptors,
      );
      return fontFace.load().then((loaded) => {
        document.fonts.add(loaded);
      });
    }),
  )
    .then(() => {
      fontsLoaded = true;
      continueRender(handle);
    })
    .catch((err: unknown) => {
      cancelRender(err instanceof Error ? err : new Error(String(err)));
    });
  return fontsReady;
};

loadRallyoFonts();

/** Await before measureText()/fitText() with the Rallyo families (scripts, calculateMetadata). */
export const waitForRallyoFonts = (): Promise<void> => loadRallyoFonts();

/** True once every Rallyo face is loaded. */
export const rallyoFontsLoaded = (): boolean => fontsLoaded;

/**
 * Gate for measureText() / fitText() inside components. @remotion/layout-utils CACHES results,
 * so a measurement taken before the faces load is wrong for the rest of the session.
 * Returns false until the fonts are loaded and holds its own delayRender until the component has
 * re-rendered with `true`, so the frame is never captured with unmeasured layout.
 *   const ready = useRallyoFontsReady();
 *   const size = ready ? fitText({...}).fontSize : 88;
 */
export const useRallyoFontsReady = (): boolean => {
  const [ready, setReady] = useState(fontsLoaded);
  const [handle] = useState(() => (fontsLoaded ? null : delayRender("Rallyo fonts: measure after load")));
  useEffect(() => {
    if (handle === null) {
      return;
    }
    if (ready) {
      continueRender(handle);
      return;
    }
    let alive = true;
    loadRallyoFonts().then(() => {
      if (alive) {
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [ready, handle]);
  useEffect(
    () => () => {
      if (handle !== null) {
        continueRender(handle);
      }
    },
    [handle],
  );
  return ready;
};

type TextOpts = {
  readonly size?: number;
  readonly color?: string;
  readonly lineHeight?: number;
};

/**
 * Display style: Archivo 900 italic UPPERCASE, font-stretch 70% (headlines, hook, offer hero, chapter cards).
 * Spread into a style object, then add position / animation inline at the call site.
 */
export const displayText = ({
  size = RALLYO_TYPE.headline,
  color = RALLYO_COLORS.fg,
  lineHeight = 0.92,
}: TextOpts = {}): React.CSSProperties => ({
  fontFamily: RALLYO_FONTS.display,
  fontWeight: 900,
  fontStyle: "italic",
  fontStretch: "70%",
  textTransform: "uppercase",
  fontSize: size,
  lineHeight,
  color,
  letterSpacing: 0,
  margin: 0,
});

/** Live wordmark / rallyo.ph: Archivo 900 italic, normal width, NOT uppercase, tracking -.02em. */
export const wordmarkText = ({
  size = RALLYO_TYPE.wordmark,
  color = RALLYO_COLORS.lime,
  lineHeight = 1,
}: TextOpts = {}): React.CSSProperties => ({
  fontFamily: RALLYO_FONTS.display,
  fontWeight: 900,
  fontStyle: "italic",
  fontStretch: "100%",
  textTransform: "none",
  fontSize: size,
  lineHeight,
  color,
  letterSpacing: "-0.02em",
  margin: 0,
});

/** UI text: Satoshi 500 / 700 / 900 (chips, pills, captions, chat bubbles). */
export const uiText = (
  weight: 500 | 700 | 900,
  { size = RALLYO_TYPE.chip, color = RALLYO_COLORS.fg, lineHeight = 1.2 }: TextOpts = {},
): React.CSSProperties => ({
  fontFamily: RALLYO_FONTS.ui,
  fontWeight: weight,
  fontStyle: "normal",
  fontSize: size,
  lineHeight,
  color,
  margin: 0,
});

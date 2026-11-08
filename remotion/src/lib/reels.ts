import type { SafeArea } from "./formats";

/**
 * Facebook Reels zones for the Rallyo reel v2.3 (brief section 2 item e + section 5.1 layout grid).
 * Designed to the BOOSTED safe box so one master serves organic and boosted:
 * readable text, logo, offer and URL stay inside x 65-918, y 270-1248.
 * All values are canvas px on the 1080x1920 frame.
 */

export type Edges = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

export const REEL_SIZE = { w: 1080, h: 1920 } as const;

/** Boost-safe box for anything readable. */
export const SAFE_BOX: Edges = { left: 65, top: 270, right: 918, bottom: 1248 };

/** Top band with the Reels header / profile row: nothing readable above y 270. */
export const HEADER_ZONE: Edges = { left: 0, top: 0, right: 1080, bottom: 270 };

/** Right rail (like / comment / share / audio icons): nothing readable at x ≥ 918. */
export const RAIL_ZONE: Edges = { left: 918, top: 0, right: 1080, bottom: 1920 };

/** Bottom 35% when boosted (CTA button + long caption): nothing readable below y 1248. */
export const BOOST_ZONE: Edges = { left: 0, top: 1248, right: 1080, bottom: 1920 };

/**
 * Chapter rail band (brief 5.1): lime pill y 1170-1236, x 72 to at most 552 (width asserted ≤ 480).
 * Rail 01 `01 · HOSTS` + 7 dots = x 72-496; rail 02 `02 · PLAYERS` + 4 dots = x 72-466 (round 4). Counts as a text layer.
 */
export const RAIL_BAND: Edges = { left: 72, top: 1170, right: 552, bottom: 1236 };

/** Fallback rail band if the boosted CTA overlaps it in Ads Manager "Show Safe Zones" (open item e). */
export const RAIL_BAND_FALLBACK: Edges = { left: 72, top: 1100, right: 552, bottom: 1166 };

/** Support line under headline slot B (S7 `You send each match.`, S10b–d supports): Satoshi 700 48 px, y 486-546. */
export const SUPPORT_SLOT: Edges = { left: 72, top: 486, right: 918, bottom: 546 };

/** Pushed UI targets land here (CameraRig frame rects). */
export const READABLE_WINDOW: Edges = { left: 92, top: 590, right: 890, bottom: 1070 };

/** Text stack slots (brief 5.1). */
export const TEXT_STACK = {
  /** ChaosChip slot: 52 px avatar + graphite bubble, Satoshi 700 44 px (S3-S6, S8, S9). */
  chip: { left: 72, top: 286, right: 900, bottom: 356 } as Edges,
  /** Headline slot A (with a chip): Archivo 900 italic 88 px, ≤ 2 lines, line 2 lime. */
  headline: { left: 72, top: 376, right: 918, bottom: 546 } as Edges,
  /** Headline slot B (no chip: S7, S10a–d): same type, y 296-466; optional support line in SUPPORT_SLOT. */
  headlineB: { left: 72, top: 296, right: 918, bottom: 466 } as Edges,
} as const;

/** Stage clip + scrims (layers/Stage.tsx defaults). */
export const STAGE = {
  clipTop: 570,
  /** Scenes 1-2 start the stage higher. */
  clipTopHookReveal: 520,
  topFade: 24,
  sideFadeLeft: 56,
  sideFadeRight: 924,
  sideOpacity: 0.85,
  scrimTop: 1290,
  scrimBottom: 1590,
  scrimOpacity: 0.85,
} as const;

/**
 * Padding-style safe area, shape-compatible with lib/formats `safeArea()`:
 * top 270, bottom 672 (= 1920 − 1248), left 65, right 162 (= 1080 − 918).
 */
export const reelsSafe = (): SafeArea => ({
  top: SAFE_BOX.top,
  bottom: REEL_SIZE.h - SAFE_BOX.bottom,
  left: SAFE_BOX.left,
  right: REEL_SIZE.w - SAFE_BOX.right,
  o: "vertical",
});

/** True when the rect (x, y, w, h in canvas px) sits fully inside the boost-safe box. */
export const isInsideSafe = (rect: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }): boolean =>
  rect.x >= SAFE_BOX.left &&
  rect.y >= SAFE_BOX.top &&
  rect.x + rect.w <= SAFE_BOX.right &&
  rect.y + rect.h <= SAFE_BOX.bottom;

export const edgesToRect = (e: Edges) => ({ x: e.left, y: e.top, w: e.right - e.left, h: e.bottom - e.top });

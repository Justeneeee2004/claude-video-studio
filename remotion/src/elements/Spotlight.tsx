import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS } from "../theme/rallyo";
import type { Rect } from "./CameraRig";

/**
 * Spotlight veil (brief v2.2 section 5.4 "Spotlight veil", S3). Owner: S3/S4 scene implementer.
 *
 * A night veil (draft v3, craft #11: 40%, was 55%, which turned white paper UI a flat mid-grey) over a
 * screen with ONE rounded-rect hole. The hole rests on `stops[0]`, then hops to each later stop over the
 * `hop` frames that END on its `at` (EASE.inOut), so the landing frame is the beat. The veil fades in
 * over `fadeInAt` → + `fade` and out over `fadeOutAt` → + `fade`.
 *
 * `clip` (optional, parent px): the padded hole is intersected with this rect (e.g. a segmented control's
 * outer rect), so a hole on one segment never overshoots the control above or below it and never reads as
 * a white tab stuck onto it (draft v2 S3).
 *
 * Coordinates: everything (`rect`s, `padding`, `radius`, `boxW` / `boxH`) is in the PARENT's px. Put it
 * inside the device children slot (su), or inside a ScrollShot's children (full-image px) so the hole
 * scrolls with the page and the camera's scale applies to it (it tracks the CameraRig).
 *
 * Drawing: one SVG path (the box + the hole, fill-rule evenodd), so the hole edge is a crisp vector edge
 * at any camera scale and nothing outside `boxW` x `boxH` is touched.
 */

export type SpotlightStop = {
  /** Local frame the hole has LANDED on `rect` (the hop runs over at − hop … at). stops[0].at is ignored. */
  readonly at: number;
  /** Target in parent px (the hole is this rect grown by `padding`). */
  readonly rect: Rect;
};

type SpotlightProps = {
  /** stops[0] = the opening hole; later stops are hops in time order. */
  readonly stops: readonly SpotlightStop[];
  /** Local frame the veil starts fading in. */
  readonly fadeInAt: number;
  /** Local frame the veil starts fading out (-1 = never). */
  readonly fadeOutAt?: number;
  /** Fade length (frames) for the veil in and out. */
  readonly fade?: number;
  /** Hop length (frames). */
  readonly hop?: number;
  /** Veil strength 0-1 (draft v3: night 40%). */
  readonly veilOpacity?: number;
  /** Hole corner radius (parent px). */
  readonly radius?: number;
  /** Hole padding around each rect (parent px). */
  readonly padding?: number;
  /** Optional bounds (parent px): the padded hole is clipped to this rect. */
  readonly clip?: Rect;
  readonly color?: string;
  /** Veil box size (parent px): the screen (1170x2532) or a ScrollShot image (e.g. 1170x6573). */
  readonly boxW?: number;
  readonly boxH?: number;
  readonly style?: React.CSSProperties;
};

const HOP_EASE = Easing.bezier(0.83, 0, 0.17, 1);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Hole rect (unpadded) at a frame: rest on stops[0], hop to each later stop over [at − hop, at]. */
export const spotlightRectAt = (frame: number, stops: readonly SpotlightStop[], hop: number): Rect => {
  if (stops.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  let r = stops[0].rect;
  for (let i = 1; i < stops.length; i++) {
    const s = stops[i];
    const start = s.at - Math.max(1, hop);
    if (frame <= start) {
      break;
    }
    const t = interpolate(frame, [start, s.at], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: HOP_EASE,
    });
    r = { x: lerp(r.x, s.rect.x, t), y: lerp(r.y, s.rect.y, t), w: lerp(r.w, s.rect.w, t), h: lerp(r.h, s.rect.h, t) };
    if (frame < s.at) {
      break;
    }
  }
  return r;
};

/** `r` grown by `pad` on every side, then intersected with `clip` (if any). */
export const spotlightHole = (r: Rect, pad: number, clip?: Rect): Rect => {
  const x0 = r.x - pad;
  const y0 = r.y - pad;
  const x1 = r.x + r.w + pad;
  const y1 = r.y + r.h + pad;
  if (!clip) {
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const cx0 = Math.max(x0, clip.x);
  const cy0 = Math.max(y0, clip.y);
  const cx1 = Math.min(x1, clip.x + clip.w);
  const cy1 = Math.min(y1, clip.y + clip.h);
  return { x: cx0, y: cy0, w: Math.max(0, cx1 - cx0), h: Math.max(0, cy1 - cy0) };
};

/** Rounded-rect sub-path (clockwise), radius clamped to the rect. */
const roundedRectPath = (x: number, y: number, w: number, h: number, radius: number): string => {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  return [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
};

const SpotlightInner: React.FC<SpotlightProps> = ({
  stops,
  fadeInAt,
  fadeOutAt = -1,
  fade = 6,
  hop = 6,
  veilOpacity = 0.4,
  radius = 24,
  padding = 10,
  clip,
  color = RALLYO_COLORS.night,
  boxW = 1170,
  boxH = 2532,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = Math.max(1, fade);
  const fadeIn = interpolate(frame, [fadeInAt, fadeInAt + f], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut =
    fadeOutAt < 0
      ? 1
      : interpolate(frame, [fadeOutAt, fadeOutAt + f], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.7, 0, 0.84, 0),
        });
  const level = fadeIn * fadeOut;
  if (level <= 0 || stops.length === 0) {
    return null;
  }
  const h = spotlightHole(spotlightRectAt(frame, stops, hop), padding, clip);
  const hole = h.w > 0 && h.h > 0 ? roundedRectPath(h.x, h.y, h.w, h.h, radius) : "";
  return (
    <svg
      width={boxW}
      height={boxH}
      viewBox={`0 0 ${boxW} ${boxH}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", pointerEvents: "none", opacity: level, ...style }}
      aria-hidden
    >
      <path d={`M0 0 H${boxW} V${boxH} H0 Z ${hole}`} fill={color} fillOpacity={veilOpacity} fillRule="evenodd" />
    </svg>
  );
};

const spotlightSchema = {
  fadeInAt: { type: "number", default: 0, min: 0, step: 3, integer: true, description: "Veil in (f)", hiddenFromList: false },
  fadeOutAt: { type: "number", default: -1, min: -1, step: 3, integer: true, description: "Veil out (f, -1 none)", hiddenFromList: false },
  fade: { type: "number", default: 6, min: 1, step: 1, integer: true, description: "Fade frames", hiddenFromList: false },
  hop: { type: "number", default: 6, min: 1, step: 1, integer: true, description: "Hop frames", hiddenFromList: false },
  veilOpacity: { type: "number", default: 0.4, min: 0, max: 1, step: 0.05, description: "Veil opacity", hiddenFromList: false },
  radius: { type: "number", default: 24, min: 0, step: 1, description: "Hole radius", hiddenFromList: false },
  padding: { type: "number", default: 10, min: 0, step: 1, description: "Hole padding", hiddenFromList: false },
  color: { type: "color", default: "#0B130D", description: "Veil colour" },
} as const satisfies InteractivitySchema;

export const Spotlight = Interactive.create({
  Component: SpotlightInner,
  layout: "none",
  schema: spotlightSchema,
});

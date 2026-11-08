import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";
import { RALLYO_COLORS } from "../theme/rallyo";

/**
 * Pointers (brief build item 8). Owner: overlays implementer.
 *
 * Pointers live in CANVAS px (the brief's "frame" coordinates), rendered inside <Stage> AFTER the
 * CameraRig (so they are clipped by the stage but never scaled by the camera). Every tap/click in
 * the brief happens while the camera holds, so the brief's frame coords are exact.
 * (x, y) is the hotspot: finger centre for TapRipple, arrow tip for Cursor.
 *
 * Motion (lib/motion.ts): enters EASE.out (0.16, 1, 0.3, 1), exits EASE.in (0.7, 0, 0.84, 0),
 * moves EASE.inOut (0.83, 0, 0.17, 1), scale with output "perceptual-scale". All frame offsets are
 * integers on the 3 f grid relative to the cue frame.
 */

// ---------------------------------------------------------------------------------------------
// TapRipple: finger dot lands `dotLead` f before `at` (scale 1.2 → 1), presses .85 at `at`, and a
// lime ring expands scale 0 → 1.6 while fading .5 → 0 over `frames` (12 f). The ring's END
// diameter is `size` (default 120 px), so its rest diameter is size / 1.6.
// Draft v3 (craft #7): the finger dot is a 36 px light disc at 45% with a hairline night edge and a
// soft shadow (was 44 px at 62%), so a label under it stays readable through it (`Share`, `Review`,
// `Approve`, `Check in`, `Mark as game over` no longer lose their middle letters).
// ---------------------------------------------------------------------------------------------

type TapRippleProps = {
  readonly x: number;
  readonly y: number;
  /** Local frame of the tap (the SFX "tap" cue lands here). */
  readonly at: number;
  /** Finger-dot fade-in lead (S3: dot 30-33, tap 33 → 3). */
  readonly dotLead?: number;
  /** Ring expansion length. */
  readonly frames?: number;
  /** Ring end diameter in canvas px. */
  readonly size?: number;
  readonly ringColor?: string;
  readonly dotColor?: string;
  /** Finger-dot diameter in canvas px. */
  readonly dotSize?: number;
  /** Ring stroke at rest (scales with the ring). */
  readonly ringWidth?: number;
  readonly style?: React.CSSProperties;
};

const TapRippleInner: React.FC<TapRippleProps> = ({
  x,
  y,
  at,
  dotLead = 3,
  frames = 12,
  size = 120,
  ringColor = RALLYO_COLORS.lime,
  dotColor = "rgba(238, 241, 234, 0.45)",
  dotSize = 36,
  ringWidth = 5,
  style,
}) => {
  const frame = useCurrentFrame();
  const lead = Math.max(1, dotLead);
  const span = Math.max(6, frames);
  const ringRest = size / 1.6;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -ringRest / 2,
          top: -ringRest / 2,
          width: ringRest,
          height: ringRest,
          borderRadius: "50%",
          boxSizing: "border-box",
          border: `${ringWidth}px solid ${ringColor}`,
          // Night hairlines keep the ring readable on paper / lime UI; invisible on night UI.
          boxShadow: `0 0 0 1.5px rgba(11, 19, 13, 0.5), inset 0 0 0 1.5px rgba(11, 19, 13, 0.5), 0 0 18px ${ringColor}`,
          opacity: interpolate(frame, [at, at + span], [0.5, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [at, at + span], [0, 1.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -dotSize / 2,
          top: -dotSize / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: dotColor,
          boxShadow:
            "0 0 0 1.5px rgba(11, 19, 13, 0.4), 0 4px 12px rgba(0, 0, 0, 0.28)",
          opacity: interpolate(
            frame,
            [at - lead, at, at + span - 6, at + span],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(
            frame,
            [at - lead, at, at + 3, at + 9],
            [1.2, 1, 0.85, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            },
          ),
        }}
      />
    </div>
  );
};

export const TapRipple = Interactive.create({
  Component: TapRippleInner,
  layout: "none",
  schema: {
    x: {
      type: "number",
      default: 540,
      step: 1,
      description: "x (canvas)",
      hiddenFromList: false,
    },
    y: {
      type: "number",
      default: 960,
      step: 1,
      description: "y (canvas)",
      hiddenFromList: false,
    },
    at: {
      type: "number",
      default: 12,
      min: 0,
      step: 3,
      integer: true,
      description: "Tap frame",
      hiddenFromList: false,
    },
    dotLead: {
      type: "number",
      default: 3,
      min: 1,
      step: 3,
      integer: true,
      description: "Dot lead (f)",
      hiddenFromList: false,
    },
    frames: {
      type: "number",
      default: 12,
      min: 6,
      step: 3,
      integer: true,
      description: "Ring frames",
      hiddenFromList: false,
    },
    size: {
      type: "number",
      default: 120,
      min: 20,
      step: 1,
      description: "Ring end diameter",
      hiddenFromList: false,
    },
    ringColor: { type: "color", default: "#C8F23A", description: "Ring" },
    dotColor: {
      type: "color",
      default: "rgba(238, 241, 234, 0.45)",
      description: "Finger dot",
    },
    dotSize: {
      type: "number",
      default: 36,
      min: 12,
      step: 1,
      description: "Finger dot diameter",
      hiddenFromList: false,
    },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// Cursor: SVG arrow gliding along a keyframed path (EASE.inOut per leg), press dip .85 at clicks.
// ---------------------------------------------------------------------------------------------

export type CursorPoint = {
  /** Local frame the cursor arrives at (x, y). The first point is where it appears. */
  readonly at: number;
  readonly x: number;
  readonly y: number;
};

type CursorProps = {
  readonly path: readonly CursorPoint[];
  /** Local frames of clicks: dip .85 for 6 f (S5 Play click at 108). Hover-only beats pass []. */
  readonly pressAt?: readonly number[];
  /** Fade-in length before path[0].at. */
  readonly fadeIn?: number;
  /** Arrow height in canvas px. */
  readonly size?: number;
  readonly color?: string;
  /** Arrow outline. */
  readonly outlineColor?: string;
  readonly style?: React.CSSProperties;
};

// Arrow drawn in a 24-unit box with its tip at (2, 2) (the hotspot).
const ARROW_D =
  "M2 2 L2 21.2 L7.1 16.4 L10.4 23.6 L13.6 22.2 L10.4 15.1 L17.2 15.1 Z";
const TIP = 2;

/** Strictly increasing keyframes (drops points whose `at` does not advance). */
const cleanPath = (path: readonly CursorPoint[]): CursorPoint[] => {
  const out: CursorPoint[] = [];
  for (const p of path) {
    if (out.length === 0 || p.at > out[out.length - 1].at) {
      out.push(p);
    }
  }
  return out;
};

const CursorInner: React.FC<CursorProps> = ({
  path,
  pressAt = [],
  fadeIn = 6,
  size = 56,
  color = "#FFFFFF",
  outlineColor = RALLYO_COLORS.night,
  style,
}) => {
  const frame = useCurrentFrame();
  const pts = cleanPath(path);
  if (pts.length === 0) {
    return null;
  }
  const ats = pts.map((p) => p.at);
  const u = size / 24;
  const first = pts[0].at;
  const glide = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.83, 0, 0.17, 1),
  } as const;
  const x =
    pts.length > 1
      ? interpolate(
          frame,
          ats,
          pts.map((p) => p.x),
          glide,
        )
      : pts[0].x;
  const y =
    pts.length > 1
      ? interpolate(
          frame,
          ats,
          pts.map((p) => p.y),
          glide,
        )
      : pts[0].y;
  const press = pressAt.reduce(
    (acc, p) =>
      Math.min(
        acc,
        interpolate(frame, [p, p + 3, p + 6], [1, 0.85, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          output: "perceptual-scale",
        }),
      ),
    1,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: x - TIP * u,
          top: y - TIP * u,
          width: size,
          height: size,
          transformOrigin: `${TIP * u}px ${TIP * u}px`,
          opacity: interpolate(
            frame,
            [first - Math.max(1, fadeIn), first],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          scale: press,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{
            overflow: "visible",
            filter: "drop-shadow(0px 6px 10px rgba(0, 0, 0, 0.45))",
          }}
        >
          <path
            d={ARROW_D}
            fill={color}
            stroke={outlineColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export const Cursor = Interactive.create({
  Component: CursorInner,
  layout: "none",
  schema: {
    color: { type: "color", default: "#FFFFFF", description: "Cursor" },
    outlineColor: { type: "color", default: "#0B130D", description: "Outline" },
    size: {
      type: "number",
      default: 56,
      min: 16,
      step: 1,
      description: "Size",
      hiddenFromList: false,
    },
    fadeIn: {
      type: "number",
      default: 6,
      min: 1,
      step: 3,
      integer: true,
      description: "Fade-in (f)",
      hiddenFromList: false,
    },
  } as const satisfies InteractivitySchema,
});

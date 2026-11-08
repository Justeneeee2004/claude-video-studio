import { StrikeThrough } from "@remotion/rough-notation";
import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS } from "../theme/rallyo";
import type { Rect } from "./CameraRig";

/**
 * StrikeLine: a hand-drawn lime strike-through across a canvas-space text line (brief K6, S1 hook line 2:
 * lime 8 px, 12 f, on the track's pickup hit). Owner: S1/S2 scene implementer.
 *
 * Same rough-notation StrikeThrough as the chip strikes (ChaosChip: iterations 2, roughness 1.2, bowing .6),
 * so the hook's strike and the six chip strikes read as one gesture. Like the Annotate primitives it wraps an
 * EMPTY box of `rect` size (rough-notation measures layout px), so it never depends on the text's own layout
 * and it can sit over animated type.
 *
 * Geometry: the stroke runs through rect.y + rect.h / 2, from rect.x to rect.x + rect.w (pass the line's ink
 * box plus the overshoot you want). Pass 1 draws left → right, pass 2 returns right → left (rough-notation
 * iterations), both inside `frames` with EASE.out, so the slash lands within ≈ 2 f of `at` (front-loaded on the
 * beat) and the return pass finishes the gesture. `tilt` rotates the stroke about its centre (deg; negative
 * rises to the right). `lift` adds a soft night drop shadow under the stroke so lime stays crisp on light or
 * warm type (0 = none).
 *
 * Props never use from / to / name / style / width / height.
 */

type StrikeLineProps = {
  /** Canvas box the stroke spans: x … x + w at the vertical centre y + h / 2. */
  readonly rect: Rect;
  /** Local frame the draw starts. */
  readonly at: number;
  /** Draw length in frames (K6: 12). */
  readonly frames?: number;
  readonly color?: string;
  /** Stroke width in px (hook: 8). */
  readonly strokeWidth?: number;
  /** rough-notation passes (2 = there and back). */
  readonly iterations?: number;
  readonly roughness?: number;
  readonly bowing?: number;
  /** Deterministic wobble. */
  readonly seed?: number;
  /** Stroke rotation about its centre, deg (negative rises to the right). */
  readonly tilt?: number;
  /** Night drop-shadow strength under the stroke, 0-1. */
  readonly lift?: number;
  readonly style?: React.CSSProperties;
};

const StrikeLineInner: React.FC<StrikeLineProps> = ({
  rect,
  at,
  frames = 12,
  color = RALLYO_COLORS.lime,
  strokeWidth = 8,
  iterations = 2,
  roughness = 1.2,
  bowing = 0.6,
  seed = 11,
  tilt = 0,
  lift = 0.55,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        fontSize: 0,
        lineHeight: 0,
        pointerEvents: "none",
        rotate: `${tilt}deg`,
        filter: lift > 0 ? `drop-shadow(0px 3px 2px rgba(11, 19, 13, ${lift}))` : undefined,
        ...style,
      }}
    >
      <StrikeThrough
        name="Strike stroke"
        progress={interpolate(frame, [at, at + Math.max(1, frames)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
        color={color}
        strokeWidth={strokeWidth}
        iterations={Math.max(1, Math.round(iterations))}
        roughness={roughness}
        bowing={bowing}
        maxRandomnessOffset={2}
        seed={seed}
      >
        <div style={{ width: rect.w, height: rect.h }} />
      </StrikeThrough>
    </div>
  );
};

export const StrikeLine = Interactive.create({
  Component: StrikeLineInner,
  layout: "none",
  schema: {
    at: { type: "number", default: 0, min: 0, step: 3, integer: true, description: "Start frame", hiddenFromList: false },
    frames: { type: "number", default: 12, min: 1, step: 1, integer: true, description: "Draw frames", hiddenFromList: false },
    color: { type: "color", default: "#C8F23A", description: "Stroke colour" },
    strokeWidth: { type: "number", default: 8, min: 1, step: 0.5, description: "Stroke (px)", hiddenFromList: false },
    tilt: { type: "number", default: 0, min: -10, max: 10, step: 0.25, description: "Tilt (deg)", hiddenFromList: false },
    lift: { type: "number", default: 0.55, min: 0, max: 1, step: 0.05, description: "Shadow lift", hiddenFromList: false },
    seed: { type: "number", default: 11, step: 1, integer: true, description: "Seed", hiddenFromList: false },
  } as const satisfies InteractivitySchema,
});

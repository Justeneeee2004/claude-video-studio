import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS } from "../theme/rallyo";

/**
 * PinPulse (brief 5.4 "Pin pulse", S10 event map): one lime ring per map pin that grows from radius
 * `radiusStart` to `radiusEnd` while fading `peak` → 0 over `frames` (brief: r 24 → 64 px, .9 → 0, 18 f).
 * A soft lime core glow (screen blend) blooms under the pin over the first 9 f, so the pin itself
 * seems to light up without redrawing any captured UI.
 *
 * COORDINATES: (x, y) and every length are in the PARENT's px. Inside a phone screen (su) pass
 * canvasPx / k, e.g. the S10 map at k .593: radiusStart 24 / .593, radiusEnd 64 / .593, ringWidth 4 / .593.
 * Drawn inside the device children slot it tracks the camera and leaves with an in-screen swipe.
 *
 * Motion: the radius uses EASE.out with a perceptual curve (a burst that settles; the ring is resized,
 * not scaled, so its stroke stays `ringWidth`), the fade an ease-in-out tail; nothing renders before
 * `at` or after `at + frames`. Props never use from / to / name / style / width / height.
 */

type PinPulseProps = {
  /** Pin centre x (parent px). */
  readonly x: number;
  /** Pin centre y (parent px). */
  readonly y: number;
  /** Local frame the pulse starts. */
  readonly at: number;
  /** Pulse length. */
  readonly frames?: number;
  /** Ring radius at `at` (parent px). */
  readonly radiusStart?: number;
  /** Ring radius at `at + frames` (parent px). */
  readonly radiusEnd?: number;
  /** Ring stroke (parent px). */
  readonly ringWidth?: number;
  /** Ring opacity at `at`. */
  readonly peak?: number;
  /** Core glow strength 0-1 (0 = ring only). */
  readonly core?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

const PinPulseInner: React.FC<PinPulseProps> = ({
  x,
  y,
  at,
  frames = 18,
  radiusStart = 24,
  radiusEnd = 64,
  ringWidth = 4,
  peak = 0.9,
  core = 0.55,
  color = RALLYO_COLORS.lime,
  style,
}) => {
  const frame = useCurrentFrame();
  const len = Math.max(3, frames);
  if (frame < at || frame > at + len) {
    return null;
  }
  // Radius grows with a perceptual curve; the ring is resized (not scaled) so its stroke stays constant.
  const r =
    radiusEnd *
    interpolate(frame, [at, at + len], [radiusStart / Math.max(1e-6, radiusEnd), 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      output: "perceptual-scale",
    });
  const coreD = radiusStart * 2.4;
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
      {core > 0 ? (
        <div
          style={{
            position: "absolute",
            left: -coreD / 2,
            top: -coreD / 2,
            width: coreD,
            height: coreD,
            borderRadius: "50%",
            backgroundImage: `radial-gradient(circle, ${color} 0%, rgba(200, 242, 58, 0.35) 38%, rgba(200, 242, 58, 0) 70%)`,
            mixBlendMode: "screen",
            opacity: interpolate(frame, [at, at + 3, at + 9], [0, core, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: -r,
          top: -r,
          width: 2 * r,
          height: 2 * r,
          borderRadius: "50%",
          boxSizing: "border-box",
          border: `${ringWidth}px solid ${color}`,
          boxShadow: `0 0 ${ringWidth * 3}px ${color}, inset 0 0 ${ringWidth * 2}px rgba(200, 242, 58, 0.45)`,
          opacity: interpolate(frame, [at, at + len], [peak, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.67, 1),
          }),
        }}
      />
    </div>
  );
};

const pinPulseSchema = {
  x: { type: "number", default: 540, step: 1, description: "x (parent px)", hiddenFromList: false },
  y: { type: "number", default: 960, step: 1, description: "y (parent px)", hiddenFromList: false },
  at: { type: "number", default: 0, min: 0, step: 3, integer: true, description: "Pulse start (local f)", hiddenFromList: false },
  frames: { type: "number", default: 18, min: 3, step: 3, integer: true, description: "Pulse frames", hiddenFromList: false },
  radiusStart: { type: "number", default: 24, min: 1, step: 1, description: "Radius start", hiddenFromList: false },
  radiusEnd: { type: "number", default: 64, min: 1, step: 1, description: "Radius end", hiddenFromList: false },
  ringWidth: { type: "number", default: 4, min: 0.5, step: 0.5, description: "Ring stroke", hiddenFromList: false },
  peak: { type: "number", default: 0.9, min: 0, max: 1, step: 0.05, description: "Peak opacity", hiddenFromList: false },
  core: { type: "number", default: 0.55, min: 0, max: 1, step: 0.05, description: "Core glow", hiddenFromList: false },
  color: { type: "color", default: "#C8F23A", description: "Color" },
} as const satisfies InteractivitySchema;

export const PinPulse = Interactive.create({
  Component: PinPulseInner,
  layout: "none",
  schema: pinPulseSchema,
});

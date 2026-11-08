import type React from "react";
import { useId } from "react";
import { Interactive, useCurrentFrame, type InteractivitySchema } from "remotion";
import { scrollYAt, type ScrollMove } from "./ScreenMedia";

/**
 * ScrollSmear (brief v2.2 section 5.4 "Scroll whip", S3). Owner: S3/S4 scene implementer.
 *
 * A directional (vertical by default) Gaussian smear on its children, sized to the per-frame travel of a
 * scroll described by the SAME `ScrollMove` list the ScrollShot uses (EASE.inOut via `scrollYAt`), so the
 * blur peaks on the fastest frames of the whip and is exactly 0 at rest (every landing frame is sharp).
 * Nothing is rendered twice; the smear is one SVG feGaussianBlur on a wrapper.
 *
 *   travel = |scrollY(f + shutter/2) − scrollY(f − shutter/2)| × gain      (px of the wrapper's space)
 *   σ      = min(maxSigma, 0.29 × travel)     (a box streak of length L ≈ a Gaussian of σ 0.29 L)
 *
 * With `shutter` 0.5 (180°) the streak length is half the per-frame travel. Use it two ways:
 * - inside a device slot around a ScrollShot (units = image px): smears the scrolled page; when the
 *   camera pans the device with the same easing, raise `gain` to (scroll + pan in image px) ÷ scroll
 *   so the page streak matches what the viewer sees while the bezel stays sharp (S3);
 * - around a CameraRig in canvas px, with a ScrollMove list that describes the camera's own pan
 *   (y = canvas px of travel, gain 1): smears the device body as it pans.
 * Gaussian blurs compose (σ² add), so the page inside a panning device gets both.
 *
 * `dim` darkens the smeared content in step with the smear (brightness 1 − dim × σ ÷ maxSigma), so a
 * bright page never blooms into a white slab mid-whip; at rest it is exactly 1 (no filter at all).
 * Draft v3 (accuracy #6): the S3 treatment is now the default for every user (dim .3, σ cap 40), so a new
 * smear cannot flash white unless it opts out.
 */

type ScrollSmearProps = {
  readonly children?: React.ReactNode;
  /** The scroll (or pan) the smear follows; same shape as ScrollShot `scrollMoves`. */
  readonly scrollMoves: readonly ScrollMove[];
  /** Clamp for the ScrollMove targets (the ScrollShot's effective limit). */
  readonly maxScrollY?: number;
  /** Multiplier from scroll units to the wrapper's px. */
  readonly gain?: number;
  /** Shutter in frames (0.5 = 180°). */
  readonly shutter?: number;
  /** Cap on σ (wrapper px). */
  readonly maxSigma?: number;
  readonly axis?: "x" | "y";
  /** Brightness drop at full smear (0 = off; default 0.3 = 70% brightness while σ is at maxSigma). */
  readonly dim?: number;
  /** Wrapper box (wrapper px). */
  readonly boxW?: number;
  readonly boxH?: number;
  readonly style?: React.CSSProperties;
};

/** σ of the smear at a frame (exported for QA). */
export const scrollSmearSigma = (
  frame: number,
  moves: readonly ScrollMove[],
  { maxScrollY = Number.MAX_SAFE_INTEGER, gain = 1, shutter = 0.5, maxSigma = 40 } = {},
): number => {
  const half = shutter / 2;
  const travel = Math.abs(scrollYAt(frame + half, moves, maxScrollY) - scrollYAt(frame - half, moves, maxScrollY)) * gain;
  return Math.min(maxSigma, 0.29 * travel);
};

const ScrollSmearInner: React.FC<ScrollSmearProps> = ({
  children,
  scrollMoves,
  maxScrollY = Number.MAX_SAFE_INTEGER,
  gain = 1,
  shutter = 0.5,
  maxSigma = 40,
  axis = "y",
  dim = 0.3,
  boxW = 1170,
  boxH = 2532,
  style,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const filterId = `scroll-smear-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sigma = scrollSmearSigma(frame, scrollMoves, { maxScrollY, gain, shutter, maxSigma });
  const blurring = sigma >= 0.5;
  const vertical = axis === "y";
  const brightness = blurring && maxSigma > 0 ? 1 - Math.min(1, Math.max(0, dim)) * Math.min(1, sigma / maxSigma) : 1;
  const filters = [blurring ? `url(#${filterId})` : "", brightness < 0.999 ? `brightness(${brightness.toFixed(3)})` : ""].filter(Boolean);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: boxW, height: boxH, ...style }}>
      {blurring ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter
              id={filterId}
              x={vertical ? "0%" : "-10%"}
              y={vertical ? "-10%" : "0%"}
              width={vertical ? "100%" : "120%"}
              height={vertical ? "120%" : "100%"}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation={vertical ? `0 ${sigma.toFixed(2)}` : `${sigma.toFixed(2)} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div style={{ position: "absolute", inset: 0, filter: filters.length > 0 ? filters.join(" ") : undefined }}>{children}</div>
    </div>
  );
};

const scrollSmearSchema = {
  gain: { type: "number", default: 1, min: 0, step: 0.05, description: "Gain", hiddenFromList: false },
  shutter: { type: "number", default: 0.5, min: 0, max: 1, step: 0.05, description: "Shutter (frames)", hiddenFromList: false },
  maxSigma: { type: "number", default: 40, min: 0, step: 1, description: "Max smear (px)", hiddenFromList: false },
  axis: { type: "enum", default: "y", description: "Axis", variants: { x: {}, y: {} } },
  dim: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Dim at full smear", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const ScrollSmear = Interactive.create({
  Component: ScrollSmearInner,
  layout: "none",
  schema: scrollSmearSchema,
});

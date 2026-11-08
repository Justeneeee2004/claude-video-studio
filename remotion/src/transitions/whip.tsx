import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import type React from "react";
import { useId } from "react";
import { Easing, interpolate } from "remotion";

/**
 * T6 whip (S6 → S7, abs 645–660): a CSS camera pan, both layers move together (S6 leaves to the left, S7 arrives
 * from the right). linearTiming({durationInFrames: 15}); easing inside; p = (abs − 645) / 15.
 *
 * - e = interpolate(p, [0, 1], [0, 1], {easing: Easing.bezier(0.22, 1, 0.36, 1)}).
 *   Exiting `translate: ${-distance * e}px 0px`; entering `translate: ${distance * (1 - e)}px 0px`
 *   (303 px of pan in the first frame, 547 by 647, 853 by 649, settled by 658: the snap is on the beat).
 * - Motion blur = the ScreenSwipe smear: an SVG feGaussianBlur stdDeviation="σ 0" on each layer's wrapper,
 *   σ = 0.29 × half the per-frame travel (centred difference over ±0.5 f, a 180° shutter), capped at
 *   `maxSmear` px: σ 23 / 32 / 31 / 22 at 645–648, ≤ 4 from 652 (sharp). One render per layer.
 * - Optional (`ghosts` 1–2, default 0): ghost copies per layer at +60 / +120 px (trailing, opposite to the
 *   motion), opacity .30 / .12 × (1 − e). Never CameraMotionBlur inside a presentation (every sample shares
 *   presentationProgress, so nothing would blur).
 * - Draft v3 (accuracy #6): the ENTERING layer (S7's white laptop cards) dims with the smear, brightness
 *   1 − `dimIncoming` × min(1, σ ÷ (maxSmear / 2)): 70% while σ ≥ 16 (645–648), .72 / .82 / .88 / .92 at 649–652,
 *   1 (no filter) once sharp, so the arrival never smears white blocks across the night frame. The exiting S6 is
 *   night UI and keeps its full brightness.
 */

export type WhipProps = {
  /** Pan distance, px (the canvas width). */
  readonly distance: number;
  /** Smear cap, px. */
  readonly maxSmear: number;
  /** Ghost copies per layer (0–2). */
  readonly ghosts: number;
  /** Brightness drop of the entering layer at full smear (0 = off). */
  readonly dimIncoming: number;
};

export const WHIP_DEFAULTS: WhipProps = { distance: 1080, maxSmear: 32, ghosts: 0, dimIncoming: 0.3 };

const GHOST_OFFSETS = [60, 120] as const;
const GHOST_OPACITY = [0.3, 0.12] as const;

const panEase = (p: number): number =>
  interpolate(p, [0, 1], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const WhipPresentation: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  presentationDurationInFrames,
  passedProps,
}) => {
  const { distance, maxSmear, ghosts, dimIncoming } = passedProps;
  const rawId = useId();
  const filterId = `whip-smear-${presentationDirection}-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const p = presentationProgress;
  const e = panEase(p);
  const halfFrame = 0.5 / Math.max(1, presentationDurationInFrames);
  const travel = Math.abs(panEase(p + halfFrame) - panEase(p - halfFrame)) * distance;
  const sigma = Math.min(travel * 0.5 * 0.29, maxSmear);
  const blurring = sigma >= 0.5;
  const x = presentationDirection === "exiting" ? -distance * e : distance * (1 - e);
  const ghostCount = Math.max(0, Math.min(2, Math.round(ghosts)));
  const dimFullAt = Math.max(1, maxSmear / 2);
  const brightness =
    presentationDirection === "entering" && blurring
      ? 1 - Math.min(1, Math.max(0, dimIncoming)) * Math.min(1, sigma / dimFullAt)
      : 1;
  const layerFilter = blurring
    ? [`url(#${filterId})`, brightness < 0.999 ? `brightness(${brightness.toFixed(3)})` : ""].filter(Boolean).join(" ")
    : undefined;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {blurring ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={filterId} x="-10%" y="0%" width="120%" height="100%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${sigma} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      {GHOST_OFFSETS.slice(0, ghostCount)
        .map((offset, i) => ({ offset, opacity: GHOST_OPACITY[i] * (1 - e) }))
        .reverse()
        .map(({ offset, opacity }) =>
          opacity > 0.005 ? (
            <div
              key={`ghost-${offset}`}
              style={{
                position: "absolute",
                inset: 0,
                translate: `${x + offset}px 0px`,
                opacity,
                filter: layerFilter,
              }}
            >
              {children}
            </div>
          ) : null,
        )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          translate: `${x}px 0px`,
          filter: layerFilter,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const whip = (props: Partial<WhipProps> = {}): TransitionPresentation<WhipProps> => ({
  component: WhipPresentation,
  props: { ...WHIP_DEFAULTS, ...props },
});

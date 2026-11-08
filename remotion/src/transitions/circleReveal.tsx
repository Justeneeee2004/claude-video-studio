import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import type React from "react";
import { Easing, interpolate } from "remotion";

/**
 * T1 circleReveal (S1 → S2, abs 120–135, the music drop). Used with linearTiming({durationInFrames: 15});
 * all easing lives in here (brief 5.2 / 5.3). p = presentationProgress = (abs − 120) / 15.
 *
 * Centre = the jammed newest bubble (491, 1000); rTo 1200 > the farthest corner distance 1161 + ring.
 * - Entering: wrapper `clipPath: circle(r at cx cy)`, r = interpolate(p, [0, 1], [0, rTo],
 *   {easing: Easing.bezier(0.16, 1, 0.3, 1)}) → r 432 / 722 / 903 / 1014 / 1083 px at abs 121–125 (front-loaded:
 *   the burst sits on the drop). Ring: absolutely positioned div, left cx − r, top cy − r, size 2r,
 *   borderRadius 50%, `border: ${ring}px solid ${ringColor}`, boxSizing border-box (its outer edge is the clip
 *   edge, so it is never cut), opacity interpolate(p, [0.2, 0.6], [1, 0], clamp): full at 121–123, gone by 129.
 * - Exiting: transformOrigin `${cx}px ${cy}px`, scale 1 → 1.08 (Easing.bezier(0.16, 1, 0.3, 1),
 *   perceptual-scale), filter brightness 1 → 0.6 (same easing). It stays opaque under the growing circle.
 * `scale` style prop (never a `transform` string), literal ranges.
 */

export type CircleRevealProps = {
  /** Burst centre x, canvas px. */
  readonly cx: number;
  /** Burst centre y, canvas px. */
  readonly cy: number;
  /** Final clip radius, px (must clear the farthest corner + ring). */
  readonly rTo: number;
  /** Ring stroke, px. */
  readonly ring: number;
  readonly ringColor: string;
};

export const CIRCLE_REVEAL_DEFAULTS: CircleRevealProps = { cx: 491, cy: 1000, rTo: 1200, ring: 16, ringColor: "#C8F23A" };

const CircleRevealPresentation: React.FC<TransitionPresentationComponentProps<CircleRevealProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { cx, cy, rTo, ring, ringColor } = passedProps;
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${cx}px ${cy}px`,
          scale: interpolate(p, [0, 1], [1, 1.08], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          filter: `brightness(${interpolate(p, [0, 1], [1, 0.6], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
        }}
      >
        {children}
      </div>
    );
  }

  const r = interpolate(p, [0, 1], [0, rTo], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(p, [0.2, 0.6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>{children}</div>
      {ringOpacity > 0 && r > 0 ? (
        <div
          style={{
            position: "absolute",
            left: cx - r,
            top: cy - r,
            width: 2 * r,
            height: 2 * r,
            borderRadius: "50%",
            border: `${ring}px solid ${ringColor}`,
            boxSizing: "border-box",
            opacity: ringOpacity,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

export const circleReveal = (props: Partial<CircleRevealProps> = {}): TransitionPresentation<CircleRevealProps> => ({
  component: CircleRevealPresentation,
  props: { ...CIRCLE_REVEAL_DEFAULTS, ...props },
});

import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import type React from "react";
import { useId } from "react";
import { Easing, Img, interpolate } from "remotion";
import { asset } from "../lib/assets";

/**
 * T10 limeFlood (S10 → S11, abs 1185–1200, the music drop-out beat). The frame is already solid lime from the
 * S10 zoom into the lime card + lime fill (brief 5.4); this holds the lime and clears it to the night offer
 * ON bar 20 (abs 1200: the reveal, the FREE slam and track C's downbeat coincide). linearTiming({durationInFrames:
 * 15}); easing inside; p = (abs − 1185) / 15.
 *
 * - Exiting: children + an absolute `color` layer, opacity interpolate(p, [0, 0.45], [0, 1], clamp) (solid by
 *   1192 even if S10 is not lime yet).
 * - Entering (draft v3, accuracy #9 / craft #14): nothing before p 11/15 (abs 1196; the exiting carries the
 *   flood). From 1196 the children snap in under a `color` layer that clears 1 → 0 over p 11/15 → 1 with EASE.in
 *   (0.7, 0, 0.84, 0): lime 1 / 1 / .97 / .83 at 1196–1199, night + FREE at 1200 (the presentation unmounts on the
 *   bar). Draft v2 cleared over 1193–1199 (.64 / .37 / .18 …), so S11's empty photo plate sat in the silence for
 *   4–5 f before FREE.
 * - Mark (draft v3, craft #14): the Rallyo R (`markSrc`, the lime brand mark) knocked into the lime in `markColor`
 *   (night): cuts in on 1188 and settles 1188–1191 (scale 1.12 → 1, EASE.out, perceptual), holds, and leaves 1194–1197
 *   (opacity 1 → 0, scale 1 → .94, EASE.in), so 1197–1199 is clean lime again before the reveal. Tinted with an SVG
 *   flood composited into the PNG's alpha (exact night; the ball's holes stay lime). Drawn in the entering layer, on
 *   top of both lime layers. `markSrc` "" = no mark. Centre (`markX`, `markY`) = the reel's safe-zone centre column.
 */

export type LimeFloodProps = {
  readonly color: string;
  /** public/ path of the R mark (lime on alpha); "" = no mark. */
  readonly markSrc: string;
  /** Mark tint (night). */
  readonly markColor: string;
  /** Mark width, canvas px (the PNG is 528 x 416). */
  readonly markW: number;
  /** Mark centre, canvas px. */
  readonly markX: number;
  readonly markY: number;
};

export const LIME_FLOOD_DEFAULTS: LimeFloodProps = {
  color: "#C8F23A",
  markSrc: "rallyo/brand/rallyo-mark.png",
  markColor: "#0B130D",
  markW: 340,
  markX: 491,
  markY: 900,
};

/** 528 x 416 source. */
const MARK_RATIO = 416 / 528;
/** Transition length (frames) the p grid is built on. */
const FRAMES = 15;
/** p of a frame offset from the transition start (abs 1185). */
const at = (offset: number): number => offset / FRAMES;

const LimeFloodPresentation: React.FC<TransitionPresentationComponentProps<LimeFloodProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { color, markSrc, markColor, markW, markX, markY } = passedProps;
  const p = presentationProgress;
  const rawId = useId();
  const tintId = `lime-flood-mark-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  if (presentationDirection === "exiting") {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        {children}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: color,
            opacity: interpolate(p, [0, 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        />
      </div>
    );
  }

  const markH = markW * MARK_RATIO;
  const markOpacity = interpolate(p, [at(2), at(3), at(9), at(12)], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markScale =
    p < at(9)
      ? interpolate(p, [at(3), at(6)], [1.12, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          output: "perceptual-scale",
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(p, [at(9), at(12)], [1, 0.94], {
          easing: Easing.bezier(0.7, 0, 0.84, 0),
          output: "perceptual-scale",
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: p >= at(11) ? 1 : 0,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: color,
            opacity: interpolate(p, [at(11), 1], [1, 0], {
              easing: Easing.bezier(0.7, 0, 0.84, 0),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </div>
      {/* Mounted for the whole transition (opacity 0 outside 1188–1197), so the PNG is loaded before it shows. */}
      {markSrc ? (
        <>
          <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
            <defs>
              <filter id={tintId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
                <feFlood floodColor={markColor} result="tint" />
                <feComposite in="tint" in2="SourceAlpha" operator="in" />
              </filter>
            </defs>
          </svg>
          <Img
            name="Lime flood R mark"
            src={asset(markSrc)}
            style={{
              position: "absolute",
              left: markX - markW / 2,
              top: markY - markH / 2,
              width: markW,
              height: markH,
              maxWidth: "none",
              display: "block",
              filter: `url(#${tintId})`,
              opacity: markOpacity,
              scale: markScale,
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export const limeFlood = (props: Partial<LimeFloodProps> = {}): TransitionPresentation<LimeFloodProps> => ({
  component: LimeFloodPresentation,
  props: { ...LIME_FLOOD_DEFAULTS, ...props },
});

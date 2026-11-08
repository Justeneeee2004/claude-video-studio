import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { RALLYO_COLORS } from "../theme/rallyo";
import { PHONE_BASE, PHONE_SOURCE, PhoneFrame } from "./PhoneFrame";

/**
 * PhoneFan (brief v2.2 section 5.4 "Phone fan", S11 Offer): five real phone screens fanned behind the offer.
 * Owner: S11/S12 scene implementer. Canvas px; frames are LOCAL to the parent (no `from` needed in S11).
 *
 * Geometry: PhoneFrame screenW 230 (k .1966, 230x498; body 239x507), rotations −14 / −7 / 0 / 7 / 14° about each
 * phone's bottom centre, screen tops y 960 / 915 / 890 / 915 / 960 (pre-rotation numbers), centres x 291 / 391 / 491 /
 * 591 / 691 (100 px pitch; draft v2, DEFECTS #14). The brief's 150 px pitch (191 … 791) put the rotated outer bodies at
 * x −47 … 1029, so `NEW EVENT` was cut by the left canvas edge; at 100 px the whole fan spans x ≈ 52–930 (≥ 50 px
 * clear of both edges, symmetric about the stack axis x 491), each back phone still shows a ≈ 150 px strip at its top,
 * and the tops keep the brief's arc (each phone's inner top corner steps down from the hero: ≈ 886 / 900 / 942).
 * Paint order back → front: outer pair, inner pair, centre (the hero phone in front).
 *
 * Motion (all frame-driven):
 * - Rise: each phone translates y + `rise` (440) → 0 over `enterFrames` (18) with EASE.out, starting at
 *   enterAt + i × stagger (18, 24, 30, 36, 42 → lands 36 … 60), fading in over its first 6 f (no pop at the
 *   bottom of the canvas). While rising, the tilt opens from `spreadFrom` × angle to the final angle (the fan opens).
 * - Float: from its landing frame each phone drifts y −floatPx × (1 − cos) (0 → −2·floatPx → 0, i.e. ±floatPx around
 *   its mean) with its own period (84-108 f), zero velocity at the hand-off, so no frame freezes.
 * - Beat flash: at flashAt[i] (one phone per beat, L → R) an `outlineWidth` px lime outline + soft glow is at full
 *   strength ON the beat frame and gone `flashFrames` (9) f later; the phone lifts `flashLift` px and its depth dim
 *   clears for the flash.
 * - Depth: outer phones sit under a night dim (`dims`, default .28 / .14 / 0 / .14 / .28).
 * - Lower fade: the whole fan is masked from opaque at `fadeTop` (1300) to 15% at `fadeBottom` (1480) and 0 by
 *   fadeBottom + 220 (draft v2: the softer, lower Stage scrim of director note a, applied as a mask so the scene
 *   backdrop shows through; the phone bottoms at y ≈ 1390–1490 melt away instead of being cut at 1250).
 *
 * Screens: each is an image 1170 px wide shown from its top at its natural aspect (a tall page such as the
 * 1170x6573 new-event sheet shows its first 2532 rows = a ScrollShot at scrollY 0). `offsetY` skips source rows at
 * the top (e.g. the half-cut stat labels of player-live-crop); the freed rows at the bottom show the screen colour,
 * under the lower fade. Text inside these screens is ≈ 5-8 px texture by design.
 */

export type FanScreen = {
  /** public/ path of a 1170 px wide capture. */
  readonly src: string;
  /** Source rows skipped at the top (default 0). */
  readonly offsetY?: number;
};

export const PHONE_FAN = {
  screenW: 230,
  centers: [291, 391, 491, 591, 691],
  tops: [960, 915, 890, 915, 960],
  angles: [-14, -7, 0, 7, 14],
  dims: [0.28, 0.14, 0, 0.14, 0.28],
  order: [0, 4, 1, 3, 2],
  flashAt: [60, 75, 90, 105, 120],
} as const;

type PhoneFanProps = {
  /** Screens L → R (one per phone). Missing / empty src = labelled PhoneFrame placeholder. */
  readonly screens?: readonly FanScreen[];
  /** Phone centre x per phone (canvas px). */
  readonly centers?: readonly number[];
  /** Screen top y per phone (canvas px, before rotation). */
  readonly tops?: readonly number[];
  /** Final rotation per phone (deg), about the phone's bottom centre. */
  readonly angles?: readonly number[];
  /** Night dim per phone at rest (0-1). */
  readonly dims?: readonly number[];
  /** Paint order back → front (indices into the arrays). */
  readonly order?: readonly number[];
  /** Local frame of each flash (one per phone). */
  readonly flashAt?: readonly number[];
  /** Screen width in canvas px (230 = k .1966). */
  readonly screenW?: number;
  /** Local frame the first phone starts rising. */
  readonly enterAt?: number;
  /** Frames between phones. */
  readonly stagger?: number;
  /** Frames each rise takes. */
  readonly enterFrames?: number;
  /** Rise distance in px. */
  readonly rise?: number;
  /** Rotation at the start of the rise, as a fraction of the final angle. */
  readonly spreadFrom?: number;
  /** Float amplitude (± px). */
  readonly floatPx?: number;
  /** Flash length in frames. */
  readonly flashFrames?: number;
  /** Lift during a flash in px. */
  readonly flashLift?: number;
  readonly outlineColor?: string;
  readonly outlineWidth?: number;
  readonly glowColor?: string;
  /** Dynamic island on every phone. */
  readonly island?: boolean;
  /** Lower fade: opaque above this y. */
  readonly fadeTop?: number;
  /** Lower fade: 15% at this y (0 by +220). */
  readonly fadeBottom?: number;
  readonly style?: React.CSSProperties;
};

const PERIODS = [84, 96, 108, 90, 102];

const PhoneFanInner: React.FC<PhoneFanProps> = ({
  screens = [],
  centers = PHONE_FAN.centers,
  tops = PHONE_FAN.tops,
  angles = PHONE_FAN.angles,
  dims = PHONE_FAN.dims,
  order = PHONE_FAN.order,
  flashAt = PHONE_FAN.flashAt,
  screenW = PHONE_FAN.screenW,
  enterAt = 18,
  stagger = 6,
  enterFrames = 18,
  rise = 440,
  spreadFrom = 0.4,
  floatPx = 6,
  flashFrames = 9,
  flashLift = 8,
  outlineColor = RALLYO_COLORS.lime,
  outlineWidth = 2,
  glowColor = "rgba(200, 242, 58, 0.45)",
  island = true,
  fadeTop = 1300,
  fadeBottom = 1480,
  style,
}) => {
  const frame = useCurrentFrame();
  const u = screenW / PHONE_BASE.screenW;
  const bezel = PHONE_BASE.bezel * u;
  const radius = PHONE_BASE.radius * u;
  const screenH = screenW * (PHONE_SOURCE.h / PHONE_SOURCE.w);
  const bodyW = screenW + 2 * bezel;
  const bodyH = screenH + 2 * bezel;
  const mask = `linear-gradient(180deg, rgba(0, 0, 0, 1) ${fadeTop}px, rgba(0, 0, 0, 0.15) ${fadeBottom}px, rgba(0, 0, 0, 0) ${fadeBottom + 220}px)`;
  const count = Math.min(centers.length, tops.length, angles.length);
  const paint = order.filter((i) => i >= 0 && i < count);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        pointerEvents: "none",
        maskImage: mask,
        WebkitMaskImage: mask,
        ...style,
      }}
    >
      {paint.map((i) => {
        const cx = centers[i];
        const top = tops[i];
        const angle = angles[i];
        const start = enterAt + i * stagger;
        const landed = start + enterFrames;
        const flash = flashAt[i] ?? -1000;
        const period = PERIODS[i % PERIODS.length];
        const floatY = frame > landed ? -floatPx * (1 - Math.cos((2 * Math.PI * (frame - landed)) / period)) : 0;
        const flashOn = interpolate(frame, [flash - 1, flash, flash + flashFrames - 4, flash + flashFrames], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const lift = interpolate(frame, [flash - 1, flash + 2, flash + flashFrames], [0, -flashLift, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.45, 0, 0.55, 1),
        });
        const screen = screens[i];
        const dim = (dims[i] ?? 0) * (1 - flashOn);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: `${cx}px ${top + screenH + bezel}px`,
              opacity: interpolate(frame, [start, start + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: `0px ${
                interpolate(frame, [start, landed], [rise, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }) +
                floatY +
                lift
              }px`,
              rotate: `${interpolate(frame, [start, landed], [angle * spreadFrom, angle], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })}deg`,
            }}
          >
            <PhoneFrame
              name={`Fan phone ${i + 1}`}
              screenX={cx - screenW / 2}
              screenY={top}
              screenW={screenW}
              island={island}
              previewSrc=""
              label={`Fan ${i + 1}`}
            >
              {screen?.src ? (
                <>
                  <Img
                    name={`Fan screen ${i + 1}`}
                    src={asset(screen.src)}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: PHONE_SOURCE.w,
                      height: "auto",
                      maxWidth: "none",
                      display: "block",
                      translate: `0px ${-(screen.offsetY ?? 0)}px`,
                    }}
                  />
                  {dim > 0 ? (
                    <div style={{ position: "absolute", inset: 0, backgroundColor: RALLYO_COLORS.night, opacity: dim }} />
                  ) : null}
                </>
              ) : undefined}
            </PhoneFrame>
            {flashOn > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: cx - bodyW / 2,
                  top: top - bezel,
                  width: bodyW,
                  height: bodyH,
                  borderRadius: radius,
                  boxShadow: `0 0 0 ${outlineWidth}px ${outlineColor}, 0 0 28px 4px ${glowColor}`,
                  opacity: flashOn,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const phoneFanSchema = {
  screenW: { type: "number", default: 230, min: 60, step: 1, description: "Screen width", hiddenFromList: false },
  enterAt: { type: "number", default: 18, min: 0, step: 3, integer: true, description: "First rise (local f)", hiddenFromList: false },
  stagger: { type: "number", default: 6, min: 0, step: 1, integer: true, description: "Stagger (f)", hiddenFromList: false },
  enterFrames: { type: "number", default: 18, min: 3, step: 3, integer: true, description: "Rise (f)", hiddenFromList: false },
  rise: { type: "number", default: 440, step: 10, description: "Rise distance (px)", hiddenFromList: false },
  spreadFrom: { type: "number", default: 0.4, min: 0, max: 1, step: 0.05, description: "Tilt at rise start (× angle)", hiddenFromList: false },
  floatPx: { type: "number", default: 6, min: 0, step: 1, description: "Float (± px)", hiddenFromList: false },
  flashFrames: { type: "number", default: 9, min: 3, step: 3, integer: true, description: "Flash (f)", hiddenFromList: false },
  flashLift: { type: "number", default: 8, min: 0, step: 1, description: "Flash lift (px)", hiddenFromList: false },
  outlineColor: { type: "color", default: "#C8F23A", description: "Flash outline" },
  outlineWidth: { type: "number", default: 2, min: 0, step: 1, description: "Flash outline (px)", hiddenFromList: false },
  island: { type: "boolean", default: true, description: "Dynamic island" },
  fadeTop: { type: "number", default: 1300, step: 10, description: "Lower fade start (y)", hiddenFromList: false },
  fadeBottom: { type: "number", default: 1480, step: 10, description: "Lower fade 15% (y)", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const PhoneFan = Interactive.create({
  Component: PhoneFanInner,
  layout: "none",
  schema: phoneFanSchema,
});

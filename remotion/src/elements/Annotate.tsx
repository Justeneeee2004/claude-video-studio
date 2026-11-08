import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { Box, Circle, Highlight, Underline } from "@remotion/rough-notation";
import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";
import { RALLYO_COLORS } from "../theme/rallyo";
import type { Rect } from "./CameraRig";

/**
 * Annotation primitives (brief build item 11). Owner: overlays implementer.
 *
 * RoughRing / RoughBox / RoughUnderline / Highlighter draw with @remotion/rough-notation
 * (Circle / Box / Underline / Highlight), `progress` driven by an inline interpolate. Each wraps an
 * empty box of `rect` size, so rough-notation measures layout px (offsetWidth/Height), which the
 * CameraRig's scale does not change. Connector uses evolvePath (@remotion/paths); RowFlash,
 * RiseMask and Confetti are plain frame-driven CSS.
 *
 * COORDINATES: every `rect` / path is in the PARENT's px. Put screen annotations INSIDE the
 * device children slot (source px / su) so they track the CameraRig; then `strokeWidth` and
 * `padding` are also in source px: pass desiredCanvasPx / k_current (e.g. 6 px at k 0.732 → 8.2).
 * Canvas-space annotations (outside the rig) use the brief's frame coords directly.
 *
 * TONES (brief section 5 "Highlights"): "lime" (#C8F23A) on night surfaces; "ink" (#0B130D) on
 * lime or paper surfaces; "tint" (#E3F3A6) highlighter behind ink text on paper (drawn with
 * mix-blend-mode multiply over the screenshot, so the ink stays readable).
 *
 * Draws use EASE.out (0.16, 1, 0.3, 1) (they are enters); Connector uses EASE.inOut (a move from
 * A to B). Every annotation is deterministic: rough-notation `seed`, Confetti `random(seed)`.
 */

export type AnnotateTone = "lime" | "ink" | "tint";

export const toneColor = (tone: AnnotateTone): string =>
  tone === "ink"
    ? RALLYO_COLORS.night
    : tone === "tint"
      ? RALLYO_COLORS.limeTint
      : RALLYO_COLORS.lime;

type AnnotateBaseProps = {
  /** Target box in parent px (text bounds for underline / highlighter, element bounds for ring / box). */
  readonly rect: Rect;
  /** Local frame the draw starts. */
  readonly at: number;
  /** Draw length in frames (brief windows, e.g. S4 ring 15-33 → 18). */
  readonly frames?: number;
  readonly tone?: AnnotateTone;
  /** Overrides tone. */
  readonly color?: string;
  /** Parent px (divide by camera k when inside a screen). */
  readonly strokeWidth?: number;
  /** Extra space around rect (parent px). Underline: gap between rect bottom and the line. */
  readonly padding?: number;
  /** rough-notation seed (deterministic). */
  readonly seed?: number;
  /** rough-notation passes (ring 2, box 2, underline 1, highlighter 2 by default). */
  readonly iterations?: number;
  /** rough-notation roughness (wobble). */
  readonly roughness?: number;
  readonly style?: React.CSSProperties;
};

/** Absolute anchor at rect's top-left; fontSize 0 keeps inline-block struts out of the measurement. */
const anchorStyle = (rect: Rect): React.CSSProperties => ({
  position: "absolute",
  left: rect.x,
  top: rect.y,
  width: rect.w,
  height: rect.h,
  fontSize: 0,
  lineHeight: 0,
  pointerEvents: "none",
});

const annotateSchema = {
  at: {
    type: "number",
    default: 0,
    min: 0,
    step: 3,
    integer: true,
    description: "Start frame",
    hiddenFromList: false,
  },
  frames: {
    type: "number",
    default: 12,
    min: 1,
    step: 1,
    integer: true,
    description: "Draw frames",
    hiddenFromList: false,
  },
  tone: {
    type: "enum",
    default: "lime",
    description: "Tone",
    variants: { lime: {}, ink: {}, tint: {} },
  },
  strokeWidth: {
    type: "number",
    default: 6,
    min: 0.5,
    step: 0.5,
    description: "Stroke",
    hiddenFromList: false,
  },
  padding: {
    type: "number",
    default: 12,
    min: 0,
    step: 1,
    description: "Padding",
    hiddenFromList: false,
  },
  seed: {
    type: "number",
    default: 1,
    step: 1,
    integer: true,
    description: "Seed",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

// ---------------------------------------------------------------------------------------------
// RoughRing: hand-drawn ellipse around rect (rough-notation Circle, box "inside"). The ellipse is
// rect.w × spread + 2 × padding wide and rect.h × spreadY + 2 × padding tall (1 = it touches the
// rect's sides, 1.414 on both axes = it passes through the rect's corners). Default 1.3 encloses a
// text block (S4 "1 / TO APPROVE" reads best at 1.35). Tight buttons with close neighbours want a
// narrow, taller ring: S5 `Next court` spread 1.12; S7 `Auto-call: on` spread 1.1, spreadY 1.4,
// padding 3 / k (a taller ring leaves the lime bar, where night ink disappears).
// ---------------------------------------------------------------------------------------------

type RoughRingProps = AnnotateBaseProps & {
  /** Ellipse width relative to rect.w (before padding). */
  readonly spread?: number;
  /** Ellipse height relative to rect.h (before padding); defaults to `spread`. */
  readonly spreadY?: number;
};

const RoughRingInner: React.FC<RoughRingProps> = ({
  rect,
  at,
  frames = 12,
  tone = "lime",
  color,
  strokeWidth = 6,
  padding = 12,
  seed = 1,
  iterations = 2,
  roughness = 1.2,
  spread = 1.3,
  spreadY,
  style,
}) => {
  const frame = useCurrentFrame();
  const padX = (rect.w * (spread - 1)) / 2 + padding;
  const padY = (rect.h * ((spreadY ?? spread) - 1)) / 2 + padding;
  return (
    <div style={{ ...anchorStyle(rect), ...style }}>
      <Circle
        name="Rough ring"
        progress={interpolate(frame, [at, at + Math.max(1, frames)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
        box="inside"
        padding={{ left: padX, right: padX, top: padY, bottom: padY }}
        color={color ?? toneColor(tone)}
        strokeWidth={strokeWidth}
        iterations={Math.max(1, Math.round(iterations))}
        roughness={roughness}
        seed={seed}
      >
        <div style={{ width: rect.w, height: rect.h }} />
      </Circle>
    </div>
  );
};
export const RoughRing = Interactive.create({
  Component: RoughRingInner,
  layout: "none",
  schema: {
    ...annotateSchema,
    spread: {
      type: "number",
      default: 1.3,
      min: 1,
      max: 2,
      step: 0.01,
      description: "Spread (x)",
      hiddenFromList: false,
    },
    spreadY: {
      type: "number",
      default: 1.3,
      min: 1,
      max: 2.5,
      step: 0.01,
      description: "Spread (y)",
      hiddenFromList: false,
    },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// RoughBox: hand-drawn rectangle around rect (rough-notation Box) — wrapped paragraphs and cards.
// ---------------------------------------------------------------------------------------------

const RoughBoxInner: React.FC<AnnotateBaseProps> = ({
  rect,
  at,
  frames = 12,
  tone = "lime",
  color,
  strokeWidth = 6,
  padding = 10,
  seed = 1,
  iterations = 2,
  roughness = 1.2,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...anchorStyle(rect), ...style }}>
      <Box
        name="Rough box"
        progress={interpolate(frame, [at, at + Math.max(1, frames)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
        padding={{
          left: padding,
          right: padding,
          top: padding,
          bottom: padding,
        }}
        color={color ?? toneColor(tone)}
        strokeWidth={strokeWidth}
        iterations={Math.max(1, Math.round(iterations))}
        roughness={roughness}
        seed={seed}
      >
        <div style={{ width: rect.w, height: rect.h }} />
      </Box>
    </div>
  );
};
export const RoughBox = Interactive.create({
  Component: RoughBoxInner,
  layout: "none",
  schema: {
    ...annotateSchema,
    padding: { ...annotateSchema.padding, default: 10 },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// RoughUnderline: one rough stroke left → right at rect bottom + padding (rect = the text's box;
// the brief's "baseline y" = rect.y + rect.h).
// ---------------------------------------------------------------------------------------------

const RoughUnderlineInner: React.FC<AnnotateBaseProps> = ({
  rect,
  at,
  frames = 12,
  tone = "lime",
  color,
  strokeWidth = 6,
  padding = 4,
  seed = 1,
  iterations = 1,
  roughness = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...anchorStyle(rect), ...style }}>
      <Underline
        name="Rough underline"
        progress={interpolate(frame, [at, at + Math.max(1, frames)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
        padding={{ top: padding }}
        color={color ?? toneColor(tone)}
        strokeWidth={strokeWidth}
        iterations={Math.max(1, Math.round(iterations))}
        roughness={roughness}
        bowing={0.5}
        seed={seed}
      >
        <div style={{ width: rect.w, height: rect.h }} />
      </Underline>
    </div>
  );
};
export const RoughUnderline = Interactive.create({
  Component: RoughUnderlineInner,
  layout: "none",
  schema: {
    ...annotateSchema,
    padding: { ...annotateSchema.padding, default: 4 },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// Highlighter: marker band over rect (rough-notation Highlight, stroke = rect.h + 2 × padding),
// wiping left → right, multiply-blended over the screenshot so ink text stays crisp. For the
// lime-tint tone on paper (S6 `Points go to` / `the standings when you save.`).
// ---------------------------------------------------------------------------------------------

type HighlighterProps = AnnotateBaseProps & {
  /** CSS mix-blend-mode of the band ("multiply" keeps ink text readable on paper). */
  readonly blend?: "multiply" | "normal" | "screen" | "darken";
};

const HighlighterInner: React.FC<HighlighterProps> = ({
  rect,
  at,
  frames = 16,
  tone = "tint",
  color,
  padding = 4,
  seed = 1,
  iterations = 2,
  roughness = 2,
  blend = "multiply",
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...anchorStyle(rect), mixBlendMode: blend, ...style }}>
      <Highlight
        name="Highlighter"
        progress={interpolate(frame, [at, at + Math.max(1, frames)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
        padding={{
          left: padding,
          right: padding,
          top: padding,
          bottom: padding,
        }}
        color={color ?? toneColor(tone)}
        iterations={Math.max(1, Math.round(iterations))}
        roughness={roughness}
        seed={seed}
      >
        <div style={{ width: rect.w, height: rect.h }} />
      </Highlight>
    </div>
  );
};
export const Highlighter = Interactive.create({
  Component: HighlighterInner,
  layout: "none",
  schema: {
    at: annotateSchema.at,
    frames: { ...annotateSchema.frames, default: 16 },
    tone: { ...annotateSchema.tone, default: "tint" },
    padding: { ...annotateSchema.padding, default: 4 },
    seed: annotateSchema.seed,
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// RowFlash: a row / card flashes in (3 f) and settles to `hold` by at + frames.
//   mode "fill" (default): rounded fill over rect. Blend "auto": tint/ink → multiply (light rows,
//     S7 Maya K. / Sam B. on the paper table), lime → screen (brightens dark rows and lime cards:
//     S7 SF row on a night card). The fill peaks in `flashColor` (tint tone: lime, so the flash
//     reads on a row that is already pale lime) and settles into the tone colour. The lime tone
//     also draws an inset lime outline (`outline`, parent px) at full strength, and its fill
//     defaults to a lower peak/hold (.45 / .18) so white row text keeps its contrast.
//     Defaults for tint / ink: peak .75, hold .35.
//   mode "glow": no fill; a lime outline + outer glow pulses around rect (rise over the first
//     half, fall over the second) — S8 "soft lime glow pulses around the lime card".
// ---------------------------------------------------------------------------------------------

type RowFlashProps = Omit<
  AnnotateBaseProps,
  "strokeWidth" | "seed" | "iterations" | "roughness"
> & {
  /** Peak opacity of the flash. */
  readonly peak?: number;
  /** Opacity it settles to after the flash (0 = gone). */
  readonly hold?: number;
  readonly mode?: "fill" | "glow";
  readonly blend?: "auto" | "multiply" | "screen" | "normal";
  /** Corner radius (parent px). */
  readonly radius?: number;
  /** Glow blur (parent px, mode "glow"). */
  readonly glow?: number;
  /** Colour at the peak (default: lime for the tint tone, else the tone colour). */
  readonly flashColor?: string;
  /** Inset outline width in parent px (fill mode; default 3 for the lime tone, else 0). */
  readonly outline?: number;
};

const RowFlashInner: React.FC<RowFlashProps> = ({
  rect,
  at,
  frames = 13,
  tone = "tint",
  color,
  padding = 0,
  peak,
  hold,
  mode = "fill",
  blend = "auto",
  radius = 8,
  glow = 36,
  flashColor,
  outline,
  style,
}) => {
  const frame = useCurrentFrame();
  const c = color ?? toneColor(tone);
  const limeFill = mode === "fill" && tone === "lime";
  const peakO = peak ?? (limeFill ? 0.45 : 0.75);
  const holdO = hold ?? (limeFill ? 0.18 : 0.35);
  const ring = outline ?? (limeFill ? 3 : 0);
  const peakColor =
    flashColor ??
    (tone === "tint" && color === undefined ? RALLYO_COLORS.lime : c);
  const len = Math.max(4, frames);
  const mid = mode === "glow" ? Math.max(1, Math.round(len / 2)) : 3;
  const mixBlendMode =
    blend !== "auto" ? blend : tone === "lime" ? "screen" : "multiply";
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x - padding,
        top: rect.y - padding,
        width: rect.w + 2 * padding,
        height: rect.h + 2 * padding,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          backgroundColor:
            mode === "fill"
              ? interpolateColors(frame, [at + mid, at + len], [peakColor, c])
              : "rgba(0, 0, 0, 0)",
          mixBlendMode: mode === "fill" ? mixBlendMode : "normal",
          boxShadow:
            mode === "glow"
              ? `0 0 0 ${Math.max(2, glow / 12)}px ${c}, 0 0 ${glow}px ${glow / 3}px ${c}`
              : "none",
          opacity: interpolate(
            frame,
            [at, at + mid, at + len],
            [0, peakO, holdO],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      />
      {ring > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: `inset 0 0 0 ${ring}px ${peakColor}`,
            // Same curve as the fill, normalised so the outline peaks at full strength.
            opacity: interpolate(
              frame,
              [at, at + mid, at + len],
              [0, 1, Math.min(1, holdO / Math.max(0.01, peakO))],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
          }}
        />
      ) : null}
    </div>
  );
};
export const RowFlash = Interactive.create({
  Component: RowFlashInner,
  layout: "none",
  schema: {
    at: annotateSchema.at,
    frames: { ...annotateSchema.frames, default: 13 },
    tone: { ...annotateSchema.tone, default: "tint" },
    peak: {
      type: "number",
      default: 0.75,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Peak",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 0.35,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Hold",
      hiddenFromList: false,
    },
    mode: {
      type: "enum",
      default: "fill",
      description: "Mode",
      variants: { fill: {}, glow: {} },
    },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// Connector: path drawn with evolvePath (S7 QF winner → SF row), EASE.inOut. `d` in parent px.
// Optional end dots: the start dot pops at `at`, the end dot when the stroke arrives.
// ---------------------------------------------------------------------------------------------

type ConnectorProps = {
  readonly d: string;
  readonly at: number;
  readonly frames?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
  /** SVG viewport size in parent px (the device source box). */
  readonly boxW?: number;
  readonly boxH?: number;
  /** Node dots at both ends (radius = 1.3 × strokeWidth). */
  readonly dots?: boolean;
  readonly style?: React.CSSProperties;
};

const ConnectorInner: React.FC<ConnectorProps> = ({
  d,
  at,
  frames = 15,
  color = RALLYO_COLORS.lime,
  strokeWidth = 8,
  boxW = 2880,
  boxH = 1800,
  dots = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const len = Math.max(1, frames);
  const evolved = evolvePath(
    interpolate(frame, [at, at + len], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.83, 0, 0.17, 1),
    }),
    d,
  );
  const total = getLength(d);
  const start = getPointAtLength(d, 0) ?? { x: 0, y: 0 };
  const end = getPointAtLength(d, total) ?? start;
  const r = strokeWidth * 1.3;
  return (
    <svg
      width={boxW}
      height={boxH}
      viewBox={`0 0 ${boxW} ${boxH}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        pointerEvents: "none",
        ...style,
      }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={evolved.strokeDasharray}
        strokeDashoffset={evolved.strokeDashoffset}
        opacity={frame < at ? 0 : 1}
      />
      {dots ? (
        <>
          <circle
            cx={start.x}
            cy={start.y}
            fill={color}
            r={interpolate(frame, [at, at + 6], [0, r], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 14, stiffness: 160 }),
            })}
          />
          <circle
            cx={end.x}
            cy={end.y}
            fill={color}
            r={interpolate(frame, [at + len - 3, at + len + 3], [0, r], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 14, stiffness: 160 }),
            })}
          />
        </>
      ) : null}
    </svg>
  );
};
export const Connector = Interactive.create({
  Component: ConnectorInner,
  layout: "none",
  schema: {
    d: {
      type: "svg-path",
      default: "M 100 100 L 400 100",
      description: "Path",
    },
    at: annotateSchema.at,
    frames: { ...annotateSchema.frames, default: 15 },
    color: { type: "color", default: "#C8F23A", description: "Color" },
    strokeWidth: { ...annotateSchema.strokeWidth, default: 8 },
    dots: { type: "boolean", default: true, description: "End dots" },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// RiseMask: children are visible everywhere except the part of `rect` above the rising reveal
// line (S6 podium bars: crop y 575-1040 revealed bottom → top over local 111-129, EASE.out).
// The hidden band shows `fillColor` (default: transparent = whatever is behind the mask). For the
// podium, keep the band inside the card and paint it the card colour so no seam shows:
// rect { x: 76, y: 575, w: 1018, h: 465 }, fillColor "#111B14" (card x 72-1098, border 3 px).
// ---------------------------------------------------------------------------------------------

type RiseMaskProps = {
  readonly children?: React.ReactNode;
  readonly rect: Rect;
  readonly at: number;
  readonly frames?: number;
  /** Size of the parent box the children fill (source px). */
  readonly boxW?: number;
  readonly boxH?: number;
  /** Paint for the still-hidden band (the surface the children sit on). */
  readonly fillColor?: string;
  readonly style?: React.CSSProperties;
};

/** Preview only (no children): three podium-style bars standing on rect's bottom edge. */
const RiseMaskPreview: React.FC<{ readonly rect: Rect }> = ({ rect }) => {
  const barW = rect.w / 3 - 12;
  const bars = [
    { i: 0, h: 0.72, color: RALLYO_COLORS.fg2 },
    { i: 1, h: 1, color: RALLYO_COLORS.lime },
    { i: 2, h: 0.55, color: RALLYO_COLORS.limeTint },
  ];
  return (
    <>
      {bars.map((b) => (
        <div
          key={b.i}
          style={{
            position: "absolute",
            left: rect.x + 6 + b.i * (barW + 12),
            top: rect.y + rect.h * (1 - b.h),
            width: barW,
            height: rect.h * b.h,
            borderRadius: "12px 12px 0px 0px",
            backgroundColor: b.color,
          }}
        />
      ))}
    </>
  );
};

const RiseMaskInner: React.FC<RiseMaskProps> = ({
  children,
  rect,
  at,
  frames = 18,
  boxW = 1170,
  boxH = 2532,
  fillColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const lineY =
    rect.y +
    rect.h *
      interpolate(frame, [at, at + Math.max(1, frames)], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
  const { x, y, w } = rect;
  // Even-odd polygon = whole box minus the hidden band [x, x+w] × [y, lineY].
  const clip =
    `polygon(evenodd, 0px 0px, ${boxW}px 0px, ${boxW}px ${boxH}px, 0px ${boxH}px, 0px 0px, ` +
    `${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${lineY}px, ${x}px ${lineY}px, ${x}px ${y}px)`;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: boxW,
        height: boxH,
        ...style,
      }}
    >
      {fillColor ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: w,
            height: Math.max(0, lineY - y),
            backgroundColor: fillColor,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: boxW,
          height: boxH,
          clipPath: clip,
        }}
      >
        {children ?? <RiseMaskPreview rect={rect} />}
      </div>
    </div>
  );
};
export const RiseMask = Interactive.create({
  Component: RiseMaskInner,
  layout: "none",
  schema: {
    at: annotateSchema.at,
    frames: { ...annotateSchema.frames, default: 18 },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// Confetti: sparse, deterministic (random(seed)), at most 24 flakes falling through `area` with a
// gravity curve, sway, spin and a paper flip. Flakes start in 4 waves (0/3/6/9 f after `at`).
// ---------------------------------------------------------------------------------------------

type ConfettiProps = {
  readonly area: Rect;
  readonly at: number;
  readonly frames?: number;
  readonly count?: number;
  readonly seed?: string;
  readonly colors?: readonly string[];
  /** Flake length in parent px. */
  readonly size?: number;
  readonly style?: React.CSSProperties;
};

const ConfettiInner: React.FC<ConfettiProps> = ({
  area,
  at,
  frames = 33,
  count = 24,
  seed = "rallyo-confetti",
  colors = [
    RALLYO_COLORS.lime,
    RALLYO_COLORS.limeTint,
    RALLYO_COLORS.lime,
    RALLYO_COLORS.fg,
  ],
  size = 18,
  style,
}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(24, Math.round(count)));
  if (frame < at || n === 0 || colors.length === 0) {
    return null;
  }
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
      {new Array(n).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const delay = 3 * Math.floor(r("delay") * 4);
        const life = Math.max(6, frames - delay);
        const t = interpolate(frame, [at + delay, at + delay + life], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const square = i % 3 === 0;
        const w = square ? size * 0.6 : size;
        const h = square ? size * 0.6 : size * 0.45;
        const x0 = area.x + r("x") * area.w;
        const y0 = area.y - 0.05 * area.h + r("y") * 0.25 * area.h;
        const fall = (0.55 + 0.45 * r("fall")) * area.h;
        const sway =
          (8 + r("sway") * 18) *
          Math.sin(
            t * Math.PI * (2 + 2 * r("freq")) + r("phase") * Math.PI * 2,
          );
        const spin =
          (r("rot") * 360 +
            t * (220 + r("spin") * 320) * (r("dir") < 0.5 ? -1 : 1)) %
          360;
        const flip = Math.cos(t * Math.PI * (2 + 3 * r("flip")));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + sway - w / 2,
              top: y0 + fall * (0.35 * t + 0.65 * t * t) - h / 2,
              width: w,
              height: h,
              borderRadius: square ? 2 : 1,
              backgroundColor: colors[i % colors.length],
              rotate: `${spin}deg`,
              scale: `1 ${Math.max(0.15, Math.abs(flip))}`,
              opacity: interpolate(t, [0, 0.08, 0.7, 1], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        );
      })}
    </div>
  );
};
export const Confetti = Interactive.create({
  Component: ConfettiInner,
  layout: "none",
  schema: {
    at: annotateSchema.at,
    frames: { ...annotateSchema.frames, default: 33 },
    count: {
      type: "number",
      default: 24,
      min: 1,
      max: 24,
      step: 1,
      integer: true,
      description: "Particles",
      hiddenFromList: false,
    },
    size: {
      type: "number",
      default: 18,
      min: 4,
      step: 1,
      description: "Flake size",
      hiddenFromList: false,
    },
  } as const satisfies InteractivitySchema,
});

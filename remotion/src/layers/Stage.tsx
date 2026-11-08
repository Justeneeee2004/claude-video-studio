import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS, RALLYO_FONTS } from "../theme/rallyo";

/**
 * Stage clip for devices (brief section 5 "Stage"). Owner: camera-screens implementer.
 *
 * Children (CameraRig → devices, plus canvas-space pointers) render inside a clip that starts at
 * y `clipTop` (570; scenes 1-2: 520) and runs to the bottom of the canvas (devices may bleed off
 * the bottom). Drawn ABOVE the children, all in the night colour:
 * - top fade: opaque at clipTop → clear at clipTop + topFade (24 px),
 * - side fades x 0-56 and x 924-1080: clear at the inner edge → 85% night, reached 70% of the way
 *   out and held to the canvas edge (so UI under the right rail is dimmed hard, not half-read),
 * - lower scrim: clear at y `scrimTop` → `scrimOpacity` at y `scrimBottom`, held to the bottom.
 *   Default (draft v2, director note a) = STAGE_LOWER_FADE: clear to y 1290 → 85% at y 1590, a 300 px
 *   smoothstep ramp (≈ 9% at 1350, ≈ 47% at 1450). Text and callouts still end at y 1248, but the
 *   device imagery now reads down to ≈ y 1450 instead of dying at 1250 (v1 default 1250 → 1450 left
 *   the lower third of the host frames as an empty dark band). Scenes that override the scrim
 *   (S3 / S4 / S7 / S8 / S10) pass their own values.
 * Ramps use smoothstep stops, so no band edge shows. Children above clipTop never draw, so a
 * pushed device can never show UI under the chip or headline. The clip is static: it never moves
 * with the camera.
 */

/** Default lower scrim (draft v2): scenes that animate back to "the default" can read these numbers. */
export const STAGE_LOWER_FADE = { scrimTop: 1290, scrimBottom: 1590, scrimOpacity: 0.85 } as const;

/** v1 lower scrim (clear at 1250 → 85% at 1450), kept for reference / A-B checks. */
export const STAGE_LOWER_FADE_V1 = { scrimTop: 1250, scrimBottom: 1450, scrimOpacity: 0.85 } as const;

type StageProps = {
  readonly children?: React.ReactNode;
  readonly clipTop?: number;
  readonly topFade?: number;
  readonly sideFadeLeft?: number;
  readonly sideFadeRight?: number;
  readonly sideOpacity?: number;
  readonly scrimTop?: number;
  readonly scrimBottom?: number;
  readonly scrimOpacity?: number;
  /** Night colour used by the fades and scrim (#RGB, #RRGGBB or rgb()). */
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

const CANVAS_W = 1080;
const CANVAS_H = 1920;

/** "r, g, b" from #RGB / #RRGGBB / #RRGGBBAA / rgb() / rgba(); falls back to night. */
const rgbOf = (color: string): string => {
  const c = color.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (d) => d + d) : hex[1].slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ");
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c);
  if (fn) {
    return `${fn[1]}, ${fn[2]}, ${fn[3]}`;
  }
  return "11, 19, 13";
};

const smoothstep = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Gradient stops (px from the gradient line's start) ramping alpha a0 → a1 over [0, rampPx] with
 * smoothstep, then holding a1.
 */
const rampStops = (rgb: string, a0: number, a1: number, rampPx: number): string => {
  const steps = 8;
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + (a1 - a0) * smoothstep(t);
    stops.push(`rgba(${rgb}, ${a.toFixed(4)}) ${(t * rampPx).toFixed(2)}px`);
  }
  stops.push(`rgba(${rgb}, ${a1.toFixed(4)}) 100%`);
  return stops.join(", ");
};

/** Preview only (no children): a test card so the clip line and the fades read in Studio. */
const StagePreview: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: "#EEF1EA",
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(11, 19, 13, 0.9) 0px, rgba(11, 19, 13, 0.9) 4px, transparent 4px, transparent 50px), repeating-linear-gradient(90deg, rgba(200, 242, 58, 0.9) 0px, rgba(200, 242, 58, 0.9) 4px, transparent 4px, transparent 50px)",
      color: "#0B130D",
      fontFamily: RALLYO_FONTS.ui,
      fontWeight: 900,
      fontSize: 44,
      lineHeight: "50px",
      whiteSpace: "pre",
      overflow: "hidden",
    }}
  >
    {Array.from({ length: 38 }, (_, i) => `y ${i * 50}  STAGE TEST CARD  y ${i * 50}  STAGE TEST CARD`).join("\n")}
  </div>
);

const StageInner: React.FC<StageProps> = ({
  children,
  clipTop = 570,
  topFade = 24,
  sideFadeLeft = 56,
  sideFadeRight = 924,
  sideOpacity = 0.85,
  scrimTop = 1290,
  scrimBottom = 1590,
  scrimOpacity = 0.85,
  color = RALLYO_COLORS.night,
  style,
}) => {
  const rgb = rgbOf(color);
  const leftW = Math.max(0, sideFadeLeft);
  const rightW = Math.max(0, CANVAS_W - sideFadeRight);
  const scrimRamp = Math.max(0, scrimBottom - scrimTop);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: clipTop, bottom: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: -clipTop, width: CANVAS_W, height: CANVAS_H }}>
          {children ?? <StagePreview />}
        </div>
      </div>
      {topFade > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: clipTop,
            height: topFade,
            backgroundImage: `linear-gradient(180deg, ${rampStops(rgb, 1, 0, topFade)})`,
          }}
        />
      ) : null}
      {leftW > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: clipTop,
            bottom: 0,
            width: leftW,
            // From the inner edge (x = sideFadeLeft) outwards to x 0.
            backgroundImage: `linear-gradient(270deg, ${rampStops(rgb, 0, sideOpacity, leftW * 0.7)})`,
          }}
        />
      ) : null}
      {rightW > 0 ? (
        <div
          style={{
            position: "absolute",
            left: sideFadeRight,
            top: clipTop,
            bottom: 0,
            right: 0,
            // From the inner edge (x = sideFadeRight) outwards to x 1080.
            backgroundImage: `linear-gradient(90deg, ${rampStops(rgb, 0, sideOpacity, rightW * 0.7)})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: Math.max(clipTop, scrimTop),
          bottom: 0,
          backgroundImage: `linear-gradient(180deg, ${rampStops(rgb, 0, scrimOpacity, scrimRamp)})`,
        }}
      />
    </div>
  );
};

const stageSchema = {
  clipTop: { type: "number", default: 570, step: 1, description: "Clip top (y)", hiddenFromList: false },
  topFade: { type: "number", default: 24, min: 0, step: 1, description: "Top fade (px)", hiddenFromList: false },
  sideFadeLeft: { type: "number", default: 56, min: 0, step: 1, description: "Left fade to (x)", hiddenFromList: false },
  sideFadeRight: { type: "number", default: 924, max: 1080, step: 1, description: "Right fade from (x)", hiddenFromList: false },
  sideOpacity: { type: "number", default: 0.85, min: 0, max: 1, step: 0.05, description: "Side fade opacity", hiddenFromList: false },
  scrimTop: { type: "number", default: 1290, step: 1, description: "Scrim start (y)", hiddenFromList: false },
  scrimBottom: { type: "number", default: 1590, step: 1, description: "Scrim full (y)", hiddenFromList: false },
  scrimOpacity: { type: "number", default: 0.85, min: 0, max: 1, step: 0.05, description: "Scrim opacity", hiddenFromList: false },
  color: { type: "color", default: "#0B130D", description: "Night" },
} as const satisfies InteractivitySchema;

export const Stage = Interactive.create({
  Component: StageInner,
  layout: "none",
  schema: stageSchema,
});

import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS } from "../../theme/rallyo";

/**
 * CarouselStage (carousel spec 3.4): the device clip for the 1080x1080 cards. Same contract as layers/Stage (clip
 * from `clipTop` to the bottom, `topFade` px soft top edge, optional lower scrim in night) with one change: the top
 * fade is a transparent MASK on the devices instead of a band painted in night. The cards sit on a lime glow (and
 * card 8 on a photo), and Stage's painted night band read as a dark stripe across the glow at the clip line
 * (measured on the first stills: rgb 19,29,15 → 10,18,12 at y 520 on card 1). layers/Stage stays untouched for the
 * reel. No side fades (the spec's sideOpacity 0). Static.
 */

const W = 1080;
const H = 1080;

const smoothstep = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Smoothstep ramp a0 → a1 over [0, rampPx] px of a vertical gradient, as CSS stops in `rgba(r, g, b, a)`. */
const ramp = (rgb: string, a0: number, a1: number, rampPx: number): string => {
  const steps = 8;
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stops.push(`rgba(${rgb}, ${(a0 + (a1 - a0) * smoothstep(t)).toFixed(4)}) ${(t * rampPx).toFixed(2)}px`);
  }
  stops.push(`rgba(${rgb}, ${a1.toFixed(4)}) 100%`);
  return stops.join(", ");
};

const rgbOf = (hex: string): string => {
  const m = /^#([0-9a-f]{6})/i.exec(hex.trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(", ") : "11, 19, 13";
};

type CarouselStageProps = {
  readonly children?: React.ReactNode;
  readonly clipTop?: number;
  readonly topFade?: number;
  /** Lower scrim: clear at scrimTop → scrimOpacity night at scrimBottom (≥ 1080 = none). */
  readonly scrimTop?: number;
  readonly scrimBottom?: number;
  readonly scrimOpacity?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

const CarouselStageInner: React.FC<CarouselStageProps> = ({
  children,
  clipTop = 440,
  topFade = 24,
  scrimTop = 1080,
  scrimBottom = 1200,
  scrimOpacity = 0.85,
  color = RALLYO_COLORS.night,
  style,
}) => {
  const mask = topFade > 0 ? `linear-gradient(180deg, ${ramp("0, 0, 0", 0, 1, topFade)})` : undefined;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none", ...style }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: clipTop,
          width: W,
          height: Math.max(0, H - clipTop),
          overflow: "hidden",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: -clipTop, width: W, height: H }}>{children}</div>
      </div>
      {scrimTop < H ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: Math.max(clipTop, scrimTop),
            width: W,
            height: H - Math.max(clipTop, scrimTop),
            backgroundImage: `linear-gradient(180deg, ${ramp(rgbOf(color), 0, scrimOpacity, Math.max(1, scrimBottom - scrimTop))})`,
          }}
        />
      ) : null}
    </div>
  );
};

const carouselStageSchema = {
  clipTop: { type: "number", default: 440, step: 1, description: "Clip top (y)", hiddenFromList: false },
  topFade: { type: "number", default: 24, min: 0, step: 1, description: "Top fade (px)", hiddenFromList: false },
  scrimTop: { type: "number", default: 1080, step: 1, description: "Scrim start (y)", hiddenFromList: false },
  scrimBottom: { type: "number", default: 1200, step: 1, description: "Scrim full (y)", hiddenFromList: false },
  scrimOpacity: { type: "number", default: 0.85, min: 0, max: 1, step: 0.05, description: "Scrim opacity", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const CarouselStage = Interactive.create({
  Component: CarouselStageInner,
  layout: "none",
  schema: carouselStageSchema,
});

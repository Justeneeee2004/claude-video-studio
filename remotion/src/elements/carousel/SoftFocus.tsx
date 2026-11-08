import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS } from "../../theme/rallyo";
import type { Rect } from "../CameraRig";

/**
 * SoftFocus (carousel spec 5: card 1 / 8 home lead band, card 7 games list): a soft-focus layer over part of a real
 * capture, placed INSIDE a device's children slot (rect, blur and feather in the device's source px / su). Backdrop
 * blur `blur` + a night tint at `tint`, optionally feathered at the top edge so it reads as depth, not as a box.
 * It never redraws UI: the pixels underneath are the capture's own, only out of focus.
 */

type SoftFocusProps = {
  readonly rect: Rect;
  /** Backdrop blur radius (parent px). */
  readonly blur?: number;
  /** Night tint opacity 0–1. */
  readonly tint?: number;
  readonly color?: string;
  /** Feathered top edge (parent px, 0 = hard edge). */
  readonly featherTop?: number;
  readonly radius?: number;
  readonly style?: React.CSSProperties;
};

const SoftFocusInner: React.FC<SoftFocusProps> = ({
  rect,
  blur = 14,
  tint = 0.3,
  color = RALLYO_COLORS.night,
  featherTop = 0,
  radius = 0,
  style,
}) => {
  const mask = featherTop > 0 ? `linear-gradient(180deg, transparent 0px, black ${featherTop}px)` : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: radius,
        overflow: "hidden",
        backdropFilter: `blur(${blur}px)`,
        maskImage: mask,
        WebkitMaskImage: mask,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: color, opacity: tint }} />
    </div>
  );
};

const softFocusSchema = {
  blur: { type: "number", default: 14, min: 0, max: 80, step: 1, description: "Blur (parent px)", hiddenFromList: false },
  tint: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Night tint", hiddenFromList: false },
  featherTop: { type: "number", default: 0, min: 0, step: 1, description: "Top feather (parent px)", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const SoftFocus = Interactive.create({
  Component: SoftFocusInner,
  layout: "none",
  schema: softFocusSchema,
});

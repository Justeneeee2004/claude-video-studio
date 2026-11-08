import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";

type VignetteOverlayProps = {
  readonly amount?: number;
  readonly style?: React.CSSProperties;
};

// CSS vignette (no WebGL). For a canvas-based one use vignette() from @remotion/effects.
const VignetteOverlayInner: React.FC<VignetteOverlayProps> = ({
  amount = 0.5,
  style,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, ${amount}) 100%)`,
        ...style,
      }}
    />
  );
};

const vignetteOverlaySchema = {
  amount: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.5,
    description: "Darkness at edges",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

export const VignetteOverlay = Interactive.create({
  Component: VignetteOverlayInner,
  layout: "none",
  schema: vignetteOverlaySchema,
});

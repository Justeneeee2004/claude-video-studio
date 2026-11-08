import type React from "react";
import { useId } from "react";
import { Interactive, useCurrentFrame, type InteractivitySchema } from "remotion";

type GrainOverlayProps = {
  readonly opacity?: number;
  readonly animate?: boolean;
  readonly style?: React.CSSProperties;
};

// Film grain via SVG turbulence. CSS/SVG only, so it previews without WebGL.
const GrainOverlayInner: React.FC<GrainOverlayProps> = ({
  opacity = 0.12,
  animate = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const seed = animate ? Math.floor(frame / 2) % 50 : 1;

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        ...style,
      }}
    >
      <filter id={`grain-${id}`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="2"
          seed={seed}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${id})`} />
    </svg>
  );
};

const grainOverlaySchema = {
  opacity: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.12,
    description: "Grain opacity",
    hiddenFromList: false,
  },
  animate: { type: "boolean", default: true, description: "Animate grain" },
} as const satisfies InteractivitySchema;

export const GrainOverlay = Interactive.create({
  Component: GrainOverlayInner,
  layout: "none",
  schema: grainOverlaySchema,
});

import { noise2D } from "@remotion/noise";
import type React from "react";
import {
  Interactive,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";

type AmbientOrbsProps = {
  readonly colorA?: string;
  readonly colorB?: string;
  readonly intensity?: number;
  readonly style?: React.CSSProperties;
};

// Two soft color blobs drifting on simplex noise. Deterministic per frame.
const AmbientOrbsInner: React.FC<AmbientOrbsProps> = ({
  colorA = "#6366F1",
  colorB = "#22D3EE",
  intensity = 0.55,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 90;
  const size = Math.max(width, height) * 0.9;
  const ax = width * (0.22 + 0.1 * noise2D("orb-a-x", t, 0));
  const ay = height * (0.3 + 0.1 * noise2D("orb-a-y", 0, t));
  const bx = width * (0.8 + 0.1 * noise2D("orb-b-x", t, 7));
  const by = height * (0.75 + 0.1 * noise2D("orb-b-y", 7, t));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: intensity,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: ax,
          top: ay,
          width: size,
          height: size,
          translate: "-50% -50%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colorA} 0%, rgba(0, 0, 0, 0) 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: bx,
          top: by,
          width: size * 0.8,
          height: size * 0.8,
          translate: "-50% -50%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colorB} 0%, rgba(0, 0, 0, 0) 62%)`,
        }}
      />
    </div>
  );
};

const ambientOrbsSchema = {
  colorA: { type: "color", default: "#6366F1", description: "Orb A" },
  colorB: { type: "color", default: "#22D3EE", description: "Orb B" },
  intensity: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.55,
    description: "Intensity",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

export const AmbientOrbs = Interactive.create({
  Component: AmbientOrbsInner,
  layout: "none",
  schema: ambientOrbsSchema,
});

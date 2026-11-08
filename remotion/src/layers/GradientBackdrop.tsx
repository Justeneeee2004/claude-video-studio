import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";

type GradientBackdropProps = {
  readonly colorA?: string;
  readonly colorB?: string;
  readonly angle?: number;
  readonly style?: React.CSSProperties;
};

// CSS-only backdrop: previews everywhere, no WebGL needed.
const GradientBackdropInner: React.FC<GradientBackdropProps> = ({
  colorA = "#0B0F19",
  colorB = "#1E1B4B",
  angle = 160,
  style,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${angle}deg, ${colorA} 0%, ${colorB} 100%)`,
        ...style,
      }}
    />
  );
};

const gradientBackdropSchema = {
  colorA: { type: "color", default: "#0B0F19", description: "Color A" },
  colorB: { type: "color", default: "#1E1B4B", description: "Color B" },
  angle: {
    type: "number",
    min: 0,
    max: 360,
    step: 1,
    default: 160,
    description: "Angle",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

export const GradientBackdrop = Interactive.create({
  Component: GradientBackdropInner,
  layout: "none",
  schema: gradientBackdropSchema,
});

import type React from "react";
import { interpolate } from "remotion";

type ShineSweepProps = {
  readonly children: React.ReactNode;
  /** 0 → band left of the element, 1 → band has left on the right. Drive with interpolate(). */
  readonly progress: number;
  readonly angle?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

// Glossy light band sweeping across children. CSS only, previews everywhere.
export const ShineSweep: React.FC<ShineSweepProps> = ({
  children,
  progress,
  angle = 20,
  color = "rgba(255, 255, 255, 0.55)",
  style,
}) => {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: "-40%",
          pointerEvents: "none",
          mixBlendMode: "screen",
          background: `linear-gradient(${90 + angle}deg, rgba(255, 255, 255, 0) 42%, ${color} 50%, rgba(255, 255, 255, 0) 58%)`,
          translate: `${interpolate(progress, [0, 1], [-120, 120], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}% 0px`,
        }}
      />
    </div>
  );
};

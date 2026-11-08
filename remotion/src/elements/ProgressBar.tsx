import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";

type ProgressBarProps = {
  /** 0 → 1. Drive with interpolate() at the call site. */
  readonly progress?: number;
  readonly color?: string;
  readonly track?: string;
  readonly style?: React.CSSProperties;
};

const ProgressBarInner: React.FC<ProgressBarProps> = ({
  progress = 0,
  color = "#22D3EE",
  track = "rgba(255, 255, 255, 0.12)",
  style,
}) => {
  return (
    <div
      style={{
        width: 400,
        height: 12,
        borderRadius: 999,
        backgroundColor: track,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          height: "100%",
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

const progressBarSchema = {
  progress: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0,
    description: "Progress",
    hiddenFromList: false,
  },
  color: { type: "color", default: "#22D3EE", description: "Fill" },
  track: { type: "color", default: "rgba(255, 255, 255, 0.12)", description: "Track" },
} as const satisfies InteractivitySchema;

export const ProgressBar = Interactive.create({
  Component: ProgressBarInner,
  layout: "none",
  schema: progressBarSchema,
});

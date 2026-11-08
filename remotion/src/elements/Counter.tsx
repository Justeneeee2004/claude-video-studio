import type React from "react";
import {
  Interactive,
  spring,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { fonts } from "../theme/fonts";

type CounterProps = {
  readonly start?: number;
  readonly to?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly decimals?: number;
  /** Frames the count-up takes. */
  readonly countFrames?: number;
  /** Frames to wait before counting. */
  readonly delay?: number;
  readonly style?: React.CSSProperties;
};

// Animated number. Spring with no bounce so the value never overshoots.
const CounterInner: React.FC<CounterProps> = ({
  start = 0,
  to = 100,
  prefix = "",
  suffix = "",
  decimals = 0,
  countFrames = 45,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: countFrames,
    delay,
  });
  const value = start + (to - start) * progress;

  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 800,
        fontSize: 120,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: "#F9FAFB",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </div>
  );
};

const counterSchema = {
  ...Interactive.textSchema,
  start: { type: "number", step: 1, default: 0, description: "Start value", hiddenFromList: false },
  to: { type: "number", step: 1, default: 100, description: "End value", hiddenFromList: false },
  prefix: { type: "string", default: "", description: "Prefix" },
  suffix: { type: "string", default: "", description: "Suffix" },
  decimals: {
    type: "number",
    min: 0,
    max: 3,
    step: 1,
    integer: true,
    default: 0,
    description: "Decimals",
    hiddenFromList: false,
  },
  countFrames: {
    type: "number",
    min: 1,
    max: 300,
    step: 1,
    integer: true,
    default: 45,
    description: "Count frames",
    hiddenFromList: false,
  },
  delay: {
    type: "number",
    min: 0,
    max: 300,
    step: 1,
    integer: true,
    default: 0,
    description: "Delay (frames)",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

export const Counter = Interactive.create({
  Component: CounterInner,
  layout: "none",
  schema: counterSchema,
});

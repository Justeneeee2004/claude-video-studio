import { StrikeThrough } from "@remotion/rough-notation";
import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type PainRowProps = {
  readonly children?: React.ReactNode;
  /** 0 → 1 strike-through progress. Drive with interpolate() at the call site. */
  readonly strike?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

// "✕ pain point" row that gets crossed out. Used by ProblemScene.
const PainRowInner: React.FC<PainRowProps> = ({
  children,
  strike = 0,
  color = "#F43F5E",
  style,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, ...style }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: "rgba(244, 63, 94, 0.16)",
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: 34,
          flexShrink: 0,
        }}
      >
        ✕
      </div>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 60,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "#F9FAFB",
        }}
      >
        <StrikeThrough color={color} progress={strike} strokeWidth={5} iterations={1}>
          {children}
        </StrikeThrough>
      </div>
    </div>
  );
};

const painRowSchema = {
  ...Interactive.childrenSchema,
  strike: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0,
    description: "Strike progress",
    hiddenFromList: false,
  },
  color: { type: "color", default: "#F43F5E", description: "Color" },
} as const satisfies InteractivitySchema;

export const PainRow = Interactive.create({
  Component: PainRowInner,
  layout: "none",
  schema: painRowSchema,
});

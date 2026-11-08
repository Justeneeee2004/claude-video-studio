import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type FeatureCardProps = {
  readonly index?: number;
  readonly title?: string;
  readonly desc?: string;
  readonly accent?: string;
  readonly compact?: boolean;
  readonly style?: React.CSSProperties;
};

// Numbered feature tile. `compact` hides the description (square format).
const FeatureCardInner: React.FC<FeatureCardProps> = ({
  index = 1,
  title = "Feature",
  desc = "",
  accent = "#22D3EE",
  compact = false,
  style,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 16 : 22,
        padding: compact ? 28 : 40,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        width: 480,
        ...style,
      }}
    >
      <div
        style={{
          width: compact ? 60 : 72,
          height: compact ? 60 : 72,
          borderRadius: 22,
          backgroundColor: accent,
          color: "#0B0F19",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: compact ? 28 : 32,
        }}
      >
        {String(index).padStart(2, "0")}
      </div>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: compact ? 40 : 44,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "#F9FAFB",
        }}
      >
        {title}
      </div>
      {compact || !desc ? null : (
        <div
          style={{
            fontFamily: fonts.body,
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1.35,
            color: "#A1A1AA",
          }}
        >
          {desc}
        </div>
      )}
    </div>
  );
};

const featureCardSchema = {
  index: {
    type: "number",
    min: 1,
    max: 99,
    step: 1,
    integer: true,
    default: 1,
    description: "Number",
    hiddenFromList: false,
  },
  title: { type: "string", default: "Feature", description: "Title" },
  desc: { type: "string", default: "", description: "Description" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
  compact: { type: "boolean", default: false, description: "Compact" },
} as const satisfies InteractivitySchema;

export const FeatureCard = Interactive.create({
  Component: FeatureCardInner,
  layout: "none",
  schema: featureCardSchema,
});

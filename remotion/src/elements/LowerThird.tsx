import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type LowerThirdProps = {
  readonly children?: React.ReactNode;
  readonly accentColor?: string;
  readonly style?: React.CSSProperties;
};

// Caption bar anchored bottom-left. Override `left` / `bottom` via style for safe areas.
const LowerThirdInner: React.FC<LowerThirdProps> = ({
  children,
  accentColor = "#22D3EE",
  style,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 80,
        display: "flex",
        alignItems: "center",
        gap: 24,
        backgroundColor: "rgba(10, 12, 20, 0.82)",
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 18,
        padding: "22px 34px",
        color: "#F9FAFB",
        fontFamily: fonts.body,
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.2,
        ...style,
      }}
    >
      <div
        style={{
          width: 8,
          alignSelf: "stretch",
          borderRadius: 4,
          backgroundColor: accentColor,
          flexShrink: 0,
        }}
      />
      <div>{children}</div>
    </div>
  );
};

const lowerThirdSchema = {
  ...Interactive.childrenSchema,
  ...Interactive.textSchema,
  accentColor: { type: "color", default: "#22D3EE", description: "Accent color" },
} as const satisfies InteractivitySchema;

export const LowerThird = Interactive.create({
  Component: LowerThirdInner,
  layout: "none",
  schema: lowerThirdSchema,
});

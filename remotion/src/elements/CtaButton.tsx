import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type CtaButtonProps = {
  readonly children?: React.ReactNode;
  readonly color?: string;
  readonly textColor?: string;
  readonly style?: React.CSSProperties;
};

// Pill CTA. Pulse / pop it at the call site via `style.scale`.
const CtaButtonInner: React.FC<CtaButtonProps> = ({
  children,
  color = "#6366F1",
  textColor = "#FFFFFF",
  style,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        padding: "28px 56px",
        borderRadius: 999,
        backgroundColor: color,
        color: textColor,
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 44,
        letterSpacing: "-0.01em",
        boxShadow: `0 24px 60px -16px ${color}`,
        ...style,
      }}
    >
      <span>{children}</span>
      <span style={{ fontSize: 44, lineHeight: 1 }}>→</span>
    </div>
  );
};

const ctaButtonSchema = {
  ...Interactive.textSchema,
  ...Interactive.childrenSchema,
  color: { type: "color", default: "#6366F1", description: "Button color" },
  textColor: { type: "color", default: "#FFFFFF", description: "Label color" },
} as const satisfies InteractivitySchema;

export const CtaButton = Interactive.create({
  Component: CtaButtonInner,
  layout: "none",
  schema: ctaButtonSchema,
});

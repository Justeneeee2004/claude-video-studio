import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type BadgeProps = {
  readonly children?: React.ReactNode;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

// Kicker pill: glowing dot + uppercase label.
const BadgeInner: React.FC<BadgeProps> = ({ children, color = "#22D3EE", style }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 24px",
        borderRadius: 999,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        border: "1.5px solid rgba(255, 255, 255, 0.16)",
        fontFamily: fonts.body,
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#F9FAFB",
        ...style,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 18px ${color}`,
          flexShrink: 0,
        }}
      />
      <span>{children}</span>
    </div>
  );
};

const badgeSchema = {
  ...Interactive.textSchema,
  ...Interactive.childrenSchema,
  color: { type: "color", default: "#22D3EE", description: "Dot color" },
} as const satisfies InteractivitySchema;

export const Badge = Interactive.create({
  Component: BadgeInner,
  layout: "none",
  schema: badgeSchema,
});

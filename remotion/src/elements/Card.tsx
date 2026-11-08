import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";

type CardProps = {
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

// Glass panel container.
const CardInner: React.FC<CardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 48,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const cardSchema = {
  ...Interactive.backgroundSchema,
  ...Interactive.borderRadiusSchema,
} as const satisfies InteractivitySchema;

export const Card = Interactive.create({
  Component: CardInner,
  layout: "none",
  schema: cardSchema,
});

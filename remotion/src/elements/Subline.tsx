import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type SublineProps = {
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

// Supporting text. 44px is the minimum for important support copy at 1080 base.
const SublineInner: React.FC<SublineProps> = ({ children, style }) => {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: fonts.body,
        fontWeight: 500,
        fontSize: 44,
        lineHeight: 1.3,
        color: "#D4D4D8",
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </p>
  );
};

const sublineSchema = {
  ...Interactive.textSchema,
  ...Interactive.childrenSchema,
} as const satisfies InteractivitySchema;

export const Subline = Interactive.create({
  Component: SublineInner,
  layout: "none",
  schema: sublineSchema,
});

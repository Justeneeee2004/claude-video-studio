import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { fonts } from "../theme/fonts";

type HeadlineProps = {
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

// Static headline. Animate at the call site (opacity / translate / scale in `style`).
const HeadlineInner: React.FC<HeadlineProps> = ({ children, style }) => {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: fonts.display,
        fontWeight: 800,
        fontSize: 112,
        lineHeight: 1.02,
        letterSpacing: "-0.03em",
        color: "#F9FAFB",
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </h1>
  );
};

const headlineSchema = {
  ...Interactive.textSchema,
  ...Interactive.childrenSchema,
} as const satisfies InteractivitySchema;

export const Headline = Interactive.create({
  Component: HeadlineInner,
  layout: "none",
  schema: headlineSchema,
});

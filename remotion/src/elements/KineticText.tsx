import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";
import { fonts } from "../theme/fonts";

type KineticTextProps = {
  readonly text?: string;
  readonly by?: "word" | "char";
  /** Frames between each token's start. */
  readonly stagger?: number;
  /** Frames each token takes to land. */
  readonly enter?: number;
  /** Comma-separated words to color with accentColor. */
  readonly accentWords?: string;
  readonly accentColor?: string;
  /** Skip the animation (for stills / thumbnails). */
  readonly instant?: boolean;
  readonly style?: React.CSSProperties;
};

const normalize = (word: string) => word.replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase();

// Word-by-word (or char-by-char) rise-in. Uses its own timeline: set `from` on the instance.
const KineticTextInner: React.FC<KineticTextProps> = ({
  text = "",
  by = "word",
  stagger = 3,
  enter = 14,
  accentWords = "",
  accentColor = "#22D3EE",
  instant = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const tokens = by === "char" ? Array.from(text) : text.split(" ");
  const accents = new Set(
    accentWords
      .split(",")
      .map((w) => normalize(w.trim()))
      .filter(Boolean),
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: by === "word" ? "0.28em" : 0,
        rowGap: "0.08em",
        fontFamily: fonts.display,
        fontWeight: 800,
        fontSize: 112,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: "#F9FAFB",
        ...style,
      }}
    >
      {tokens.map((token, i) => {
        const start = i * stagger;
        const isAccent = accents.has(normalize(token));
        return (
          <span
            key={`${i}-${token}`}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              color: isAccent ? accentColor : undefined,
              opacity: instant
                ? 1
                : interpolate(frame, [start, start + enter], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
              translate: instant
                ? "0px 0px"
                : interpolate(frame, [start, start + enter], ["0px 44px", "0px 0px"], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
              rotate: instant
                ? "0deg"
                : interpolate(frame, [start, start + enter], ["-3deg", "0deg"], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
            }}
          >
            {token}
          </span>
        );
      })}
    </div>
  );
};

const kineticTextSchema = {
  ...Interactive.textSchema,
  text: { type: "string", default: "", description: "Text" },
  by: {
    type: "enum",
    default: "word",
    description: "Split by",
    variants: { word: {}, char: {} },
  },
  stagger: {
    type: "number",
    min: 0,
    max: 30,
    step: 1,
    integer: true,
    default: 3,
    description: "Stagger (frames)",
    hiddenFromList: false,
  },
  enter: {
    type: "number",
    min: 1,
    max: 60,
    step: 1,
    integer: true,
    default: 14,
    description: "Enter (frames)",
    hiddenFromList: false,
  },
  accentWords: { type: "string", default: "", description: "Accent words (comma separated)" },
  accentColor: { type: "color", default: "#22D3EE", description: "Accent color" },
  instant: { type: "boolean", default: false, description: "No animation" },
} as const satisfies InteractivitySchema;

export const KineticText = Interactive.create({
  Component: KineticTextInner,
  layout: "none",
  schema: kineticTextSchema,
});

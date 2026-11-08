import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import React, { useMemo } from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractiveTransformProps,
  type InteractivitySchema,
  type SequenceProps,
} from "remotion";
import { fonts } from "../theme/fonts";

type KineticCaptionsProps = InteractiveTransformProps &
  Pick<SequenceProps, "width"> & {
    readonly captions: Caption[];
    readonly combineTokensWithinMilliseconds?: number;
    readonly highlightColor?: string;
    readonly fontSize?: number;
  };

const defaultCombineTokensWithinMilliseconds = 1200;
const defaultWidth = 900;

const kineticCaptionsSchema = {
  ...Interactive.captionsSchema,
  width: {
    type: "number",
    min: 1,
    step: 1,
    default: undefined,
    description: "Caption area width",
    hiddenFromList: false,
  },
  combineTokensWithinMilliseconds: {
    type: "number",
    min: 0,
    step: 50,
    default: defaultCombineTokensWithinMilliseconds,
    description: "Time between caption pages",
    hiddenFromList: false,
  },
  highlightColor: { type: "color", default: "#22D3EE", description: "Active word color" },
  fontSize: {
    type: "number",
    min: 20,
    max: 200,
    step: 1,
    default: 72,
    description: "Font size",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

// TikTok-style pages; the word being spoken pops and takes the highlight color.
const KineticCaptionsContent: React.FC<KineticCaptionsProps> = ({
  captions,
  combineTokensWithinMilliseconds = defaultCombineTokensWithinMilliseconds,
  highlightColor = "#22D3EE",
  fontSize = 72,
  style,
  width = defaultWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds,
      }).pages,
    [captions, combineTokensWithinMilliseconds],
  );
  const currentTimeMs = (frame / fps) * 1000;
  const page = pages.find(
    (candidate) =>
      currentTimeMs >= candidate.startMs &&
      currentTimeMs < candidate.startMs + candidate.durationMs,
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width,
        ...style,
      }}
    >
      {page ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: "0.22em",
            rowGap: "0.1em",
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize,
            lineHeight: 1.1,
            color: "#FFFFFF",
            textAlign: "center",
            textShadow: "0 4px 24px rgba(0, 0, 0, 0.65)",
          }}
        >
          {page.tokens.map((token, i) => {
            const active = currentTimeMs >= token.fromMs && currentTimeMs < token.toMs;
            return (
              <span
                key={`${i}-${token.fromMs}`}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  color: active ? highlightColor : "#FFFFFF",
                  scale: active
                    ? interpolate(currentTimeMs, [token.fromMs, token.fromMs + 140], [0.9, 1.1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.out(Easing.back(1.6)),
                      })
                    : 1,
                }}
              >
                {token.text.trim()}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export const KineticCaptions = Interactive.create({
  Component: KineticCaptionsContent,
  componentName: "<KineticCaptions>",
  schema: kineticCaptionsSchema,
});

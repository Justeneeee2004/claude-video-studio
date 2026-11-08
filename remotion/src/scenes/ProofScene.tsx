import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { Card } from "../elements/Card";
import { Counter } from "../elements/Counter";
import { StarRating } from "../elements/StarRating";
import { Subline } from "../elements/Subline";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { safeArea } from "../lib/formats";
import { fonts } from "../theme/fonts";

type ProofSceneProps = {
  readonly stat1Value?: number;
  readonly stat1Suffix?: string;
  readonly stat1Label?: string;
  readonly stat2Value?: number;
  readonly stat2Suffix?: string;
  readonly stat2Label?: string;
  readonly quote?: string;
  readonly author?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly primary?: string;
  readonly accent?: string;
};

// Scene 5: two count-up stats + testimonial card.
const ProofSceneInner: React.FC<ProofSceneProps> = ({
  stat1Value = 0,
  stat1Suffix = "",
  stat1Label = "",
  stat2Value = 0,
  stat2Suffix = "",
  stat2Label = "",
  quote = "",
  author = "",
  bg = "#0B0F19",
  bg2 = "#1E1B4B",
  primary = "#6366F1",
  accent = "#22D3EE",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pad = safeArea(width, height);
  const horizontal = pad.o === "landscape";

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={bg2} colorB={bg} angle={160} />
      <AmbientOrbs name="Orbs" colorA={primary} colorB={accent} intensity={0.45} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 48,
          paddingTop: pad.top,
          paddingBottom: pad.bottom,
          paddingLeft: pad.left,
          paddingRight: pad.right,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: horizontal ? "row" : "column",
            gap: horizontal ? 80 : 32,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0, 0.4 * fps], ["0px 24px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <Counter
              name="Stat 1"
              to={stat1Value}
              suffix={stat1Suffix}
              countFrames={45}
              delay={6}
              style={{ color: accent, fontSize: horizontal ? 132 : 112 }}
            />
            <Subline name="Stat 1 label">{stat1Label}</Subline>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              opacity: interpolate(frame, [0.2 * fps, 0.6 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0.2 * fps, 0.6 * fps], ["0px 24px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <Counter
              name="Stat 2"
              to={stat2Value}
              suffix={stat2Suffix}
              countFrames={45}
              delay={12}
              style={{ color: "#F9FAFB", fontSize: horizontal ? 132 : 112 }}
            />
            <Subline name="Stat 2 label">{stat2Label}</Subline>
          </div>
        </div>
        {quote ? (
          <Card
            name="Testimonial"
            style={{
              opacity: interpolate(frame, [1.2 * fps, 1.7 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [1.2 * fps, 1.7 * fps], ["0px 32px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <StarRating name="Stars" rating={5} size={36} />
            <div
              style={{
                fontFamily: fonts.display,
                fontWeight: 600,
                fontSize: horizontal ? 48 : 42,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                color: "#F9FAFB",
                textWrap: "balance",
              }}
            >
              “{quote}”
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontWeight: 500,
                fontSize: 30,
                color: "#A1A1AA",
              }}
            >
              — {author}
            </div>
          </Card>
        ) : null}
      </div>
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.5} />
    </>
  );
};

const proofSceneSchema = {
  stat1Value: { type: "number", step: 1, default: 0, description: "Stat 1 value", hiddenFromList: false },
  stat1Suffix: { type: "string", default: "", description: "Stat 1 suffix" },
  stat1Label: { type: "string", default: "", description: "Stat 1 label" },
  stat2Value: { type: "number", step: 1, default: 0, description: "Stat 2 value", hiddenFromList: false },
  stat2Suffix: { type: "string", default: "", description: "Stat 2 suffix" },
  stat2Label: { type: "string", default: "", description: "Stat 2 label" },
  quote: { type: "string", default: "", description: "Quote" },
  author: { type: "string", default: "", description: "Author" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  primary: { type: "color", default: "#6366F1", description: "Primary" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
} as const satisfies InteractivitySchema;

export const ProofScene = Interactive.create({
  Component: ProofSceneInner,
  layout: "absolute-fill",
  schema: proofSceneSchema,
});

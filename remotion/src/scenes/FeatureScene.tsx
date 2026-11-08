import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { FeatureCard } from "../elements/FeatureCard";
import { Headline } from "../elements/Headline";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { safeArea } from "../lib/formats";

type FeatureSceneProps = {
  readonly title?: string;
  readonly feature1Title?: string;
  readonly feature1Desc?: string;
  readonly feature2Title?: string;
  readonly feature2Desc?: string;
  readonly feature3Title?: string;
  readonly feature3Desc?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly primary?: string;
  readonly accent?: string;
};

// Scene 4: three feature cards staggering in. Row in 16:9, stacked otherwise.
const FeatureSceneInner: React.FC<FeatureSceneProps> = ({
  title = "How it works",
  feature1Title = "Feature one",
  feature1Desc = "",
  feature2Title = "Feature two",
  feature2Desc = "",
  feature3Title = "Feature three",
  feature3Desc = "",
  bg = "#0B0F19",
  bg2 = "#1E1B4B",
  primary = "#6366F1",
  accent = "#22D3EE",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pad = safeArea(width, height);
  const horizontal = pad.o === "landscape";
  const compact = pad.o === "square";
  const cardWidth = horizontal ? 500 : width - pad.left - pad.right;

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={bg} colorB={bg2} angle={140} />
      <AmbientOrbs name="Orbs" colorA={accent} colorB={primary} intensity={0.4} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: horizontal ? 56 : 32,
          paddingTop: pad.top,
          paddingBottom: pad.bottom,
          paddingLeft: pad.left,
          paddingRight: pad.right,
        }}
      >
        <Headline
          name="Title"
          style={{
            fontSize: horizontal ? 84 : 72,
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
          {title}
        </Headline>
        <div
          style={{
            display: "flex",
            flexDirection: horizontal ? "row" : "column",
            gap: horizontal ? 40 : 24,
          }}
        >
          <FeatureCard
            name="Feature 1"
            index={1}
            title={feature1Title}
            desc={feature1Desc}
            accent={accent}
            compact={compact}
            style={{
              width: cardWidth,
              opacity: interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0.3 * fps, 0.8 * fps], ["0px 48px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [0.3 * fps, 0.8 * fps], [0.92, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          />
          <FeatureCard
            name="Feature 2"
            index={2}
            title={feature2Title}
            desc={feature2Desc}
            accent={accent}
            compact={compact}
            style={{
              width: cardWidth,
              opacity: interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0.5 * fps, 1 * fps], ["0px 48px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [0.5 * fps, 1 * fps], [0.92, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          />
          <FeatureCard
            name="Feature 3"
            index={3}
            title={feature3Title}
            desc={feature3Desc}
            accent={accent}
            compact={compact}
            style={{
              width: cardWidth,
              opacity: interpolate(frame, [0.7 * fps, 1.2 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0.7 * fps, 1.2 * fps], ["0px 48px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [0.7 * fps, 1.2 * fps], [0.92, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          />
        </div>
      </div>
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.5} />
    </>
  );
};

const featureSceneSchema = {
  title: { type: "string", default: "How it works", description: "Title" },
  feature1Title: { type: "string", default: "Feature one", description: "Feature 1 title" },
  feature1Desc: { type: "string", default: "", description: "Feature 1 description" },
  feature2Title: { type: "string", default: "Feature two", description: "Feature 2 title" },
  feature2Desc: { type: "string", default: "", description: "Feature 2 description" },
  feature3Title: { type: "string", default: "Feature three", description: "Feature 3 title" },
  feature3Desc: { type: "string", default: "", description: "Feature 3 description" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  primary: { type: "color", default: "#6366F1", description: "Primary" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
} as const satisfies InteractivitySchema;

export const FeatureScene = Interactive.create({
  Component: FeatureSceneInner,
  layout: "absolute-fill",
  schema: featureSceneSchema,
});

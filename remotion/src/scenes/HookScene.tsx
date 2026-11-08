import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { Badge } from "../elements/Badge";
import { KineticText } from "../elements/KineticText";
import { Subline } from "../elements/Subline";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { safeArea } from "../lib/formats";

type HookSceneProps = {
  readonly kicker?: string;
  readonly headline?: string;
  readonly accentWords?: string;
  readonly sub?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly primary?: string;
  readonly accent?: string;
};

// Scene 1: the hook. Kicker → kinetic headline → subline. Works in 16:9, 9:16, 1:1.
const HookSceneInner: React.FC<HookSceneProps> = ({
  kicker = "New",
  headline = "Your headline here",
  accentWords = "",
  sub = "",
  bg = "#0B0F19",
  bg2 = "#1E1B4B",
  primary = "#6366F1",
  accent = "#22D3EE",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pad = safeArea(width, height);

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={bg} colorB={bg2} angle={160} />
      <AmbientOrbs name="Orbs" colorA={primary} colorB={accent} intensity={0.55} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
          paddingTop: pad.top,
          paddingBottom: pad.bottom,
          paddingLeft: pad.left,
          paddingRight: pad.right,
        }}
      >
        <Badge
          name="Kicker"
          color={accent}
          style={{
            alignSelf: "flex-start",
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
          {kicker}
        </Badge>
        <KineticText
          name="Headline"
          from={0.2 * fps}
          text={headline}
          by="word"
          stagger={3}
          enter={14}
          accentWords={accentWords}
          accentColor={accent}
          style={{
            fontSize: pad.o === "landscape" ? 128 : 104,
            maxWidth: pad.o === "landscape" ? 1500 : undefined,
          }}
        />
        <Subline
          name="Subline"
          style={{
            maxWidth: 1100,
            opacity: interpolate(frame, [1.1 * fps, 1.6 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [1.1 * fps, 1.6 * fps], ["0px 20px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {sub}
        </Subline>
      </div>
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.5} />
    </>
  );
};

const hookSceneSchema = {
  kicker: { type: "string", default: "New", description: "Kicker" },
  headline: { type: "string", default: "Your headline here", description: "Headline" },
  accentWords: { type: "string", default: "", description: "Accent words (comma separated)" },
  sub: { type: "string", default: "", description: "Subline" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  primary: { type: "color", default: "#6366F1", description: "Primary" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
} as const satisfies InteractivitySchema;

export const HookScene = Interactive.create({
  Component: HookSceneInner,
  layout: "absolute-fill",
  schema: hookSceneSchema,
});

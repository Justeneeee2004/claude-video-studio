import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { PainRow } from "../elements/PainRow";
import { Subline } from "../elements/Subline";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { safeArea } from "../lib/formats";

type ProblemSceneProps = {
  readonly title?: string;
  readonly pain1?: string;
  readonly pain2?: string;
  readonly pain3?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly danger?: string;
};

// Scene 2: pains slide in, then get struck through one by one (≈2.3 s in).
const ProblemSceneInner: React.FC<ProblemSceneProps> = ({
  title = "Sounds familiar?",
  pain1 = "Pain point one",
  pain2 = "Pain point two",
  pain3 = "Pain point three",
  bg = "#0B0F19",
  bg2 = "#1E1B4B",
  danger = "#F43F5E",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pad = safeArea(width, height);

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={bg} colorB={bg2} angle={200} />
      <AmbientOrbs name="Orbs" colorA={danger} colorB="#7C3AED" intensity={0.35} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 40,
          paddingTop: pad.top,
          paddingBottom: pad.bottom,
          paddingLeft: pad.left,
          paddingRight: pad.right,
        }}
      >
        <Subline
          name="Title"
          style={{
            color: "#A1A1AA",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {title}
        </Subline>
        <PainRow
          name="Pain 1"
          color={danger}
          strike={interpolate(frame, [2.3 * fps, 2.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.83, 0, 0.17, 1),
          })}
          style={{
            fontSize: pad.o === "landscape" ? 60 : 50,
            opacity: interpolate(frame, [0.4 * fps, 0.9 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [0.4 * fps, 0.9 * fps], ["-48px 0px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {pain1}
        </PainRow>
        {pain2 ? (
          <PainRow
            name="Pain 2"
            color={danger}
            strike={interpolate(frame, [2.5 * fps, 3 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            })}
            style={{
              opacity: interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0.6 * fps, 1.1 * fps], ["-48px 0px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {pain2}
          </PainRow>
        ) : null}
        {pain3 ? (
          <PainRow
            name="Pain 3"
            color={danger}
            strike={interpolate(frame, [2.7 * fps, 3.2 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            })}
            style={{
              opacity: interpolate(frame, [0.8 * fps, 1.3 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0.8 * fps, 1.3 * fps], ["-48px 0px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {pain3}
          </PainRow>
        ) : null}
      </div>
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.55} />
    </>
  );
};

const problemSceneSchema = {
  title: { type: "string", default: "Sounds familiar?", description: "Title" },
  pain1: { type: "string", default: "Pain point one", description: "Pain 1" },
  pain2: { type: "string", default: "Pain point two", description: "Pain 2" },
  pain3: { type: "string", default: "Pain point three", description: "Pain 3" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  danger: { type: "color", default: "#F43F5E", description: "Danger color" },
} as const satisfies InteractivitySchema;

export const ProblemScene = Interactive.create({
  Component: ProblemSceneInner,
  layout: "absolute-fill",
  schema: problemSceneSchema,
});

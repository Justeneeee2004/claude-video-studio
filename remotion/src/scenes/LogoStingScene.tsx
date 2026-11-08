import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { LogoLockup } from "../elements/LogoLockup";
import { Subline } from "../elements/Subline";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { ShineSweep } from "../layers/ShineSweep";
import { VignetteOverlay } from "../layers/VignetteOverlay";

type LogoStingSceneProps = {
  readonly brandName?: string;
  readonly logoSrc?: string;
  readonly tagline?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly primary?: string;
  readonly accent?: string;
};

// 3-second logo sting: flash → logo pops → ring expands → shine → tagline.
const LogoStingSceneInner: React.FC<LogoStingSceneProps> = ({
  brandName = "YourBrand",
  logoSrc = "",
  tagline = "",
  bg = "#0B0F19",
  bg2 = "#1E1B4B",
  primary = "#6366F1",
  accent = "#22D3EE",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={bg} colorB={bg2} angle={160} />
      <AmbientOrbs name="Orbs" colorA={primary} colorB={accent} intensity={0.6} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          border: `3px solid ${accent}`,
          opacity: interpolate(frame, [0.2 * fps, 1.2 * fps], [0.8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0.2 * fps, 1.2 * fps], [0.3, 2.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [0.1 * fps, 0.4 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0.1 * fps, 0.8 * fps], [0.5, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 12, stiffness: 120 }),
              output: "perceptual-scale",
            }),
          }}
        >
          <ShineSweep
            progress={interpolate(frame, [0.9 * fps, 1.6 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          >
            <LogoLockup
              name="Logo"
              brandName={brandName}
              logoSrc={logoSrc}
              size={160}
              color={primary}
              color2={accent}
              style={{ padding: 24 }}
            />
          </ShineSweep>
        </div>
        {tagline ? (
          <Subline
            name="Tagline"
            style={{
              fontSize: 40,
              letterSpacing: "0.04em",
              opacity: interpolate(frame, [1.1 * fps, 1.6 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [1.1 * fps, 1.6 * fps], ["0px 16px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {tagline}
          </Subline>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#FFFFFF",
          pointerEvents: "none",
          opacity: interpolate(frame, [0, 10], [0.85, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.55} />
    </>
  );
};

const logoStingSceneSchema = {
  brandName: { type: "string", default: "YourBrand", description: "Brand name" },
  logoSrc: { type: "asset", assetType: "image", default: "", description: "Logo" },
  tagline: { type: "string", default: "", description: "Tagline" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  primary: { type: "color", default: "#6366F1", description: "Primary" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
} as const satisfies InteractivitySchema;

export const LogoStingScene = Interactive.create({
  Component: LogoStingSceneInner,
  layout: "absolute-fill",
  schema: logoStingSceneSchema,
});

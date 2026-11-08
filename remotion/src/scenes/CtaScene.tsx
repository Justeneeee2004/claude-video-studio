import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { CtaButton } from "../elements/CtaButton";
import { KineticText } from "../elements/KineticText";
import { LogoLockup } from "../elements/LogoLockup";
import { Subline } from "../elements/Subline";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { ShineSweep } from "../layers/ShineSweep";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { safeArea } from "../lib/formats";

type CtaSceneProps = {
  readonly brandName?: string;
  readonly logoSrc?: string;
  readonly headline?: string;
  readonly ctaLabel?: string;
  readonly url?: string;
  readonly note?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly primary?: string;
  readonly accent?: string;
};

// Scene 6: centered CTA. Button pops in, pulses once, shine sweeps across.
const CtaSceneInner: React.FC<CtaSceneProps> = ({
  brandName = "YourBrand",
  logoSrc = "",
  headline = "Ready when you are",
  ctaLabel = "Get started",
  url = "yourbrand.com",
  note = "",
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
      <GradientBackdrop name="Backdrop" colorA={bg} colorB={bg2} angle={180} />
      <AmbientOrbs name="Orbs" colorA={primary} colorB={accent} intensity={0.6} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 40,
          paddingTop: pad.top,
          paddingBottom: pad.bottom,
          paddingLeft: pad.left,
          paddingRight: pad.right,
        }}
      >
        <LogoLockup
          name="Logo"
          brandName={brandName}
          logoSrc={logoSrc}
          size={56}
          color={primary}
          color2={accent}
          style={{
            opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
        <KineticText
          name="Headline"
          from={0.1 * fps}
          text={headline}
          by="word"
          stagger={3}
          enter={14}
          accentColor={accent}
          style={{
            fontSize: horizontal ? 104 : 88,
            justifyContent: "center",
            maxWidth: horizontal ? 1400 : undefined,
          }}
        />
        <div
          style={{
            opacity: interpolate(frame, [0.7 * fps, 0.9 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(
              frame,
              [0.7 * fps, 1.2 * fps, 2 * fps, 2.3 * fps, 2.6 * fps],
              [0.6, 1, 1, 1.05, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                output: "perceptual-scale",
                easing: [
                  Easing.spring({ damping: 12, stiffness: 150 }),
                  Easing.linear,
                  Easing.bezier(0.16, 1, 0.3, 1),
                  Easing.bezier(0.7, 0, 0.84, 0),
                ],
              },
            ),
          }}
        >
          <ShineSweep
            progress={interpolate(frame, [1.3 * fps, 1.9 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
            style={{ borderRadius: 999 }}
          >
            <CtaButton name="CTA" color={primary} textColor="#FFFFFF">
              {ctaLabel}
            </CtaButton>
          </ShineSweep>
        </div>
        <Subline
          name="URL"
          style={{
            fontWeight: 600,
            color: "#F9FAFB",
            letterSpacing: "0.02em",
            opacity: interpolate(frame, [1.4 * fps, 1.9 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {url}
        </Subline>
        {note ? (
          <Subline
            name="Note"
            style={{
              fontSize: 30,
              color: "#A1A1AA",
              opacity: interpolate(frame, [1.8 * fps, 2.3 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {note}
          </Subline>
        ) : null}
      </div>
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.5} />
    </>
  );
};

const ctaSceneSchema = {
  brandName: { type: "string", default: "YourBrand", description: "Brand name" },
  logoSrc: { type: "asset", assetType: "image", default: "", description: "Logo" },
  headline: { type: "string", default: "Ready when you are", description: "Headline" },
  ctaLabel: { type: "string", default: "Get started", description: "Button label" },
  url: { type: "string", default: "yourbrand.com", description: "URL" },
  note: { type: "string", default: "", description: "Note" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  primary: { type: "color", default: "#6366F1", description: "Primary" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
} as const satisfies InteractivitySchema;

export const CtaScene = Interactive.create({
  Component: CtaSceneInner,
  layout: "absolute-fill",
  schema: ctaSceneSchema,
});

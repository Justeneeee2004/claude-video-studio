import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { DEVICE_SIZE, DeviceFrame } from "../elements/DeviceFrame";
import { KineticText } from "../elements/KineticText";
import { LogoLockup } from "../elements/LogoLockup";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { ShineSweep } from "../layers/ShineSweep";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { safeArea } from "../lib/formats";

type SolutionSceneProps = {
  readonly productName?: string;
  readonly tagline?: string;
  readonly screenshotSrc?: string;
  readonly deviceVariant?: "phone" | "browser";
  readonly logoSrc?: string;
  readonly bg?: string;
  readonly bg2?: string;
  readonly primary?: string;
  readonly accent?: string;
};

const DEVICE_SCALE = {
  phone: { landscape: 0.86, vertical: 0.8, square: 0.52 },
  browser: { landscape: 0.78, vertical: 0.8, square: 0.68 },
} as const;

// Scene 3: product reveal. Text + device mockup; row in 16:9, stacked otherwise.
const SolutionSceneInner: React.FC<SolutionSceneProps> = ({
  productName = "Product",
  tagline = "One line that says what it does.",
  screenshotSrc = "",
  deviceVariant = "phone",
  logoSrc = "",
  bg = "#0B0F19",
  bg2 = "#1E1B4B",
  primary = "#6366F1",
  accent = "#22D3EE",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pad = safeArea(width, height);
  const horizontal = pad.o === "landscape";
  const device = DEVICE_SIZE[deviceVariant];
  const scale = DEVICE_SCALE[deviceVariant][pad.o];

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={bg2} colorB={bg} angle={200} />
      <AmbientOrbs name="Orbs" colorA={primary} colorB={accent} intensity={0.5} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          alignItems: "center",
          justifyContent: horizontal ? "space-between" : "center",
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
            flexDirection: "column",
            gap: 28,
            flex: horizontal ? "0 0 50%" : "0 0 auto",
            maxWidth: horizontal ? "50%" : "100%",
          }}
        >
          <LogoLockup
            name="Logo"
            brandName={productName}
            logoSrc={logoSrc}
            size={64}
            color={primary}
            color2={accent}
            style={{
              opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0, 0.4 * fps], ["0px 20px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          />
          <KineticText
            name="Tagline"
            from={0.3 * fps}
            text={tagline}
            by="word"
            stagger={3}
            enter={14}
            accentColor={accent}
            style={{ fontSize: horizontal ? 88 : 80 }}
          />
        </div>
        <div
          style={{
            width: device.width * scale,
            height: device.height * scale,
            flexShrink: 0,
            opacity: interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [0.5 * fps, 1.4 * fps], ["0px 140px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            rotate: interpolate(frame, [0.5 * fps, 1.4 * fps], ["-6deg", "0deg"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div
            style={{
              width: device.width,
              height: device.height,
              scale,
              transformOrigin: "top left",
            }}
          >
            <ShineSweep
              progress={interpolate(frame, [1.6 * fps, 2.4 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              style={{ borderRadius: deviceVariant === "phone" ? 60 : 22 }}
            >
              <DeviceFrame name="Device" src={screenshotSrc} variant={deviceVariant} />
            </ShineSweep>
          </div>
        </div>
      </div>
      <GrainOverlay name="Grain" opacity={0.1} />
      <VignetteOverlay name="Vignette" amount={0.5} />
    </>
  );
};

const solutionSceneSchema = {
  productName: { type: "string", default: "Product", description: "Product name" },
  tagline: { type: "string", default: "One line that says what it does.", description: "Tagline" },
  screenshotSrc: { type: "asset", assetType: "image", default: "", description: "Screenshot" },
  deviceVariant: {
    type: "enum",
    default: "phone",
    description: "Device",
    variants: { phone: {}, browser: {} },
  },
  logoSrc: { type: "asset", assetType: "image", default: "", description: "Logo" },
  bg: { type: "color", default: "#0B0F19", description: "Background" },
  bg2: { type: "color", default: "#1E1B4B", description: "Background 2" },
  primary: { type: "color", default: "#6366F1", description: "Primary" },
  accent: { type: "color", default: "#22D3EE", description: "Accent" },
} as const satisfies InteractivitySchema;

export const SolutionScene = Interactive.create({
  Component: SolutionSceneInner,
  layout: "absolute-fill",
  schema: solutionSceneSchema,
});

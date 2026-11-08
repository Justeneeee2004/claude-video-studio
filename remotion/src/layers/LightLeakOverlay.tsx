import { lightLeak } from "@remotion/effects/light-leak";
import type React from "react";
import {
  Interactive,
  interpolate,
  Solid,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";

type LightLeakOverlayProps = {
  readonly seed?: number;
  readonly hueShift?: number;
  readonly style?: React.CSSProperties;
};

// WebGL effect. Renders need --gl=angle (set in remotion.config.ts).
// Use inside <TransitionSeries.Overlay> or as a decorative top layer.
const LightLeakOverlayInner: React.FC<LightLeakOverlayProps> = ({
  seed = 0,
  hueShift = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, height, width } = useVideoConfig();

  return (
    <Solid
      width={width}
      height={height}
      style={style}
      effects={[
        lightLeak({
          seed,
          hueShift,
          progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }),
      ]}
    />
  );
};

const lightLeakOverlaySchema = {
  seed: {
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    integer: true,
    default: 0,
    description: "Pattern seed",
    hiddenFromList: false,
  },
  hueShift: {
    type: "number",
    min: 0,
    max: 360,
    step: 1,
    default: 0,
    description: "Hue shift",
    hiddenFromList: false,
  },
} as const satisfies InteractivitySchema;

export const LightLeakOverlay = Interactive.create({
  Component: LightLeakOverlayInner,
  layout: "none",
  schema: lightLeakOverlaySchema,
});

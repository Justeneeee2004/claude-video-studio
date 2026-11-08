import { Audio } from "@remotion/media";
import { zColor } from "@remotion/zod-types";
import type React from "react";
import {
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import { z } from "zod";
import { DEVICE_SIZE, DeviceFrame } from "../elements/DeviceFrame";
import { LogoLockup } from "../elements/LogoLockup";
import { LowerThird } from "../elements/LowerThird";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { GrainOverlay } from "../layers/GrainOverlay";
import { VignetteOverlay } from "../layers/VignetteOverlay";
import { asset } from "../lib/assets";
import { safeArea } from "../lib/formats";

/**
 * Screenshot slideshow (the "app walkthrough" promo): each slide = device mockup with
 * slow Ken Burns + caption bar. Duration = slides × secondsPerSlide (calculateMetadata).
 */
export const showcaseSchema = z.object({
  brandName: z.string(),
  logoSrc: z.string(),
  secondsPerSlide: z.number().min(1).max(15),
  slides: z
    .array(
      z.object({
        src: z.string(),
        caption: z.string(),
        variant: z.enum(["phone", "browser"]),
      }),
    )
    .min(1),
  musicSrc: z.string(),
  primary: zColor(),
  accent: zColor(),
  bg: zColor(),
  bg2: zColor(),
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;

// Must match the fps on the <Composition> in Root.tsx.
const COMPOSITION_FPS = 30;

export const calculateShowcaseMetadata: CalculateMetadataFunction<ShowcaseProps> = ({
  props,
}) => {
  return {
    durationInFrames: Math.max(
      COMPOSITION_FPS,
      Math.round(props.slides.length * props.secondsPerSlide * COMPOSITION_FPS),
    ),
  };
};

type SlideProps = {
  readonly src: string;
  readonly caption: string;
  readonly variant: "phone" | "browser";
  readonly index: number;
  readonly accent: string;
};

const DEVICE_SCALE = {
  phone: { landscape: 0.9, vertical: 0.8, square: 0.6 },
  browser: { landscape: 0.82, vertical: 0.8, square: 0.7 },
} as const;

const Slide: React.FC<SlideProps> = ({ src, caption, variant, index, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const pad = safeArea(width, height);
  const device = DEVICE_SIZE[variant];
  const scale = DEVICE_SCALE[variant][pad.o];
  const direction = index % 2 === 0 ? 1 : -1;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: pad.top,
          paddingBottom: pad.bottom + 110,
          opacity: interpolate(
            frame,
            [0, 10, durationInFrames - 10, durationInFrames - 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        <div style={{ width: device.width * scale, height: device.height * scale }}>
          <div
            style={{
              width: device.width,
              height: device.height,
              transformOrigin: "center center",
              scale: interpolate(frame, [0, durationInFrames], [scale, scale * 1.06], {
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              }),
              translate: `${interpolate(frame, [0, durationInFrames], [-16 * direction, 16 * direction])}px ${
                (device.height * (scale - 1)) / 2
              }px`,
              marginLeft: (device.width * (scale - 1)) / 2,
            }}
          >
            <DeviceFrame name="Device" src={src} variant={variant} />
          </div>
        </div>
      </div>
      <LowerThird
        name="Caption"
        accentColor={accent}
        style={{
          left: pad.left,
          bottom: pad.bottom,
          maxWidth: width - pad.left - pad.right,
          opacity: interpolate(frame, [6, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [6, 20], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {caption}
      </LowerThird>
    </>
  );
};

export const ScreenshotShowcase: React.FC<ShowcaseProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const pad = safeArea(width, height);
  const slideFrames = Math.round(p.secondsPerSlide * fps);

  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={p.bg} colorB={p.bg2} angle={160} />
      <AmbientOrbs name="Orbs" colorA={p.primary} colorB={p.accent} intensity={0.45} />
      {p.slides.map((slide, i) => (
        <Sequence
          key={`${i}-${slide.src}`}
          name={`Slide ${i + 1}`}
          from={i * slideFrames}
          durationInFrames={slideFrames}
          layout="absolute-fill"
        >
          <Slide
            src={slide.src}
            caption={slide.caption}
            variant={slide.variant}
            index={i}
            accent={p.accent}
          />
        </Sequence>
      ))}
      <LogoLockup
        name="Logo"
        brandName={p.brandName}
        logoSrc={p.logoSrc}
        size={52}
        color={p.primary}
        color2={p.accent}
        style={{ position: "absolute", top: pad.top - 20, left: pad.left }}
      />
      <GrainOverlay name="Grain" opacity={0.08} />
      <VignetteOverlay name="Vignette" amount={0.45} />
      {p.musicSrc ? (
        <Audio
          name="Music"
          src={asset(p.musicSrc)}
          loop
          volume={interpolate(
            frame,
            [0, 1 * fps, durationInFrames - 2 * fps, durationInFrames - 1],
            [0, 0.3, 0.3, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
        />
      ) : null}
    </>
  );
};

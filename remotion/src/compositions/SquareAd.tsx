import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { asset } from "../lib/assets";
import { CtaScene } from "../scenes/CtaScene";
import { HookScene } from "../scenes/HookScene";
import { SolutionScene } from "../scenes/SolutionScene";
import type { PromoProps } from "./schema";

/**
 * 1:1 feed ad, 9.7 s at 30 fps. Hook → Solution → CTA.
 * Hook 3s → fade 12 → Solution 4s → fade 12 → CTA 3.5s
 * Total = 315 − 24 = 291 frames. Cut points: 78, 186.
 */
export const SquareAd: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <>
      <TransitionSeries name="Ad timeline">
        <TransitionSeries.Sequence name="Hook" durationInFrames={3 * fps}>
          <HookScene
            name="Hook scene"
            kicker={p.kicker}
            headline={p.headline}
            accentWords={p.accentWords}
            sub={p.sub}
            bg={p.bg}
            bg2={p.bg2}
            primary={p.primary}
            accent={p.accent}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence name="Solution" durationInFrames={4 * fps}>
          <SolutionScene
            name="Solution scene"
            productName={p.productName}
            tagline={p.tagline}
            screenshotSrc={p.screenshotSrc}
            deviceVariant={p.deviceVariant}
            logoSrc={p.logoSrc}
            bg={p.bg}
            bg2={p.bg2}
            primary={p.primary}
            accent={p.accent}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence name="CTA" durationInFrames={3.5 * fps}>
          <CtaScene
            name="CTA scene"
            brandName={p.brandName}
            logoSrc={p.logoSrc}
            headline={p.ctaHeadline}
            ctaLabel={p.ctaLabel}
            url={p.url}
            note={p.note}
            bg={p.bg}
            bg2={p.bg2}
            primary={p.primary}
            accent={p.accent}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {p.musicSrc ? (
        <Audio
          name="Music"
          src={asset(p.musicSrc)}
          loop
          volume={interpolate(
            frame,
            [0, 1 * fps, durationInFrames - 2 * fps, durationInFrames - 1],
            [0, 0.35, 0.35, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
        />
      ) : null}
      {p.sfxEnabled ? (
        <>
          <Audio name="Whoosh 1" from={78} src="https://remotion.media/whoosh.wav" volume={0.5} />
          <Audio name="Whoosh 2" from={186} src="https://remotion.media/whoosh.wav" volume={0.5} />
        </>
      ) : null}
    </>
  );
};

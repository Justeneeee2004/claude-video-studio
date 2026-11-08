import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { asset } from "../lib/assets";
import { CtaScene } from "../scenes/CtaScene";
import { FeatureScene } from "../scenes/FeatureScene";
import { HookScene } from "../scenes/HookScene";
import { SolutionScene } from "../scenes/SolutionScene";
import type { PromoProps } from "./schema";

/**
 * 9:16 reel, 13.3 s at 30 fps. Faster pacing, no Problem/Proof scenes.
 * Hook 3s → fade 12 → Solution 4s → slide 12 → Features 4s → fade 12 → CTA 3.5s
 * Total = 435 − 36 = 399 frames. Cut points: 78, 186, 294.
 */
export const SocialReel: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [f1, f2, f3] = p.features;

  return (
    <>
      <TransitionSeries name="Reel timeline">
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
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence name="Features" durationInFrames={4 * fps}>
          <FeatureScene
            name="Feature scene"
            title={p.featureTitle}
            feature1Title={f1?.title ?? ""}
            feature1Desc={f1?.desc ?? ""}
            feature2Title={f2?.title ?? ""}
            feature2Desc={f2?.desc ?? ""}
            feature3Title={f3?.title ?? ""}
            feature3Desc={f3?.desc ?? ""}
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
          <Audio name="Whoosh 3" from={294} src="https://remotion.media/whoosh.wav" volume={0.5} />
        </>
      ) : null}
    </>
  );
};

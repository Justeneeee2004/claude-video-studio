import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LightLeakOverlay } from "../layers/LightLeakOverlay";
import { asset } from "../lib/assets";
import { CtaScene } from "../scenes/CtaScene";
import { FeatureScene } from "../scenes/FeatureScene";
import { HookScene } from "../scenes/HookScene";
import { ProblemScene } from "../scenes/ProblemScene";
import { ProofScene } from "../scenes/ProofScene";
import { SolutionScene } from "../scenes/SolutionScene";
import type { PromoProps } from "./schema";

/**
 * 16:9 product promo, 27 s at 30 fps.
 * Hook 4s → fade 15 → Problem 5s → slide 15 → Solution 5s → [light leak overlay]
 * → Features 6s → wipe 15 → Proof 4s → fade 15 → CTA 5s
 * Total = 870 − 60 = 810 frames. Keep <Composition durationInFrames> in Root.tsx in sync.
 * Cut points (for SFX): 105, 240, 390, 555, 660.
 */
export const ProductPromo: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [pain1 = "", pain2 = "", pain3 = ""] = p.pains;
  const [f1, f2, f3] = p.features;

  return (
    <>
      <TransitionSeries name="Promo timeline">
        <TransitionSeries.Sequence name="Hook" durationInFrames={4 * fps}>
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
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="Problem" durationInFrames={5 * fps}>
          <ProblemScene
            name="Problem scene"
            title={p.problemTitle}
            pain1={pain1}
            pain2={pain2}
            pain3={pain3}
            bg={p.bg}
            bg2={p.bg2}
            danger={p.danger}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="Solution" durationInFrames={5 * fps}>
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
        <TransitionSeries.Overlay durationInFrames={16}>
          <LightLeakOverlay name="Light leak" seed={3} hueShift={220} style={{ mixBlendMode: "screen", opacity: 0.45 }} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Features" durationInFrames={6 * fps}>
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
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="Proof" durationInFrames={4 * fps}>
          <ProofScene
            name="Proof scene"
            stat1Value={p.stat1.value}
            stat1Suffix={p.stat1.suffix}
            stat1Label={p.stat1.label}
            stat2Value={p.stat2.value}
            stat2Suffix={p.stat2.suffix}
            stat2Label={p.stat2.label}
            quote={p.quote}
            author={p.author}
            bg={p.bg}
            bg2={p.bg2}
            primary={p.primary}
            accent={p.accent}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="CTA" durationInFrames={5 * fps}>
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
          <Audio name="Whoosh 1" from={105} src="https://remotion.media/whoosh.wav" volume={0.5} />
          <Audio name="Whoosh 2" from={240} src="https://remotion.media/whoosh.wav" volume={0.5} />
          <Audio name="Whoosh 3" from={555} src="https://remotion.media/whoosh.wav" volume={0.5} />
          <Audio name="Whoosh 4" from={660} src="https://remotion.media/whoosh.wav" volume={0.5} />
        </>
      ) : null}
    </>
  );
};

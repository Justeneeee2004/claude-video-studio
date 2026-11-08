import { TransitionSeries } from "@remotion/transitions";
import type React from "react";
import { SCENE, type CutKind } from "../lib/rallyo-timeline";
import { RALLYO_COLORS, RALLYO_FONTS } from "../theme/rallyo";
import { cutTiming, presentationFor } from "./index";

/**
 * Preview of one Rallyo cut (Rallyo-Transitions folder in Root): scene A 30 f → the reel's own
 * presentation + timing (15 f) → scene B 30 f = 45 f. Round 4: the players chapter's slide (1110), wipe (1200) and
 * whip (1320) are the same kinds and timings as T04 / T05 / T06, so they need no previews of their own; T10 limeFlood
 * now reads S10d's out (1545–1560). Markers show where each presentation is anchored
 * (circle centre, Publish button rect, pushCut origin) so a still at A-end + 1/2/9 f reads at a glance.
 */

export const PREVIEW_CUTS = {
  circleReveal: SCENE.hook.out,
  zoomThrough: SCENE.publish.out,
  slideRight: SCENE.share.out,
  wipeLeft: SCENE.approve.out,
  whip: SCENE.checkIn.out,
  pushCut: SCENE.upNext.out,
  slideBottom: SCENE.whoWon.out,
  limeFlood: SCENE.playersLive.out,
} as const satisfies Record<string, CutKind>;

export type PreviewCutId = keyof typeof PREVIEW_CUTS;

type PanelProps = {
  readonly title: string;
  readonly caption: string;
  readonly background: string;
  readonly ink: string;
  readonly cutId: PreviewCutId;
};

const Panel: React.FC<PanelProps> = ({ title, caption, background, ink, cutId }) => (
  <div style={{ position: "absolute", inset: 0, backgroundColor: background, overflow: "hidden" }}>
    {Array.from({ length: 9 }, (_, i) => (
      <div
        key={`h-${i}`}
        style={{ position: "absolute", left: 0, right: 0, top: 200 * (i + 1), height: 2, backgroundColor: ink, opacity: 0.12 }}
      />
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <div
        key={`v-${i}`}
        style={{ position: "absolute", top: 0, bottom: 0, left: 180 * (i + 1), width: 2, backgroundColor: ink, opacity: 0.12 }}
      />
    ))}
    {cutId === "circleReveal" ? (
      <div
        style={{ position: "absolute", left: 491 - 24, top: 1000 - 24, width: 48, height: 48, borderRadius: 24, border: `4px solid ${ink}` }}
      />
    ) : null}
    {cutId === "zoomThrough" ? (
      <div
        style={{
          position: "absolute",
          left: 98,
          top: 665,
          width: 786,
          height: 113,
          borderRadius: 15,
          backgroundColor: RALLYO_COLORS.ink,
          border: `3px solid ${RALLYO_COLORS.lime}`,
          boxSizing: "border-box",
        }}
      />
    ) : null}
    {cutId === "pushCut" ? (
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 590,
          width: 702,
          height: 480,
          borderRadius: 24,
          border: `4px solid ${ink}`,
          boxSizing: "border-box",
        }}
      />
    ) : null}
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 296,
        fontFamily: RALLYO_FONTS.display,
        fontWeight: 900,
        fontStyle: "italic",
        fontStretch: "70%",
        fontSize: 200,
        lineHeight: 1,
        color: ink,
      }}
    >
      {title}
    </div>
    <div style={{ position: "absolute", left: 72, top: 520, fontFamily: RALLYO_FONTS.ui, fontWeight: 700, fontSize: 44, color: ink }}>
      {caption}
    </div>
  </div>
);

type TransitionPreviewProps = {
  readonly cutId: PreviewCutId;
};

export const TransitionPreview: React.FC<TransitionPreviewProps> = ({ cutId }) => {
  const cut: CutKind = PREVIEW_CUTS[cutId];
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: RALLYO_COLORS.night }}>
      <TransitionSeries name={`Preview ${cutId}`}>
        <TransitionSeries.Sequence name="A (outgoing)" durationInFrames={30}>
          <Panel title="A" caption={`${cutId} · outgoing`} background={RALLYO_COLORS.nightRaised} ink={RALLYO_COLORS.fg} cutId={cutId} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(cut)} timing={cutTiming(cut)} />
        <TransitionSeries.Sequence name="B (incoming)" durationInFrames={30}>
          <Panel title="B" caption={`${cutId} · incoming`} background={RALLYO_COLORS.court} ink={RALLYO_COLORS.lime} cutId={cutId} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </div>
  );
};

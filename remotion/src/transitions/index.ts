import { linearTiming, type TransitionPresentation, type TransitionTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { pushCut } from "@remotion/transitions/push-cut";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Easing } from "remotion";
import { FRONT_BEZIER, HEIGHT, WIDTH, type CutKind } from "../lib/rallyo-timeline";
import { circleReveal } from "./circleReveal";
import { limeFlood } from "./limeFlood";
import { whip } from "./whip";
import { zoomThrough } from "./zoomThrough";

/**
 * Rallyo v2.3 transition API (brief 5.2). One entry point for the reel and the previews (round 4 adds the players
 * chapter's slide from-right 1110, wipe from-left 1200 and whip 1320: existing kinds, no new presentation):
 *   <TransitionSeries.Transition presentation={presentationFor(cut)} timing={cutTiming(cut)} />
 * Custom presentations (CSS only, no WebGL) live one per file in this folder; built-ins come from
 * @remotion/transitions 4.0.536 (slide, wipe, push-cut are all present in the installed package).
 * `cut` (hard cut) and `none` (last scene) render no Transition element: calling these throws.
 */

export { CIRCLE_REVEAL_DEFAULTS, circleReveal, type CircleRevealProps } from "./circleReveal";
export { LIME_FLOOD_DEFAULTS, limeFlood, type LimeFloodProps } from "./limeFlood";
export { WHIP_DEFAULTS, whip, type WhipProps } from "./whip";
export { ZOOM_THROUGH_DEFAULTS, zoomThrough, type ZoomThroughProps } from "./zoomThrough";

export type AnyPresentation = TransitionPresentation<Record<string, unknown>>;

/** T7 S7 → S8 Court 1 match cut: cut + 2 f lime flash at p 0.6 = abs 759 (brief 5.2). */
export const PUSH_CUT_PROPS = {
  cutProgress: 0.6,
  outgoingScale: 1.06,
  incomingStartScale: 1.08,
  incomingEndScale: 1.0,
  transformOrigin: "491px 830px",
  flashColor: "#C8F23A",
  flashOpacity: 0.22,
  flashFrames: 2,
} as const;

export const presentationFor = (cut: CutKind): AnyPresentation => {
  switch (cut.type) {
    case "circleReveal":
      return circleReveal() as unknown as AnyPresentation;
    case "zoomThrough":
      return zoomThrough() as unknown as AnyPresentation;
    case "whip":
      return whip() as unknown as AnyPresentation;
    case "limeFlood":
      return limeFlood() as unknown as AnyPresentation;
    case "pushCut":
      return pushCut({ ...PUSH_CUT_PROPS }) as unknown as AnyPresentation;
    case "slide":
      return slide({ direction: cut.direction }) as unknown as AnyPresentation;
    case "wipe":
      return wipe({ direction: cut.direction }) as unknown as AnyPresentation;
    case "iris":
      return iris({ width: WIDTH, height: HEIGHT }) as unknown as AnyPresentation;
    case "fade":
      return fade() as unknown as AnyPresentation;
    default:
      throw new Error(`rallyo transitions: "${cut.type}" renders no Transition element`);
  }
};

/** linearTiming for custom kinds and pushCut; FRONT-eased (bezier .22, 1, .36, 1) for slide and wipe. */
export const cutTiming = (cut: CutKind): TransitionTiming => {
  if (cut.type === "cut" || cut.type === "none") {
    throw new Error(`rallyo transitions: "${cut.type}" has no timing`);
  }
  return cut.timing === "front"
    ? linearTiming({ durationInFrames: cut.frames, easing: Easing.bezier(...FRONT_BEZIER) })
    : linearTiming({ durationInFrames: cut.frames });
};

import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { LabelPill } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { PhoneFan } from "../../elements/PhoneFan";
import { AmbientOrbs } from "../../layers/AmbientOrbs";
import { GrainOverlay } from "../../layers/GrainOverlay";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, type RallyoColors } from "../../theme/rallyo";

/**
 * S11 · Offer "FREE DURING PRE-LAUNCH." (abs 1185–1350, 165 f; local = abs − 1185). Brief v2.2 section 6 S11,
 * copy from the owner decision log round 3 (props only). In: limeFlood (the scene snaps in at local 8 under the
 * fading lime, night by 15). Out: slide from-bottom at local 150.
 *
 * - Backdrop: night + `ph-open-play-night.webp` full bleed at 15% (= under night 85%), Ken Burns 1.00 → 1.06 over
 *   the scene; two slow lime/court orbs; grain.
 * - FREE slam on bar 20 (local 15 = abs 1200, the music returns): visible from 15 at 1.35, K3 scale 1.35 → 1 in 6 f
 *   (perceptual, EASE.out) about its left edge, white-hot glyphs 15 → 21, a soft lime bloom 15 → 33, and a hero-layer
 *   shake ±6 px decaying over 15–24. `DURING PRE-LAUNCH.` (92 px fixed, y 552–644) rises 40 px + fades 15–24 →
 *   hero landed 24 (abs 1209).
 * - Badge `FOR HOSTS` (LabelPill kicker, x 72–408, y 290–354) drops −40 px + fades 21–30 → landed 30 (abs 1215).
 * - Support (Satoshi 700 48 px #C3CBC1, x 72, lh 1.25, y 668–788) on 2 lines, K1 words 33, 35, 37 / 39, 41 →
 *   landed 50 (abs 1235).
 * - PhoneFan (elements/PhoneFan.tsx): rise 18–60 (6 f stagger, 18 f each, the tilt opens as it rises), one beat
 *   flash per phone at 60 / 75 / 90 / 105 / 120 L → R, float from each landing. Screens L → R: new-event sheet (top),
 *   host check-in, podium (centre, in front), host up next, player live (from below its half-cut stat row).
 * - ShineSweep across FREE 75–99: a glyph-clipped band (background-clip: text), so only the letters shine (the
 *   ShineSweep layer's screen-blended band would show as a grey bar over the night).
 * Never in this scene: a Host ID strip, a price, an end date, queue wording, a venue line.
 */

type OfferSceneProps = {
  readonly badge?: string;
  readonly hero?: string;
  readonly heroSub?: string;
  /** Support line 1, e.g. "Open plays, tournaments,". */
  readonly supportLine1?: string;
  /** Support line 2, e.g. "every feature.". */
  readonly supportLine2?: string;
  /** Phone-fan screens L → R (new event, check-in, podium, host up next, player live). */
  readonly fanSrcs?: readonly string[];
  readonly photoSrc?: string;
  readonly photoEnabled?: boolean;
  readonly colors?: RallyoColors;
};

/** Source rows skipped at the top of each fan screen (player-live-crop starts on a half-cut stat-label row). */
const FAN_OFFSET_Y = [0, 0, 0, 0, 140];

const OfferSceneInner: React.FC<OfferSceneProps> = ({
  badge = "FOR HOSTS",
  hero = "FREE",
  heroSub = "DURING PRE-LAUNCH.",
  supportLine1 = "Open plays, tournaments,",
  supportLine2 = "every feature.",
  fanSrcs = [
    "rallyo/screens/mobile/new-event-sheet-safe.png",
    "rallyo/screens/mobile/host-checkin.png",
    "rallyo/screens/mobile/podium-demo-crop.png",
    "rallyo/screens/mobile/host-up-next.png",
    "rallyo/screens/mobile/player-live-crop.png",
  ],
  photoSrc = "rallyo/photos/ph-open-play-night.webp",
  photoEnabled = true,
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Interactive.Div name="Night" style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {photoEnabled && photoSrc ? (
        <Img
          name="Offer photo (15%)"
          src={asset(photoSrc)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            objectFit: "cover",
            objectPosition: "46% 50%",
            opacity: 0.15,
            filter: "saturate(0.7) blur(1.5px)",
            scale: interpolate(frame, [0, 165], [1, 1.06], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              output: "perceptual-scale",
            }),
          }}
        />
      ) : null}
      <AmbientOrbs name="Orbs" colorA={colors.lime} colorB={colors.court} intensity={0.12} />
      <PhoneFan
        name="Phone fan"
        screens={fanSrcs.map((src, i) => ({ src, offsetY: FAN_OFFSET_Y[i] ?? 0 }))}
        enterAt={18}
        stagger={6}
        enterFrames={18}
        flashAt={[60, 75, 90, 105, 120]}
      />
      <LabelPill
        name="Badge"
        label={badge}
        variant="kicker"
        limeColor={colors.lime}
        nightColor={colors.night}
        style={{
          left: 72,
          top: 290,
          opacity: interpolate(frame, [21, 27], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [21, 30], ["0px -40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      {/* Hero layer: FREE + DURING PRE-LAUNCH. shake together after the slam (±6 px, decaying 15–24). */}
      <Interactive.Div
        name="Hero layer (shake)"
        style={{
          position: "absolute",
          inset: 0,
          translate: interpolate(
            frame,
            [15, 16, 17, 18, 19, 20, 21, 22, 24],
            ["0px 0px", "6px -3px", "-5px 3px", "4px -2px", "-3px 2px", "2px -1px", "-1px 1px", "1px 0px", "0px 0px"],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        <Interactive.Div
          name="FREE bloom"
          style={{
            position: "absolute",
            left: 72 + 185 - 380,
            top: 458 - 210,
            width: 760,
            height: 420,
            borderRadius: "50%",
            backgroundImage: `radial-gradient(closest-side, ${colors.lime} 0%, rgba(200, 242, 58, 0) 100%)`,
            opacity: interpolate(frame, [14, 15, 33], [0, 0.28, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            scale: interpolate(frame, [15, 33], [0.7, 1.15], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
          }}
        />
        <Interactive.Div
          name="FREE slam"
          style={{
            position: "absolute",
            left: 72,
            top: 376,
            transformOrigin: "0% 60%",
            opacity: interpolate(frame, [14, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [15, 21], [1.35, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
          }}
        >
          <Interactive.Div
            name="FREE"
            style={{ ...displayText({ size: 180, color: colors.lime, lineHeight: 0.91 }), paddingRight: 24 }}
          >
            {hero}
          </Interactive.Div>
          {/* Impact: white-hot glyphs on the slam frame, back to lime by 21. */}
          <Interactive.Div
            name="FREE impact"
            style={{
              ...displayText({ size: 180, color: "#F6FFD6", lineHeight: 0.91 }),
              position: "absolute",
              left: 0,
              top: 0,
              paddingRight: 24,
              opacity: interpolate(frame, [15, 21], [0.85, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {hero}
          </Interactive.Div>
          {/* ShineSweep 75–99, clipped to the glyphs. */}
          <Interactive.Div
            name="FREE shine"
            style={{
              ...displayText({ size: 180, color: "rgba(255, 255, 255, 0)", lineHeight: 0.91 }),
              position: "absolute",
              left: 0,
              top: 0,
              paddingRight: 24,
              backgroundImage:
                "linear-gradient(100deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0) 100%)",
              backgroundSize: "170px 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: `${interpolate(frame, [75, 99], [-190, 430], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.45, 0, 0.55, 1),
              })}px 0px`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {hero}
          </Interactive.Div>
        </Interactive.Div>
        <Interactive.Div
          name="Hero line 2"
          style={{
            ...displayText({ size: 92, color: colors.fg, lineHeight: 1 }),
            position: "absolute",
            left: 72,
            top: 552,
            whiteSpace: "nowrap",
            opacity: interpolate(frame, [15, 24], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [15, 24], ["0px 40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {heroSub}
        </Interactive.Div>
      </Interactive.Div>
      <KineticText
        name="Support line 1"
        from={33}
        text={supportLine1}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...uiText(700, { size: 48, color: colors.fg2, lineHeight: 1.25 }),
          position: "absolute",
          left: 72,
          top: 668,
          columnGap: "0.26em",
          whiteSpace: "nowrap",
          flexWrap: "nowrap",
        }}
      />
      <KineticText
        name="Support line 2"
        from={39}
        text={supportLine2}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...uiText(700, { size: 48, color: colors.fg2, lineHeight: 1.25 }),
          position: "absolute",
          left: 72,
          top: 728,
          columnGap: "0.26em",
          whiteSpace: "nowrap",
          flexWrap: "nowrap",
        }}
      />
      <GrainOverlay name="Grain" opacity={0.08} />
    </>
  );
};

const offerSceneSchema = {
  badge: { type: "string", default: "FOR HOSTS", description: "Badge" },
  hero: { type: "string", default: "FREE", description: "Hero" },
  heroSub: { type: "string", default: "DURING PRE-LAUNCH.", description: "Hero line 2" },
  supportLine1: { type: "string", default: "Open plays, tournaments,", description: "Support line 1" },
  supportLine2: { type: "string", default: "every feature.", description: "Support line 2" },
  photoSrc: { type: "asset", assetType: "image", default: "rallyo/photos/ph-open-play-night.webp", description: "B-roll photo" },
  photoEnabled: { type: "boolean", default: true, description: "B-roll photo on" },
} as const satisfies InteractivitySchema;

export const OfferScene = Interactive.create({
  Component: OfferSceneInner,
  layout: "absolute-fill",
  schema: offerSceneSchema,
});

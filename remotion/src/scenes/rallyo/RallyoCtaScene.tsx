import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { KineticText } from "../../elements/KineticText";
import { AmbientOrbs } from "../../layers/AmbientOrbs";
import { GrainOverlay } from "../../layers/GrainOverlay";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, wordmarkText, type RallyoColors } from "../../theme/rallyo";

/**
 * S12 · CTA "USE RALLYO WHILE IT'S FREE." (abs 1335–1500, 165 f; local = abs − 1335). Brief v2.2 section 6 S12,
 * copy from the owner decision log round 3 (props only; no badge). In: slide from-bottom (front-loaded; the stack
 * animates while the card arrives). Out: none; the last frame holds and loops into the f0 chat.
 * Centred stack on x 491, everything inside x 65–918, y 270–1248.
 *
 * - Backdrop: night + `ph-paddle-tap.webp` full bleed at 22% (under night ≈ 80%), Ken Burns 1.00 → 1.08 over the
 *   scene, lime/court orbs, grain. Draft v2: the photo dims 22% → 10% over 135–165 (with the music fade), so the
 *   held last frame reads as night + logo + URL and loops into the dark f0 chat without a brightness jump.
 * - Logo `rallyo-logo.png` 220x184 at x 381–601, y 290–474: scale .8 → 1 (3–18) + a lime LogoSting ring (3–18) that
 *   haloes the lockup (r 130 → 182 about 491, 381; its lower arc masked out above y ≈ 490, so it never crosses the
 *   wordmark or the headline) and re-fires on the button (105).
 * - A soft radial night scrim sits behind the stack (photo kept at the edges, calm night under the type).
 * - Headline 96 px lh .92 centred: `USE RALLYO` (y 494–582) words 3, 5; `WHILE IT'S FREE.` (y 582–670) words 7, 9, 11
 *   → landed 20 (abs 1355).
 * - URL `rallyo.ph` 160 px wordmark (x 131–851, y 690–850): K4 slam 6–15 (scale 1.18 → 1 perceptual + fade 6–9;
 *   draft v2: 1.18 not 1.3, so the slam never leaves the safe box x 65–918) → landed 15 (abs 1350), on screen to
 *   1500 (5.0 s). ShineSweep 45–69 clipped to the glyphs.
 * - Support `Website. No app needed.` 48 px centred (y 900–960) words 21, 23, 25, 27 → landed 36 (abs 1371).
 * - Button ending at 105 (abs 1440, bar 24, the track's final hit): URL pulse 1.00 → 1.04 → 1.00 with a lime glow,
 *   the 8 px lime underline (y 866–874, the URL's own width) slams scaleX 0 → 1 from the left (9 f, EASE.out), the
 *   logo ring re-fires. Each keyframe starts at 104 (still at rest), so the first visible change IS the hit frame
 *   105 (underline ≈ 40% in, ring at full); pulse peak 110, underline full 113, all settled by 125. Hold to 165.
 */

type RallyoCtaSceneProps = {
  /** Headline line 1, e.g. "USE RALLYO". */
  readonly headline1?: string;
  /** Headline line 2, e.g. "WHILE IT'S FREE.". */
  readonly headline2?: string;
  readonly url?: string;
  readonly support?: string;
  readonly logoSrc?: string;
  readonly photoSrc?: string;
  readonly photoEnabled?: boolean;
  readonly colors?: RallyoColors;
};

const RallyoCtaSceneInner: React.FC<RallyoCtaSceneProps> = ({
  headline1 = "USE RALLYO",
  headline2 = "WHILE IT'S FREE.",
  url = "rallyo.ph",
  support = "Website. No app needed.",
  logoSrc = "rallyo/brand/rallyo-logo.png",
  photoSrc = "rallyo/photos/ph-paddle-tap.webp",
  photoEnabled = true,
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <Interactive.Div name="Night" style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {photoEnabled && photoSrc ? (
        <Img
          name="CTA photo (22%)"
          src={asset(photoSrc)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            objectFit: "cover",
            objectPosition: "52% 50%",
            // 22% under night; dims to 10% over 135–165 with the music fade (1470–1500), so the last frame is the
            // brief's "night + logo + URL" and the loop cut to the dark f0 chat is not a luminance jump.
            opacity: interpolate(frame, [0, 135, 165], [0.22, 0.22, 0.1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.33, 0, 0.67, 1),
            }),
            filter: "saturate(0.7) blur(1.5px)",
            scale: interpolate(frame, [0, 165], [1, 1.08], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              output: "perceptual-scale",
            }),
          }}
        />
      ) : null}
      <AmbientOrbs name="Orbs" colorA={colors.lime} colorB={colors.court} intensity={0.14} />
      {/* Soft night scrim behind the centred stack: the photo stays at the edges, the type sits on calm night. */}
      <Interactive.Div
        name="Text scrim"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 600px 480px at 491px 640px, rgba(11, 19, 13, 0.55) 0%, rgba(11, 19, 13, 0.32) 55%, rgba(11, 19, 13, 0) 100%)",
        }}
      />
      {/* LogoSting ring (3–18): r 130 → 182 about the lockup centre (491, 381); its lower arc is masked out above y ≈ 490,
          so it haloes the logo and never crosses the wordmark or the headline (y 494). Behind the type. */}
      <Interactive.Div
        name="Logo ring"
        style={{
          position: "absolute",
          left: 491 - 130,
          top: 381 - 130,
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: `5px solid ${colors.lime}`,
          boxSizing: "border-box",
          maskImage: "linear-gradient(180deg, #000000 0%, #000000 55%, rgba(0, 0, 0, 0) 80%)",
          WebkitMaskImage: "linear-gradient(180deg, #000000 0%, #000000 55%, rgba(0, 0, 0, 0) 80%)",
          opacity: interpolate(frame, [3, 6, 18], [0, 0.9, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [3, 18], [1, 1.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
      {/* Ring re-fire on the button (105 = abs 1440). */}
      <Interactive.Div
        name="Logo ring (button)"
        style={{
          position: "absolute",
          left: 491 - 130,
          top: 381 - 130,
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: `5px solid ${colors.lime}`,
          boxSizing: "border-box",
          maskImage: "linear-gradient(180deg, #000000 0%, #000000 55%, rgba(0, 0, 0, 0) 80%)",
          WebkitMaskImage: "linear-gradient(180deg, #000000 0%, #000000 55%, rgba(0, 0, 0, 0) 80%)",
          opacity: interpolate(frame, [104, 105, 119], [0, 0.9, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [104, 119], [1, 1.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
      {logoSrc ? (
        <Img
          name="Logo"
          src={asset(logoSrc)}
          style={{
            position: "absolute",
            left: 381,
            top: 290,
            width: 220,
            height: 184,
            objectFit: "contain",
            opacity: interpolate(frame, [3, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [3, 18], [0.8, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
          }}
        />
      ) : null}
      <KineticText
        name="Headline line 1"
        from={3}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 96, color: colors.fg, lineHeight: 0.92 }),
          position: "absolute",
          left: 0,
          top: 494,
          width: 982,
          justifyContent: "center",
          flexWrap: "nowrap",
          columnGap: "0.2em",
        }}
      />
      <KineticText
        name="Headline line 2"
        from={7}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 96, color: colors.fg, lineHeight: 0.92 }),
          position: "absolute",
          left: 0,
          top: 582,
          width: 982,
          justifyContent: "center",
          flexWrap: "nowrap",
          columnGap: "0.2em",
        }}
      />
      {/* URL: centred box sized by the text itself, so the underline is exactly the URL's width. */}
      <Interactive.Div
        name="URL row"
        style={{ position: "absolute", left: 0, top: 690, width: 982, display: "flex", justifyContent: "center" }}
      >
        <Interactive.Div name="URL box" style={{ position: "relative", display: "inline-block" }}>
          <Interactive.Div
            name="URL pulse"
            style={{
              scale: interpolate(frame, [104, 110, 116], [1, 1.04, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.45, 0, 0.55, 1),
                output: "perceptual-scale",
              }),
            }}
          >
            <Interactive.Div
              name="URL slam"
              style={{
                position: "relative",
                opacity: interpolate(frame, [6, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                // 1.18 (brief K4: 1.3): 721 px × 1.18 = 851 px = x 65–917, so even the first faint slam frames
                // stay inside the safe box (DEFECTS #18: at 1.3 the URL was ≈ 937 px wide over 1341–1343).
                scale: interpolate(frame, [6, 15], [1.18, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  output: "perceptual-scale",
                }),
              }}
            >
              <Interactive.Div
                name="URL"
                style={{
                  ...wordmarkText({ size: 160, color: colors.lime, lineHeight: 1 }),
                  whiteSpace: "nowrap",
                  textShadow: `0 0 36px rgba(200, 242, 58, ${interpolate(frame, [104, 107, 125], [0, 0.55, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })})`,
                }}
              >
                {url}
              </Interactive.Div>
              {/* ShineSweep 45–69, clipped to the glyphs. */}
              <Interactive.Div
                name="URL shine"
                style={{
                  ...wordmarkText({ size: 160, color: "rgba(255, 255, 255, 0)", lineHeight: 1 }),
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: -24,
                  whiteSpace: "nowrap",
                  backgroundImage:
                    "linear-gradient(100deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0) 100%)",
                  backgroundSize: "220px 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: `${interpolate(frame, [45, 69], [-240, 780], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.bezier(0.45, 0, 0.55, 1),
                  })}px 0px`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                {url}
              </Interactive.Div>
            </Interactive.Div>
          </Interactive.Div>
          {/* Button ending: 8 px lime underline, y 866–874, slams in from the left (0 at 104 → ≈ 40% on the hit at 105). */}
          <Interactive.Div
            name="URL underline"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 176,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.lime,
              boxShadow: "0 0 18px rgba(200, 242, 58, 0.45)",
              transformOrigin: "0% 50%",
              scale: `${interpolate(frame, [104, 113], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })} 1`,
            }}
          />
        </Interactive.Div>
      </Interactive.Div>
      <KineticText
        name="Support"
        from={21}
        text={support}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...uiText(700, { size: 48, color: colors.fg2, lineHeight: 1.25 }),
          position: "absolute",
          left: 0,
          top: 900,
          width: 982,
          justifyContent: "center",
          flexWrap: "nowrap",
          columnGap: "0.26em",
        }}
      />
      <GrainOverlay name="Grain" opacity={0.08} />
    </>
  );
};

const rallyoCtaSceneSchema = {
  headline1: { type: "string", default: "USE RALLYO", description: "Headline line 1" },
  headline2: { type: "string", default: "WHILE IT'S FREE.", description: "Headline line 2" },
  url: { type: "string", default: "rallyo.ph", description: "URL" },
  support: { type: "string", default: "Website. No app needed.", description: "Support line" },
  logoSrc: { type: "asset", assetType: "image", default: "rallyo/brand/rallyo-logo.png", description: "Logo" },
  photoSrc: { type: "asset", assetType: "image", default: "rallyo/photos/ph-paddle-tap.webp", description: "B-roll photo" },
  photoEnabled: { type: "boolean", default: true, description: "B-roll photo on" },
} as const satisfies InteractivitySchema;

export const RallyoCtaScene = Interactive.create({
  Component: RallyoCtaSceneInner,
  layout: "absolute-fill",
  schema: rallyoCtaSceneSchema,
});

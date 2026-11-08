import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { LabelPill } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { LaptopFrame } from "../../elements/LaptopFrame";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { measureDisplay } from "../../layers/ChapterRail";
import { GrainOverlay } from "../../layers/GrainOverlay";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, useRallyoFontsReady, wordmarkText, type RallyoColors } from "../../theme/rallyo";

/**
 * S2 · Brand drop "Relax, host" (abs 120–240, 120 f; brief v2.2 section 6 S2, contract section 13).
 *
 * Local 0–15 is revealed inside the circleReveal (the music drop on abs 120): a lime bloom at the burst
 * centre (491, 1000) lights the night → #16241A gradient and decays by 24 while the devices arrive.
 * Draft v2 (DEFECTS #2): the drop never lands on an empty frame. The laptop already rises inside the burst
 * from local 0 (visible in the circle from abs 121), the phone follows 6 f behind, and the headline words
 * start at local 3 / 6 (abs 123 / 126, landed 138: the reading window 138–236 contains the brief's 144–236).
 *
 * Supers (3 text layers):
 * - HEADLINE `headline1` (#EEF1EA) + `headline2` (lime) on one line, Archivo 900 italic uppercase stretch 70%,
 *   96 px, x 72, y 296–392, normal word spacing (531 px → x 603). K2 words (44 px rise, 3 f stagger, 12 f
 *   enter) start 3, 6 → landed 18 (abs 138), covered by CH01 ≈ 236.
 * - LOCKUP real `rallyo-mark.png` 112 px tall + live wordmark (Archivo 900 italic, normal width, lime, 120 px,
 *   −.02em), x 72, y 414–534 (draft v3, REVIEW-craft #6: ≈ 120 px, was 104). K3 slam 1.25 → 1 (perceptual,
 *   9 f, EASE.out) over 30–39 about the mark's centre (the left edge never leaves the safe box) + a LogoSting
 *   lime ring from the mark centre (143, 474) over 30–42.
 * - BADGE `badge` LabelPill kicker x 72, y 558–622, K8 pop .6 → 1 (EASE.pop) 51–60, lands on bar 3 (abs 180).
 *
 * Devices (Stage clip y 520, default lower fade 1290 → 1590), laptop + phone combo, draft v3 (REVIEW-craft #6,
 * accuracy #12): lower and a little larger so the lockup sits in clear space and the stage reads full.
 * - LaptopFrame desktop home (screenW 860, k .2986, screen x 110–970, y 776–1314; lid top ≈ 762) floats in
 *   0–30: rises 140 px, rotate −6° → 0, scale .94 → 1, EASE.out, opaque from the first revealed frame (the
 *   circle is its entrance). Its deck spans x ≈ 42–1038, ≥ 27 px from both edges at the end of the push.
 * - PhoneFrame mobile home (screenW 280, k .2393, screen x 628–908, y 846–1452, rotate −4°) rises 1340 px
 *   6–36 (EASE.out, 6 f behind the laptop) from fully below the canvas, up through the lower fade, so no
 *   sliver ever shows at a canvas edge (was a slide from +480 px that showed a clipped sliver at the right
 *   edge 127–129), stacking in front of the laptop's right side; its bottom reaches ≈ y 1450 under the fade.
 * - Screen veil: night 40% over both screens (inside each glass) from local 0 until the badge lands (60),
 *   lifting to 20% by 75 and HELD there to the CH01 cover (draft v4, v3 craft #12: lifting to 0 let the site's
 *   own `PADDLES UP. WHO'S GOT NEXT?`, ≈ 56 px cap like `RELAX, HOST.`, compete again over 195–228), so
 *   `RELAX, HOST.` and the lockup out-rank the site's hero type for the whole hold; the shine (60–84) still
 *   crosses the screens as they brighten.
 * - Shine 60–84: one canvas-space light band (170 px, 18°) crosses the laptop and then the phone screen
 *   (ScreenShine, clipped to each glass; ShineSweep sizes its band per element, so the two would not match).
 * - Group push 1.00 → 1.03 about (540, 1100) over 39–108 (abs 159–228; linear, perceptual, continuing to
 *   1.035 at 120), so the hold never freezes.
 * One slow lime orb top-right, grain. ChapterWipe 01 (a top-level overlay) rises over 108–120; hard cut at 240.
 */

/** Device placements (canvas px), draft v3. */
const LAPTOP = { x: 110, y: 776, w: 860 } as const;
const PHONE = { x: 628, y: 846, w: 280 } as const;

type RevealSceneProps = {
  /** One-line headline part 1, e.g. "RELAX,". */
  readonly headline1?: string;
  /** One-line headline part 2 in lime, e.g. "HOST.". */
  readonly headline2?: string;
  readonly wordmark?: string;
  /** Kicker pill, e.g. "PRE-LAUNCH". */
  readonly badge?: string;
  readonly markSrc?: string;
  readonly desktopHomeSrc?: string;
  readonly mobileHomeSrc?: string;
  readonly colors?: RallyoColors;
};

/** "#RRGGBB" → [r, g, b] (0-255); anything else falls back to night. */
const rgbOf = (hex: string): [number, number, number] => {
  const m = /^#([0-9a-f]{6})/i.exec(hex.trim());
  if (!m) {
    return [11, 19, 13];
  }
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as [number, number, number];
};

/** `color` at alpha `a` as rgba(). */
const rgba = (color: string, a: number): string => `rgba(${rgbOf(color).join(", ")}, ${a})`;

/** The colour that, screen-blended over `base`, lifts it to `target` (per channel 1 − (1 − t) / (1 − b)). */
const screenLift = (base: string, target: string): string => {
  const b = rgbOf(base);
  const t = rgbOf(target);
  const c = b.map((bv, i) => Math.round(255 * Math.max(0, 1 - (1 - t[i] / 255) / Math.max(1e-6, 1 - bv / 255))));
  return `rgb(${c.join(", ")})`;
};

/**
 * One light band crossing a device screen, set in CANVAS px so the laptop and the phone share one band:
 * centre at canvas x `bandX`, `bandW` px wide, tilted 18°, screen-blended white. Rendered inside the device's
 * children slot (source px), so it is clipped to the glass; `screenX` / `k` map canvas → source px.
 */
const ScreenShine: React.FC<{
  readonly bandX: number;
  readonly screenX: number;
  readonly k: number;
  readonly boxH: number;
  readonly bandW?: number;
  readonly strength?: number;
}> = ({ bandX, screenX, k, boxH, bandW = 170, strength = 0.3 }) => {
  const w = bandW / k;
  return (
    <div
      style={{
        position: "absolute",
        left: (bandX - screenX) / k - w / 2,
        top: -boxH * 0.25,
        width: w,
        height: boxH * 1.5,
        rotate: "18deg",
        pointerEvents: "none",
        mixBlendMode: "screen",
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, ${strength * 0.45}) 30%, rgba(255, 255, 255, ${strength}) 50%, rgba(255, 255, 255, ${strength * 0.45}) 70%, rgba(255, 255, 255, 0) 100%)`,
      }}
    />
  );
};

/** Night veil over a device screen (children slot, source px `w` x `h`), at opacity `level`. */
const ScreenVeil: React.FC<{ readonly color: string; readonly w: number; readonly h: number; readonly level: number }> = ({ color, w, h, level }) =>
  level > 0 ? (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, backgroundColor: color, opacity: level, pointerEvents: "none" }} />
  ) : null;

/** Flex gap that reproduces the face's own space width (normal word spacing), px. */
const spaceGap = (line: string, size: number, ready: boolean): number => {
  const words = line.split(" ").filter((w) => w.length > 0);
  if (!ready || words.length < 2) {
    return size * 0.2;
  }
  const whole = measureDisplay(words.join(" "), size);
  const parts = words.reduce((sum, w) => sum + measureDisplay(w, size), 0);
  return (whole - parts) / (words.length - 1);
};

const RevealSceneInner: React.FC<RevealSceneProps> = ({
  headline1 = "RELAX,",
  headline2 = "HOST.",
  wordmark = "Rallyo",
  badge = "PRE-LAUNCH",
  markSrc = "rallyo/brand/rallyo-mark.png",
  desktopHomeSrc = "rallyo/screens/desktop/home.png",
  mobileHomeSrc = "rallyo/screens/mobile/home.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const fontsReady = useRallyoFontsReady();
  const headline = `${headline1} ${headline2}`;
  // Screen veil (night over both glasses): 40% until the badge lands (60), 20% from 75 to the CH01 cover (EASE.smooth).
  const veil = interpolate(frame, [60, 75], [0.4, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <Stage name="Stage" clipTop={520} color={colors.night}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "540px 1100px",
            scale: interpolate(frame, [39, 120], [1, 1.035], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.linear,
              output: "perceptual-scale",
            }),
          }}
        >
          <LaptopFrame
            name="Laptop"
            screenX={LAPTOP.x}
            screenY={LAPTOP.y}
            screenW={LAPTOP.w}
            style={{
              translate: interpolate(frame, [0, 30], ["0px 140px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              rotate: interpolate(frame, [0, 30], ["-6deg", "0deg"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [0, 30], [0.94, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          >
            <ScreenImage name="Desktop home" src={desktopHomeSrc} sourceW={2880} sourceH={1800} />
            <ScreenVeil color={colors.night} w={2880} h={1800} level={veil} />
            <ScreenShine
              bandX={interpolate(frame, [60, 84], [-120, 1200], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              })}
              screenX={LAPTOP.x}
              k={LAPTOP.w / 2880}
              boxH={1800}
            />
          </LaptopFrame>
          <PhoneFrame
            name="Phone"
            screenX={PHONE.x}
            screenY={PHONE.y}
            screenW={PHONE.w}
            style={{
              rotate: "-4deg",
              translate: interpolate(frame, [6, 36], ["0px 1340px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <ScreenImage name="Mobile home" src={mobileHomeSrc} />
            <ScreenVeil color={colors.night} w={1170} h={2532} level={veil} />
            <ScreenShine
              bandX={interpolate(frame, [60, 84], [-120, 1200], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              })}
              screenX={PHONE.x}
              k={PHONE.w / 1170}
              boxH={2532}
            />
          </PhoneFrame>
        </div>
      </Stage>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 22%, ${screenLift(colors.night, colors.nightRaised)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 470,
          top: -420,
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          pointerEvents: "none",
          mixBlendMode: "screen",
          backgroundImage: `radial-gradient(circle, ${rgba(colors.lime, 0.18)} 0%, ${rgba(colors.lime, 0.08)} 32%, ${rgba(colors.lime, 0)} 66%)`,
          translate: interpolate(frame, [0, 120], ["0px 0px", "-44px 36px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 120], [1, 1.06], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
          backgroundImage: `radial-gradient(circle at 491px 1000px, ${rgba(colors.lime, 0.42)} 0%, ${rgba(colors.lime, 0.16)} 24%, ${rgba(colors.lime, 0)} 60%)`,
          opacity: interpolate(frame, [0, 24], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        }}
      />
      <KineticText
        name="Headline"
        from={3}
        text={headline}
        by="word"
        stagger={3}
        enter={12}
        accentWords={headline2}
        accentColor={colors.lime}
        style={{
          ...displayText({ size: 96, color: colors.fg }),
          position: "absolute",
          left: 72,
          top: 296,
          flexWrap: "nowrap",
          columnGap: spaceGap(headline, 96, fontsReady),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 143,
          top: 474,
          width: 160,
          height: 160,
          marginLeft: -80,
          marginTop: -80,
          borderRadius: "50%",
          border: `4px solid ${colors.lime}`,
          boxSizing: "border-box",
          pointerEvents: "none",
          opacity: interpolate(frame, [30, 31, 42], [0, 0.85, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [30, 42], [0.7, 2.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 414,
          height: 120,
          display: "flex",
          alignItems: "center",
          gap: 20,
          transformOrigin: "71px 60px",
          opacity: interpolate(frame, [30, 33], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          scale: interpolate(frame, [30, 39], [1.25, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        {markSrc ? <Img name="Rallyo mark" src={asset(markSrc)} style={{ height: 112, width: "auto", display: "block" }} /> : null}
        <div style={{ ...wordmarkText({ size: 120, color: colors.lime }), whiteSpace: "nowrap" }}>{wordmark}</div>
      </div>
      <LabelPill
        name="Badge"
        label={badge}
        variant="kicker"
        limeColor={colors.lime}
        nightColor={colors.night}
        style={{
          left: 72,
          top: 558,
          transformOrigin: "50% 50%",
          opacity: interpolate(frame, [51, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          scale: interpolate(frame, [51, 60], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 14, stiffness: 160 }),
            output: "perceptual-scale",
          }),
        }}
      />
      <GrainOverlay name="Grain" opacity={0.08} />
    </>
  );
};

const revealSceneSchema = {
  headline1: { type: "string", default: "RELAX,", description: "Headline part 1" },
  headline2: { type: "string", default: "HOST.", description: "Headline part 2 (lime)" },
  wordmark: { type: "string", default: "Rallyo", description: "Wordmark" },
  badge: { type: "string", default: "PRE-LAUNCH", description: "Badge" },
  markSrc: { type: "asset", assetType: "image", default: "rallyo/brand/rallyo-mark.png", description: "Mark" },
  desktopHomeSrc: { type: "asset", assetType: "image", default: "rallyo/screens/desktop/home.png", description: "Desktop home" },
  mobileHomeSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/home.png", description: "Mobile home" },
} as const satisfies InteractivitySchema;

export const RevealScene = Interactive.create({
  Component: RevealSceneInner,
  layout: "absolute-fill",
  schema: revealSceneSchema,
});

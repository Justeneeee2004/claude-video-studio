import type React from "react";
import { useId } from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { RoughBox, RoughRing } from "../../elements/Annotate";
import { CameraRig, IDENTITY, rectToTransform, type CameraTransform } from "../../elements/CameraRig";
import { KineticText } from "../../elements/KineticText";
import { LaptopFrame, laptopPlacement } from "../../elements/LaptopFrame";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { Cursor } from "../../elements/Pointer";
import { ScreenImage } from "../../elements/ScreenMedia";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, type RallyoColors } from "../../theme/rallyo";

/**
 * S7 · Up next "Up next, automatic" (abs 645–765, 120 f; brief v2.2 section 6, contract section 6 / 13).
 *
 * Local timeline (abs = local + 645):
 * - 0–15   whip arrival on the COMBO base: LaptopFrame (screen x 71–911, y 590, k .2917) with the host courts
 *          board + PhoneFrame in front (screen 600/800, w 300, k .2564, −3°) on the player up-next crop.
 * - 12–24  the phone (its own layer above the rig) exits right: +760 px, −3° → +3°, EASE.in, and fades out 15–21
 *          (gone by abs 666, before it reaches the canvas edge); the camera moves 12 f to the UP NEXT column
 *          (source x 1330–1990, y 238–668 → frame x 62–920, y 584–1143, k 1.3). The Match 1 row (Next court, ▶ Play)
 *          ends at y 1156, ≥ 12 px above the rail (1170–1236).
 * - 24–66  hold drift 1.00 → 1.012 (linear) about ▶ Play (806, 1114), so the click target does not move.
 * - 12/14/16 headline words (slot B) → landed 25 · 24/26/28/30 support words → landed 39.
 * - 33–45  lime RoughBox around "Matches are made automatically …" (9 f after the camera lands).
 * - 30–36  cursor fades in at (948, 1228) · 36–54 glides to ▶ Play (807, 1142: tip on the button's lower half, so the
 *          label stays readable) · 45–57 lime RoughRing on `Next court`.
 * - 60     click (beat 11.4): cursor dip .85, Play flashes lime-hover #DFFF6E 60–66 (full on the beat; a
 *          colour-mapped copy of the captured button, not a redraw). No court change is shown.
 * - 66–90  camera EASE.inOut (3-sample motion blur, shutter .35 to cap the streak) to the COURT 1 card: source
 *          x 120–690, y 240–630 → frame x 140–842, y 590–1070 (k 1.23, centre 491, 830); the cursor fades out 66–72.
 *          Draft v3 (accuracy #6, craft #10): the page dims 30% over the fast part (69–84; v3 69–87) and the Court 2 card sinks
 *          into the board's night 66–72, so the whip never smears into a white block (v2 f723) and the Court 1 shot
 *          has no Court 2 sliver at the right edge.
 * - 90–105 drift 1.00 → 1.015 about (491, 830). 105–120: pushCut (cut + flash at 114 = abs 759) into S8,
 *          whose first framing has the same card width (702) and centre.
 * Draft v2 (director note a): the device fills the stage to ≈ 1450. A "Focus falloff" (backdrop blur 9 px, 60 px
 * ramp) under the focal UI (from y 1160 on the column, 1092 on the Court 1 card), so the lower rows stay visible as
 * soft shapes and nothing readable meets the rail.
 * Draft v4 (craft #3): the Court 1 hold (abs 731–758) no longer ends in flat night. The Stage scrim is the default
 * 1290 → 85% at 1590 (v3 1240 → 1460) and the falloff's night tint eases 30% → 0 over the 66–90 move, so the soft
 * Game History rows under the rail (lime score lines, still unreadable at 9 px) carry the lower stage to ≈ 1450:
 * band x 72–1008, y 1300–1450 mean luma ≈ 27, std ≈ 9 at abs 745 (v3 20.5 / 4.5; S6 at 610: 25 / 12).
 * Right edge (draft v3): blur 6 px + 85% night from x 944 (column; the STANDINGS paper starts at 988) / 850
 * (Court 1), so no neighbouring card reads as a clipped sliver at the canvas edge. Draft v4 (craft #5 / accuracy
 * #10): the 12–24 zoom swept the white STANDINGS table through x ≈ 760–1040 before that cover landed (a white flash
 * at the edge, abs 659–664), and the two IN GAME court cards out past the left edge: both sit under 70% night
 * in-screen from local 9–12 (the court cards clear again, off-canvas, over 57–63). Right-edge band (x 880–1080,
 * y 590–1250) mean luma over abs 659–664: v3 38–107, now 24–44.
 */

type UpNextSceneProps = {
  readonly headline1?: string;
  readonly headline2?: string;
  /** Support line under the headline (the accuracy guard), e.g. "You send each match.". */
  readonly support?: string;
  readonly courtsSrc?: string;
  readonly playerUpNextSrc?: string;
  readonly colors?: RallyoColors;
};

/** Uniform push `p` about canvas point (cx, cy), applied on top of an existing camera transform. */
const pushOn = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

const UpNextSceneInner: React.FC<UpNextSceneProps> = ({
  headline1 = "UP NEXT,",
  headline2 = "AUTOMATIC.",
  support = "You send each match.",
  courtsSrc = "rallyo/screens/desktop/demo-open-play-host-courts.png",
  playerUpNextSrc = "rallyo/screens/mobile/player-upnext-crop.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const flashFilterId = `play-hover-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const laptop = laptopPlacement();
  // UP NEXT column framing (k 1.3): its hold drifts 1.00 → 1.012 about the Play button, so the click target stays put.
  const column = rectToTransform({ x: 1330, y: 238, w: 660, h: 430 }, { x: 62, y: 584, w: 858, h: 559 }, laptop);
  // COURT 1 card framing (k 1.23, centre 491, 830) and the end-of-hold drift (1.015 about the same centre).
  const court1 = rectToTransform({ x: 120, y: 240, w: 570, h: 390 }, { x: 140, y: 590, w: 702, h: 480 }, laptop);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {/* Default lower scrim (1290 → 85% at 1590; v3 1240 → 1460): the device fills the stage to ≈ 1450. The right
          fade closes in to 900 on the column (the STANDINGS table only ghosts at the edge) and 850 on Court 1. */}
      <Stage
        name="Stage"
        clipTop={570}
        color={colors.night}
        scrimTop={1290}
        scrimBottom={1590}
        sideFadeRight={interpolate(frame, [12, 24, 66, 90], [924, 900, 900, 850], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.83, 0, 0.17, 1),
        })}
      >
        <CameraRig
          name="Camera"
          screen={laptop}
          shutter={0.35}
          moves={[
            { start: 0, end: 0, transform: IDENTITY },
            { start: 12, end: 24, sourceRect: { x: 1330, y: 238, w: 660, h: 430 }, frameRect: { x: 62, y: 584, w: 858, h: 559 } },
            { start: 24, end: 66, transform: pushOn(column, 1.012, 806, 1114), ease: "linear" },
            { start: 66, end: 90, sourceRect: { x: 120, y: 240, w: 570, h: 390 }, frameRect: { x: 140, y: 590, w: 702, h: 480 }, blur: 3 },
            { start: 90, end: 105, transform: pushOn(court1, 1.015, 491, 830), ease: "linear" },
          ]}
        >
          <LaptopFrame name="Laptop" screenX={71} screenY={590} screenW={840}>
            <ScreenImage name="Host courts board" src={courtsSrc} sourceW={2880} sourceH={1800} />
            {/* The two white IN GAME court cards (source x 120–1284, y 240–632) sweep out past the left edge in the
                12–24 zoom: 70% night for that move only, clear again (off-canvas) before the 66–90 move back. */}
            <Interactive.Div
              name="In-game cards dim"
              style={{
                position: "absolute",
                left: 110,
                top: 230,
                width: 1185,
                height: 412,
                borderRadius: 28,
                backgroundColor: colors.night,
                opacity: interpolate(frame, [9, 12, 57, 63], [0, 0.7, 0.7, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            />
            {/* The white STANDINGS table (source x 2042–2760) dims to 70% night as the camera leaves the combo shot:
                the zoom sweeps it through x ≈ 760–1040 before the right-edge cover lands, which read as a white flash
                at the frame edge (craft #5 / accuracy #10, abs 659–664). Off-canvas in the Court 1 shot. */}
            <Interactive.Div
              name="Standings dim"
              style={{
                position: "absolute",
                left: 2030,
                top: 140,
                width: 750,
                height: 1660,
                backgroundColor: colors.night,
                opacity: interpolate(frame, [9, 12], [0, 0.7], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            />
            <RoughBox
              name="Box auto paragraph"
              rect={{ x: 1345, y: 262, w: 615, h: 118 }}
              at={33}
              frames={12}
              tone="lime"
              strokeWidth={6 / 1.3}
              padding={10 / 1.3}
              seed={7}
            />
            <RoughRing
              name="Ring Next court"
              rect={{ x: 1692, y: 629, w: 122, h: 31 }}
              at={45}
              frames={12}
              tone="lime"
              strokeWidth={6 / 1.3}
              padding={10 / 1.3}
              spread={1.12}
              spreadY={1.6}
              seed={3}
            />
            {/* Play click: the captured button, colour-mapped lime #C8F23A → lime-hover #DFFF6E (night ink kept). */}
            <Interactive.Div
              name="Play flash"
              style={{
                position: "absolute",
                left: 1836,
                top: 614,
                width: 132,
                height: 64,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 0 30px rgba(223, 255, 110, 0.55)",
                opacity: interpolate(frame, [59, 60, 63, 66], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {frame >= 60 && frame < 66 ? (
                <Img
                  name="Play button capture"
                  src={asset(courtsSrc)}
                  style={{
                    position: "absolute",
                    left: -1836,
                    top: -614,
                    width: 2880,
                    height: 1800,
                    maxWidth: "none",
                    filter: `url(#${flashFilterId})`,
                  }}
                />
              ) : null}
            </Interactive.Div>
            {/* Court 2 card (source x 714–1284, y 240–630) sinks into the board's own night as the camera leaves the
                column (it is off-canvas there): in the Court 1 shot it would be a ≈ 30% sliver at the right edge, and in
                the 66–90 move its paper merged with Court 1 into one white smear block. Feathered 4 px inside the gap. */}
            <Interactive.Div
              name="Court 2 cover"
              style={{
                position: "absolute",
                left: 704,
                top: 230,
                width: 590,
                height: 412,
                borderRadius: 28,
                backgroundColor: colors.night,
                boxShadow: `0 0 6px 4px ${colors.night}`,
                opacity: interpolate(frame, [66, 72], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            />
            {/* The page dims ≈ 30% while the camera whips to Court 1 (fastest 72–84), so the smeared paper never
                blooms into a white block; back to full as the card settles (84). */}
            <Interactive.Div
              name="Move dim"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 2880,
                height: 1800,
                backgroundColor: colors.night,
                opacity: interpolate(frame, [69, 73, 79, 84], [0, 0.3, 0.3, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            />
          </LaptopFrame>
        </CameraRig>
        {/* The phone sits on its own layer above the rig, so it leaves while the camera pushes in. */}
        <PhoneFrame
          name="Phone"
          screenX={600}
          screenY={800}
          screenW={300}
          style={{
            translate: interpolate(frame, [12, 24], ["0px 0px", "760px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
            rotate: interpolate(frame, [12, 24], ["-3deg", "3deg"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
            // Faded out by 21 (abs 666), before it reaches the canvas edge: no half-clipped phone lingers.
            opacity: interpolate(frame, [15, 21], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
          }}
        >
          <ScreenImage name="Player up next" src={playerUpNextSrc} />
        </PhoneFrame>
        {/* Focus falloff: below the focal UI the board drops into soft focus (backdrop blur, light night tint), so the
            stage stays full to ≈ 1450 but nothing readable meets the rail. Edge just under the Play row (column),
            just under the Court 1 card (66–90 on), off in the combo shot. */}
        <Interactive.Div
          name="Focus falloff"
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: interpolate(frame, [12, 24, 66, 90], [1250, 1160, 1160, 1092], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
            height: 900,
            backdropFilter: "blur(9px)",
            maskImage: "linear-gradient(180deg, transparent 0px, black 60px)",
            opacity: interpolate(frame, [12, 24], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
          }}
        >
          <Interactive.Div
            name="Focus tint"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: colors.night,
              opacity: interpolate(frame, [66, 90], [0.3, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        </Interactive.Div>
        {/* Right edge: soft focus + 85% night from just past the column card (944; the STANDINGS paper starts at 988)
            and past the Court 1 card (850), so no neighbouring card reads as a clipped sliver at the canvas edge. */}
        <Interactive.Div
          name="Focus falloff right"
          style={{
            position: "absolute",
            top: 570,
            height: 1350,
            width: 300,
            left: interpolate(frame, [12, 24, 66, 90], [1080, 944, 944, 850], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
            backdropFilter: "blur(6px)",
            maskImage: "linear-gradient(90deg, transparent 0px, black 40px)",
            opacity: interpolate(frame, [12, 24], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
          }}
        >
          <Interactive.Div name="Focus tint right" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.85 }} />
        </Interactive.Div>
        <Cursor
          name="Cursor"
          path={[
            { at: 36, x: 948, y: 1228 },
            { at: 54, x: 807, y: 1142 },
          ]}
          pressAt={[60]}
          style={{
            opacity: interpolate(frame, [66, 72], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
          }}
        />
      </Stage>
      <KineticText
        name="Headline line 1"
        from={12}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 296 }}
      />
      <KineticText
        name="Headline line 2"
        from={16}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 377 }}
      />
      <KineticText
        name="Support"
        from={24}
        text={support}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...uiText(700, { size: 48, color: colors.fg2, lineHeight: 1.25 }),
          position: "absolute",
          left: 72,
          top: 486,
          columnGap: "0.25em",
        }}
      />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          {/* Per-channel linear map: lime (200, 242, 58) → (223, 255, 110); night ink (11, 19, 13) stays put. */}
          <filter id={flashFilterId} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope={1.122} intercept={-0.0051} />
              <feFuncG type="linear" slope={1.058} intercept={-0.0043} />
              <feFuncB type="linear" slope={2.156} intercept={-0.0588} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </>
  );
};

const upNextSceneSchema = {
  headline1: { type: "string", default: "UP NEXT,", description: "Headline line 1" },
  headline2: { type: "string", default: "AUTOMATIC.", description: "Headline line 2 (lime)" },
  support: { type: "string", default: "You send each match.", description: "Support line" },
  courtsSrc: { type: "asset", assetType: "image", default: "rallyo/screens/desktop/demo-open-play-host-courts.png", description: "Host board" },
  playerUpNextSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/player-upnext-crop.png", description: "Player bar" },
} as const satisfies InteractivitySchema;

export const UpNextScene = Interactive.create({
  Component: UpNextSceneInner,
  layout: "absolute-fill",
  schema: upNextSceneSchema,
});

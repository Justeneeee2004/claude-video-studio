import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Confetti, RiseMask, RoughBox, RowFlash } from "../../elements/Annotate";
import { CameraRig, cameraAt, rectToTransform, type CameraMove, type CameraTransform } from "../../elements/CameraRig";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { ScreenImage, ScreenSwipe } from "../../elements/ScreenMedia";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, type RallyoColors } from "../../theme/rallyo";

/**
 * S10d · Live + results + close: "YOU'RE UP!" → "SEE WHERE YOU RANK." + "Rallyo ratings only." → "FREE FOR PLAYERS."
 * (abs 1320–1560, 240 f). Players spec section 4 S10d (+ contract §6 S10d). Local frame = abs − 1320. In: `whip`.
 * Out: `limeFlood` at local 225, which needs the frame SOLID lime from 225 (abs 1545). Beat 4 has zero slack: the four
 * supers fill 1325–1536 exactly (landed 1336 / 1399 / 1409 / 1482; until 1381 / 1463 / 1463 / 1536).
 *
 * - 0–60   live card `live-on-court.png` (sourceH 1215): source x 64–1104, y 46–1215 → frame x 117–906, y 539–1426
 *          (k .759); stage clip 500 (the lime card top, 539, is never cut), scrim 1290 / 1560 (.85). The rail pill
 *          sits in the gap between `Maya K. / Sam B.` and `Leah V. / Chris N.` (≥ 19 px each side, measured at 1357),
 *          the `VS` 28 px right of its end. 15–60 drift 1.5% about the rail centre (491, 1203). 22–52 lime glow pulse
 *          around the lime card (measured x 72–1097, y 46–279). 5 / 7 `YOU'RE UP!` → landed 16. 61–67 K5 rise, with the
 *          fade front-loaded (60–63, inOut) so no frame shows it under `SEE` (64; the v3 craft #11 double exposure).
 * - 60–72  ScreenSwipe from-bottom to the standings (sourceH 2325): source x 60–1110, y 670–1360 → frame x 92–890,
 *          y 600–1124 (k .76); clip 500 → 570. Travel 1215 su (`boxH`, the screen box kept at 2532 via `style`): the
 *          standings follow the live page's last row like one strip, so no empty band of phone crosses the stage; the
 *          paper arrives dimmed (night .85 → 0), so its first rows never pop in under the live card's foot. 72–99 drift
 *          1% about (491, 860). Rows 3–7 (seed names, incl. the seed host in row 4) run on to ≈ 1450 in soft focus from
 *          source 1380 (frame 1140): blur 14 canvas px + 35% night, 79 su ramp (the spec's 9 px left row 4
 *          half-readable). 64–70 rank words → landed 79; 76–80 support → landed 89; exit 143–149 (K5). Draft v5 (craft
 *          #6, 1384): the page head (`STANDINGS`, tabs, blurb; source y < 668) is a soft copy, so the title never rides
 *          through the stage and under the rail as text mid-swipe (at rest it is above the clip either way).
 * - 81–90  night-ink RoughBox (4 px) on the `RALLYO ONLY` badge (measured x 72–363, y 777–834), padding 12 su on the
 *          left, top and bottom and ≈ 5 su on the right (draft v5, craft #8): the right stroke ends 12–13 px clear of the
 *          "Registered Rallyo players. Not …" note (x ≥ 388; v4 7–8 px).
 * - 87–99  lime-tint RowFlash on row 1 `1 Maya Kim 56 4.84` (source x 62–1100, y 1105–1200), multiply: ink stays crisp.
 * - 99–111 ScreenSwipe from-bottom to the podium (sourceH 2532), travel 1325 su (the podium draws from 1000, the
 *          standings end at 2325: one strip again). The outgoing paper dims (night 0 → .45, 99–105). Camera (draft v5,
 *          craft #1; v4 k .577 with the GOLD block 155 px, smaller than S8's 181): source x 135–1035, y 1185–2031 →
 *          frame x 197–793, y 582–1142 (k .662): the podium alone, JR avatar top 620, block bottoms 28 px over the
 *          rail, GOLD block 178 px wide. The `BEGINNER · 20 players · top 3` heading is painted card colour (it would sit
 *          in the top fade). The podium's title, venue, `Hosted by` line and stats (source y < 1000) are never drawn
 *          (clip), so nothing of them can stream past mid-swipe. The tie note + FINAL STANDINGS (re-served rows)
 *          continue soft from source 2040 to the phone's foot at ≈ 1480–1510.
 * - 111–120 one RiseMask per podium block (measured: silver x 147–419 from 1695, gold 450–719 from 1581, bronze
 *          750–1022 from 1779, all to 2030), 9 f EASE.out: the bars land on bar 24 (1440). 120–144 ≤ 24 lime confetti
 *          (33 su), seeded, in-screen and BEHIND the podium: feathered exact copies of the avatars, name + record
 *          stacks and blocks sit over it, so it never crosses a name, record or label (draft v5, accuracy #6).
 * - 123–210 push ×1.12 (linear) about the block baseline under GOLD (495, 1142): k .662 → .742, GOLD 178 → 200 px,
 *          the bottoms stay put. 150–162 the clip opens 570 → 510 (the support has left at 149), so the JR avatar stays
 *          clear of the top fade (top ≥ 600 to 150, 557 at 210). 149–153 close words → landed 162.
 * - 210–216 screen text out (GOLD labels painted the block's flat lime, its rounded top corners squared in lime (draft
 *          v5, craft #7: no lime "tombstone" in the zoom), the rest of the screen to night; the patches overlap by 2 su
 *          so no seam shows). 216–219 close fades (gone before the block reaches it at 221). 216–225
 *          zoom into the CENTRE of the flat GOLD block (source x 547–623, y 1738–1873 → the full canvas, EASE.in,
 *          perceptual; all four block edges leave together ≈ 223) + full-canvas lime fill 216–225 (EASE.in); the stage
 *          clip follows the block's top once it rises past it. Solid lime from 222 (abs 1542).
 */

type PlayersLiveSceneProps = {
  /** `YOU'RE` (fg), one line with upLine2. */
  readonly upLine1?: string;
  /** `UP!` (lime). */
  readonly upLine2?: string;
  /** `SEE WHERE` (fg). */
  readonly rankLine1?: string;
  /** `YOU RANK.` (lime). */
  readonly rankLine2?: string;
  /** `Rallyo ratings only.` */
  readonly rankSupport?: string;
  /** `FREE FOR` (fg). */
  readonly closeLine1?: string;
  /** `PLAYERS.` (lime). */
  readonly closeLine2?: string;
  /** players/live-on-court.png (1170x1215). */
  readonly liveSrc?: string;
  /** players/standings-rallyo.png (1170x2325). */
  readonly standingsSrc?: string;
  /** players/results-podium.png (1170x2532). */
  readonly podiumSrc?: string;
  readonly colors?: RallyoColors;
};

const PHONE = phonePlacement(131, 600, 720);

const LIVE_SOURCE = { x: 64, y: 46, w: 1040, h: 1169 };
const LIVE_FRAME = { x: 117, y: 539, w: 789, h: 887 };
const STANDINGS_SOURCE = { x: 60, y: 670, w: 1050, h: 690 };
const STANDINGS_FRAME = { x: 92, y: 600, w: 798, h: 524 };
/**
 * Draft v5 (craft #1): the podium alone, from the JR avatar (source y 1242) to the block bottoms (2031), at k .662 (v4
 * .577): block bottoms on frame y 1142 (28 px over the rail), GOLD centre (585) on x 495. The `BEGINNER · 20 players ·
 * top 3` heading (now inside the top fade) is painted card colour, so no sliced heading rides the clip.
 */
const PODIUM_SOURCE = { x: 135, y: 1185, w: 900, h: 846 };
const PODIUM_FRAME = { x: 197, y: 582, w: 596, h: 560 };
/** 123–210 push about the block baseline under GOLD (495, 1142): the bottoms stay off the rail, the podium grows up. */
const PODIUM_PUSH = { p: 1.12, x: 495, y: 1142 };
/**
 * Zoom target (9:16), mapped onto the whole canvas: the CENTRE of the GOLD block (centre 585, 1806), flat lime once its
 * labels are painted out at 210–216. Centred, all four block edges leave the canvas together around local 223; the
 * spec's lower target (x 525–601, y 1890–2025) kept the block's bottom edge on screen to the last frame, a dark band
 * under the lime at 1542–1544.
 */
const GOLD_SOURCE = { x: 547, y: 1738, w: 76, h: 135 };
const GOLD_FRAME = { x: 0, y: 0, w: 1080, h: 1920 };
/** GOLD block (flat #C8F23A, measured): x 450–719, y 1581–2030 (= [450, 720) × [1581, 2031)). */
const GOLD = { x: 450, y: 1581, w: 270, h: 450 };

const pushFraming = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

const CAMERA_MOVES: readonly CameraMove[] = [
  { start: 0, end: 0, sourceRect: LIVE_SOURCE, frameRect: LIVE_FRAME },
  { start: 15, end: 60, transform: pushFraming(rectToTransform(LIVE_SOURCE, LIVE_FRAME, PHONE), 1.015, 491, 1203), ease: "linear" },
  { start: 60, end: 72, sourceRect: STANDINGS_SOURCE, frameRect: STANDINGS_FRAME },
  { start: 72, end: 99, transform: pushFraming(rectToTransform(STANDINGS_SOURCE, STANDINGS_FRAME, PHONE), 1.01, 491, 860), ease: "linear" },
  { start: 99, end: 111, sourceRect: PODIUM_SOURCE, frameRect: PODIUM_FRAME },
  {
    start: 123,
    end: 210,
    transform: pushFraming(rectToTransform(PODIUM_SOURCE, PODIUM_FRAME, PHONE), PODIUM_PUSH.p, PODIUM_PUSH.x, PODIUM_PUSH.y),
    ease: "linear",
  },
  { start: 216, end: 225, sourceRect: GOLD_SOURCE, frameRect: GOLD_FRAME, ease: "in" },
];

const K_LIVE = 0.759;
const K_STANDINGS = 0.76;
const K_PODIUM = 0.662;
/**
 * Standings rows 3–7 (seed names, incl. the seed host in row 4): the focus falloff from frame y 1140 = source 1380.
 * 14 canvas px (+35% night): the spec's 9 px left row 4's name half-readable on the core stub stills.
 */
const STANDINGS_SOFT_Y = 1380;
/** Podium: tie note + FINAL STANDINGS (re-served rows) soft from source 2040. */
const PODIUM_SOFT_Y = 2040;
/**
 * Podium page above the BEGINNER card (title, blurred venue, `Hosted by`, stats; card border at y 1005): never drawn
 * (clipped), so it cannot stream past in the swipe and the outgoing standings show through instead.
 */
const PODIUM_TOP_CLIP = 1000;
/**
 * In-screen swipe travel (su): each incoming page follows the outgoing page's last row, like one long strip, so no
 * empty band of phone screen crosses the stage mid-swipe. The live file ends at 1215; the standings end at 2325 and
 * the podium draws from 1000 (2325 − 1000 = 1325).
 */
const TRAVEL_TO_STANDINGS = 1215;
const TRAVEL_TO_PODIUM = 1325;
/**
 * Standings page head (`STANDINGS`, the tabs, the ranking blurb: source y 0–631): never in frame at rest (above the
 * clip), but in the 60–72 swipe it rode up through the stage and under the rail at full size (craft #6, 1384). A soft
 * copy (blur 20 canvas px: the 95 su title letters lose their word shape; no tint, so the page keeps its luma) covers
 * it, feathered out before `Results are recorded…` (679).
 */
const STANDINGS_HEAD = { h: 668, sharpTo: 640, blur: 20 };
/** `BEGINNER` + `20 players · top 3` (measured x 146–1022, y 1089–1183) → card colour #111B14 (the card's border stays). */
const PODIUM_HEADING = { x: 90, y: 1070, w: 985, h: 135 };
/**
 * Confetti (draft v5, accuracy #6 / craft #1): lime flakes fall in the card BEHIND the podium. Above them, exact copies
 * of the screen redraw every avatar, name + record stack and block (feathered 10 su, the feather always on bare card),
 * so a flake shows only in the bare card around and between the columns, never over a name, record or label.
 * Measured (source px): avatars r 78 at MT (282, 1434), JR (585, 1320), AP (888, 1518); `Mika T.` + record x 189–376,
 * y 1550–1668; `Jessa R.` + record 491–678, 1436–1554; `Ana P.` + record 793–980, 1634–1752; blocks silver 147–420 ×
 * 1695–2031, gold 450–720 × 1581–2031, bronze 750–1023 × 1779–2031. Avatar discs r 98 (opaque to 88); each name +
 * record stack runs from its avatar's centre down into its block, 30 su either side of the text, so a visible flake
 * stays ≥ 20 su (≈ 14 px) off every glyph and never reads as a dash beside a name.
 */
const CONFETTI_FEATHER = 10;
const PODIUM_FRONT: readonly { label: string; round: boolean; x: number; y: number; w: number; h: number }[] = [
  { label: "MT", round: true, x: 184, y: 1336, w: 196, h: 196 },
  { label: "JR", round: true, x: 487, y: 1222, w: 196, h: 196 },
  { label: "AP", round: true, x: 790, y: 1420, w: 196, h: 196 },
  { label: "Mika T. record", round: false, x: 159, y: 1434, w: 247, h: 266 },
  { label: "Jessa R. record", round: false, x: 461, y: 1320, w: 247, h: 270 },
  { label: "Ana P. record", round: false, x: 763, y: 1518, w: 247, h: 267 },
  { label: "Silver block", round: false, x: 137, y: 1685, w: 293, h: 360 },
  { label: "Gold block", round: false, x: 440, y: 1571, w: 290, h: 474 },
  { label: "Bronze block", round: false, x: 740, y: 1769, w: 293, h: 276 },
];
/** Spawn band source y 1132–1322 (around and above JR, the bare card where the heading was), falls 418–760 su. */
const CONFETTI_AREA = { x: 120, y: 1170, w: 930, h: 760 };
const CONFETTI_AT = 120;
const CONFETTI_FRAMES = 24;

const PlayersLiveSceneInner: React.FC<PlayersLiveSceneProps> = ({
  upLine1 = "YOU'RE",
  upLine2 = "UP!",
  rankLine1 = "SEE WHERE",
  rankLine2 = "YOU RANK.",
  rankSupport = "Rallyo ratings only.",
  closeLine1 = "FREE FOR",
  closeLine2 = "PLAYERS.",
  liveSrc = "rallyo/screens/players/live-on-court.png",
  standingsSrc = "rallyo/screens/players/standings-rallyo.png",
  podiumSrc = "rallyo/screens/players/results-podium.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  // 500 on the live card (its lime top lands at 539) → 570 under the rank support (y 486–546) → 510 once the support
  // has left (149; `PLAYERS.` ends ≈ 446), so the 1.12 push keeps the JR avatar clear of the top fade: its top is ≥ 600
  // up to 150 (fade ends 594) and 557 at 210 (fade ends 534).
  const clipBase = interpolate(frame, [60, 72, 150, 162], [500, 570, 570, 510], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  // In the zoom the clip follows the GOLD block's top once it rises past the clip, so the block is never cut flat.
  const cam = cameraAt(frame, CAMERA_MOVES, PHONE);
  const goldTop = cam.translateY + cam.scale * (PHONE.y + GOLD.y * PHONE.k);
  const clipTop = frame < 216 ? clipBase : Math.max(0, Math.min(clipBase, goldTop));
  const textOut = interpolate(frame, [210, 216], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <Stage
        name="Stage"
        clipTop={clipTop}
        color={colors.night}
        topFade={interpolate(frame, [216, 219], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        scrimTop={1290}
        scrimBottom={interpolate(frame, [60, 72], [1560, 1590], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        scrimOpacity={interpolate(frame, [216, 222], [0.85, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })}
        sideOpacity={interpolate(frame, [216, 222], [0.85, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })}
      >
        <CameraRig name="Camera" screen={PHONE} moves={CAMERA_MOVES}>
          <PhoneFrame name="Phone" screenX={131} screenY={600} screenW={720} island={false}>
            <ScreenSwipe
              name="Swipe to podium"
              at={99}
              frames={12}
              direction="from-bottom"
              boxH={TRAVEL_TO_PODIUM}
              style={{ height: 2532 }}
              before={
                <ScreenSwipe
                  name="Swipe to standings"
                  at={60}
                  frames={12}
                  direction="from-bottom"
                  boxH={TRAVEL_TO_STANDINGS}
                  style={{ height: 2532 }}
                  before={
                    <>
                      <ScreenImage name="On Court 2 now" src={liveSrc} sourceH={1215} />
                      {/* Glow pulse around the lime `On Court 2 now` card (measured x 72–1097, y 46–279). */}
                      <Interactive.Div
                        name="Lime card glow"
                        style={{
                          position: "absolute",
                          left: 72,
                          top: 46,
                          width: 1026,
                          height: 234,
                          borderRadius: 30,
                          pointerEvents: "none",
                          boxShadow: `0 0 ${interpolate(frame, [22, 37, 52], [0, 40 / K_LIVE, 0], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.37, 0, 0.63, 1),
                          })}px ${interpolate(frame, [22, 37, 52], [0, 8 / K_LIVE, 0], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.37, 0, 0.63, 1),
                          })}px rgba(200, 242, 58, ${interpolate(frame, [22, 37, 52], [0, 0.6, 0], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.37, 0, 0.63, 1),
                          })})`,
                        }}
                      />
                    </>
                  }
                  after={
                    <>
                      <ScreenImage name="Standings" src={standingsSrc} sourceH={2325} />
                      <Interactive.Div
                        name="Standings head (soft)"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: 1170,
                          height: STANDINGS_HEAD.h,
                          overflow: "hidden",
                          maskImage: `linear-gradient(180deg, black 0px, black ${STANDINGS_HEAD.sharpTo}px, transparent ${STANDINGS_HEAD.h}px)`,
                        }}
                      >
                        {standingsSrc ? (
                          <Img
                            name="Standings head blur"
                            src={asset(standingsSrc)}
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              width: 1170,
                              height: 2325,
                              maxWidth: "none",
                              filter: `blur(${(STANDINGS_HEAD.blur / K_STANDINGS).toFixed(2)}px)`,
                            }}
                          />
                        ) : null}
                      </Interactive.Div>
                      <Interactive.Div
                        name="Standings focus falloff"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: STANDINGS_SOFT_Y,
                          width: 1170,
                          height: 2325 - STANDINGS_SOFT_Y,
                          overflow: "hidden",
                          maskImage: "linear-gradient(180deg, transparent 0px, black 79px)",
                        }}
                      >
                        {standingsSrc ? (
                          <Img
                            name="Standings rows (soft)"
                            src={asset(standingsSrc)}
                            style={{
                              position: "absolute",
                              left: 0,
                              top: -STANDINGS_SOFT_Y,
                              width: 1170,
                              height: 2325,
                              maxWidth: "none",
                              filter: `blur(${(14 / K_STANDINGS).toFixed(2)}px)`,
                            }}
                          />
                        ) : null}
                        <Interactive.Div name="Standings soft tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.35 }} />
                      </Interactive.Div>
                      {/* 81–90: night-ink box on the badge only. Draft v5 (craft #8): the right side pads ≈ 5 su (the rect
                          stops 7 su inside the badge's right end, 363), so the right stroke sits at ≈ 368, ≥ 13 su clear
                          of `Registered` / `ratings.` (x ≥ 388) even at the wobble's peak; left, top, bottom keep 12. */}
                      <RoughBox
                        name="Box Rallyo only"
                        rect={{ x: 72, y: 777, w: 284, h: 56 }}
                        at={81}
                        frames={9}
                        tone="ink"
                        strokeWidth={4 / K_STANDINGS}
                        padding={12}
                        roughness={0.8}
                        seed={7}
                      />
                      {/* 87–99: lime-tint flash on row 1, where Maya ranks (multiply: the row's ink stays crisp). */}
                      <RowFlash
                        name="Flash row 1"
                        rect={{ x: 62, y: 1105, w: 1038, h: 95 }}
                        at={87}
                        frames={12}
                        tone="tint"
                        radius={10 / K_STANDINGS}
                      />
                      {/* The paper arrives dimmed (night .85 → 0, 60–72: its first rows join the strip under the live card's
                          foot without a pop) and dims again as it leaves (99–105): never a white slam. */}
                      <Interactive.Div
                        name="Standings swipe dim"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: 1170,
                          height: 2325,
                          backgroundColor: colors.night,
                          opacity: interpolate(frame, [60, 72, 99, 105], [0.85, 0, 0, 0.45], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.37, 0, 0.63, 1),
                          }),
                        }}
                      />
                    </>
                  }
                />
              }
              after={
                <Interactive.Div name="Podium (card down)" style={{ position: "absolute", inset: 0, clipPath: `inset(${PODIUM_TOP_CLIP}px 0px 0px 0px)` }}>
                  <RiseMask name="Rise silver" rect={{ x: 145, y: 1693, w: 277, h: 338 }} at={111} frames={9} fillColor={colors.nightCard}>
                    <RiseMask name="Rise gold" rect={{ x: 448, y: 1579, w: 274, h: 452 }} at={111} frames={9} fillColor={colors.nightCard}>
                      <RiseMask name="Rise bronze" rect={{ x: 748, y: 1777, w: 277, h: 254 }} at={111} frames={9} fillColor={colors.nightCard}>
                        <ScreenImage name="Results podium" src={podiumSrc} sourceH={2532} />
                        <Interactive.Div
                          name="Podium heading out"
                          style={{
                            position: "absolute",
                            left: PODIUM_HEADING.x,
                            top: PODIUM_HEADING.y,
                            width: PODIUM_HEADING.w,
                            height: PODIUM_HEADING.h,
                            backgroundColor: colors.nightCard,
                          }}
                        />
                        {/* 120–144: lime confetti in the card, BEHIND the podium (in-screen: rides the camera push). */}
                        <Confetti
                          name="Confetti"
                          area={CONFETTI_AREA}
                          at={CONFETTI_AT}
                          frames={CONFETTI_FRAMES}
                          count={24}
                          size={33}
                          seed="players-podium"
                          colors={[colors.lime, colors.limeTint, colors.lime, colors.limeHover]}
                        />
                        {/* The podium's front: feathered exact copies of avatars, names + records and blocks over the
                            confetti, mounted only while it falls. */}
                        {podiumSrc && frame >= CONFETTI_AT && frame <= CONFETTI_AT + CONFETTI_FRAMES
                          ? PODIUM_FRONT.map((s) => (
                              <Interactive.Div
                                key={s.label}
                                name={`Front ${s.label}`}
                                style={{
                                  position: "absolute",
                                  left: s.x,
                                  top: s.y,
                                  width: s.w,
                                  height: s.h,
                                  overflow: "hidden",
                                  maskImage: s.round
                                    ? `radial-gradient(circle closest-side, black calc(100% - ${CONFETTI_FEATHER}px), transparent 100%)`
                                    : `linear-gradient(90deg, transparent 0px, black ${CONFETTI_FEATHER}px, black calc(100% - ${CONFETTI_FEATHER}px), transparent 100%), linear-gradient(180deg, transparent 0px, black ${CONFETTI_FEATHER}px, black calc(100% - ${CONFETTI_FEATHER}px), transparent 100%)`,
                                  maskComposite: "intersect",
                                }}
                              >
                                <Img
                                  name={`Front ${s.label} copy`}
                                  src={asset(podiumSrc)}
                                  style={{ position: "absolute", left: -s.x, top: -s.y, width: 1170, height: 2532, maxWidth: "none", display: "block" }}
                                />
                              </Interactive.Div>
                            ))
                          : null}
                      </RiseMask>
                    </RiseMask>
                  </RiseMask>
                  <Interactive.Div
                    name="Podium soft focus"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: PODIUM_SOFT_Y,
                      width: 1170,
                      height: 2532 - PODIUM_SOFT_Y,
                      overflow: "hidden",
                      maskImage: "linear-gradient(180deg, transparent 0px, black 24px)",
                    }}
                  >
                    {podiumSrc ? (
                      <Img
                        name="Podium lower (soft)"
                        src={asset(podiumSrc)}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: -PODIUM_SOFT_Y,
                          width: 1170,
                          height: 2532,
                          maxWidth: "none",
                          filter: `blur(${(12 / K_PODIUM).toFixed(2)}px)`,
                        }}
                      />
                    ) : null}
                    <Interactive.Div name="Podium soft tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.3 }} />
                  </Interactive.Div>
                  {/* 210–216: the screen's text goes before the zoom. GOLD's own labels take the block's flat lime; the
                      rest of the screen fades to night, so the zoom shows a bare lime block, never cut-off glyphs. */}
                  <Interactive.Div
                    name="Gold labels out"
                    style={{ position: "absolute", left: GOLD.x, top: 1730, width: GOLD.w, height: 150, backgroundColor: colors.lime, opacity: textOut }}
                  />
                  {/* Draft v5 (craft #7): the block's rounded top corners (r ≈ 26 su) square off with the text-out, so the
                      zoom never shows a lime "tombstone" (1541–1542). */}
                  <Interactive.Div
                    name="Gold corners square"
                    style={{ position: "absolute", left: GOLD.x, top: GOLD.y, width: GOLD.w, height: 32, backgroundColor: colors.lime, opacity: textOut }}
                  />
                  <Interactive.Div
                    name="Screen out above gold"
                    style={{ position: "absolute", left: 0, top: 0, width: 1170, height: GOLD.y, backgroundColor: colors.night, opacity: textOut }}
                  />
                  {/* The night patches overlap by 2 su where they meet (never on the block), so no anti-aliased seam shows. */}
                  <Interactive.Div
                    name="Screen out left of gold"
                    style={{ position: "absolute", left: 0, top: GOLD.y - 2, width: GOLD.x, height: 2534 - GOLD.y, backgroundColor: colors.night, opacity: textOut }}
                  />
                  <Interactive.Div
                    name="Screen out right of gold"
                    style={{
                      position: "absolute",
                      left: GOLD.x + GOLD.w,
                      top: GOLD.y - 2,
                      width: 1170 - GOLD.x - GOLD.w,
                      height: 2534 - GOLD.y,
                      backgroundColor: colors.night,
                      opacity: textOut,
                    }}
                  />
                  <Interactive.Div
                    name="Screen out below gold"
                    style={{
                      position: "absolute",
                      left: GOLD.x - 2,
                      top: GOLD.y + GOLD.h,
                      width: GOLD.w + 4,
                      height: 2532 - GOLD.y - GOLD.h,
                      backgroundColor: colors.night,
                      opacity: textOut,
                    }}
                  />
                </Interactive.Div>
              }
            />
          </PhoneFrame>
        </CameraRig>
      </Stage>
      {/* Zoom into lime: full-canvas lime above the Stage (solid from 225 for the limeFlood). */}
      <Interactive.Div
        name="Lime fill"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.lime,
          opacity: interpolate(frame, [216, 225], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="You're up"
        from={5}
        text={`${upLine1} ${upLine2}`}
        by="word"
        stagger={2}
        enter={9}
        accentWords={upLine2}
        accentColor={colors.lime}
        style={{
          ...displayText({ size: 104, color: colors.fg }),
          position: "absolute",
          left: 72,
          top: 296,
          // K5 rise over 61–67; the fade is front-loaded (inOut 60–63, gone before `SEE` starts at 64): no ghost under it.
          opacity: interpolate(frame, [60, 63], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.37, 0, 0.63, 1),
          }),
          translate: interpolate(frame, [61, 67], ["0px 0px", "0px -24px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="Rank line 1"
        from={64}
        text={rankLine1}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 88, color: colors.fg }),
          position: "absolute",
          left: 72,
          top: 296,
          opacity: interpolate(frame, [143, 149], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
          translate: interpolate(frame, [143, 149], ["0px 0px", "0px -24px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="Rank line 2"
        from={68}
        text={rankLine2}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 88, color: colors.lime }),
          position: "absolute",
          left: 72,
          top: 377,
          opacity: interpolate(frame, [143, 149], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
          translate: interpolate(frame, [143, 149], ["0px 0px", "0px -24px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="Rank support"
        from={76}
        text={rankSupport}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...uiText(700, { size: 48, color: colors.fg2, lineHeight: 1.25 }),
          position: "absolute",
          left: 72,
          top: 486,
          columnGap: "0.25em",
          opacity: interpolate(frame, [143, 149], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
          translate: interpolate(frame, [143, 149], ["0px 0px", "0px -24px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="Close line 1"
        from={149}
        text={closeLine1}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 88, color: colors.fg }),
          position: "absolute",
          left: 72,
          top: 296,
          // Gone by 219 (inside the 216–222 window): from 221 the zooming GOLD block reaches y 296–466 (lime on lime).
          opacity: interpolate(frame, [216, 219], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.37, 0, 0.63, 1),
          }),
        }}
      />
      <KineticText
        name="Close line 2"
        from={153}
        text={closeLine2}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 88, color: colors.lime }),
          position: "absolute",
          left: 72,
          top: 377,
          // Gone by 219 (inside the 216–222 window): from 221 the zooming GOLD block reaches y 296–466 (lime on lime).
          opacity: interpolate(frame, [216, 219], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.37, 0, 0.63, 1),
          }),
        }}
      />
    </>
  );
};

const playersLiveSceneSchema = {
  upLine1: { type: "string", default: "YOU'RE", description: "You're up part 1" },
  upLine2: { type: "string", default: "UP!", description: "You're up part 2 (lime)" },
  rankLine1: { type: "string", default: "SEE WHERE", description: "Rank line 1" },
  rankLine2: { type: "string", default: "YOU RANK.", description: "Rank line 2 (lime)" },
  rankSupport: { type: "string", default: "Rallyo ratings only.", description: "Rank support" },
  closeLine1: { type: "string", default: "FREE FOR", description: "Close line 1" },
  closeLine2: { type: "string", default: "PLAYERS.", description: "Close line 2 (lime)" },
  liveSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/live-on-court.png", description: "Live page" },
  standingsSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/standings-rallyo.png", description: "Standings" },
  podiumSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/results-podium.png", description: "Results podium" },
} as const satisfies InteractivitySchema;

export const PlayersLiveScene = Interactive.create({
  Component: PlayersLiveSceneInner,
  layout: "absolute-fill",
  schema: playersLiveSceneSchema,
});

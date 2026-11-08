import type React from "react";
import { Easing, Freeze, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Confetti, Highlighter, RiseMask } from "../../elements/Annotate";
import { CameraRig, rectToTransform, type CameraTransform } from "../../elements/CameraRig";
import { ChaosChip } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { TapRipple } from "../../elements/Pointer";
import { ScreenClip, ScreenImage, ScreenSwipe } from "../../elements/ScreenMedia";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, type RallyoColors } from "../../theme/rallyo";

/**
 * S8 · Who won? → standings → podium "Clear winners" (abs 750–870, 120 f; brief v2.2 section 6, contract 6 / 13).
 *
 * The stepped recording `open-play-who-won.mp4` is shown as three <Freeze> states (clip frames 0 / 40 / 90),
 * never as a running clip. Local timeline (abs = local + 750):
 * - 0–15   pushCut arrival (visible from 9). State 1: COURT 1 · BEGINNER / IN GAME card, camera source
 *          x 60–1110, y 456–993 → frame x 140–842, y 651–1010 (k .669): same width (702) and centre (491, 830)
 *          as S7's last frame. The stage clip starts at 620 here (the IN GAME heading above the card stays
 *          hidden) and opens to the standard 570 with the 30–42 camera move. 0–30 drift 1.00 → 1.012 about the card
 *          centre (491, 830).
 * - 9–19   chip slides in → landed 19 · 15 TapRipple on blank card space right of `vs` (606, 854), finger dot from 9.
 * - 28/30  headline words → landed 39.
 * - 30     state 2 on bar 13 (front-loaded 2 f dissolve, 73% in on 30) + camera 30–42 to the shared states
 *          2–3 rect. Draft v4 (accuracy #8, craft #7): source x 0–1170, y 708–1524 → frame x 99.6–882.3, y 594–1140
 *          (k .669, the state 1 scale, so 30–42 is a pure tilt; v3 y 820–1550 at k .76 hid both headings above the
 *          clip). The in-UI heading (source y 719–786) lands at y 601–646, so `IS THE GAME OVER?` and then
 *          `WHO WON?` read in the same framing, as brief section 10 step 3 asks; it never crosses the clip in the
 *          tilt. The header row `RECORD SCORE · COURT 1` + × and the status pill (source y 498–690) DO cross it
 *          (v3: sliced at abs 785–787), so they go under a sampled paper patch over 31–34, before they reach it.
 *          `Mark as game over` reads ≈ 17 px x-height (v3 19): the largest scale that keeps `WHO WON?` and both
 *          Winner? cards in one framing above the rail. 42–69 drift 1.00 → 1.012 about the tap point (530, 1094).
 * - 39–45  finger dot, TapRipple on `Mark as game over` at 45 (beat 13.2), below-right of the label centre (491,
 *          1070), under `ga` (craft #7: the finger never covers the label), button press .97 45–47; ring and dot
 *          fade 46–48 (draft v4, craft #6: v3 faded 48–51 and the ring landed on `Omar F.` after the cut), so
 *          nothing is on screen when state 3 cuts in.
 * - 48     state 3 `WHO WON?` in the same framing (the UI's answer, 3 f after the tap). Its second Winner? card ends at
 *          y ≈ 1140, 30 px above the rail. Its captured "Marked game over" toast (source y 2265–2455) is painted
 *          95% night.
 * - 54–63 / 57–66  lime-tint Highlighters on `Points go to` / `the standings when you save.` (0–0 stays).
 * - 69–81  ScreenSwipe from-right to the podium crop; camera to crop x 80–1090, y 232–1034 → frame x 148–835,
 *          y 600–1145 (k .68; v2 .585, craft #13): the podium alone fills the stage (the `BEGINNER` heading stays
 *          above the clip), its bars end at y ≈ 1147, above the rail, and the tie note + final standings continue
 *          soft below to ≈ 1450. The outgoing paper dims to 55% night 69–75, so its smear never reads as a white flash.
 * - 81–90  the three podium bars rise (one RiseMask per bar, EASE.out) and land on bar 14 (840); ≤ 24 seeded
 *          lime confetti 81–105, in-screen and BEHIND the podium (draft v5: never over a name, record or label; see
 *          PODIUM_FRONT); drift 1.00 → 1.012 from 90 about the podium centre (491, 872).
 * - 93     chip strike + ✓ (after its answer, the podium, has landed). 105–120: slide from-bottom.
 * Draft v2 (director note a): the phone fills the stage to ≈ 1450. Stage scrim 1240 → 85% at 1460, and a
 * "Focus falloff" (backdrop blur 9 px + 30% night; draft v4: 36 px ramp, v3 60) from just under the focal UI (y 1028
 * in state 1, 1124 in state 2, 1142 in state 3, 1140 on the podium): the Court 2 card, the lower sheet and the
 * standings stay visible as soft shapes, and every line beside the rail (`Still playing`, the sudden-death note,
 * 38–56 px under the edge) is fully blurred, so nothing readable meets it.
 */

type WhoWonSceneProps = {
  readonly chipSender?: string;
  readonly chipText?: string;
  readonly headline1?: string;
  readonly headline2?: string;
  readonly clipSrc?: string;
  readonly podiumSrc?: string;
  readonly colors?: RallyoColors;
};

/**
 * Confetti (draft v5, accuracy #6 / craft #1; only the confetti changed in S8): the flakes fall INSIDE the podium screen,
 * behind the podium. Above them, feathered exact copies of the screen redraw every avatar, name + record stack and block
 * (inside the bars' RiseMasks, so nothing shows early), so a flake shows only in the bare card around and between the
 * columns, never over `Priya S.`, `Tom B.`, `Jessa R.`, a record or a block label. Measured in podium-demo-crop.png:
 * avatars r 78 at TB (282, 436), PS (585, 322), JR (888, 520); `Tom B.` + record x 177–388, y 552–670; `Priya S.` +
 * record 479–690, 438–556; `Jessa R.` + record 789–983, 636–754; blocks silver 147–420 × 697–1033, gold 450–720 ×
 * 583–1033, bronze 750–1023 × 781–1033. Discs r 98 (opaque to 88); stacks run from the avatar centre into the block,
 * 30 su either side of the text; blocks pad 10 su (the feather always on bare card). Spawn and fall match v4's canvas
 * area (spawn y 573–702, fall ≈ 284–517 px); flakes 33 su (≈ 22 px; v4's 18 px read as specks).
 */
const CONFETTI_FEATHER = 10;
const PODIUM_FRONT: readonly { label: string; round: boolean; x: number; y: number; w: number; h: number }[] = [
  { label: "TB", round: true, x: 184, y: 338, w: 196, h: 196 },
  { label: "PS", round: true, x: 487, y: 224, w: 196, h: 196 },
  { label: "JR", round: true, x: 790, y: 422, w: 196, h: 196 },
  { label: "Tom B. record", round: false, x: 147, y: 436, w: 271, h: 271 },
  { label: "Priya S. record", round: false, x: 449, y: 322, w: 271, h: 271 },
  { label: "Jessa R. record", round: false, x: 759, y: 520, w: 254, h: 271 },
  { label: "Silver block", round: false, x: 137, y: 687, w: 293, h: 360 },
  { label: "Gold block", round: false, x: 440, y: 573, w: 290, h: 474 },
  { label: "Bronze block", round: false, x: 740, y: 771, w: 293, h: 276 },
];
const CONFETTI_AREA = { x: 110, y: 230, w: 950, h: 760 };
const CONFETTI_AT = 81;
const CONFETTI_FRAMES = 24;

/** Uniform push `p` about canvas point (cx, cy), applied on top of an existing camera transform. */
const pushOn = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

const WhoWonSceneInner: React.FC<WhoWonSceneProps> = ({
  chipSender = "MG",
  chipText = "Who won last night?",
  headline1 = "CLEAR",
  headline2 = "WINNERS.",
  clipSrc = "rallyo/clips/open-play-who-won.mp4",
  podiumSrc = "rallyo/screens/mobile/podium-demo-crop.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const phone = phonePlacement();
  // State 1 (the S7 match cut: card width 702, centre 491, 830), the shared states 2–3 framing (k .669, heading to
  // the second Winner? card) and the podium (k .68). Each hold drifts ≈ 1–2% (linear) about the point the viewer is
  // looking at.
  const state1 = rectToTransform({ x: 60, y: 456, w: 1050, h: 537 }, { x: 140, y: 651, w: 702, h: 359 }, phone);
  const states23 = rectToTransform({ x: 0, y: 708, w: 1170, h: 816 }, { x: 99.6, y: 594, w: 782.7, h: 546 }, phone, "width");
  const podium = rectToTransform({ x: 80, y: 232, w: 1010, h: 802 }, { x: 148, y: 600, w: 687, h: 545 }, phone);
  // Recording state on screen: 1 (clip f0) until 30, 2 (clip f40) until 48, then 3 (clip f90).
  const clipFrame = frame < 30 ? 0 : frame < 48 ? 40 : 90;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {/* Soft lower scrim like S7's (1240 → 85% at 1460): the phone fills the stage to ≈ 1450 (director note a). The
          captured "Marked game over" toast (state 3) sits far below it and is dimmed again on its own. */}
      <Stage
        name="Stage"
        color={colors.night}
        scrimTop={1240}
        scrimBottom={1460}
        clipTop={interpolate(frame, [30, 42], [620, 570], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.83, 0, 0.17, 1),
        })}
      >
        <CameraRig
          name="Camera"
          screen={phone}
          moves={[
            { start: 0, end: 0, sourceRect: { x: 60, y: 456, w: 1050, h: 537 }, frameRect: { x: 140, y: 651, w: 702, h: 359 } },
            { start: 0, end: 30, transform: pushOn(state1, 1.012, 491, 830), ease: "linear" },
            { start: 30, end: 42, transform: states23 },
            { start: 42, end: 69, transform: pushOn(states23, 1.012, 530, 1094), ease: "linear" },
            { start: 69, end: 81, sourceRect: { x: 80, y: 232, w: 1010, h: 802 }, frameRect: { x: 148, y: 600, w: 687, h: 545 } },
            { start: 90, end: 120, transform: pushOn(podium, 1.012, 491, 872), ease: "linear" },
          ]}
        >
          <PhoneFrame name="Phone" screenX={131} screenY={600} screenW={720}>
            <ScreenSwipe
              name="Podium swipe"
              at={69}
              frames={12}
              direction="from-right"
              before={
                <>
                  <Freeze frame={clipFrame}>
                    <ScreenClip name="Who won recording" src={clipSrc} />
                  </Freeze>
                  {/* State 1 gives way to state 2 on bar 13: a front-loaded 2 f dissolve (73% new on 30). */}
                  {frame >= 30 && frame < 32 ? (
                    <Interactive.Div
                      name="State 1 dissolve"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 1170,
                        height: 2532,
                        opacity: interpolate(frame, [29, 32], [1, 0], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.16, 1, 0.3, 1),
                        }),
                      }}
                    >
                      <Freeze frame={0}>
                        <ScreenClip name="Who won state 1" src={clipSrc} />
                      </Freeze>
                    </Interactive.Div>
                  ) : null}
                  {/* `Mark as game over` press .97 (the captured button, scaled about its centre on its paper). */}
                  {frame >= 45 && frame < 48 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 120,
                        top: 1318,
                        width: 930,
                        height: 196,
                        overflow: "hidden",
                        backgroundColor: "#EDEEE6",
                      }}
                    >
                      <Interactive.Div
                        name="Mark as game over press"
                        style={{
                          position: "absolute",
                          left: -120,
                          top: -1318,
                          width: 1170,
                          height: 2532,
                          transformOrigin: "585px 1416px",
                          scale: interpolate(frame, [45, 47], [1, 0.97], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.16, 1, 0.3, 1),
                            output: "perceptual-scale",
                          }),
                        }}
                      >
                        <Freeze frame={40}>
                          <ScreenClip name="Who won state 2 button" src={clipSrc} />
                        </Freeze>
                      </Interactive.Div>
                    </div>
                  ) : null}
                  {/* Sheet header row (`RECORD SCORE · COURT 1` + ×) and the status pill (`IN GAME` / `GAME OVER`):
                      paper patch (#EDEEE6, sampled) from 31–34, before the 30–42 tilt carries them through the stage clip
                      (craft #7: no glyph is sliced at the clip; the pill's foot would also ghost in the top fade at rest). */}
                  <Interactive.Div
                    name="Sheet header patch"
                    style={{
                      position: "absolute",
                      left: 62,
                      top: 498,
                      width: 1045,
                      height: 192,
                      backgroundColor: "#EDEEE6",
                      opacity: interpolate(frame, [31, 34], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                    }}
                  />
                  <Highlighter name="Highlight Points go to" rect={{ x: 755, y: 857, w: 220, h: 40 }} at={54} frames={9} tone="tint" seed={4} />
                  <Highlighter
                    name="Highlight the standings when you save"
                    rect={{ x: 132, y: 920, w: 549, h: 40 }}
                    at={57}
                    frames={9}
                    tone="tint"
                    seed={5}
                  />
                  {/* State 3's captured "Marked game over" toast: night 95% on top of the scrim, so it never reads. */}
                  {frame >= 48 ? (
                    <Interactive.Div
                      name="Toast dim"
                      style={{
                        position: "absolute",
                        left: 40,
                        top: 2240,
                        width: 1090,
                        height: 250,
                        borderRadius: 40,
                        backgroundColor: colors.night,
                        opacity: 0.95,
                      }}
                    />
                  ) : null}
                  {/* The paper sheet dims as it swipes out, so its smear never reads as a white flash. */}
                  <Interactive.Div
                    name="Swipe dim"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 1170,
                      height: 2532,
                      backgroundColor: colors.night,
                      opacity: interpolate(frame, [69, 75], [0, 0.55], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                </>
              }
              after={
                <RiseMask name="Rise silver" rect={{ x: 146, y: 695, w: 275, h: 339 }} at={81} frames={9} fillColor={colors.nightCard}>
                  <RiseMask name="Rise gold" rect={{ x: 449, y: 581, w: 272, h: 453 }} at={81} frames={9} fillColor={colors.nightCard}>
                    <RiseMask name="Rise bronze" rect={{ x: 749, y: 779, w: 275, h: 255 }} at={81} frames={9} fillColor={colors.nightCard}>
                      <ScreenImage name="Podium crop" src={podiumSrc} />
                      {/* 81–105: lime confetti in the card, BEHIND the podium (in-screen: rides the 90–120 drift). */}
                      <Confetti
                        name="Confetti"
                        area={CONFETTI_AREA}
                        at={CONFETTI_AT}
                        frames={CONFETTI_FRAMES}
                        count={24}
                        size={33}
                        seed="whowon-podium"
                        colors={[colors.lime, colors.limeTint, colors.lime, colors.limeHover]}
                      />
                      {/* The podium's front over the confetti, mounted only while it falls. */}
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
              }
            />
          </PhoneFrame>
        </CameraRig>
        {/* Focus falloff (as S7): below the focal UI the phone drops into soft focus (backdrop blur, light night tint),
            so it fills the stage to ≈ 1450 while nothing readable meets the rail. Edge under the Court 1 card (state 1),
            under `Mark as game over` / the Winner rows (states 2–3), under the podium bars (from 69). */}
        <Interactive.Div
          name="Focus falloff"
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: interpolate(frame, [30, 42, 48, 51, 69, 81], [1028, 1124, 1124, 1142, 1142, 1140], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
            height: 900,
            backdropFilter: "blur(9px)",
            // 36 px ramp (v3 60): the sheet's next lines (`Still playing`, the sudden-death note) start 38–56 px under
            // the edge, right of the pill, and must already be fully soft there.
            maskImage: "linear-gradient(180deg, transparent 0px, black 36px)",
          }}
        >
          <Interactive.Div name="Focus tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.3 }} />
        </Interactive.Div>
        {/* Taps sit below-right of what they press (craft #7), so the finger never covers the label: the card tap lands
            on blank card space right of `vs`, the button tap just under the baseline of `game over`. */}
        <TapRipple name="Tap card" x={606} y={854} at={15} dotLead={6} />
        {/* Ring and dot fade out 46–48 (gone by the state 3 cut at abs 798), so nothing lands on its Winner? cards. */}
        <TapRipple
          name="Tap Mark as game over"
          x={530}
          y={1094}
          at={45}
          dotLead={6}
          frames={9}
          style={{
            opacity: interpolate(frame, [46, 48], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
          }}
        />
      </Stage>
      <ChaosChip name="Chip" sender={chipSender} text={chipText} enterAt={9} strikeAt={93} />
      <KineticText
        name="Headline line 1"
        from={28}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 376 }}
      />
      <KineticText
        name="Headline line 2"
        from={30}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 457 }}
      />
    </>
  );
};

const whoWonSceneSchema = {
  chipSender: { type: "string", default: "MG", description: "Chip initials" },
  chipText: { type: "string", default: "Who won last night?", description: "Chip message (quotes a hook bubble)" },
  headline1: { type: "string", default: "CLEAR", description: "Headline line 1" },
  headline2: { type: "string", default: "WINNERS.", description: "Headline line 2 (lime)" },
  clipSrc: { type: "asset", assetType: "video", default: "rallyo/clips/open-play-who-won.mp4", description: "Recording" },
  podiumSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/podium-demo-crop.png", description: "Podium crop" },
} as const satisfies InteractivitySchema;

export const WhoWonScene = Interactive.create({
  Component: WhoWonSceneInner,
  layout: "absolute-fill",
  schema: whoWonSceneSchema,
});

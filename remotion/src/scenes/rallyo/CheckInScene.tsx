import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Connector, RoughRing } from "../../elements/Annotate";
import { CameraRig } from "../../elements/CameraRig";
import { ChaosChip } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { TapRipple } from "../../elements/Pointer";
import { ScreenImage } from "../../elements/ScreenMedia";
import { UiTile } from "../../elements/UiTile";
import { Stage } from "../../layers/Stage";
import { displayText, RALLYO_COLORS, type RallyoColors } from "../../theme/rallyo";

/**
 * S6 · Check-in "Check-in by code." (abs 555–660, 105 f; brief v2.2 section 6 S6, contract 6 + 13).
 *
 * Local frames (abs = local + 555). Draft v2 reframed both cameras (DEFECTS #6 / director notes a + c). Draft v3
 * (REVIEW-accuracy #5 / #13, craft #7): the rail (pill y 1170–1236, x 72–496) sits on empty card space in camera A
 * and on a deliberate soft area (the S7 / S8 focus falloff) in camera B, never on a sharp row; nothing readable
 * survives below y ≈ 1450; the tap sits under the `Check in` label instead of on it.
 *  0–15   wipe in from the left (transition). PhoneFrame base on host-checkin.png, island={false} (the pill would
 *         touch `LIVE`). Camera A: source x 100–1060 (k .831, fit width) with source y 630 → frame y 1203: the phone's
 *         top edge (≈ 660), the `Rallyo LIVE` header (727–777), `CHECK IN` (867–916), `40 of 42 checked in`
 *         (948–974), "Host only. Check in players as they arrive…" (1004–1130); the rail lands in the empty card
 *         space left of `Hide all` (su x 100–820, y 545–724; canvas 1124–1281, 34 px clear of the pill above and
 *         below). The BEGINNER header stays sharp; from y 1380 the toggle, field and list drop into the focus falloff.
 *  2–12   chip slides in (landed 567).
 *  12–24  lime RoughRing on `40 of 42 checked in` (measured glyphs x 130–505, y 323–354, contract open
 *         issue 14; ring padding 10 px): the answer to "How many are here??".
 *  21–34  headline words 21 / 23 / 25 (K1, landed 589).
 *  24–36  Camera B (EASE.inOut; v2 27–39, moved 3 f earlier: `Check in` is clear of the rail from 33, within 12 px
 *         of rest when the headline lands at 34, and the fastest frames sit on the whoosh at 30): source
 *         x 130–1030 (k .887, fit width) with source y 1454.5 → frame y 1203: `BEGINNER · 20 of 22 checked in`
 *         (604–626), the toggle (705–845), the code field
 *         `Check-in code (4 digits) or Rallyo` (869–985; draft v4, craft #9: the capture's placeholder overflows to a
 *         sliced `r` at the field's padding, now under a patch of the field's own night, su x 936–997, so the line
 *         ends on a whole word), lime `Check in` (x 126–394, y 1007–1123), then the `Ana P.` row under the rail and
 *         `Arnel D.`, `Bianca L.`… all in the focus falloff.
 *  Focus falloff (backdrop blur 6 px + 30% night, 60 px ramp, as S7 / S8; between the rig and the tile, so the
 *         tile, connector and tap stay sharp): edge y 1380 in camera A (under the BEGINNER header) → 1090 over
 *         27–30 (ahead of the rows that pass behind the rail, so they cross soft: no crisp sliver), held at 1090 to
 *         34 and → 1133 over 34–37 (10 px under the landed button). Draft v4 (craft #14 / accuracy #10): v3 moved
 *         the edge down over 30–33, so the lime button was sharp while it slid behind the pill (abs 585–588); now it
 *         crosses the rail soft (one frame, abs 587, partly behind the pill) and racks into focus as it settles
 *         above it (sharp from abs 589, the headline's landing). Stage scrim 1290 / 1590
 *         → 1240 / 1460 over 24–36, so the rows are ≈ 85% night by y 1460 (accuracy #13: no readable names
 *         below 1450).
 *  39–51  UiTile: player-card-masked.png crop `tileCrop` (x 850–1120, y 695–825: `CHECK-IN 7314`) at
 *         1.185 = 320x154 flies in from +140 px, 8° → 0 (EASE.out) to frame x 570–890, y 1094–1248, sharp over
 *         the soft `Ana P.` row (it covers the row's time; the rail's tray ends at x ≈ 530).
 *  48–60  lime Connector `M 730 1094 C 730 1042 562 1036 522 974` (5 px) from the tile's top edge into the code
 *         field (end dot inside the field, under "(4 digits)").
 *  54     finger dot; 60 TapRipple on `Check in` at (284, 1094): below-right of the label centre (260, 1064),
 *         under the baseline (craft #7) + press .97 60–66 (beat 10.2). The field stays empty: no typed code, no toast.
 *  66     chip strike + ✓.
 *  39–105 continuous drift 1.00 → 1.025 about the tap (devices, tile, connector and pointer move as one;
 *         DEFECTS #17: no near-static hold over 600–625).
 *  90–105 whip (transition).
 */

type CropRect = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

type CheckInSceneProps = {
  readonly chipSender?: string;
  readonly chipText?: string;
  readonly headline1?: string;
  readonly headline2?: string;
  /** host-checkin.png (props.screens.hostCheckin). */
  readonly checkinSrc?: string;
  /** player-card-masked.png (props.screens.playerCard). */
  readonly tileSrc?: string;
  /** Source-px crop of tileSrc shown in the tile (props.screens.codeTile). */
  readonly tileCrop?: CropRect;
  readonly colors?: RallyoColors;
};

const CheckInSceneInner: React.FC<CheckInSceneProps> = ({
  chipSender = "KT",
  chipText = "How many are here??",
  headline1 = "CHECK-IN",
  headline2 = "BY CODE.",
  checkinSrc = "rallyo/screens/mobile/host-checkin.png",
  tileSrc = "rallyo/screens/mobile/player-card-masked.png",
  tileCrop = { x: 850, y: 695, w: 270, h: 130 },
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <Stage
        name="Stage"
        clipTop={570}
        color={colors.night}
        scrimTop={interpolate(frame, [24, 36], [1290, 1240], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.83, 0, 0.17, 1),
        })}
        scrimBottom={interpolate(frame, [24, 36], [1590, 1460], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.83, 0, 0.17, 1),
        })}
      >
        {/* Drift: everything on the stage pushes 1.00 → 1.025 about the Check in tap from camera B's landing on. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "284px 1094px",
            scale: interpolate(frame, [39, 105], [1, 1.025], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.33, 0, 0.67, 1),
              output: "perceptual-scale",
            }),
          }}
        >
          <CameraRig
            name="Camera"
            screen={phonePlacement()}
            moves={[
              { start: 0, end: 0, sourceRect: { x: 100, y: 30, w: 960, h: 560 }, frameRect: { x: 92, y: 704, w: 798, h: 466 }, fit: "width" },
              { start: 24, end: 36, sourceRect: { x: 130, y: 870, w: 900, h: 590 }, frameRect: { x: 92, y: 685, w: 798, h: 523 }, fit: "width" },
            ]}
          >
            <PhoneFrame name="Phone" screenX={131} screenY={600} screenW={720} island={false}>
              <ScreenImage name="Host check-in" src={checkinSrc} />
              {/* The placeholder overflows its field in the capture (`…or Rallyo r|`, the `r` sliced at the padding):
                  the sliced glyph sits under a patch of the field's own night, so the line ends on `Rallyo` (craft #9). */}
              <Interactive.Div
                name="Placeholder end mask"
                style={{ position: "absolute", left: 936, top: 1084, width: 61, height: 118, backgroundColor: colors.night }}
              />
              <RoughRing
                name="Ring 40 of 42 checked in"
                rect={{ x: 130, y: 323, w: 375, h: 31 }}
                at={12}
                frames={12}
                tone="lime"
                strokeWidth={6 / 0.831}
                padding={10 / 0.831}
                spread={1.16}
                spreadY={1.9}
                seed={4}
              />
              {frame >= 59 && frame <= 67 ? (
                <UiTile
                  name="Check in press"
                  src={checkinSrc}
                  crop={{ x: 156, y: 1221, w: 326, h: 155 }}
                  zoom={1}
                  radius={0}
                  borderWidth={0}
                  shadow="none"
                  fillColor="#111B14"
                  style={{
                    left: 156,
                    top: 1221,
                    scale: interpolate(frame, [60, 63, 66], [1, 0.97, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      output: "perceptual-scale",
                    }),
                  }}
                />
              ) : null}
            </PhoneFrame>
          </CameraRig>
          {/* Focus falloff (as S7 / S8): below the focal UI the list drops into soft focus (backdrop blur, light night
              tint), so it fills the stage to ≈ 1450 while no row reads under the rail or below the fade. The edge sits
              under the BEGINNER header in camera A (1380) and leads camera B to 10 px under `Check in` (1133), so
              the rows that pass under the rail during the move are already soft. Above it: the tile, connector, tap. */}
          <Interactive.Div
            name="Focus falloff"
            style={{
              position: "absolute",
              left: 0,
              width: 1080,
              top: interpolate(frame, [27, 30, 34, 37], [1380, 1090, 1090, 1133], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.83, 0, 0.17, 1),
              }),
              height: 900,
              backdropFilter: "blur(6px)",
              maskImage: "linear-gradient(180deg, transparent 0px, black 60px)",
            }}
          >
            <Interactive.Div name="Focus tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.3 }} />
          </Interactive.Div>
          <UiTile
            name="Check-in code tile"
            src={tileSrc}
            crop={tileCrop}
            zoom={1.185}
            style={{
              left: 570,
              top: 1094,
              opacity: interpolate(frame, [39, 45], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(frame, [39, 51], ["140px 0px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              rotate: interpolate(frame, [39, 51], ["8deg", "0deg"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [39, 51], [0.94, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          />
          <Connector
            name="Code to field"
            d="M 730 1094 C 730 1042 562 1036 522 974"
            at={48}
            frames={12}
            strokeWidth={5}
            boxW={1080}
            boxH={1920}
          />
          <TapRipple name="Tap Check in" x={284} y={1094} at={60} dotLead={6} />
        </div>
      </Stage>
      <ChaosChip name="Chip" sender={chipSender} text={chipText} enterAt={2} strikeAt={66} />
      <KineticText
        name="Headline line 1"
        from={21}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 376 }}
      />
      <KineticText
        name="Headline line 2"
        from={23}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 457 }}
      />
    </>
  );
};

const checkInSceneSchema = {
  chipSender: { type: "string", default: "KT", description: "Chip initials" },
  chipText: { type: "string", default: "How many are here??", description: "Chip message (quotes a hook bubble)" },
  headline1: { type: "string", default: "CHECK-IN", description: "Headline line 1" },
  headline2: { type: "string", default: "BY CODE.", description: "Headline line 2 (lime)" },
  checkinSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/host-checkin.png", description: "Host check-in" },
  tileSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/player-card-masked.png", description: "Player card (tile source)" },
} as const satisfies InteractivitySchema;

export const CheckInScene = Interactive.create({
  Component: CheckInSceneInner,
  layout: "absolute-fill",
  schema: checkInSceneSchema,
});

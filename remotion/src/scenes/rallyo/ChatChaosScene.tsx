import { fitText } from "@remotion/layout-utils";
import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { CHAT_SU, chatShake, ChatScreen, type ChatMessage, type ChatReplay } from "../../elements/ChatScreen";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { StrikeLine } from "../../elements/StrikeLine";
import { measureDisplay } from "../../layers/ChapterRail";
import { GrainOverlay } from "../../layers/GrainOverlay";
import { Stage } from "../../layers/Stage";
import { displayText, RALLYO_COLORS, RALLYO_FONTS, useRallyoFontsReady, type RallyoColors } from "../../theme/rallyo";
import { CIRCLE_REVEAL_DEFAULTS } from "../../transitions/circleReveal";

/**
 * S1 · Hook: GC chaos (abs 0–135, 135 f; brief v2.2 section 6 S1, contract section 13).
 *
 * Super: `headline1` (#EEF1EA) / `headline2` (danger-soft #F28B7A), Archivo 900 italic uppercase stretch 70%,
 * both lines `headlineSize` 90 px fixed (0 = fitText to 846 px, clamped 88–100), line-height .9, x 72,
 * y 296–458 (line 2 top 377). Normal word spacing: the flex gap is the measured width of a space in the face,
 * so line 1 sets 832 px (ends x 906 ≤ 918). Words rise (K2: 44 px, 3 f stagger, 12 f enter) from local 3:
 * 3, 6, 9 | 12, 15, 18 → landed 30, readable to 120 (90 f ≥ 84).
 *
 * Phone (draft v2, director notes a / b): PhoneFrame screen x 101–881 (screenW 780, k .6667: bubble text
 * ≈ 45 px → 50 px at the end of the push), top y 548, rotate −3°, bleeding off the bottom. ChatScreen chaos,
 * anchorSu 990 (newest bubble bottom ≈ frame y 1208 → 1239 under the push, every bubble line ≤ y 1248),
 * composer su 1020–1140, keyboard below it at 40% key level (device imagery: its top drops from y 1308 to
 * ≈ 1351 with the push, the key rows to ≈ 1400–1920, fading out under the Stage scrim 1300 → 1540).
 * Bubbles from props (each chip of S3–S9 quotes one exactly) plus 2 older backfill bubbles above them so the
 * chat is full from f0; unread pill 12 → 99+ by 87.
 * Draft v3 (REVIEW-craft #3, accuracy #10 / #11): the host's own lines (HOOK_OWN_PICKS: the slot list and
 * `Who hasn't paid yet?`) are right-aligned lime-tint bubbles with night ink; the other bubbles are lifted
 * (≈ #676E67, white text). The 63–87 spam is interleaved with long lines (HOOK_REPLAYS: existing messages
 * re-popped by index on the spam frames, no new strings), so at least two bubbles wider than half the
 * screen are on screen on every frame 45–105 and the right half of the chat never empties. Bubble text wraps
 * "pretty" (no orphan `in?`).
 * Rush 87–108: flood of history replays (every 2 f, then
 * every frame) and then the jam, one bubble slammed onto the glass per frame on both sides of the screen,
 * the newest (105) centred on the circleReveal burst point (JAM_FOCUS_SU, so the T1 burst opens out of it);
 * freeze 108–120. Shake ±6 px / ±1.5° on a 3 f period over 87–108 (chatShake), at rest on the freeze.
 * Camera push 1.00 → 1.12 (perceptual, linear) about (200, 950) over 0–105 (draft v3: the bubbles grow and
 * the keyboard sinks for the whole hook; was 1.04 EASE.in, which barely moved before the rush). Draft v4 (v3 craft
 * #13): the push origin moved from x 491 to 200, so the push grows the phone mostly to the right. With the −3° tilt
 * the left bezel used to end 1–10 px from x 0 (side buttons cut) on the held frames 84–87 and 108–123; it now keeps
 * 30 px before the rush and 26 px on the freeze, and the right bezel ends at x ≈ 971 (109 px clear). On the shake's
 * swing extremes (87–108, ±6 px / ±1.5°) the bezel still meets x 0 for single frames (v3: ≈ 20 px past it), as part of
 * the designed chaos. Scaling about a point LEFT of the old one is what gains room on the left (a point right of it,
 * as the review suggested, would push the left edge further out).
 *
 * Strike: lime 8 px rough strike-through (StrikeLine) across line 2 only, 105–117, on the track's pickup hit;
 * the danger-soft type stays legible under it.
 *
 * The danger-soft vignette sits UNDER the Stage, so it tints the room around the phone and never the chat.
 * The Stage draws no top or side fades here (clip y 470 sits above the phone's highest corner, so there is
 * no seam to hide); only its lower scrim fades the keyboard into night. Grain on top.
 * circleReveal (transition) opens out of the jammed newest bubble at (491, 1000) from local 120.
 * Backdrop (draft v3): the screen-light halo behind the phone is wider and ≈ 15% brighter at the centre.
 */

/** S1 phone screen placement (canvas px). */
const PHONE = { x: 101, y: 548, w: 780, tilt: -3 } as const;

/** Camera push (draft v3): 1.00 → PUSH.end about (PUSH.ox, PUSH.oy) over local 0–105, held on the freeze. */
const PUSH = { ox: 200, oy: 950, end: 1.12 } as const;

/**
 * The circleReveal burst point (canvas) mapped into the resting phone's screen units: the newest jam bubble
 * is centred here. On the freeze the shake is at rest (tilt only) and the push is complete (PUSH.end, held from
 * 105), so the burst point is first un-pushed about the push origin; this holds for every frame 108–120.
 */
const JAM_FOCUS_SU: readonly [number, number] = (() => {
  const k = PHONE.w / 1170;
  const cx = PHONE.x + PHONE.w / 2;
  const cy = PHONE.y + (PHONE.w * 2532) / 1170 / 2;
  const a = (-PHONE.tilt * Math.PI) / 180;
  const bx = PUSH.ox + (CIRCLE_REVEAL_DEFAULTS.cx - PUSH.ox) / PUSH.end;
  const by = PUSH.oy + (CIRCLE_REVEAL_DEFAULTS.cy - PUSH.oy) / PUSH.end;
  const dx = bx - cx;
  const dy = by - cy;
  const ux = cx + dx * Math.cos(a) - dy * Math.sin(a);
  const uy = cy + dx * Math.sin(a) + dy * Math.cos(a);
  return [Math.round((ux - PHONE.x) / k), Math.round((uy - PHONE.y) / k)];
})();

/** Canonical v2.2 hook bubbles (decision log round 3: fully English; S4 chip "When? How much? Who's in?"). */
const HOOK_MESSAGES: readonly ChatMessage[] = [
  { at: 0, sender: "KT", text: "Who's in for Thursday?" },
  { at: 0, sender: "KT", text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___" },
  { at: 0, sender: "MG", text: "+1" },
  { at: 9, sender: "BE", text: "+1, bringing a guest" },
  { at: 15, sender: "DX", text: "Who's next on Court 2??" },
  { at: 21, sender: "AN", text: "Who hasn't paid yet?" },
  { at: 27, sender: "JU", text: "When? How much? Who's in?" },
  { at: 33, sender: "RC", text: "Joining! Cash or GCash?" },
  { at: 39, sender: "MG", text: "Who won last night?" },
  { at: 45, sender: "BE", text: "Where's the bracket?" },
  { at: 51, sender: "JU", text: "+1" },
  { at: 57, sender: "KT", text: "How many are here??" },
  { at: 63, sender: "RC", text: "Court 3 free?" },
  { at: 66, sender: "AN", text: "+1" },
  { at: 69, sender: "MG", text: "+1" },
  { at: 72, sender: "DX", text: "who's next?!" },
  { at: 75, sender: "BE", text: "+1" },
  { at: 78, sender: "KT", text: "list??" },
  { at: 81, sender: "RC", text: "+2" },
  { at: 84, sender: "JU", text: "+1" },
  { at: 87, sender: "AN", text: "???" },
];

/** The host's own lines in HOOK_MESSAGES (right-aligned lime-tint): the slot list and `Who hasn't paid yet?`. */
const HOOK_OWN_PICKS: readonly number[] = [1, 5];

/**
 * Long lines interleaved with the 63–87 spam (indices into the hook messages; no new strings), each popping on
 * a spam frame next to that frame's short bubble. With the chaos metrics this keeps two or more bubbles wider
 * than half the screen in view on every frame 45–105 (stack simulated against the measured Satoshi widths):
 * - 66 after Ana's `+1`: the host re-posts the slot list (lime, right);
 * - 69 / 72 / 81 before Migs' `+1`, Dex's `who's next?!`, Rico's `+2`: that sender's own long line, joined;
 * - 78 after Kat's `list??`: the host's `Who hasn't paid yet?` (lime, right).
 */
const HOOK_REPLAYS: readonly ChatReplay[] = [
  { at: 66, pick: 1 },
  { at: 69, pick: 8, before: true },
  { at: 72, pick: 4, before: true },
  { at: 78, pick: 5 },
  { at: 81, pick: 7, before: true },
];

type ChatChaosSceneProps = {
  readonly headline1?: string;
  readonly headline2?: string;
  /** Fixed size for both lines (v2.2: 90). 0 = fitText to 846 px, clamped 88–100. */
  readonly headlineSize?: number;
  readonly chatTitle?: string;
  readonly chatMembers?: string;
  /** Hook bubbles (`at` = scene-local pop frame, 0 = visible at f0). */
  readonly messages?: readonly ChatMessage[];
  readonly colors?: RallyoColors;
};

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

const ChatChaosSceneInner: React.FC<ChatChaosSceneProps> = ({
  headline1 = "HOSTING OPEN PLAYS?",
  headline2 = "GROUP CHAT CHAOS?",
  headlineSize: fixedSize = 90,
  chatTitle = "Thursday Open Play",
  chatMembers = "47 members",
  messages = HOOK_MESSAGES,
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const fontsReady = useRallyoFontsReady();
  // Both lines at one size: fitText to 846 px on the longer line, clamped 88-100 (only when headlineSize is 0).
  const fit = (text: string) =>
    fitText({
      text,
      withinWidth: 846,
      fontFamily: RALLYO_FONTS.display,
      fontWeight: 900,
      textTransform: "uppercase",
      additionalStyles: { fontStyle: "italic", fontStretch: "70%" },
      validateFontIsLoaded: true,
    }).fontSize;
  const size = fixedSize > 0 ? fixedSize : fontsReady ? Math.max(88, Math.min(100, fit(headline1), fit(headline2))) : 90;
  const line2Top = 296 + Math.round(size * 0.9);
  const words1 = headline1.split(" ").filter((w) => w.length > 0).length;
  // Line 2's advance width; the strike overshoots 6 px left (stays ≥ x 66) and 14 px right.
  const line2W = fontsReady ? measureDisplay(headline2, size) : headline2.length * size * 0.45;
  // Shake (87–108) on the resting −3° tilt; chatShake is deterministic per frame and still on the freeze.
  const shake = chatShake(frame, { start: 87, end: 108, px: 6, deg: 1.5, period: 3, baseRotate: PHONE.tilt });

  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {/* Danger vignette (under the Stage: tints the room, never the chat) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(ellipse 80% 62% at 50% 50%, ${colors.dangerSoft}00 30%, ${colors.dangerSoft}17 72%, ${colors.dangerSoft}2E 100%)`,
        }}
      />
      {/* Screen light: the phone lifts off the night (draft v3: wider, ≈ 15% brighter centre) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(ellipse 74% 46% at 46% 54%, ${colors.fg}1F 0%, ${colors.fg}10 48%, ${colors.fg}00 82%)`,
        }}
      />
      <Stage name="Stage" clipTop={470} topFade={0} sideOpacity={0} scrimTop={1300} scrimBottom={1540} color={colors.night}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            // Literal values for Studio editing; keep them equal to PUSH (JAM_FOCUS_SU un-pushes with it).
            transformOrigin: "200px 950px",
            scale: interpolate(frame, [0, 105], [1, 1.12], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.linear,
              output: "perceptual-scale",
            }),
          }}
        >
          <PhoneFrame
            name="Phone"
            screenX={PHONE.x}
            screenY={PHONE.y}
            screenW={PHONE.w}
            style={{
              rotate: shake.rotate,
              translate: shake.translate,
            }}
          >
            <ChatScreen
              name="Group chat"
              messages={messages}
              anchorSu={CHAT_SU.anchorHook}
              composerTopSu={CHAT_SU.composerHook}
              jamFocus={JAM_FOCUS_SU}
              backfill={2}
              ownPicks={HOOK_OWN_PICKS}
              replays={HOOK_REPLAYS}
              keyboardLevel={0.4}
              keyboard
              state="chaos"
              title={chatTitle}
              members={chatMembers}
              unreadStart={12}
              unreadBy={87}
              rush={[87, 108]}
              freezeAt={108}
              colors={colors}
            />
          </PhoneFrame>
        </div>
      </Stage>
      <KineticText
        name="Headline line 1"
        from={3}
        text={headline1}
        by="word"
        stagger={3}
        enter={12}
        style={{
          ...displayText({ size, color: colors.fg, lineHeight: 0.9 }),
          position: "absolute",
          left: 72,
          top: 296,
          flexWrap: "nowrap",
          columnGap: spaceGap(headline1, size, fontsReady),
        }}
      />
      <KineticText
        name="Headline line 2"
        from={3 + 3 * words1}
        text={headline2}
        by="word"
        stagger={3}
        enter={12}
        style={{
          ...displayText({ size, color: colors.dangerSoft, lineHeight: 0.9 }),
          position: "absolute",
          left: 72,
          top: line2Top,
          flexWrap: "nowrap",
          columnGap: spaceGap(headline2, size, fontsReady),
        }}
      />
      <StrikeLine
        name="Hook strike"
        rect={{ x: 66, y: line2Top + Math.round(size * 0.47) - 20, w: Math.round(line2W) + 20, h: 40 }}
        at={105}
        frames={12}
        color={colors.lime}
        strokeWidth={8}
        tilt={-0.75}
      />
      <GrainOverlay name="Grain" opacity={interpolate(frame, [0, 135], [0.08, 0.12])} />
    </>
  );
};

const chatChaosSceneSchema = {
  headline1: { type: "string", default: "HOSTING OPEN PLAYS?", description: "Headline line 1" },
  headline2: { type: "string", default: "GROUP CHAT CHAOS?", description: "Headline line 2 (struck)" },
  headlineSize: { type: "number", default: 90, min: 0, max: 100, step: 1, integer: true, description: "Headline size (0 = fit)", hiddenFromList: false },
  chatTitle: { type: "string", default: "Thursday Open Play", description: "Chat title" },
  chatMembers: { type: "string", default: "47 members", description: "Members line" },
} as const satisfies InteractivitySchema;

export const ChatChaosScene = Interactive.create({
  Component: ChatChaosSceneInner,
  layout: "absolute-fill",
  schema: chatChaosSceneSchema,
});

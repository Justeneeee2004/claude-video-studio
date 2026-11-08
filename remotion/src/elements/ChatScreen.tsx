import type React from "react";
import { useId } from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { EASE } from "../lib/motion";
import { POST_SRC, postLayout, textWidthSu, usePostText, wrapLine, type PostLayout } from "../lib/post-layout";
import { RALLYO_COLORS, RALLYO_FONTS, useRallyoFontsReady, type RallyoColors } from "../theme/rallyo";
import type { Rect } from "./CameraRig";

/**
 * Generic group chat (brief scene 1 + scene 3). NO Messenger logo, blue/purple gradient, chrome or
 * sound; no emoji. Built at 1170x2532 SCREEN UNITS (su) for the PhoneFrame children slot.
 *
 *   header su 0-240: back chevron, unread pill (chaos only: #F28B7A fill, night text, 12 → "99+"
 *     by `unreadBy`, stepping on each pop), group avatar, `title` (Satoshi 900), `members` line
 *     (chaos: "· typing" + dots; calm: "<name> is typing" + dots while `replyTyping` runs).
 *   message stack: the NEWEST bubble's bottom always sits at `anchorSu`. A new bubble pops in place
 *     at the anchor (scale .92 → 1, EASE.pop, 6 f; the post and the reply 12 f) while everything
 *     older is pushed up by its measured height + gap (EASE.out, starting 2-3 f early so the two
 *     never overlap on text). Heights come from measureText word-wrapping (deterministic):
 *     bubble text Satoshi 700 67 su (≈ 41 px at k .6154), sender names 42 su (≈ 26 px) #8E988F,
 *     graphite bubbles, 92 su initials avatars on the last bubble of each sender run.
 *   keyboard: composer bar (120 su from `composerTopSu`, default su 870) + dimmed open keyboard below
 *     it to the screen bottom (scene 1: composer su 1020-1140). Without it, the composer sits at the
 *     screen bottom (scene 3).
 *   state "chaos" (draft v3: lifted bubbles mix(graphite, fg, .25) ≈ #676E67 with #FFFFFF text, light names,
 *     court avatars; a slightly tighter vertical rhythm, CHAT_BUBBLE_CHAOS, so ≈ 5 bubbles fit the window):
 *     messages pop at their `at`. `ownPicks` (message indices) are the HOST's own lines: right-aligned lime-tint
 *     (#E3F3A6) bubbles with night ink, no avatar or name. `replays` re-pop existing messages by index (no new
 *     strings) on the same frame as a message, just before it (`before`, joined to the same sender's run) or
 *     just after it, so long lines interleave with the short spam. `rush` [start, end] then runs in two phases
 *     (draft v2, DEFECTS #1 / #9):
 *     1. FLOOD (CHAT_RUSH_FLOOD, start + 2 … start + 11): replays of the whole history, long lines
 *        included, pop at the anchor every 2 f and then every frame, each pushing the stack like a
 *        normal pop; a light vertical motion blur (σ ≤ 6 su) only while the stack moves fast, so
 *        every bubble shape stays readable.
 *     2. JAM (CHAT_RUSH_JAM, start + 12 … start + 18, one per frame): the chat stops scrolling and
 *        bubbles slam onto the glass on both sides of the screen (scale 1.22 → 1 in 3 f, own tilt,
 *        night drop shadow, lighter fill) while the stack behind drops back (42%, soft blur); the
 *        NEWEST lands centred on `jamFocus` (su) so the scene can put it on the circleReveal burst point.
 *     `freezeAt` holds every animation on the jam. The phone shake is scene-level:
 *     use `useChatShake()` / `chatShake()` on the PhoneFrame style.
 *   state "calm": no pill; `messages` are static history at `historyLevel` opacity, compressed above
 *     the outgoing post. `outgoing` = the host's post bubble (lime-tint, ink, link rows Satoshi 700
 *     olive-ink) with geometry from postLayout(): venue span blurred, URL shown as `linkDisplay`.
 *     `reply` = an incoming bubble after it (unused in v2.2: S4 has no reply), optionally preceded by a
 *     typing bubble (`replyTyping` frames, default 0 = off so the stack holds still before the reply).
 *   postOverlay: su-space children (e.g. a RoughUnderline at postLayout().linkBlock) that scroll with
 *     the post, so annotations stay on the link when the reply pushes the stack.
 * All `at` values are frames on the ChatScreen's own timeline (= scene local when it has no `from`).
 * Bubble text wraps "pretty" (chatBubbleRows): the last two rows are re-broken so no single word is orphaned,
 * preferring a break after punctuation and before a list number, then the most even pair
 * ("When? How much?" / "Who's in?"). Row counts (and so heights) never change.
 * Measuring waits for the Rallyo fonts (useRallyoFontsReady holds a delayRender until then).
 */

export type ChatMessage = {
  /** Frame the bubble pops (≤ 0 = already visible at frame 0). */
  readonly at: number;
  /** Initials, e.g. "KT". Never named `from`. */
  readonly sender: string;
  readonly text: string;
};

export type ChatOutgoing = {
  readonly at: number;
  /** Verbatim post text (capture R1). "" → read `src`. */
  readonly text: string;
  readonly blurVenue?: boolean;
  readonly linkDisplay?: string;
  /** public/-relative data file read when `text` is empty (default the capture R1 file). */
  readonly src?: string;
};

/** su layout constants (brief scene 1). */
export const CHAT_SU = {
  w: 1170,
  h: 2532,
  headerBottom: 240,
  stackTop: 260,
  /** Default composer bar (keyboard open); scene 1 moves it to composerHook. */
  composerTop: 870,
  composerBottom: 990,
  keyboardTop: 990,
  /** scene 1 (draft v2: bigger phone, taller chat; newest bubble bottom ≈ frame y 1208) */
  anchorHook: 990,
  /** scene 1 composer top (composerTopSu); the keyboard starts 120 su lower */
  composerHook: 1020,
  /** scene 3 */
  anchorCalm: 1740,
} as const;

/** Bubble geometry in su (scene 1: ≈ 41 px text and 26 px names at k .6154). */
export const CHAT_BUBBLE = {
  avatarX: 36,
  avatar: 92,
  /** Incoming bubble left edge = avatarX + avatar + 20. */
  bubbleX: 148,
  maxW: 912,
  minW: 150,
  padX: 34,
  padTop: 22,
  padBottom: 26,
  textSize: 67,
  textLh: 82,
  nameSize: 42,
  nameLh: 50,
  nameGap: 2,
  /** Gap between bubbles of different senders / the same sender. */
  gap: 18,
  gapSame: 8,
  radius: 44,
  tailRadius: 12,
  typingW: 210,
  /** Calm composer (keyboard closed) at the screen bottom. */
  calmComposerTop: 2356,
  /** Host (own) bubble: right edge inset from the screen edge and max width (su). */
  ownInset: 36,
  ownMaxW: 912,
} as const;

/** Vertical rhythm + widths shared by the bubble layout (CHAT_BUBBLE for calm, CHAT_BUBBLE_CHAOS for scene 1). */
export type ChatBubbleMetrics = {
  readonly [K in keyof typeof CHAT_BUBBLE]: number;
};

/**
 * Scene 1 chaos metrics (draft v3): the same type sizes, a slightly tighter vertical rhythm (one-row named
 * bubble 182 → 166 su, gaps 18 / 8 → 14 / 6) so about five bubbles fit between the header and the anchor and
 * the long lines interleaved with the spam stay on screen; host bubbles may run to 980 su.
 */
export const CHAT_BUBBLE_CHAOS: ChatBubbleMetrics = {
  ...CHAT_BUBBLE,
  padTop: 18,
  padBottom: 22,
  nameLh: 46,
  textLh: 78,
  gap: 14,
  gapSame: 6,
  ownMaxW: 980,
};

/**
 * A replay of an existing message (`pick` = index into `messages`, mod length; −1 = the last) re-popped on
 * frame `at`, which must be a frame on which a message also pops: `before` puts it just before that message
 * (older: joins the same sender's run), otherwise just after it (newest, at the anchor).
 */
export type ChatReplay = {
  readonly at: number;
  readonly pick: number;
  readonly before?: boolean;
};

/**
 * Older history above the first message (chaos only, `backfill` count): message indices (mod length), oldest
 * first, so the hook's chat is full from frame 0 (the canonical list: "Court 3 free?", "who's next?!").
 */
export const CHAT_BACKFILL_PICKS: readonly number[] = [12, 15];

/**
 * Rush phase 1 (flood): replay pops at rush[0] + `dt` (every 2 f, then every frame). `pick` is an index into
 * `messages` (mod length): the canonical hook list replays its opening lines, long and short mixed.
 */
export const CHAT_RUSH_FLOOD: readonly { readonly dt: number; readonly pick: number }[] = [
  // draft v3: the flood leads with the long lines the scene-1 lull did not replay (Thursday, guest, How many,
  // When? How much?), then the host's slot list (a lime own bubble), the bracket and Court 2 once more.
  { dt: 2, pick: 0 },
  { dt: 4, pick: 3 },
  { dt: 6, pick: 11 },
  { dt: 8, pick: 6 },
  { dt: 9, pick: 1 },
  { dt: 10, pick: 9 },
  { dt: 11, pick: 4 },
];

/**
 * Rush phase 2 (jam): one bubble slams onto the glass per frame at rush[0] + `dt`, centred at (`x`, `y`) su
 * (clamped inside the screen), tilted `rot`° on top of the phone's own tilt. `pick` indexes `messages`
 * (mod length; −1 = the last message). The last slot has no x / y: it lands centred on `jamFocus`.
 * Slots alternate left / right so the pile covers both sides of the chat, and overlap only in bubble padding
 * (every line stays whole: no half-hidden words); the 3 f slams end on rush[1].
 */
export const CHAT_RUSH_JAM: readonly { readonly dt: number; readonly x?: number; readonly y?: number; readonly rot: number; readonly pick: number }[] = [
  { dt: 12, x: 380, y: 352, rot: -4, pick: 8 },
  { dt: 13, x: 1040, y: 350, rot: 6, pick: 19 },
  { dt: 14, x: 830, y: 520, rot: -3, pick: 12 },
  { dt: 15, x: 190, y: 560, rot: -5, pick: 17 },
  { dt: 16, x: 180, y: 840, rot: 4, pick: -1 },
  { dt: 17, x: 790, y: 862, rot: -3, pick: 9 },
  { dt: 18, rot: 3, pick: 15 },
];

/** Fictional first names for the hook initials (brief section 11: "fictional first names"). */
export const CHAT_SENDER_NAMES: Readonly<Record<string, string>> = {
  KT: "Kat",
  MG: "Migs",
  BE: "Bea",
  JU: "Jun",
  DX: "Dex",
  AN: "Ana",
  RC: "Rico",
};

export type ChatIncomingLayout = {
  readonly name: string;
  readonly showName: boolean;
  readonly rows: readonly string[];
  /** Bubble width / height (su), avatar excluded. */
  readonly w: number;
  readonly h: number;
};

/**
 * Bubble text rows (draft v3, "text-wrap: pretty"): greedy word wrap at `maxWidth`, then the last two rows are
 * re-broken at the best word gap where both still fit. A single-word last row (orphan) is never chosen when an
 * alternative exists; a break after punctuation is preferred, one right after a list number ("2.") avoided,
 * then the most even pair wins. The row count never changes, so bubble heights match the greedy wrap.
 */
export const chatBubbleRows = (
  text: string,
  maxWidth: number,
  width: (s: string) => number,
): { readonly text: string; readonly w: number }[] => {
  const rows = wrapLine(text, maxWidth, width).map((r) => ({ text: r.text, w: r.w, start: r.start, end: r.end }));
  if (rows.length < 2) {
    return rows.map((r) => ({ text: r.text, w: r.w }));
  }
  const a = rows[rows.length - 2];
  const b = rows[rows.length - 1];
  const tail = text.slice(a.start, b.end);
  const words = Array.from(tail.matchAll(/\S+/g)).map((m) => ({ s: m.index, e: m.index + m[0].length, t: m[0] }));
  let best: { score: number; r1: string; r2: string; w1: number; w2: number } | null = null;
  for (let i = 0; i < words.length - 1; i++) {
    const r1 = tail.slice(words[0].s, words[i].e);
    const r2 = tail.slice(words[i + 1].s, words[words.length - 1].e);
    const w1 = width(r1);
    const w2 = width(r2);
    if (w1 > maxWidth || w2 > maxWidth) {
      continue;
    }
    const last = words[i].t;
    const listNumber = /^\d+\.$/.test(last);
    const score =
      Math.abs(w1 - w2) +
      (i + 1 === words.length - 1 ? 10000 : 0) +
      (listNumber ? 600 : 0) -
      (!listNumber && /[?!.:,;]$/.test(last) ? 300 : 0);
    if (best === null || score < best.score) {
      best = { score, r1, r2, w1, w2 };
    }
  }
  const head = rows.slice(0, -2).map((r) => ({ text: r.text, w: r.w }));
  return best === null
    ? rows.map((r) => ({ text: r.text, w: r.w }))
    : [...head, { text: best.r1, w: best.w1 }, { text: best.r2, w: best.w2 }];
};

/**
 * Measured layout of one incoming bubble (word-wrapped at maxW − 2·padX, chatBubbleRows) with metrics `B`
 * (CHAT_BUBBLE = calm, CHAT_BUBBLE_CHAOS = scene 1). `own` = the host's bubble: no name, max width ownMaxW.
 * Measures only once the Rallyo fonts are loaded (estimates before), so call it after useRallyoFontsReady() is true.
 */
export const chatIncomingLayout = (
  m: Pick<ChatMessage, "sender" | "text">,
  showName = true,
  senderNames: Readonly<Record<string, string>> = CHAT_SENDER_NAMES,
  B: ChatBubbleMetrics = CHAT_BUBBLE,
  own = false,
): ChatIncomingLayout => {
  const name = own ? "" : (senderNames[m.sender] ?? m.sender);
  const named = showName && !own;
  const rows = chatBubbleRows(m.text, (own ? B.ownMaxW : B.maxW) - 2 * B.padX, (s) => textWidthSu(s, B.textSize, 700));
  const textW = Math.max(...rows.map((r) => r.w));
  const nameW = named ? textWidthSu(name, B.nameSize, 700) : 0;
  return {
    name,
    showName: named,
    rows: rows.map((r) => r.text),
    w: Math.ceil(Math.max(B.minW, Math.max(textW, nameW) + 2 * B.padX)),
    h: B.padTop + (named ? B.nameLh + B.nameGap : 0) + rows.length * B.textLh + B.padBottom,
  };
};

/** How far the post (and everything above it) moves up once the scene 3 reply has popped (su). */
export const chatReplyShift = (reply: Pick<ChatMessage, "sender" | "text">, senderNames = CHAT_SENDER_NAMES): number =>
  chatIncomingLayout(reply, true, senderNames).h + CHAT_BUBBLE.gap;

/** Final rect of the scene 3 reply (avatar included), bottom at `anchorSu` (su). */
export const chatReplyRect = (
  reply: Pick<ChatMessage, "sender" | "text">,
  anchorSu: number = CHAT_SU.anchorCalm,
  senderNames = CHAT_SENDER_NAMES,
): Rect => {
  const l = chatIncomingLayout(reply, true, senderNames);
  return { x: CHAT_BUBBLE.avatarX, y: anchorSu - l.h, w: CHAT_BUBBLE.bubbleX - CHAT_BUBBLE.avatarX + l.w, h: l.h };
};

/**
 * Scene 3 camera source rect once the reply has popped (local 117-129): the post's link-push rect
 * moved up with the stack, united with the reply (avatar included unless `includeAvatar` is false),
 * padded `pad` su. Fit it into the readable window (x 92-890, y 590-1070). Call after the fonts load.
 */
export const chatReplyFraming = (
  post: PostLayout,
  reply: Pick<ChatMessage, "sender" | "text">,
  {
    anchorSu = CHAT_SU.anchorCalm,
    pad = 16,
    includeAvatar = true,
    senderNames = CHAT_SENDER_NAMES,
  }: { anchorSu?: number; pad?: number; includeAvatar?: boolean; senderNames?: Readonly<Record<string, string>> } = {},
): Rect => {
  const shift = chatReplyShift(reply, senderNames);
  const link = { ...post.cameraLink, y: post.cameraLink.y - shift };
  const r = chatReplyRect(reply, anchorSu, senderNames);
  const rx = includeAvatar ? r.x : CHAT_BUBBLE.bubbleX;
  const x0 = Math.min(link.x, rx - pad);
  const y0 = Math.min(link.y, r.y - pad);
  const x1 = Math.max(link.x + link.w, r.x + r.w + pad);
  const y1 = Math.max(link.y + link.h, r.y + r.h + pad);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

export type ChatShakeOptions = {
  readonly start?: number;
  readonly end?: number;
  /** ± px (canvas) */
  readonly px?: number;
  /** ± degrees */
  readonly deg?: number;
  /** Frames per shake position (brief: 3 f). */
  readonly period?: number;
  /** Resting rotation in degrees (scene 1 phone: −3). */
  readonly baseRotate?: number;
};

/**
 * Scene 1 phone shake (brief: ±6 px / ±1.5° on a 3 f period over f100-126, still on the freeze).
 * Returns the PhoneFrame `translate` / `rotate` style values; deterministic per frame.
 */
export const chatShake = (
  frame: number,
  { start = 100, end = 126, px = 6, deg = 1.5, period = 3, baseRotate = -3 }: ChatShakeOptions = {},
): { readonly translate: string; readonly rotate: string } => {
  if (frame < start || frame >= end) {
    return { translate: "0px 0px", rotate: `${baseRotate}deg` };
  }
  const step = Math.floor((frame - start) / period);
  const sx = step % 2 === 0 ? 1 : -1;
  const sy = Math.floor(step / 2) % 2 === 0 ? -1 : 1;
  return { translate: `${sx * px}px ${sy * px * 0.5}px`, rotate: `${baseRotate + sx * deg}deg` };
};

/** `chatShake()` on the current frame: `<PhoneFrame style={{...useChatShake()}} />`. */
export const useChatShake = (opts?: ChatShakeOptions) => chatShake(useCurrentFrame(), opts);

type ChatScreenProps = {
  readonly messages: readonly ChatMessage[];
  readonly anchorSu: number;
  readonly keyboard: boolean;
  readonly state: "chaos" | "calm";
  readonly title?: string;
  readonly members?: string;
  readonly unreadStart?: number;
  /** Frame by which the pill reads "99+". */
  readonly unreadBy?: number;
  /** [start, end] flood + jam (scene 1 v2.2: 87-108). */
  readonly rush?: readonly [number, number];
  /** Frame the jam freezes (scene 1 v2.2: 108). */
  readonly freezeAt?: number;
  /** Composer top (su) when the keyboard is open; the keyboard fills below it (default CHAT_SU.composerTop). */
  readonly composerTopSu?: number;
  /** Centre (su) of the newest jam bubble (scene 1: the circleReveal burst point mapped into the screen). */
  readonly jamFocus?: readonly [number, number];
  /** Chaos only: older bubbles (CHAT_BACKFILL_PICKS) stacked above the first message, so the chat starts full. */
  readonly backfill?: number;
  /** Chaos only: indices into `messages` that are the host's own lines (right-aligned lime-tint, night ink). */
  readonly ownPicks?: readonly number[];
  /** Chaos only: existing messages re-popped by index, interleaved with the spam (see ChatReplay). */
  readonly replays?: readonly ChatReplay[];
  /** Key opacity of the open keyboard (default calm .45, chaos .6). */
  readonly keyboardLevel?: number;
  /** Calm-state opacity of the earlier history (0.35). */
  readonly historyLevel?: number;
  readonly outgoing?: ChatOutgoing;
  readonly reply?: ChatMessage;
  readonly bgColor?: string;
  /** Per-video colours (props.colors); defaults to the brand tokens. */
  readonly colors?: RallyoColors;
  /** Initials → shown sender name. */
  readonly senderNames?: Readonly<Record<string, string>>;
  /** Frames of typing bubble before the reply (0 = none). */
  readonly replyTyping?: number;
  /** Venue blur in su (12 su ≈ 7 px at k .6154; ≈ 6.7 px in the S3 full-bubble framing). */
  readonly venueBlur?: number;
  /** Two-copy smear during the rush. */
  readonly smear?: boolean;
  /** su-space children that scroll with the outgoing post (annotations on the link). */
  readonly postOverlay?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

type EntryKind = "in" | "post" | "typing";

type Entry = {
  readonly key: string;
  readonly kind: EntryKind;
  readonly at: number;
  readonly pop: number;
  readonly fixed: boolean;
  readonly sender: string;
  readonly h: number;
  readonly gapAbove: number;
  readonly history: boolean;
  readonly inc: ChatIncomingLayout | null;
  /** The previous bubble is the same sender (rounded corner joins it). */
  readonly joined: boolean;
  /** The host's own bubble (right-aligned lime-tint). */
  readonly own: boolean;
};

type JamEntry = {
  readonly key: string;
  readonly at: number;
  readonly inc: ChatIncomingLayout;
  /** Bubble box top-left (su). */
  readonly x: number;
  readonly y: number;
  readonly rot: number;
};

/** "#RRGGBB" mix of `a` and `b` (t = share of b); non-hex input returns `a`. */
const mixHex = (a: string, b: string, t: number): string => {
  const pa = /^#([0-9a-f]{6})$/i.exec(a.trim());
  const pb = /^#([0-9a-f]{6})$/i.exec(b.trim());
  if (!pa || !pb) {
    return a;
  }
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[0, 2, 4]
    .map((i) => Math.round(ch(pa[1], i) * (1 - t) + ch(pb[1], i) * t).toString(16).padStart(2, "0"))
    .join("")}`;
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Push progress of a popping entry: starts 1 f early (2 f for 12 f pops) and runs ⅔ of the pop, so
 * on the pop frame the older bubbles have cleared all but the new bubble's padding (no text overlap)
 * and no frame ever shows an empty slot for more than one frame.
 */
const pushProgress = (frame: number, at: number, pop: number): number => {
  const lead = Math.max(1, Math.round(pop / 6));
  return interpolate(frame, [at - lead, at - lead + Math.round((pop * 2) / 3)], [0, 1], { ...CLAMP, easing: EASE.out });
};

const popScale = (frame: number, at: number, pop: number): number =>
  interpolate(frame, [at, at + pop], [0.92, 1], { ...CLAMP, easing: EASE.pop, output: "perceptual-scale" });

const popOpacity = (frame: number, at: number, pop: number): number =>
  interpolate(frame, [at, at + Math.max(2, Math.round(pop / 4))], [0.5, 1], CLAMP);

// ---------------------------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------------------------

const TypingDots: React.FC<{ readonly frame: number; readonly color: string; readonly size: number }> = ({ frame, color, size }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.6, height: size * 2 }}>
    {[0, 1, 2].map((i) => {
      const phase = (((frame - i * 3) % 15) + 15) % 15;
      const lift = interpolate(phase, [0, 4, 8], [0, 1, 0], CLAMP);
      return (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: color,
            opacity: 0.4 + 0.6 * lift,
            translate: `0px ${-lift * size * 0.45}px`,
          }}
        />
      );
    })}
  </div>
);

/** Bubble / avatar / name fills: calm = the brief's graphite set; chaos (scene 1) one step brighter. */
type ChatPalette = {
  readonly bubble: string;
  readonly avatar: string;
  readonly name: string;
  readonly jam: string;
  /** Bubble text. */
  readonly text: string;
  /** Host (own) bubble fill and ink. */
  readonly own: string;
  readonly ownInk: string;
};

const Avatar: React.FC<{ readonly sender: string; readonly colors: RallyoColors; readonly fill: string; readonly top: number }> = ({ sender, colors, fill, top }) => (
  <div
    style={{
      position: "absolute",
      left: CHAT_BUBBLE.avatarX,
      top,
      width: CHAT_BUBBLE.avatar,
      height: CHAT_BUBBLE.avatar,
      borderRadius: "50%",
      backgroundColor: fill,
      color: colors.fg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: RALLYO_FONTS.ui,
      fontWeight: 900,
      fontSize: 34,
      letterSpacing: "0.02em",
    }}
  >
    {sender}
  </div>
);

type BubbleBox = { readonly bottom: number; readonly scale: number; readonly opacity: number; readonly dx?: number; readonly rot?: number };

/** Name + text rows of an incoming bubble (shared by stack and jam bubbles). */
const BubbleText: React.FC<{
  readonly inc: ChatIncomingLayout;
  readonly textColor: string;
  readonly nameColor: string;
  readonly metrics: ChatBubbleMetrics;
}> = ({ inc, textColor, nameColor, metrics: B }) => {
  const textTop = B.padTop + (inc.showName ? B.nameLh + B.nameGap : 0);
  return (
    <>
      {inc.showName ? (
        <div
          style={{
            position: "absolute",
            left: B.padX,
            top: B.padTop,
            fontWeight: 700,
            fontSize: B.nameSize,
            lineHeight: `${B.nameLh}px`,
            color: nameColor,
          }}
        >
          {inc.name}
        </div>
      ) : null}
      {inc.rows.map((row, i) => (
        <div
          key={`${i}-${row}`}
          style={{
            position: "absolute",
            left: B.padX,
            top: textTop + i * B.textLh,
            fontWeight: 700,
            fontSize: B.textSize,
            lineHeight: `${B.textLh}px`,
            color: textColor,
          }}
        >
          {row}
        </div>
      ))}
    </>
  );
};

const IncomingBubble: React.FC<
  BubbleBox & {
    readonly inc: ChatIncomingLayout;
    readonly sender: string;
    readonly showAvatar: boolean;
    readonly joined: boolean;
    readonly colors: RallyoColors;
    readonly palette: ChatPalette;
    readonly metrics: ChatBubbleMetrics;
  }
> = ({ inc, sender, showAvatar, joined, colors, palette, metrics: B, bottom, scale, opacity, dx = 0, rot = 0 }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: bottom - inc.h,
        width: B.bubbleX + inc.w,
        height: inc.h,
        opacity,
        scale,
        translate: `${dx}px 0px`,
        rotate: `${rot}deg`,
        transformOrigin: "0% 100%",
      }}
    >
      {showAvatar ? <Avatar sender={sender} colors={colors} fill={palette.avatar} top={inc.h - B.avatar} /> : null}
      <div
        style={{
          position: "absolute",
          left: B.bubbleX,
          top: 0,
          width: inc.w,
          height: inc.h,
          borderRadius: `${joined ? B.tailRadius : B.radius}px ${B.radius}px ${B.radius}px ${B.tailRadius}px`,
          backgroundColor: palette.bubble,
          fontFamily: RALLYO_FONTS.ui,
          whiteSpace: "pre",
        }}
      >
        <BubbleText inc={inc} textColor={palette.text} nameColor={palette.name} metrics={B} />
      </div>
    </div>
  );
};

/**
 * The host's own bubble (scene 1, draft v3): right-aligned `ownInset` su from the screen edge, lime-tint fill,
 * night ink, no avatar or name; the tail corner is bottom-right and a joined run rounds its top-right corner.
 * Pops about its bottom-right corner.
 */
const OwnBubble: React.FC<
  BubbleBox & { readonly inc: ChatIncomingLayout; readonly joined: boolean; readonly palette: ChatPalette; readonly metrics: ChatBubbleMetrics }
> = ({ inc, joined, palette, metrics: B, bottom, scale, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: CHAT_SU.w - B.ownInset - inc.w,
      top: bottom - inc.h,
      width: inc.w,
      height: inc.h,
      borderRadius: `${B.radius}px ${joined ? B.tailRadius : B.radius}px ${B.tailRadius}px ${B.radius}px`,
      backgroundColor: palette.own,
      fontFamily: RALLYO_FONTS.ui,
      whiteSpace: "pre",
      opacity,
      scale,
      transformOrigin: "100% 100%",
    }}
  >
    <BubbleText inc={inc} textColor={palette.ownInk} nameColor={palette.ownInk} metrics={B} />
  </div>
);

/** Jam bubble: slammed onto the glass (no avatar), own tilt, night drop shadow, centre-origin slam. */
const JamBubble: React.FC<{
  readonly jam: JamEntry;
  readonly frame: number;
  readonly palette: ChatPalette;
  readonly metrics: ChatBubbleMetrics;
}> = ({ jam, frame, palette, metrics: B }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: jam.x,
        top: jam.y,
        width: jam.inc.w,
        height: jam.inc.h,
        borderRadius: `${B.radius}px ${B.radius}px ${B.radius}px ${B.tailRadius}px`,
        backgroundColor: palette.jam,
        boxShadow: "0px 26px 52px rgba(0, 0, 0, 0.62), 0px 6px 14px rgba(0, 0, 0, 0.45), inset 0px 2px 0px rgba(238, 241, 234, 0.1)",
        fontFamily: RALLYO_FONTS.ui,
        whiteSpace: "pre",
        transformOrigin: "50% 50%",
        rotate: `${jam.rot}deg`,
        opacity: interpolate(frame, [jam.at, jam.at + 1], [0.55, 1], CLAMP),
        scale: interpolate(frame, [jam.at, jam.at + 3], [1.22, 1], { ...CLAMP, easing: EASE.out, output: "perceptual-scale" }),
      }}
    >
      <BubbleText inc={jam.inc} textColor={palette.text} nameColor={palette.name} metrics={B} />
    </div>
  );
};

const TypingBubble: React.FC<BubbleBox & { readonly sender: string; readonly h: number; readonly frame: number; readonly colors: RallyoColors }> = ({
  sender,
  h,
  frame,
  colors,
  bottom,
  scale,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: bottom - h,
      width: CHAT_BUBBLE.bubbleX + CHAT_BUBBLE.typingW,
      height: h,
      opacity,
      scale,
      transformOrigin: "0% 100%",
    }}
  >
    <Avatar sender={sender} colors={colors} fill={colors.graphite} top={h - CHAT_BUBBLE.avatar} />
    <div
      style={{
        position: "absolute",
        left: CHAT_BUBBLE.bubbleX,
        top: 0,
        width: CHAT_BUBBLE.typingW,
        height: h,
        borderRadius: `${CHAT_BUBBLE.radius}px ${CHAT_BUBBLE.radius}px ${CHAT_BUBBLE.radius}px ${CHAT_BUBBLE.tailRadius}px`,
        backgroundColor: colors.graphiteBubble,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TypingDots frame={frame} color={colors.fg2} size={22} />
    </div>
  </div>
);

const PostBubble: React.FC<
  BubbleBox & { readonly post: PostLayout; readonly colors: RallyoColors; readonly venueBlur: number }
> = ({ post, colors, venueBlur, bottom, scale, opacity }) => {
  const { bubble } = post;
  return (
    <div
      style={{
        position: "absolute",
        left: bubble.x,
        top: bottom - bubble.h,
        width: bubble.w,
        height: bubble.h,
        borderRadius: `${CHAT_BUBBLE.radius}px ${CHAT_BUBBLE.radius}px ${CHAT_BUBBLE.tailRadius}px ${CHAT_BUBBLE.radius}px`,
        backgroundColor: colors.limeTint,
        fontFamily: RALLYO_FONTS.ui,
        whiteSpace: "pre",
        opacity,
        scale,
        transformOrigin: "100% 100%",
      }}
    >
      {post.lines.map((l, i) => (
        <div
          key={`${i}-${l.text}`}
          style={{
            position: "absolute",
            left: l.x - bubble.x,
            top: l.y - bubble.y,
            height: l.h,
            fontWeight: l.bold ? 700 : 500,
            fontSize: 48,
            lineHeight: `${l.h}px`,
            color: l.bold ? colors.oliveInk : colors.ink,
          }}
        >
          {l.blur ? (
            <>
              {l.text.slice(0, l.blur[0])}
              <span style={{ display: "inline-block", filter: `blur(${venueBlur}px)` }}>{l.text.slice(l.blur[0], l.blur[1])}</span>
              {l.text.slice(l.blur[1])}
            </>
          ) : (
            l.text
          )}
        </div>
      ))}
    </div>
  );
};

const Header: React.FC<{
  readonly title: string;
  readonly subline: React.ReactNode;
  readonly unread: string | null;
  readonly colors: RallyoColors;
}> = ({ title, subline, unread, colors }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: CHAT_SU.w,
      height: CHAT_SU.headerBottom,
      backgroundColor: colors.nightRaised,
      boxShadow: "0px 2px 0px rgba(238, 241, 234, 0.07)",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      padding: "56px 40px 0px 30px",
      gap: 18,
      fontFamily: RALLYO_FONTS.ui,
    }}
  >
    <svg width={40} height={64} viewBox="0 0 40 64" style={{ flexShrink: 0 }}>
      <path d="M 30 8 L 8 32 L 30 56" fill="none" stroke={colors.fg} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {unread !== null ? (
      <div
        style={{
          width: 104,
          height: 60,
          boxSizing: "border-box",
          borderRadius: 30,
          backgroundColor: colors.dangerSoft,
          color: colors.night,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 38,
          flexShrink: 0,
        }}
      >
        {unread}
      </div>
    ) : null}
    <div
      style={{
        width: 108,
        height: 108,
        marginLeft: 6,
        borderRadius: "50%",
        backgroundColor: colors.court,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={70} height={56} viewBox="0 0 70 56">
        <circle cx={24} cy={16} r={11} fill={colors.fg2} opacity={0.9} />
        <path d="M 4 52 C 4 36 14 30 24 30 C 34 30 44 36 44 52 Z" fill={colors.fg2} opacity={0.9} />
        <circle cx={48} cy={19} r={9} fill={colors.fg2} opacity={0.55} />
        <path d="M 40 52 C 41 40 46 33 50 33 C 58 33 66 39 66 52 Z" fill={colors.fg2} opacity={0.55} />
      </svg>
    </div>
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 4 }}>
      <div style={{ fontWeight: 900, fontSize: 56, lineHeight: "64px", color: colors.fg, whiteSpace: "nowrap" }}>{title}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontWeight: 500,
          fontSize: 38,
          lineHeight: "46px",
          color: colors.senderGrey,
          whiteSpace: "nowrap",
        }}
      >
        {subline}
      </div>
    </div>
    <svg width={16} height={64} viewBox="0 0 16 64" style={{ flexShrink: 0 }}>
      <circle cx={8} cy={14} r={6} fill={colors.fg2} />
      <circle cx={8} cy={32} r={6} fill={colors.fg2} />
      <circle cx={8} cy={50} r={6} fill={colors.fg2} />
    </svg>
  </div>
);

const Composer: React.FC<{ readonly top: number; readonly colors: RallyoColors }> = ({ top, colors }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top,
      width: CHAT_SU.w,
      height: CHAT_SU.composerBottom - CHAT_SU.composerTop,
      backgroundColor: colors.nightRaised,
      boxShadow: "0px -2px 0px rgba(238, 241, 234, 0.06)",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      padding: "0px 36px",
      gap: 22,
      fontFamily: RALLYO_FONTS.ui,
    }}
  >
    <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx={32} cy={32} r={28} fill="none" stroke={colors.fg2} strokeWidth={5} opacity={0.8} />
      <path d="M 32 19 L 32 45 M 19 32 L 45 32" stroke={colors.fg2} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    </svg>
    <div
      style={{
        flex: 1,
        height: 84,
        borderRadius: 42,
        backgroundColor: colors.night,
        boxShadow: "inset 0px 0px 0px 2px rgba(238, 241, 234, 0.1)",
        display: "flex",
        alignItems: "center",
        padding: "0px 34px",
        fontWeight: 500,
        fontSize: 40,
        color: colors.senderGrey,
      }}
    >
      Message
    </div>
    <div
      style={{
        width: 84,
        height: 84,
        borderRadius: "50%",
        backgroundColor: colors.graphite,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={44} height={44} viewBox="0 0 44 44">
        <path d="M 22 36 L 22 9 M 10 20 L 22 8 L 34 20" fill="none" stroke={colors.fg2} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"] as const;

/** Open keyboard from su `top` (scene 1: the composer bottom) to the screen bottom; keys at `level` opacity. */
const Keyboard: React.FC<{ readonly top: number; readonly level: number; readonly colors: RallyoColors }> = ({ top, level, colors }) => {
  const keyW = 102;
  const keyH = 138;
  const gap = 14;
  const rowTop = (r: number) => top + 22 + r * (keyH + 26);
  const key = (k: string, left: number, top: number, w: number, label: string, dark = false) => (
    <div
      key={k}
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: keyH,
        borderRadius: 16,
        backgroundColor: dark ? "#1D231E" : colors.graphiteBubble,
        boxShadow: "0px 4px 0px rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: RALLYO_FONTS.ui,
        fontWeight: 500,
        fontSize: label.length > 1 ? 38 : 54,
        color: colors.fg2,
      }}
    >
      {label}
    </div>
  );
  const keys: React.ReactNode[] = [];
  KEY_ROWS.forEach((row, r) => {
    const total = row.length * keyW + (row.length - 1) * gap;
    const left0 = (CHAT_SU.w - total) / 2;
    Array.from(row).forEach((ch, i) => keys.push(key(`${r}-${ch}`, left0 + i * (keyW + gap), rowTop(r), keyW, ch)));
  });
  keys.push(key("shift", 12, rowTop(2), 150, "", true));
  keys.push(key("back", CHAT_SU.w - 12 - 150, rowTop(2), 150, "", true));
  keys.push(key("num", 12, rowTop(3), 230, "123", true));
  keys.push(key("space", 256, rowTop(3), CHAT_SU.w - 2 * 256, "space"));
  keys.push(key("return", CHAT_SU.w - 12 - 230, rowTop(3), 230, "return", true));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: CHAT_SU.w,
        height: Math.max(0, CHAT_SU.h - top),
        backgroundColor: "#0D140F",
      }}
    >
      {/* dimmed: the keyboard is texture under the caption plate and the lower scrim */}
      <div style={{ position: "absolute", left: 0, top: -top, width: CHAT_SU.w, height: CHAT_SU.h, opacity: level }}>{keys}</div>
    </div>
  );
};

const HomeIndicator: React.FC<{ readonly colors: RallyoColors }> = ({ colors }) => (
  <div
    style={{
      position: "absolute",
      left: (CHAT_SU.w - 420) / 2,
      top: CHAT_SU.h - 34,
      width: 420,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.fg,
      opacity: 0.35,
    }}
  />
);

// ---------------------------------------------------------------------------------------------
// ChatScreen
// ---------------------------------------------------------------------------------------------

const ChatScreenInner: React.FC<ChatScreenProps> = ({
  messages,
  anchorSu,
  keyboard,
  state,
  title = "Thursday Open Play",
  members = "47 members",
  unreadStart = 12,
  unreadBy = 100,
  rush,
  freezeAt,
  composerTopSu = CHAT_SU.composerTop,
  jamFocus = [585, 640],
  backfill = 0,
  ownPicks = [],
  replays = [],
  keyboardLevel,
  historyLevel = 0.35,
  outgoing,
  reply,
  bgColor,
  colors = RALLYO_COLORS,
  senderNames = CHAT_SENDER_NAMES,
  replyTyping = 0,
  venueBlur = 12,
  smear = true,
  postOverlay,
  style,
}) => {
  const raw = useCurrentFrame();
  const frame = freezeAt !== undefined ? Math.min(raw, freezeAt) : raw;
  const smearId = `chat-smear-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // Measure only after the faces load (holds a delayRender until this component re-renders measured).
  useRallyoFontsReady();
  const postText = usePostText(outgoing?.text ?? "", outgoing ? (outgoing.src ?? POST_SRC) : "");
  const post = outgoing
    ? postLayout({ text: postText, blurVenue: outgoing.blurVenue, linkDisplay: outgoing.linkDisplay, bottomSu: anchorSu })
    : null;
  const calm = state === "calm";
  const B: ChatBubbleMetrics = calm ? CHAT_BUBBLE : CHAT_BUBBLE_CHAOS;
  // Chaos (scene 1, draft v3) is lifted well above the calm history so the hook reads on a phone: bubbles
  // mix(graphite, fg, .25) ≈ #676E67 with pure white text, light names, the jam one step lighter again; the
  // host's own lines are lime-tint with night ink.
  const palette: ChatPalette = calm
    ? {
        bubble: colors.graphiteBubble,
        avatar: colors.graphite,
        name: colors.senderGrey,
        jam: colors.graphite,
        text: colors.fg,
        own: colors.limeTint,
        ownInk: colors.night,
      }
    : {
        bubble: mixHex(colors.graphite, colors.fg, 0.25),
        avatar: colors.court,
        name: mixHex(colors.senderGrey, colors.fg, 0.72),
        jam: mixHex(colors.graphite, colors.fg, 0.33),
        text: "#FFFFFF",
        own: colors.limeTint,
        ownInk: colors.night,
      };

  // ---- rush schedule (chaos only) ----
  const rushOn = !calm && rush !== undefined && messages.length > 0;
  const pickMsg = (pick: number): ChatMessage => {
    const n = messages.length;
    return messages[(((pick < 0 ? n + pick : pick) % n) + n) % n];
  };
  // Host (own) lines: chaos only, by message index (mod length, like the rush picks).
  const n = messages.length;
  const ownIndex = (pick: number): number => (((pick < 0 ? n + pick : pick) % n) + n) % n;
  const ownSet = new Set(calm || n === 0 ? [] : ownPicks.map(ownIndex));
  const isOwn = (pick: number): boolean => ownSet.has(ownIndex(pick));
  const floods = rushOn && rush ? CHAT_RUSH_FLOOD.map((f) => ({ ...pickMsg(f.pick), at: rush[0] + f.dt, own: isOwn(f.pick) })) : [];

  // ---- entries in stack order (oldest first) ----
  type Draft = {
    key: string;
    kind: EntryKind;
    at: number;
    pop: number;
    fixed: boolean;
    sender: string;
    text: string;
    history: boolean;
    own: boolean;
    /** Order among drafts popping on the same frame: replays before (−1) / after (+1) the message (0). */
    sub: number;
  };
  const backfills: Draft[] =
    calm || messages.length === 0
      ? []
      : Array.from({ length: Math.max(0, Math.round(backfill)) }, (_, i) => {
          const pick = CHAT_BACKFILL_PICKS[i % CHAT_BACKFILL_PICKS.length];
          const m = pickMsg(pick);
          return { key: `b${i}`, kind: "in" as const, at: 0, pop: 6, fixed: true, sender: m.sender, text: m.text, history: false, own: isOwn(pick), sub: 0 };
        });
  const timed: Draft[] = messages.map((m, i) => ({
    key: `m${i}`,
    kind: "in" as const,
    at: m.at,
    pop: 6,
    fixed: calm || m.at <= 0,
    sender: m.sender,
    text: m.text,
    history: calm,
    own: isOwn(i),
    sub: 0,
  }));
  // Replays (chaos only) slot in next to the message popping on the same frame; a stable sort keeps the props order.
  if (!calm && n > 0) {
    replays.forEach((r, i) => {
      const m = pickMsg(r.pick);
      timed.push({ key: `r${i}`, kind: "in", at: r.at, pop: 6, fixed: r.at <= 0, sender: m.sender, text: m.text, history: false, own: isOwn(r.pick), sub: r.before ? -1 : 1 });
    });
  }
  const order = (d: Draft) => (d.fixed ? -1e6 : d.at);
  const drafts: Draft[] = backfills.concat(
    timed
      .map((d, i) => ({ d, i }))
      .sort((a, b) => order(a.d) - order(b.d) || a.d.sub - b.d.sub || a.i - b.i)
      .map((x) => x.d),
  );
  // Flood replays pop like messages, on a 3 f pop (push over 2 f) so one per frame still lands crisp.
  floods.forEach((m, i) => {
    drafts.push({ key: `f${i}`, kind: "in", at: m.at, pop: 3, fixed: false, sender: m.sender, text: m.text, history: false, own: m.own, sub: 0 });
  });
  if (outgoing && post) {
    drafts.push({ key: "post", kind: "post", at: outgoing.at, pop: 12, fixed: outgoing.at <= 0, sender: "", text: "", history: false, own: false, sub: 0 });
  }
  if (reply) {
    drafts.push({ key: "reply", kind: "in", at: reply.at, pop: 12, fixed: reply.at <= 0, sender: reply.sender, text: reply.text, history: false, own: false, sub: 0 });
  }
  const entries: Entry[] = [];
  drafts.forEach((d, i) => {
    const prev = i > 0 ? drafts[i - 1] : null;
    // A run joins consecutive bubbles of one sender, or consecutive host bubbles.
    const joined = d.kind === "in" && prev !== null && prev.kind === "in" && prev.own === d.own && (d.own || prev.sender === d.sender);
    const inc = d.kind === "in" ? chatIncomingLayout(d, !joined, senderNames, B, d.own) : null;
    const h = inc ? inc.h : post ? post.bubble.h : 0;
    const gapAbove = prev === null ? 0 : joined ? B.gapSame : B.gap;
    if (d.key === "reply" && replyTyping > 0) {
      // Typing bubble in the reply's slot; the reply replaces it.
      const typingH = B.padTop + B.textLh + B.padBottom;
      entries.push({
        key: "typing",
        kind: "typing",
        at: d.at - replyTyping,
        pop: 6,
        fixed: false,
        sender: d.sender,
        h: typingH,
        gapAbove,
        history: false,
        inc: null,
        joined: false,
        own: false,
      });
    }
    entries.push({ key: d.key, kind: d.kind, at: d.at, pop: d.pop, fixed: d.fixed, sender: d.sender, h, gapAbove, history: d.history, inc, joined, own: d.own });
  });

  // ---- push contributions: entry j moves everything older up by c_j ----
  // The typing bubble's push hands over to the reply's: older content goes from its height to the reply's.
  const contribAt = (f: number): number[] =>
    entries.map((e, i) => {
      const d = e.h + e.gapAbove;
      const p = e.fixed ? 1 : pushProgress(f, e.at, e.pop);
      if (e.kind !== "typing") {
        return d * p;
      }
      const r = entries[i + 1];
      return d * p * (1 - (r.fixed ? 1 : pushProgress(f, r.at, r.pop)));
    });
  const contrib = contribAt(frame);
  // suffix[i] = Σ_{j > i} contrib[j]
  const suffix = new Array<number>(entries.length).fill(0);
  for (let i = entries.length - 2; i >= 0; i--) {
    suffix[i] = suffix[i + 1] + contrib[i + 1];
  }

  // ---- flood motion blur: vertical only, capped so bubble shapes stay readable (no ghost copy) ----
  const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);
  const velocity = rushOn && (freezeAt === undefined || raw < freezeAt) ? sum(contrib) - sum(contribAt(frame - 1)) : 0;
  // Before the rush (the spam, with its paired replays) the smear is capped at 2 su so a pop frame stays legible.
  const sigmaCap = rush && frame >= rush[0] ? 6 : 2;
  const sigma = smear && velocity > 60 ? Math.min((velocity - 60) * 0.04, sigmaCap) : 0;

  // ---- jam pile: slams on the glass, both sides, the newest centred on jamFocus ----
  const jams: JamEntry[] =
    rushOn && rush
      ? CHAT_RUSH_JAM.map((slot, i) => {
          const inc = chatIncomingLayout(pickMsg(slot.pick), true, senderNames);
          const cx = slot.x ?? jamFocus[0];
          const cy = slot.y ?? jamFocus[1];
          return {
            key: `j${i}`,
            at: rush[0] + slot.dt,
            inc,
            x: Math.min(Math.max(16, cx - inc.w / 2), CHAT_SU.w - 16 - inc.w),
            y: Math.min(Math.max(CHAT_SU.headerBottom + 16, cy - inc.h / 2), composerTopSu - inc.h),
            rot: slot.rot,
          };
        })
      : [];

  // The stack behind the jam drops back (dim + soft blur from 2 f before the first slam to 4 f after it), so the
  // slammed bubbles read as the foreground and the stack's half-covered lines read as depth, not as cut-off text.
  const jamStart = jams.length > 0 ? jams[0].at : 0;
  const stackLevel = jams.length > 0 ? interpolate(frame, [jamStart - 2, jamStart + 4], [1, 0.42], CLAMP) : 1;
  const stackBlur = jams.length > 0 ? interpolate(frame, [jamStart - 2, jamStart + 4], [0, 9], CLAMP) : 0;
  const stackFilter = [sigma > 0 ? `url(#${smearId})` : "", stackBlur > 0 ? `blur(${stackBlur}px)` : ""].filter((x) => x !== "").join(" ");

  // ---- visibility / avatars ----
  // A typing bubble is visible from its `at` until the reply that replaces it pops.
  const visible = entries.map((e, i) =>
    e.kind === "typing" ? frame >= e.at && frame < entries[i + 1].at : e.fixed || frame >= e.at,
  );
  const typingIndex = entries.findIndex((e) => e.kind === "typing");
  // Sender of the next bubble actually on screen (the avatar sits on the last bubble of a run).
  const nextSender = (i: number): string | null => {
    for (let j = i + 1; j < entries.length; j++) {
      if (visible[j] && entries[j].kind !== "typing") {
        return entries[j].kind === "in" && !entries[j].own ? entries[j].sender : "";
      }
    }
    return null;
  };
  const bottomLimit = keyboard ? composerTopSu : B.calmComposerTop;

  const stack: React.ReactNode[] = [];
  entries.forEach((e, i) => {
    if (!visible[i]) {
      return;
    }
    // The typing bubble is replaced by the reply in its slot, so the reply never pushes it.
    const b = anchorSu - (e.kind === "typing" ? suffix[i] - contrib[i + 1] : suffix[i]);
    if (b < 0 || b - e.h > bottomLimit) {
      return;
    }
    const scale = e.fixed ? 1 : popScale(frame, e.at, e.pop);
    const opacity = (e.fixed ? 1 : popOpacity(frame, e.at, e.pop)) * (e.history ? historyLevel : 1);
    if (e.kind === "typing") {
      stack.push(<TypingBubble key={e.key} sender={e.sender} h={e.h} frame={frame} colors={colors} bottom={b} scale={scale} opacity={opacity} />);
    } else if (e.kind === "post" && post) {
      stack.push(<PostBubble key={e.key} post={post} colors={colors} venueBlur={venueBlur} bottom={b} scale={scale} opacity={opacity} />);
    } else if (e.inc && e.own) {
      stack.push(<OwnBubble key={e.key} inc={e.inc} joined={e.joined} palette={palette} metrics={B} bottom={b} scale={scale} opacity={opacity} />);
    } else if (e.inc) {
      stack.push(
        <IncomingBubble
          key={e.key}
          inc={e.inc}
          sender={e.sender}
          showAvatar={nextSender(i) !== e.sender}
          joined={e.joined}
          colors={colors}
          palette={palette}
          metrics={B}
          bottom={b}
          scale={scale}
          opacity={opacity}
        />,
      );
    }
  });

  // ---- post overlay scrolls with the post ----
  const postIndex = entries.findIndex((e) => e.kind === "post");
  const postShift = postIndex >= 0 ? suffix[postIndex] : 0;

  // ---- header ----
  const popped = messages.filter((m) => m.at <= frame);
  const lastPop = popped.length > 0 ? Math.max(0, ...popped.map((m) => m.at)) : 0;
  const unread = calm
    ? null
    : frame >= unreadBy
      ? "99+"
      : String(Math.round(interpolate(lastPop, [0, unreadBy], [unreadStart, 99], { ...CLAMP, easing: Easing.in(Easing.quad) })));
  const replyTypingOn = calm && typingIndex >= 0 && frame >= entries[typingIndex].at && reply !== undefined && frame < reply.at;
  const subline = !calm ? (
    <>
      <span>{`${members} · typing`}</span>
      <TypingDots frame={frame} color={colors.senderGrey} size={10} />
    </>
  ) : replyTypingOn && reply ? (
    <>
      <span>{`${senderNames[reply.sender] ?? reply.sender} is typing`}</span>
      <TypingDots frame={frame} color={colors.senderGrey} size={10} />
    </>
  ) : (
    <span>{members}</span>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CHAT_SU.w,
        height: CHAT_SU.h,
        overflow: "hidden",
        backgroundColor: bgColor ?? colors.nightCard,
        ...style,
      }}
    >
      {sigma > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={smearId} x="0%" y="-10%" width="100%" height="120%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`0 ${sigma}`} />
            </filter>
          </defs>
        </svg>
      ) : null}

      <div style={{ position: "absolute", inset: 0, opacity: stackLevel, filter: stackFilter === "" ? undefined : stackFilter }}>{stack}</div>

      {jams.map((j) => (frame >= j.at ? <JamBubble key={j.key} jam={j} frame={frame} palette={palette} metrics={CHAT_BUBBLE} /> : null))}

      {postOverlay ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: CHAT_SU.w, height: CHAT_SU.h, translate: `0px ${-postShift}px` }}>
          {postOverlay}
        </div>
      ) : null}

      <Header title={title} subline={subline} unread={unread} colors={colors} />

      {keyboard ? (
        <>
          <Composer top={composerTopSu} colors={colors} />
          <Keyboard top={composerTopSu + CHAT_SU.composerBottom - CHAT_SU.composerTop} level={keyboardLevel ?? (calm ? 0.45 : 0.6)} colors={colors} />
        </>
      ) : (
        <>
          <Composer top={B.calmComposerTop} colors={colors} />
          <HomeIndicator colors={colors} />
        </>
      )}
    </div>
  );
};

export const ChatScreen = Interactive.create({
  Component: ChatScreenInner,
  layout: "none",
  schema: {
    anchorSu: { type: "number", default: 840, min: 0, max: 2532, step: 1, description: "Anchor (su)", hiddenFromList: false },
    keyboard: { type: "boolean", default: true, description: "Keyboard open" },
    state: { type: "enum", default: "chaos", description: "State", variants: { chaos: {}, calm: {} } },
    title: { type: "string", default: "Thursday Open Play", description: "Chat title" },
    members: { type: "string", default: "47 members", description: "Members line" },
    unreadStart: { type: "number", default: 12, min: 0, max: 99, step: 1, integer: true, description: "Unread start", hiddenFromList: false },
    unreadBy: { type: "number", default: 100, min: 0, step: 3, integer: true, description: "Unread 99+ at (f)", hiddenFromList: false },
    historyLevel: { type: "number", default: 0.35, min: 0, max: 1, step: 0.05, description: "Calm history opacity", hiddenFromList: false },
    replyTyping: { type: "number", default: 0, min: 0, max: 60, step: 3, integer: true, description: "Typing before reply (f)", hiddenFromList: false },
    venueBlur: { type: "number", default: 12, min: 0, max: 40, step: 1, description: "Venue blur (su)", hiddenFromList: false },
    smear: { type: "boolean", default: true, description: "Rush smear" },
  } as const satisfies InteractivitySchema,
});

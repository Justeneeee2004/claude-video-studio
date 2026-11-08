import { measureText } from "@remotion/layout-utils";
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Rect } from "../elements/CameraRig";
import { RALLYO_FONTS, rallyoFontsLoaded, useRallyoFontsReady } from "../theme/rallyo";

/**
 * postLayout() lays out the GC post (public/rallyo/data/rookie-cup-post.txt = capture R1, verbatim)
 * in SCREEN UNITS (su, 1170x2532) with measureText from @remotion/layout-utils (brief scene 3):
 *   Satoshi 500, 48 su, line-height 1.3 (62.4 su), text column ≤ 800 su, padding 36 su,
 *   bubble right edge su 1110, bubble BOTTOM at su 1740 (= ChatScreen anchorSu in scene 3).
 *   Every source line is word-wrapped at the text column by measuring the candidate line, so the
 *   rendered rows are exactly the measured rows (ChatScreen draws each row with white-space: pre).
 *   The bubble shrink-wraps to the widest measured row (a real chat bubble), right-aligned at rightSu.
 *   The link line ("Join here: …", the last line holding a URL) is Satoshi 700 olive-ink and shows
 *   `linkDisplay` instead of the captured dev-DB URL (display only: the data file keeps the full id).
 *   The venue span (line 3, text before " · ") is returned as a per-row blur span when blurVenue.
 * Returns the rows, the bubble rect, the text column, the link-block rect and the two CameraRig
 * source rects (bubble padded fullPad → full-bubble framing; link rows × bubble width, padded
 * linkPad → link push).
 *
 * Measurement: only once the Rallyo faces are loaded (measureText caches results, so measuring a
 * fallback face would poison the cache for the session). Before that, and in Node (calculateMetadata),
 * the widths are estimated and `measured` is false. In components use `usePostLayout()` (holds a
 * delayRender until the fonts are in) or call postLayout() after `useRallyoFontsReady()` is true.
 * Never hand-type the post: the text comes from props (filled by calculateRallyoMetadata from postSrc)
 * or from the data file via `usePostText()`. With neither, a visible "(placeholder)" post in the
 * brief's expected shape is laid out so development works and QA's placeholder check fails loudly.
 */

export type PostLayoutOptions = {
  /** Verbatim capture text ("" → the "(placeholder)" post). */
  readonly text: string;
  readonly fontFamily?: string;
  readonly fontWeight?: number;
  /** su */
  readonly fontSize?: number;
  /** su */
  readonly lineHeight?: number;
  /** Max text column width (su). */
  readonly textWidth?: number;
  /** su */
  readonly padding?: number;
  /** Bubble right edge (su). */
  readonly rightSu?: number;
  /** Bubble bottom edge (su) = ChatScreen anchorSu. */
  readonly bottomSu?: number;
  readonly blurVenue?: boolean;
  /** What the link line shows instead of the captured dev-DB URL ("" keeps the captured URL). */
  readonly linkDisplay?: string;
  /** Camera padding around the bubble (su). */
  readonly fullPad?: number;
  /** Camera padding around the link block (su). */
  readonly linkPad?: number;
};

export type PostLine = {
  /** Text as rendered (link URL already replaced by linkDisplay). One rendered row. */
  readonly text: string;
  /** Top-left of the row box in su. */
  readonly x: number;
  readonly y: number;
  /** Measured width of the row (su). */
  readonly w: number;
  /** Row height = lineHeight (su). */
  readonly h: number;
  /** Satoshi 700 olive-ink (the "Join here:" link line rows). */
  readonly bold: boolean;
  readonly link: boolean;
  /** Character span [start, end) of `text` to blur (venue), if any. */
  readonly blur: readonly [number, number] | null;
};

export type PostLayout = {
  readonly lines: readonly PostLine[];
  /** Outgoing bubble (su). */
  readonly bubble: Rect;
  /** Text column inside the bubble (su); w = widest row. */
  readonly textColumn: Rect;
  /** "Join here:" + URL rows (su); w = widest link row. */
  readonly linkBlock: Rect;
  /** CameraRig source rect for the full-bubble framing (bubble padded fullPad). */
  readonly cameraFull: Rect;
  /**
   * CameraRig source rect for the link push: linkBlock rows padded linkPad vertically, the full
   * bubble width padded linkPad horizontally (so "width" fits never push the bubble off-frame).
   */
  readonly cameraLink: Rect;
  /** true once measured with measureText on the loaded Rallyo faces; false = estimated widths. */
  readonly measured: boolean;
};

export const POST_DEFAULTS = {
  fontFamily: RALLYO_FONTS.ui,
  fontWeight: 500,
  fontSize: 48,
  lineHeight: 62.4,
  textWidth: 800,
  padding: 36,
  rightSu: 1110,
  bottomSu: 1740,
  blurVenue: true,
  linkDisplay: "https://rallyo.ph/events/…",
  fullPad: 20,
  linkPad: 16,
} as const;

/** public/-relative path of the capture R1 data file (props.share.postSrc default). */
export const POST_SRC = "rallyo/data/rookie-cup-post.txt";

/**
 * Laid out only when no capture text is available. Same shape as eventSharePost() (brief scene 3
 * "Expected shape") so geometry is close during development; the "(placeholder)" marker makes the
 * house QA placeholder check fail if it ever reaches a render.
 */
export const POST_PLACEHOLDER = [
  "(placeholder) Rookie Cup",
  "Mon, Nov 2 · 9:00 AM",
  "Venue name · Courts 1, 2",
  "Tournament · Open · 1 division",
  "Open",
  "₱800 per team · cash at the venue",
  "N of 16 team spots left",
  "",
  "Join here: https://rallyo.ph/events/…",
].join("\n");

const LINK_RE = /https?:\/\/\S+/;

const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

const round1 = (v: number): number => Math.round(v * 10) / 10;

/** True when measureText() may run on the Rallyo faces (browser + every face loaded). */
export const canMeasureRallyo = (): boolean => typeof document !== "undefined" && rallyoFontsLoaded();

/**
 * Width of `text` in su. Measured on the loaded face when possible, otherwise estimated
 * (Satoshi averages ≈ .51 em at 500 and ≈ .54 em at 700/900 on this copy).
 */
export const textWidthSu = (text: string, fontSize: number, fontWeight: number, fontFamily: string = RALLYO_FONTS.ui): number => {
  if (!text) {
    return 0;
  }
  if (canMeasureRallyo()) {
    return measureText({ text, fontFamily, fontSize, fontWeight, validateFontIsLoaded: true }).width;
  }
  return Array.from(text).length * fontSize * (fontWeight >= 700 ? 0.54 : 0.51);
};

export type WrappedRow = {
  readonly text: string;
  /** [start, end) offsets of the row in the source line. */
  readonly start: number;
  readonly end: number;
  readonly w: number;
};

/**
 * Greedy word wrap of one source line at `maxWidth`, measuring each candidate row as a whole
 * (kerning included). Spaces at a wrap point are dropped; a single word wider than the column
 * is broken by characters. An empty line yields one empty row.
 */
export const wrapLine = (line: string, maxWidth: number, width: (s: string) => number): WrappedRow[] => {
  const rows: WrappedRow[] = [];
  const push = (start: number, end: number) => {
    const text = line.slice(start, end);
    rows.push({ text, start, end, w: width(text) });
  };
  let start = -1;
  let end = -1;
  for (const m of line.matchAll(/\S+/g)) {
    const ws = m.index;
    const we = ws + m[0].length;
    if (start >= 0 && width(line.slice(start, we)) <= maxWidth) {
      end = we;
      continue;
    }
    if (start >= 0) {
      push(start, end);
    }
    start = ws;
    end = we;
    // Break an over-long word by characters.
    while (width(line.slice(start, end)) > maxWidth && end - start > 1) {
      let cut = start + 1;
      while (cut < end && width(line.slice(start, cut + 1)) <= maxWidth) {
        cut++;
      }
      push(start, cut);
      start = cut;
    }
  }
  if (start >= 0) {
    push(start, end);
  }
  if (rows.length === 0) {
    rows.push({ text: "", start: 0, end: 0, w: 0 });
  }
  return rows;
};

/** Drop undefined keys so they never override a default. */
const defined = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

export const postLayout = (opts: PostLayoutOptions): PostLayout => {
  const o = { ...POST_DEFAULTS, ...defined(opts), text: opts.text ?? "" };
  const source = (o.text.trim() ? o.text : POST_PLACEHOLDER).replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  const measured = canMeasureRallyo();
  // The link line: the last line holding a URL (eventSharePost ends with "Join here: <url>").
  let linkIndex = -1;
  source.forEach((line, i) => {
    if (LINK_RE.test(line)) {
      linkIndex = i;
    }
  });
  // eventSharePost order: title / when / venue · courts / … → the venue is line 3.
  const venueIndex = source.length > 2 ? 2 : -1;

  const rows: { text: string; w: number; link: boolean; blur: readonly [number, number] | null }[] = [];
  source.forEach((raw, i) => {
    const link = i === linkIndex;
    const line = link && o.linkDisplay ? raw.replace(LINK_RE, o.linkDisplay) : raw;
    const weight = link ? 700 : o.fontWeight;
    let blurSpan: readonly [number, number] | null = null;
    if (i === venueIndex && o.blurVenue && line.trim()) {
      const cut = line.indexOf(" · ");
      blurSpan = [0, cut > 0 ? cut : line.length];
    }
    for (const r of wrapLine(line, o.textWidth, (s) => textWidthSu(s, o.fontSize, weight, o.fontFamily))) {
      let blur: readonly [number, number] | null = null;
      if (blurSpan) {
        const a = Math.max(blurSpan[0], r.start) - r.start;
        const b = Math.min(blurSpan[1], r.end) - r.start;
        blur = b > a ? [a, b] : null;
      }
      rows.push({ text: r.text, w: r.w, link, blur });
    }
  });

  const textW = Math.ceil(Math.max(1, ...rows.map((r) => r.w)));
  const textH = rows.length * o.lineHeight;
  const bubble: Rect = {
    x: round1(o.rightSu - textW - 2 * o.padding),
    y: round1(o.bottomSu - textH - 2 * o.padding),
    w: textW + 2 * o.padding,
    h: round1(textH + 2 * o.padding),
  };
  const textColumn: Rect = { x: bubble.x + o.padding, y: bubble.y + o.padding, w: textW, h: round1(textH) };
  const lines: PostLine[] = rows.map((r, i) => ({
    text: r.text,
    x: textColumn.x,
    y: round1(textColumn.y + i * o.lineHeight),
    w: r.w,
    h: o.lineHeight,
    bold: r.link,
    link: r.link,
    blur: r.blur,
  }));
  const linkLines = lines.filter((l) => l.link);
  const linkRows = linkLines.length > 0 ? linkLines : lines.slice(-1);
  const linkBlock: Rect = {
    x: textColumn.x,
    y: linkRows[0].y,
    w: Math.ceil(Math.max(1, ...linkRows.map((l) => l.w))),
    h: round1(linkRows.length * o.lineHeight),
  };
  return {
    lines,
    bubble,
    textColumn,
    linkBlock,
    cameraFull: pad(bubble, o.fullPad),
    // Link push: the link rows vertically, the whole bubble horizontally (both padded linkPad), so a
    // width fit keeps the bubble's edges inside the frame (brief: k ≤ ≈ .91, text ≈ 44 px).
    cameraLink: {
      x: bubble.x - o.linkPad,
      y: linkBlock.y - o.linkPad,
      w: bubble.w + 2 * o.linkPad,
      h: linkBlock.h + 2 * o.linkPad,
    },
    measured,
  };
};

// ---------------------------------------------------------------------------------------------
// Hooks: read the data file when no text came through props, and lay out after the fonts load.
// ---------------------------------------------------------------------------------------------

const textCache = new Map<string, string>();

/**
 * Returns `text` when it is non-empty. Otherwise fetches `src` (public/-relative, default the
 * capture R1 file) once per session, holding a delayRender until the text is in and rendered.
 * A missing file yields "" (→ the "(placeholder)" post), never a hand-typed fallback.
 */
export const usePostText = (text: string, src: string = POST_SRC): string => {
  const need = !text.trim() && src.length > 0;
  const [loaded, setLoaded] = useState<string | null>(() => (need ? (textCache.get(src) ?? null) : null));
  const [handle] = useState(() => (need && !textCache.has(src) ? delayRender(`Rallyo post text: ${src}`) : null));
  useEffect(() => {
    if (!need || loaded !== null) {
      return;
    }
    let alive = true;
    fetch(staticFile(src))
      .then((res) => (res.ok ? res.text() : ""))
      .catch(() => "")
      .then((t) => {
        textCache.set(src, t);
        if (alive) {
          setLoaded(t);
        }
      });
    return () => {
      alive = false;
    };
  }, [need, loaded, src]);
  useEffect(() => {
    // Also release when `text` arrives via props mid-fetch (need → false): the fetch effect's cleanup
    // cancels setLoaded, so `loaded` would stay null and the delayRender would never clear.
    if (handle !== null && (loaded !== null || !need)) {
      continueRender(handle);
    }
  }, [handle, loaded, need]);
  useEffect(
    () => () => {
      if (handle !== null) {
        continueRender(handle);
      }
    },
    [handle],
  );
  return need ? (loaded ?? "") : text;
};

/**
 * postLayout() for components: waits for the Rallyo fonts (re-renders measured) and reads the data
 * file when `text` is empty. Use the same options in the scene (camera rects) and in ChatScreen
 * (bubble), so both agree on the geometry.
 */
export const usePostLayout = (opts: PostLayoutOptions & { readonly src?: string }): PostLayout => {
  // Re-renders once the faces are in; its delayRender keeps the estimated layout from being captured.
  const ready = useRallyoFontsReady();
  const text = usePostText(opts.text, opts.src ?? POST_SRC);
  const layout = postLayout({ ...opts, text });
  return ready ? layout : { ...layout, measured: false };
};

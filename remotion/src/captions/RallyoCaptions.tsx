import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import React, { useMemo } from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS, RALLYO_FONTS } from "../theme/rallyo";

/**
 * Burned-in Taglish captions on a plate (brief section 5 "Caption plate", build item 13).
 *
 *   Plate x 92-890, y 1084-1240 (798 x 156), night rgba(11,19,13,.85), radius 16, 24 px side padding,
 *   plus a 16 px backdrop blur (`plateBlur`, 0 = flat) so phone UI behind the plate never reads as text.
 *   Satoshi 900 60 px, white; the ACTIVE word turns lime and punches in (scale 1.08 → 1 over 6 f);
 *   brand words (Rallyo, rallyo.ph) are always lime. ≤ 24 characters per line, ≤ 2 lines per page,
 *   2-4 words per page, each page ≥ 1.2 s where speech allows: all enforced or flagged upstream by
 *   scripts/align-captions.mts, which also writes the canonical spellings.
 *
 * Caption[] conventions (align-captions output, inline so the Studio caption editor can write back):
 *   - times in ms relative to the VO clip start (the component lives inside the clip's <Sequence>);
 *   - whitespace-sensitive: every word but the first carries a leading space (" next?");
 *   - a leading "\n" instead of the space starts a new line inside the page (canonical " ⏎ ");
 *   - `pageBreakAfter: true` closes each canonical " / " page. Without any page break the captions
 *     fall back to TikTok-style paging (`combineTokensWithinMilliseconds`).
 * Each page holds until the next page starts; the last page holds to the end of the parent Sequence
 * (the VO window), unless `holdLastPage` is false. Motion: the plate fades/rises in over 6 f when the
 * first word starts, each page's text rises in over 6 f, no exits (the clip window cuts it).
 * Absent in scene 10 (vo-10 has plate: false; RallyoPrelaunch does not render it).
 */

type RallyoCaptionsProps = {
  readonly captions: Caption[];
  /** Fallback paging when no caption has pageBreakAfter. */
  readonly combineTokensWithinMilliseconds?: number;
  readonly highlightColor?: string;
  readonly textColor?: string;
  readonly plateColor?: string;
  readonly fontSize?: number;
  /** Words always drawn in `brandColor` (case-insensitive, trailing punctuation ignored). */
  readonly brandWords?: readonly string[];
  readonly brandColor?: string;
  /** Last page stays up to the end of the parent Sequence (default true). */
  readonly holdLastPage?: boolean;
  /** Backdrop blur behind the plate in px (0 = flat plate) so device UI under it never reads as text. */
  readonly plateBlur?: number;
  /** Full-canvas fill behind the plate, for the standalone preview only (unset in the reel). */
  readonly backdropColor?: string;
  readonly style?: React.CSSProperties;
};

type PageToken = {
  readonly text: string;
  readonly fromMs: number;
  /** Until the next word on the page starts (so pauses keep the last spoken word lit), else its end. */
  readonly activeUntilMs: number;
  readonly brand: boolean;
};

type CaptionPage = {
  readonly startMs: number;
  readonly endMs: number;
  readonly lines: PageToken[][];
};

const DEFAULT_BRAND_WORDS: readonly string[] = ["Rallyo", "rallyo.ph"];

const bareWord = (text: string): string =>
  text
    .trim()
    .replace(/[.,!?:;]+$/, "")
    .toLowerCase();

const toPages = (
  captions: Caption[],
  combineMs: number,
  holdLastPage: boolean,
  brandWords: readonly string[],
): CaptionPage[] => {
  const hasBreaks = captions.some((c) => c.pageBreakAfter);
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: hasBreaks ? Number.POSITIVE_INFINITY : combineMs,
  });
  const brand = new Set(brandWords.map(bareWord));
  return pages.map((page, p) => {
    const lines: PageToken[][] = [[]];
    page.tokens.forEach((token, i) => {
      const next = page.tokens[i + 1];
      const startsLine = i > 0 && /^[ \t]*\n/.test(token.text);
      const prevEndsLine = i > 0 && /\n[ \t]*$/.test(page.tokens[i - 1].text);
      if ((startsLine || prevEndsLine) && lines[lines.length - 1].length > 0) {
        lines.push([]);
      }
      const text = token.text.trim();
      if (text.length === 0) {
        return;
      }
      lines[lines.length - 1].push({
        text,
        fromMs: token.fromMs,
        activeUntilMs: next ? Math.max(next.fromMs, token.fromMs + 1) : token.toMs,
        brand: brand.has(bareWord(text)),
      });
    });
    const last = p === pages.length - 1;
    return {
      startMs: page.startMs,
      endMs: last ? (holdLastPage ? Number.POSITIVE_INFINITY : page.startMs + page.durationMs) : pages[p + 1].startMs,
      lines: lines.filter((l) => l.length > 0),
    };
  });
};

const RallyoCaptionsInner: React.FC<RallyoCaptionsProps> = ({
  captions,
  combineTokensWithinMilliseconds = 1200,
  highlightColor = RALLYO_COLORS.lime,
  textColor = "#FFFFFF",
  plateColor = "rgba(11, 19, 13, 0.85)",
  fontSize = 60,
  brandWords = DEFAULT_BRAND_WORDS,
  brandColor = RALLYO_COLORS.lime,
  holdLastPage = true,
  plateBlur = 16,
  backdropColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = useMemo(
    () => toPages(captions ?? [], combineTokensWithinMilliseconds, holdLastPage, brandWords),
    [captions, combineTokensWithinMilliseconds, holdLastPage, brandWords],
  );
  const nowMs = (frame / fps) * 1000;
  const page = pages.find((candidate) => nowMs >= candidate.startMs && nowMs < candidate.endMs);
  const backdrop = backdropColor ? (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, backgroundColor: backdropColor }} />
  ) : null;
  if (!page) {
    return backdrop;
  }
  // Frames (not ms) for the motion, so easing durations stay on the 3 f grid.
  const plateIn = (pages[0].startMs / 1000) * fps;
  const pageIn = (page.startMs / 1000) * fps;
  return (
    <>
      {backdrop}
      <div
        style={{
          position: "absolute",
          left: 92,
          top: 1084,
          width: 798,
          height: 156,
          ...style,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxSizing: "border-box",
            padding: "0px 24px",
            borderRadius: 16,
            backgroundColor: plateColor,
            backdropFilter: plateBlur > 0 ? `blur(${plateBlur}px)` : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(frame, [plateIn, plateIn + 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [plateIn, plateIn + 6], ["0px 12px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              fontFamily: RALLYO_FONTS.ui,
              fontWeight: 900,
              fontStyle: "normal",
              fontSize,
              lineHeight: 1.1,
              letterSpacing: 0,
              color: textColor,
              textAlign: "center",
              opacity: interpolate(frame, [pageIn, pageIn + 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [pageIn, pageIn + 6], ["0px 10px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {page.lines.map((line, li) => (
              <div key={`line-${li}`} style={{ maxWidth: "100%", whiteSpace: "normal" }}>
                {line.map((token, ti) => {
                  const active = nowMs >= token.fromMs && nowMs < token.activeUntilMs;
                  const wordIn = (token.fromMs / 1000) * fps;
                  return (
                    <React.Fragment key={`${token.fromMs}-${ti}`}>
                      {ti > 0 ? " " : null}
                      <span
                        style={{
                          display: "inline-block",
                          whiteSpace: "pre",
                          color: active ? highlightColor : token.brand ? brandColor : textColor,
                          scale: active
                            ? interpolate(frame, [wordIn, wordIn + 6], [1.08, 1], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                                easing: Easing.bezier(0.16, 1, 0.3, 1),
                                output: "perceptual-scale",
                              })
                            : 1,
                        }}
                      >
                        {token.text}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const rallyoCaptionsSchema = {
  ...Interactive.captionsSchema,
  highlightColor: { type: "color", default: "#C8F23A", description: "Active word" },
  textColor: { type: "color", default: "#FFFFFF", description: "Text" },
  brandColor: { type: "color", default: "#C8F23A", description: "Brand words (Rallyo, rallyo.ph)" },
  plateColor: { type: "color", default: "rgba(11, 19, 13, 0.85)", description: "Plate" },
  fontSize: { type: "number", default: 60, min: 20, max: 120, step: 1, description: "Font size", hiddenFromList: false },
  plateBlur: { type: "number", default: 16, min: 0, max: 40, step: 1, description: "Plate backdrop blur", hiddenFromList: false },
  holdLastPage: { type: "boolean", default: true, description: "Hold last page to clip end" },
  combineTokensWithinMilliseconds: {
    type: "number",
    default: 1200,
    min: 0,
    step: 50,
    description: "Paging when no page breaks",
    hiddenFromList: false,
  },
  backdropColor: { type: "color", default: undefined, description: "Preview backdrop (unset in the reel)" },
} as const satisfies InteractivitySchema;

export const RallyoCaptions = Interactive.create({
  Component: RallyoCaptionsInner,
  componentName: "<RallyoCaptions>",
  layout: "none",
  schema: rallyoCaptionsSchema,
});

import { measureText } from "@remotion/layout-utils";
import type React from "react";
import { useId } from "react";
import { Img, Interactive, type InteractivitySchema } from "remotion";
import { asset } from "../../lib/assets";
import { RALLYO_COLORS, RALLYO_FONTS, displayText, useRallyoFontsReady, wordmarkText } from "../../theme/rallyo";

/**
 * CarouselRail (carousel spec section 3.3): the lime rail pill with its card counter, plus the continuous lime
 * rail that runs across every card edge so the 8 cards read as one swipe. New element (the reel's ChapterRail and
 * its asserts stay untouched); same pill metrics as layers/ChapterRail.tsx.
 *
 * Pill: lime, x 72, y 60–126 (66 tall, radius 33). Label: Archivo 900 italic uppercase stretch 70% 44 px night,
 * from x 100 (box y 71–115), or the lockup (rallyo-mark.png 34 px tall tinted night by an SVG flood, x 100,
 * y 76–110, then the wordmark `Rallyo` 44 px at x 153). Width = 28 + label + 24 + dots + 30, laid out by flex, so
 * it always fits the measured label; the measured width is checked against the spec (±1 px, console.warn).
 * Counter: `total` dots, 14 px, 10 px gap, 24 px after the label; dots 1…cardIndex filled night, the rest a 2 px
 * night ring at 30%.
 * Rail (all 4 px, y 91–95, centred on the pill's centre line y 93), drawn UNDER the pill:
 *  - leadIn: x 0 → into the pill (cards 2–8), with a 44 px half-ball centred on (0, 93);
 *  - leadOut: from the pill → x 1080 with a half-ball centred on (1080, 93) (cards 1–7);
 *  - endBall (card 8): the line stops in a full ball centred on (920, 93), x 898–942 (spec v2: pulled in from 986 so
 *    Instagram's `n/8` corner badge, about x 950–1050, y 30–95, never covers it).
 * Static (a still): no animation.
 */

export const CAROUSEL_RAIL = {
  x: 72,
  top: 60,
  h: 66,
  radius: 33,
  padLeft: 28,
  padRight: 30,
  dotsGap: 24,
  dot: 14,
  dotGap: 10,
  fontSize: 44,
  lineY: 91,
  lineH: 4,
  ball: 44,
  centerY: 93,
  canvasW: 1080,
  endBallX: 920,
  markH: 34,
  /** rallyo-mark.png natural size. */
  markSrcW: 528,
  markSrcH: 416,
  /** Wordmark left in the lockup (spec: x 153). */
  wordmarkX: 153,
} as const;

/** Spec 3.3 label widths (px), checked after the fonts load. */
const SPEC_LABEL_W: Record<string, number> = {
  "FOR HOSTS": 199.2,
  "FOR PLAYERS": 239.8,
  lockup: 194.7,
};

const warned = new Set<string>();

type CarouselRailProps = {
  /** 1-based card number = filled dots. */
  readonly cardIndex?: number;
  readonly total?: number;
  /** Pill label (display face); ignored with `lockup`. */
  readonly label?: string;
  /** Rallyo mark + wordmark instead of a label. */
  readonly lockup?: boolean;
  readonly wordmark?: string;
  readonly markSrc?: string;
  readonly leadIn?: boolean;
  readonly leadOut?: boolean;
  readonly endBall?: boolean;
  readonly lime?: string;
  readonly night?: string;
  readonly style?: React.CSSProperties;
};

const CarouselRailInner: React.FC<CarouselRailProps> = ({
  cardIndex = 1,
  total = 8,
  label = "FOR HOSTS",
  lockup = false,
  wordmark = "Rallyo",
  markSrc = "rallyo/brand/rallyo-mark.png",
  leadIn = false,
  leadOut = true,
  endBall = false,
  lime = RALLYO_COLORS.lime,
  night = RALLYO_COLORS.night,
  style,
}) => {
  const R = CAROUSEL_RAIL;
  const ready = useRallyoFontsReady();
  const tintId = `carousel-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const markW = (R.markH * R.markSrcW) / R.markSrcH;

  // QA: the measured label against the spec's widths (the pill itself is laid out by flex, so it always fits).
  if (ready && typeof document !== "undefined") {
    const key = lockup ? "lockup" : label;
    const measured = lockup
      ? R.wordmarkX -
        (R.x + R.padLeft) +
        measureText({
          text: wordmark,
          fontFamily: RALLYO_FONTS.display,
          fontSize: R.fontSize,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          additionalStyles: { fontStyle: "italic", fontStretch: "100%" },
          validateFontIsLoaded: true,
        }).width
      : measureText({
          text: label,
          fontFamily: RALLYO_FONTS.display,
          fontSize: R.fontSize,
          fontWeight: 900,
          textTransform: "uppercase",
          additionalStyles: { fontStyle: "italic", fontStretch: "70%" },
          validateFontIsLoaded: true,
        }).width;
    const spec = SPEC_LABEL_W[key];
    if (spec !== undefined && Math.abs(measured - spec) > 1 && !warned.has(key)) {
      warned.add(key);
      console.warn(`CarouselRail "${key}": label ${measured.toFixed(1)} px vs spec ${spec} px (section 3.3)`);
    }
  }

  const pillLeftCap = R.x + R.radius;
  const lineEnd = endBall ? R.endBallX : R.canvasW;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: R.canvasW, height: R.top + R.h, ...style }}>
      {leadIn ? (
        <>
          <div
            style={{ position: "absolute", left: 0, top: R.lineY, width: pillLeftCap, height: R.lineH, backgroundColor: lime }}
          />
          <div
            style={{
              position: "absolute",
              left: -R.ball / 2,
              top: R.centerY - R.ball / 2,
              width: R.ball,
              height: R.ball,
              borderRadius: "50%",
              backgroundColor: lime,
            }}
          />
        </>
      ) : null}
      {leadOut || endBall ? (
        <div
          style={{
            position: "absolute",
            left: pillLeftCap,
            top: R.lineY,
            width: lineEnd - pillLeftCap,
            height: R.lineH,
            backgroundColor: lime,
          }}
        />
      ) : null}
      {leadOut && !endBall ? (
        <div
          style={{
            position: "absolute",
            left: R.canvasW - R.ball / 2,
            top: R.centerY - R.ball / 2,
            width: R.ball,
            height: R.ball,
            borderRadius: "50%",
            backgroundColor: lime,
          }}
        />
      ) : null}
      {endBall ? (
        <div
          style={{
            position: "absolute",
            left: R.endBallX - R.ball / 2,
            top: R.centerY - R.ball / 2,
            width: R.ball,
            height: R.ball,
            borderRadius: "50%",
            backgroundColor: lime,
          }}
        />
      ) : null}
      {/* The pill (over the rail line). */}
      <div
        style={{
          position: "absolute",
          left: R.x,
          top: R.top,
          height: R.h,
          borderRadius: R.radius,
          backgroundColor: lime,
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
          paddingLeft: R.padLeft,
          paddingRight: R.padRight,
          whiteSpace: "pre",
        }}
      >
        {lockup ? (
          <>
            <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
              <defs>
                <filter id={tintId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
                  <feFlood floodColor={night} result="tint" />
                  <feComposite in="tint" in2="SourceAlpha" operator="in" />
                </filter>
              </defs>
            </svg>
            <Img
              name="Rallyo mark"
              src={asset(markSrc)}
              style={{ width: markW, height: R.markH, maxWidth: "none", display: "block", flexShrink: 0, filter: `url(#${tintId})` }}
            />
            <div
              style={{
                ...wordmarkText({ size: R.fontSize, color: night, lineHeight: 1 }),
                marginLeft: R.wordmarkX - (R.x + R.padLeft) - markW,
                height: R.fontSize,
              }}
            >
              {wordmark}
            </div>
          </>
        ) : (
          <div style={{ ...displayText({ size: R.fontSize, color: night, lineHeight: 1 }), height: R.fontSize }}>{label}</div>
        )}
        <div style={{ display: "flex", gap: R.dotGap, marginLeft: R.dotsGap, flexShrink: 0 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={`dot-${i}`}
              style={{
                width: R.dot,
                height: R.dot,
                borderRadius: "50%",
                boxSizing: "border-box",
                backgroundColor: i < cardIndex ? night : "transparent",
                border: i < cardIndex ? "none" : `2px solid ${night}4D`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const carouselRailSchema = {
  cardIndex: { type: "number", default: 1, min: 1, max: 10, step: 1, integer: true, description: "Card (filled dots)", hiddenFromList: false },
  total: { type: "number", default: 8, min: 2, max: 10, step: 1, integer: true, description: "Cards", hiddenFromList: false },
  label: { type: "string", default: "FOR HOSTS", description: "Pill label" },
  lockup: { type: "boolean", default: false, description: "Rallyo lockup" },
  leadIn: { type: "boolean", default: false, description: "Rail from the left edge" },
  leadOut: { type: "boolean", default: true, description: "Rail to the right edge" },
  endBall: { type: "boolean", default: false, description: "End ball (last card)" },
} as const satisfies InteractivitySchema;

export const CarouselRail = Interactive.create({
  Component: CarouselRailInner,
  layout: "none",
  schema: carouselRailSchema,
});

import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS, RALLYO_FONTS, useRallyoFontsReady, type RallyoColors } from "../theme/rallyo";
import { displayTokens, measureDisplay, RAIL, railLabelLayout, RailPlate } from "./ChapterRail";

/**
 * ChapterWipe (CH01 abs 228–276, CH02 abs 1008–1056): a full-canvas lime panel that rises over the hard cut,
 * slams the chapter card on the bar and collapses into the chapter rail, the type flying into the rail label.
 * Top-level overlay, outside the TransitionSeries, timed with `from` / `durationInFrames={48}` on the instance
 * (local 0 = abs 228 / 1008). Brief 5.3 + section 6 chapter overlay table.
 *
 * - Local 0–12 rise: clipPath inset(top 0 0 0), top 1920 → 0 px with Easing.in(Easing.cubic) (1110 / 809 / 441 /
 *   0 px at local 9 / 10 / 11 / 12): full cover on the bar (abs 240 / 1020). The cut to the next scene happens
 *   unseen under full cover.
 * - Local 12 (the bar): `num` Archivo 900 italic uppercase, stretch 70%, 320 px, night ink, x 72, y 560–880, slams
 *   scale 1.3 → 1 about its centre (perceptual, 9 f, EASE.out). `label` same face, 112 px fixed, x 72, y 900–1012,
 *   words rise 40 px, 2 f stagger, 9 f enter (landed 23).
 * - Local 30–45 collapse, all with Easing.bezier(0.83, 0, 0.17, 1): the panel inset animates to the rail rect
 *   (x 72 … 72 + railW, y railTop … railTop + 66, round 33). The type flies into the rail: `num` (320 → 44 px,
 *   uniform scale .1375) and the label's rail word (HOSTS / PLAYERS, 112 → 44 px, scale .393) translate linearly
 *   (in eased time) from their card boxes to the rail boxes of `railLabelLayout` (the same measured numbers
 *   ChapterRail sets its label with). The fly scale is LINEAR in that eased time (deliberately not perceptual):
 *   every glyph point then travels a straight line from its card spot to its rail spot, so it stays inside the
 *   shrinking panel (whose edges move the same way) and `01` does not cover HOSTS mid-flight. Card words the rail does not show ("FOR") fade over 30–36 while riding with the
 *   label line; rail tokens the card does not carry ("·") fade in at their rail position over 39–45.
 * - Local 36–44 (draft v2): the rail's night backing plate (`RailPlate`, the same pixels ChapterRail draws) fades
 *   0 → full UNDER the collapsing panel, so it is already in place when the panel lands on the rail rect: the
 *   hand-off frame shows no dark halo popping in.
 * - Local 45: pixel hand-off to ChapterRail (same face, size, tracking, token positions and plate). Renders
 *   nothing from 45.
 * Props never use from / to / name / style / width / height.
 */

type ChapterWipeProps = {
  /** Big number, e.g. "01". */
  readonly num?: string;
  /** Card label, e.g. "FOR HOSTS". */
  readonly label?: string;
  /** Rail label the type becomes, e.g. "01 · HOSTS". */
  readonly railLabel?: string;
  /** Rail width, px (rail 01 = 424, rail 02 = 284). */
  readonly railW?: number;
  /** Rail top, px (1170; fallback band 1100, open item e). */
  readonly railTop?: number;
  readonly colors?: RallyoColors;
};

/** Card layout (brief 5.3). */
const CARD_X = 72;
const NUM_TOP = 560;
const NUM_SIZE = 320;
const LABEL_TOP = 900;
const LABEL_SIZE = 112;

const same = (a: string, b: string): boolean => a.toUpperCase() === b.toUpperCase();

const ChapterWipeInner: React.FC<ChapterWipeProps> = ({
  num = "01",
  label = "FOR HOSTS",
  railLabel = "01 · HOSTS",
  railW = 424,
  railTop = 1170,
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  useRallyoFontsReady();
  if (frame >= 45) {
    return null;
  }

  // Rail targets (shared with ChapterRail) and the card's measured word offsets.
  const rail = railLabelLayout(railLabel, railTop);
  const words = displayTokens(label, LABEL_SIZE);
  const railIndexOf = (text: string): number => rail.tokens.findIndex((t) => same(t.text, text));
  const numRail = railIndexOf(num);
  const wordRail = words.map((w) => railIndexOf(w.text));
  // The label line is anchored on its last word that the rail shows (HOSTS / PLAYERS).
  const anchor = wordRail.reduce((acc, j, i) => (j >= 0 ? i : acc), -1);
  const covered = new Set<number>([numRail, ...wordRail].filter((j) => j >= 0));

  const numDx = numRail >= 0 ? rail.left + rail.tokens[numRail].x - CARD_X : 0;
  const numDy = numRail >= 0 ? rail.top - NUM_TOP : 0;
  const anchorX = anchor >= 0 ? words[anchor].x : 0;
  const lineDx = anchor >= 0 ? rail.left + rail.tokens[wordRail[anchor]].x - (CARD_X + anchorX) : 0;
  const lineDy = anchor >= 0 ? rail.top - LABEL_TOP : 0;
  const lineW = measureDisplay(label, LABEL_SIZE);

  const fly = interpolate(frame, [30, 45], [0, 1], {
    easing: Easing.bezier(0.83, 0, 0.17, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const collapse = { easing: Easing.bezier(0.83, 0, 0.17, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const top =
    frame < 30
      ? interpolate(frame, [0, 12], [1920, 0], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(frame, [30, 45], [0, railTop], collapse);
  const left = interpolate(frame, [30, 45], [0, RAIL.x], collapse);
  const right = interpolate(frame, [30, 45], [0, 1080 - RAIL.x - railW], collapse);
  const bottom = interpolate(frame, [30, 45], [0, 1920 - railTop - RAIL.h], collapse);
  const radius = interpolate(frame, [30, 45], [0, RAIL.radius], collapse);

  return (
    <>
      <RailPlate
        railW={railW}
        railTop={railTop}
        color={colors.night}
        strength={interpolate(frame, [36, 44], [0, 1], {
          easing: Easing.bezier(0.33, 0, 0.67, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.lime,
          clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`,
        }}
      >
        {/* Big number: fly (outer, about its top-left) wraps the slam (inner, about its centre). */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: NUM_TOP,
            transformOrigin: "0px 0px",
            translate: `${numDx * fly}px ${numDy * fly}px`,
            // Linear output on purpose (not perceptual): with translate and scale on the same eased t every
            // glyph travels a straight line with the linear panel inset (brief 5.3), and `01` never sits on
            // HOSTS mid-flight (perceptual kept `01` large and overlapped HOSTS over local 38-41).
            scale: interpolate(frame, [30, 45], [1, RAIL.fontSize / NUM_SIZE], {
              easing: Easing.bezier(0.83, 0, 0.17, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            opacity: numRail >= 0 ? 1 : interpolate(frame, [30, 36], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div
            style={{
              fontFamily: RALLYO_FONTS.display,
              fontWeight: 900,
              fontStyle: "italic",
              fontStretch: "70%",
              textTransform: "uppercase",
              letterSpacing: 0,
              fontSize: 320,
              lineHeight: 1,
              whiteSpace: "pre",
              color: colors.night,
              transformOrigin: "50% 50%",
              opacity: interpolate(frame, [11, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              scale: interpolate(frame, [12, 21], [1.3, 1], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {num}
          </div>
        </div>

        {/* Card label line: flies about its anchor word's top-left; each word rises in, non-rail words fade. */}
        <div
          style={{
            position: "absolute",
            left: CARD_X,
            top: LABEL_TOP,
            width: lineW,
            height: LABEL_SIZE,
            transformOrigin: `${anchorX}px 0px`,
            translate: `${lineDx * fly}px ${lineDy * fly}px`,
            scale: interpolate(frame, [30, 45], [1, RAIL.fontSize / LABEL_SIZE], {
              easing: Easing.bezier(0.83, 0, 0.17, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {words.map((w, i) => (
            <div
              key={`word-${i}-${w.text}`}
              style={{
                position: "absolute",
                left: w.x,
                top: 0,
                fontFamily: RALLYO_FONTS.display,
                fontWeight: 900,
                fontStyle: "italic",
                fontStretch: "70%",
                textTransform: "uppercase",
                letterSpacing: 0,
                fontSize: 112,
                lineHeight: 1,
                whiteSpace: "pre",
                color: colors.night,
                opacity: interpolate(frame, [12 + 2 * i, 21 + 2 * i, 30, 36], [0, 1, 1, wordRail[i] >= 0 ? 1 : 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: `0px ${interpolate(frame, [12 + 2 * i, 21 + 2 * i], [40, 0], {
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}px`,
              }}
            >
              {w.text}
            </div>
          ))}
        </div>

        {/* Rail tokens the card does not carry ("·"): fade in at their rail position. */}
        {rail.tokens.map((tok, j) =>
          covered.has(j) ? null : (
            <div
              key={`rail-${j}-${tok.text}`}
              style={{
                position: "absolute",
                left: rail.left + tok.x,
                top: rail.top,
                fontFamily: RALLYO_FONTS.display,
                fontWeight: 900,
                fontStyle: "italic",
                fontStretch: "70%",
                textTransform: "uppercase",
                letterSpacing: 0,
                fontSize: 44,
                lineHeight: 1,
                whiteSpace: "pre",
                color: colors.night,
                opacity: interpolate(frame, [39, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              {tok.text}
            </div>
          ),
        )}
      </div>
    </>
  );
};

const chapterWipeSchema = {
  num: { type: "string", default: "01", description: "Chapter number" },
  label: { type: "string", default: "FOR HOSTS", description: "Card label" },
  railLabel: { type: "string", default: "01 · HOSTS", description: "Rail label" },
  railW: { type: "number", default: 424, min: 200, max: 480, step: 1, integer: true, description: "Rail width (px)", hiddenFromList: false },
  railTop: { type: "number", default: 1170, min: 1100, max: 1170, step: 70, integer: true, description: "Rail top (px)", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const ChapterWipe = Interactive.create({
  Component: ChapterWipeInner,
  layout: "absolute-fill",
  schema: chapterWipeSchema,
});

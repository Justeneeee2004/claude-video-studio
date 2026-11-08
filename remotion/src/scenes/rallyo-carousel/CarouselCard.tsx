import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { CarouselRail } from "../../elements/carousel/CarouselRail";
import { GrainOverlay } from "../../layers/GrainOverlay";
import { RALLYO_COLORS, displayText, uiText, useRallyoFontsReady } from "../../theme/rallyo";
import type { CarouselCards, CarouselColors, CarouselScreens } from "../../compositions/rallyo-carousel-schema";

/** Props every card component takes (copy = its own entry of `cards`; defaults = CAROUSEL_DEFAULTS). */
export type CarouselCardProps<K extends keyof CarouselCards> = {
  readonly copy?: CarouselCards[K];
  readonly screens?: CarouselScreens;
  readonly colors?: CarouselColors;
  readonly grain?: boolean;
  readonly markSrc?: string;
  readonly wordmark?: string;
};

/**
 * CarouselCard (carousel spec sections 3.1–3.3, 9.1): the shared 1080x1080 shell of every card. Static (a still):
 * no animation, no Sequence, no Freeze.
 *
 * Back to front: night background → `backdrop` (card 8 photo) → one radial lime glow (rgba(200, 242, 58, glowA) at
 * (glowX, glowY) → 0 at glowR, smoothstep falloff) → `children` (the hero: Stage + devices, tiles, callouts) →
 * headline (Archivo 900 italic uppercase 96 px, line boxes 88.32 px from y 156, x 72; line 1 fg, later lines lime)
 * → support (Satoshi 700 44 px at `supportTop`, fg2, then `supportAccent` in lime on the same line) → `overlay`
 * (card-specific text, e.g. card 8's URL) → CarouselRail (pill, counter, continuous rail) → optional grain.
 *
 * Fonts: useRallyoFontsReady() holds a delayRender until Archivo + Satoshi are loaded, so no frame is ever
 * captured with a fallback face.
 */

export const CAROUSEL_CARD = {
  w: 1080,
  h: 1080,
  textX: 72,
  headlineTop: 156,
  headlineSize: 96,
  headlineLineHeight: 0.92,
  supportSize: 44,
  supportTop: 354,
} as const;

/**
 * Titanium rail + buttons colour for every carousel phone (spec v2, craft m4). PhoneFrame's default (#3A413B) put
 * grey button slivers right on the 60 px margin of the zoomed phones (cards 3–5); this darker rail lets them recede
 * into the night, and one rail colour keeps the devices consistent across the set.
 */
export const CAROUSEL_RAIL_COLOR = "#20261F";

export const CAROUSEL_COLORS: CarouselColors = {
  night: RALLYO_COLORS.night,
  nightCard: RALLYO_COLORS.nightCard,
  lime: RALLYO_COLORS.lime,
  limeTint: RALLYO_COLORS.limeTint,
  paper: RALLYO_COLORS.paper,
  fg: RALLYO_COLORS.fg,
  fg2: RALLYO_COLORS.fg2,
};

/** "r, g, b" of a #RRGGBB colour. */
const rgbOf = (hex: string): string => {
  const m = /^#([0-9a-f]{6})/i.exec(hex.trim());
  if (!m) {
    return "200, 242, 58";
  }
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(", ");
};

/** Radial glow stops: alpha a × (1 − smoothstep(t)), 0 at t = 1. */
const glowStops = (rgb: string, a: number): string => {
  const steps = 10;
  const out: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = t * t * (3 - 2 * t);
    out.push(`rgba(${rgb}, ${(a * (1 - s)).toFixed(4)}) ${(t * 100).toFixed(1)}%`);
  }
  return out.join(", ");
};

export type CarouselCardShellProps = {
  readonly children?: React.ReactNode;
  readonly backdrop?: React.ReactNode;
  readonly overlay?: React.ReactNode;
  /** 1-based card number (filled rail dots). */
  readonly cardIndex?: number;
  readonly total?: number;
  /** Pill label; "" = the Rallyo lockup. */
  readonly railLabel?: string;
  readonly wordmark?: string;
  readonly markSrc?: string;
  readonly leadIn?: boolean;
  readonly leadOut?: boolean;
  readonly endBall?: boolean;
  readonly headline?: readonly string[];
  readonly support?: string;
  readonly supportAccent?: string;
  readonly supportTop?: number;
  readonly glowX?: number;
  readonly glowY?: number;
  readonly glowR?: number;
  readonly glowA?: number;
  readonly grain?: boolean;
  readonly colors?: CarouselColors;
};

const CarouselCardInner: React.FC<CarouselCardShellProps> = ({
  children,
  backdrop,
  overlay,
  cardIndex = 1,
  total = 8,
  railLabel = "",
  wordmark = "Rallyo",
  markSrc = "rallyo/brand/rallyo-mark.png",
  leadIn = false,
  leadOut = true,
  endBall = false,
  headline = [],
  support = "",
  supportAccent = "",
  supportTop = CAROUSEL_CARD.supportTop,
  glowX = 540,
  glowY = 760,
  glowR = 600,
  glowA = 0.07,
  grain = false,
  colors = CAROUSEL_COLORS,
}) => {
  useRallyoFontsReady();
  const C = CAROUSEL_CARD;
  const lineBox = C.headlineSize * C.headlineLineHeight;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: C.w, height: C.h, overflow: "hidden", backgroundColor: colors.night }}>
      {backdrop}
      {glowA > 0 && glowR > 0 ? (
        <Interactive.Div
          name="Glow"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle ${glowR}px at ${glowX}px ${glowY}px, ${glowStops(rgbOf(colors.lime), glowA)})`,
          }}
        />
      ) : null}
      {children}
      {headline.map((line, i) => (
        <Interactive.Div
          key={`h-${i}`}
          name={`Headline line ${i + 1}`}
          style={{
            ...displayText({ size: C.headlineSize, color: i === 0 ? colors.fg : colors.lime, lineHeight: C.headlineLineHeight }),
            position: "absolute",
            left: C.textX,
            top: C.headlineTop + i * lineBox,
            whiteSpace: "pre",
          }}
        >
          {line}
        </Interactive.Div>
      ))}
      {support || supportAccent ? (
        <Interactive.Div
          name="Support"
          style={{
            ...uiText(700, { size: C.supportSize, color: colors.fg2, lineHeight: 1.2 }),
            position: "absolute",
            left: C.textX,
            top: supportTop,
            whiteSpace: "pre",
          }}
        >
          {support}
          {supportAccent ? <span style={{ color: colors.lime }}>{supportAccent}</span> : null}
        </Interactive.Div>
      ) : null}
      {overlay}
      <CarouselRail
        name="Rail"
        cardIndex={cardIndex}
        total={total}
        label={railLabel}
        lockup={railLabel === ""}
        wordmark={wordmark}
        markSrc={markSrc}
        leadIn={leadIn}
        leadOut={leadOut}
        endBall={endBall}
        lime={colors.lime}
        night={colors.night}
      />
      {grain ? <GrainOverlay name="Grain" animate={false} /> : null}
    </div>
  );
};

const carouselCardSchema = {
  glowX: { type: "number", default: 540, step: 1, description: "Glow x", hiddenFromList: false },
  glowY: { type: "number", default: 760, step: 1, description: "Glow y", hiddenFromList: false },
  glowR: { type: "number", default: 600, min: 0, step: 1, description: "Glow radius", hiddenFromList: false },
  glowA: { type: "number", default: 0.07, min: 0, max: 1, step: 0.01, description: "Glow strength", hiddenFromList: false },
  supportTop: { type: "number", default: 354, step: 1, description: "Support top (y)", hiddenFromList: false },
  grain: { type: "boolean", default: false, description: "Grain" },
} as const satisfies InteractivitySchema;

export const CarouselCard = Interactive.create({
  Component: CarouselCardInner,
  layout: "absolute-fill",
  schema: carouselCardSchema,
});

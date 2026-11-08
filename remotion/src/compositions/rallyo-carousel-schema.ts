import { zColor } from "@remotion/zod-types";
import { z } from "zod";

/**
 * Props for RallyoCarousel: the 8-card 1:1 Facebook / Instagram carousel ad (spec briefs/rallyo-carousel.md v2).
 * One file renders all 8 cards: briefs/rallyo-carousel.props.json (= the Root defaultProps, inline).
 * Every on-card English string, every Ads Manager field and every served screen path lives here; the card
 * components never hard-code copy (their defaults are CAROUSEL_DEFAULTS, the same object).
 * Rules (CLAUDE.md): no prop is named from / to / durationInFrames / name / style / width / height; chat
 * messages use `sender`, never `from`. Paths are public/-relative (staticFile) with forward slashes.
 */

export const carouselColorsSchema = z.object({
  night: zColor(),
  nightCard: zColor(),
  lime: zColor(),
  limeTint: zColor(),
  paper: zColor(),
  fg: zColor(),
  fg2: zColor(),
});

/** Meta per-card fields: headline ≤ 40 characters, description ≤ 20 (spec section 6). */
const adFields = {
  adHeadline: z.string().min(1).max(40),
  adDescription: z.string().min(1).max(20),
};

/**
 * Shared card copy. `railLabel` "" = the Rallyo lockup (cards 1 and 8). `headline` lines: line 1 fg, every later
 * line lime (Archivo 900 italic, 96 px). `support` is Satoshi 700 44 px in fg2; `supportAccent` follows it on the
 * same line in lime ("" = none).
 */
const cardCopy = {
  railLabel: z.string(),
  headline: z.array(z.string()).min(1).max(3),
  support: z.string(),
  supportAccent: z.string(),
  ...adFields,
};

export const carouselChatMessageSchema = z.object({
  /** ≤ 0: visible on the still. */
  at: z.number().int().max(0),
  /** Initials. */
  sender: z.string().min(1).max(3),
  text: z.string().min(1),
});

export const rallyoCarouselSchema = z.object({
  colors: carouselColorsSchema,
  /** Film grain over every card (spec 3.1, optional; off unless it helps the glow banding). */
  grain: z.boolean(),
  brand: z.object({
    name: z.string(),
    url: z.string(),
    markSrc: z.string(),
  }),
  ads: z.object({
    /** ≤ 125 characters before "See more". */
    primaryText: z.string().min(1).max(125),
    ctaButton: z.string(),
    ctaAlternative: z.string(),
    destination: z.string().url(),
    displayLink: z.string(),
  }),
  cards: z.object({
    hook: z.object({
      ...cardCopy,
      /** The hook chat behind the hero (chaos state, the reel's S1 English bubbles, all at ≤ 0). */
      chatTitle: z.string(),
      chatMembers: z.string(),
      chaos: z.array(carouselChatMessageSchema),
      /** Indices into `chaos` drawn as the host's own (right-aligned lime-tint) lines, as the reel's S1. */
      ownPicks: z.array(z.number().int().min(0)),
    }),
    publish: z.object({
      ...cardCopy,
      chatTitle: z.string(),
      chatMembers: z.string(),
      history: z.array(carouselChatMessageSchema),
      /** public/-relative data file with the verbatim share post (capture R1). */
      postSrc: z.string(),
      linkDisplay: z.string(),
      blurVenue: z.boolean(),
    }),
    pay: z.object({ ...cardCopy }),
    checkIn: z.object({ ...cardCopy }),
    upNext: z.object({ ...cardCopy }),
    tournaments: z.object({ ...cardCopy }),
    players: z.object({ ...cardCopy }),
    cta: z.object({
      ...cardCopy,
      url: z.string(),
      /** The one offer line under the URL (Satoshi 700 44 px, fg); `support` follows it in fg2. */
      offer: z.string(),
    }),
  }),
  screens: z.object({
    mobileHome: z.string(),
    newEventSheet: z.string(),
    requestPayment: z.string(),
    idCardGames: z.string(),
    idAlmostIn: z.string(),
    hostCheckin: z.string(),
    playerCard: z.string(),
    hostUpNext: z.string(),
    tournamentConsole: z.string(),
    bracket: z.string(),
  }),
  photos: z.object({
    /** Owner-approved footer photo (option g), card 8 only. "" = none. */
    cta: z.string(),
    ctaOpacity: z.number().min(0).max(1),
  }),
});

export type RallyoCarouselProps = z.infer<typeof rallyoCarouselSchema>;
export type CarouselColors = RallyoCarouselProps["colors"];
export type CarouselCards = RallyoCarouselProps["cards"];
export type CarouselScreens = RallyoCarouselProps["screens"];
export type CarouselChatMessage = z.infer<typeof carouselChatMessageSchema>;

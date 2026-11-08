import { zColor } from "@remotion/zod-types";
import { z } from "zod";

/**
 * One props shape drives ProductPromo (16:9), SocialReel (9:16) and SquareAd (1:1).
 * Author a brief → fill briefs/<slug>.props.json → render all formats from the same file.
 */
export const promoSchema = z.object({
  brandName: z.string(),
  logoSrc: z.string(),
  kicker: z.string(),
  headline: z.string(),
  accentWords: z.string(),
  sub: z.string(),
  problemTitle: z.string(),
  pains: z.array(z.string()).min(1).max(3),
  productName: z.string(),
  tagline: z.string(),
  screenshotSrc: z.string(),
  deviceVariant: z.enum(["phone", "browser"]),
  featureTitle: z.string(),
  features: z.array(z.object({ title: z.string(), desc: z.string() })).min(1).max(3),
  stat1: z.object({ value: z.number(), suffix: z.string(), label: z.string() }),
  stat2: z.object({ value: z.number(), suffix: z.string(), label: z.string() }),
  quote: z.string(),
  author: z.string(),
  ctaHeadline: z.string(),
  ctaLabel: z.string(),
  url: z.string(),
  note: z.string(),
  musicSrc: z.string(),
  sfxEnabled: z.boolean(),
  primary: zColor(),
  accent: zColor(),
  bg: zColor(),
  bg2: zColor(),
  danger: zColor(),
});

export type PromoProps = z.infer<typeof promoSchema>;

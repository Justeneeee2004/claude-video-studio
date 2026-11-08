import type React from "react";
import { useCurrentFrame } from "remotion";
import { useCarouselPesoFace } from "../elements/carousel/peso-face";
import { Card01Hook } from "../scenes/rallyo-carousel/Card01Hook";
import { Card02Publish } from "../scenes/rallyo-carousel/Card02Publish";
import { Card03Pay } from "../scenes/rallyo-carousel/Card03Pay";
import { Card04CheckIn } from "../scenes/rallyo-carousel/Card04CheckIn";
import { Card05UpNext } from "../scenes/rallyo-carousel/Card05UpNext";
import { Card06Tournaments } from "../scenes/rallyo-carousel/Card06Tournaments";
import { Card07Players } from "../scenes/rallyo-carousel/Card07Players";
import { Card08Cta } from "../scenes/rallyo-carousel/Card08Cta";
import type { RallyoCarouselProps } from "./rallyo-carousel-schema";

/**
 * RallyoCarousel: the 8-card 1:1 carousel ad (spec briefs/rallyo-carousel.md v1), 1080x1080, 8 frames.
 * Frame n (0–7) renders card n + 1, so one `--sequence` render exports all 8 PNGs (rename to card-01 … card-08).
 * Every card is a static still: callouts are fully drawn on every frame (at −30), nothing animates.
 * Fonts: theme/rallyo.ts (Archivo + Satoshi, delayRender at import) plus the carousel-scoped ₱ face (peso-face.ts);
 * nothing renders until both are loaded, so no frame is captured with a fallback face.
 * Props: rallyoCarouselSchema (briefs/rallyo-carousel.props.json = the Root defaultProps).
 */

export const CAROUSEL_CARDS = [
  { index: 1, id: "hook", slug: "01-hook" },
  { index: 2, id: "publish", slug: "02-publish" },
  { index: 3, id: "pay", slug: "03-pay" },
  { index: 4, id: "checkIn", slug: "04-checkin" },
  { index: 5, id: "upNext", slug: "05-upnext" },
  { index: 6, id: "tournaments", slug: "06-tournaments" },
  { index: 7, id: "players", slug: "07-players" },
  { index: 8, id: "cta", slug: "08-cta" },
] as const;

export const CAROUSEL_FRAMES = CAROUSEL_CARDS.length;

export const RallyoCarousel: React.FC<RallyoCarouselProps> = (props) => {
  const frame = useCurrentFrame();
  // Satoshi has no ₱: wait for the carousel-scoped Archivo ₱ face before any card lays out its text.
  const pesoReady = useCarouselPesoFace();
  const card = Math.min(CAROUSEL_FRAMES, Math.max(1, Math.round(frame) + 1));
  const shared = {
    screens: props.screens,
    colors: props.colors,
    grain: props.grain,
    markSrc: props.brand.markSrc,
    wordmark: props.brand.name,
  };
  if (!pesoReady) {
    return null;
  }
  switch (card) {
    case 1:
      return <Card01Hook name="Card 1 · Hook" copy={props.cards.hook} {...shared} />;
    case 2:
      return <Card02Publish name="Card 2 · Publish" copy={props.cards.publish} {...shared} />;
    case 3:
      return <Card03Pay name="Card 3 · Pay" copy={props.cards.pay} {...shared} />;
    case 4:
      return <Card04CheckIn name="Card 4 · Check-in" copy={props.cards.checkIn} {...shared} />;
    case 5:
      return <Card05UpNext name="Card 5 · Up next" copy={props.cards.upNext} {...shared} />;
    case 6:
      return <Card06Tournaments name="Card 6 · Tournaments" copy={props.cards.tournaments} {...shared} />;
    case 7:
      return <Card07Players name="Card 7 · Players" copy={props.cards.players} {...shared} />;
    default:
      return (
        <Card08Cta
          name="Card 8 · CTA"
          copy={props.cards.cta}
          photoSrc={props.photos.cta}
          photoOpacity={props.photos.ctaOpacity}
          {...shared}
        />
      );
  }
};

import type React from "react";
import { Interactive } from "remotion";
import { RoughRing } from "../../elements/Annotate";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { CarouselStage } from "../../elements/carousel/CarouselStage";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CAROUSEL_RAIL_COLOR, CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 5 · Up next (carousel spec v2, section 5, card 5): "Up next, automatic." / "You send each match."
 * Pill FOR HOSTS, dots 1–5. Glow (560, 760) r 600 a .06. Stage clipTop 440.
 * v2 (craft review M3): one idea. The podium tile (a second idea, standings) and the box on the 24 px paragraph are
 * gone; the phone zooms on the made match and the host's tap, and the ring on `▶ Play` is the only callout. The
 * support stays the owner's S7 line (decision log round 3), and the ring shows it: Rallyo makes the match, you send it.
 * Phone: screen x 96, y 440 − 870k, w 900 (k .76923), no island, dark rail (craft m4): host-up-next.png, visible su
 *   ≈ 870–1702 (`Refresh`, su ≤ 863, is above the clip): `Match 1` `Beginner · Upper` (su 906–974 → y ≈ 468–520,
 *   below the 24 px top fade), `Next court` `▶ Play` (su 999–1094 → y ≈ 539–612; `▶ Play` x ≈ 354–508, ≈ 154 x 73 px),
 *   the first team box (`Ella T.`, `Arnel D.`, `Team points 15`, su 1125–1538 → y ≈ 636–954) and the top of the
 *   second (`Carlo P.`). Right bezel ends at x 1013.5.
 * Callout (in su): lime RoughRing on `▶ Play` ({336, 999, 200, 95}, measured ink; padding 8 px, stroke 6 px,
 *   spread 1.15, seed 52): the host's tap. No Play after-state, no court change.
 */

const D = CAROUSEL_DEFAULTS;

const PHONE_W = 900;
const PHONE_K = PHONE_W / 1170;
const PHONE_Y = 440 - 870 * PHONE_K;

const Card05UpNextInner: React.FC<CarouselCardProps<"upNext">> = ({
  copy = D.cards.upNext,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
}) => (
  <CarouselCard
    name="Card 5 shell"
    cardIndex={5}
    railLabel={copy.railLabel}
    markSrc={markSrc}
    wordmark={wordmark}
    leadIn
    leadOut
    headline={copy.headline}
    support={copy.support}
    supportAccent={copy.supportAccent}
    glowX={560}
    glowY={760}
    glowR={600}
    glowA={0.06}
    grain={grain}
    colors={colors}
  >
    <CarouselStage name="Stage" clipTop={440} topFade={24} scrimTop={1080} scrimBottom={1200} color={colors.night}>
      <PhoneFrame name="Phone" screenX={96} screenY={PHONE_Y} screenW={PHONE_W} island={false} frameColor={CAROUSEL_RAIL_COLOR}>
        <ScreenImage name="Host up next" src={screens.hostUpNext} />
        <RoughRing
          name="Ring Play"
          rect={{ x: 336, y: 999, w: 200, h: 95 }}
          at={-30}
          tone="lime"
          padding={8 / PHONE_K}
          strokeWidth={6 / PHONE_K}
          spread={1.15}
          seed={52}
        />
      </PhoneFrame>
    </CarouselStage>
  </CarouselCard>
);

export const Card05UpNext = Interactive.create({
  Component: Card05UpNextInner,
  layout: "absolute-fill",
  schema: {},
});

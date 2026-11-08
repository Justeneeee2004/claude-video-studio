import type React from "react";
import { Interactive } from "remotion";
import { RoughBox } from "../../elements/Annotate";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { UiTile } from "../../elements/UiTile";
import { CarouselStage } from "../../elements/carousel/CarouselStage";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CAROUSEL_RAIL_COLOR, CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 4 · Check-in (carousel spec v2, section 5, card 4): "Check-in by 4-digit code."
 * Pill FOR HOSTS, dots 1–4. Glow (800, 800) r 600 a .07. Stage clipTop 440.
 * Phone: screen x 96, y 470 − 600k, w 878 (k .75043), no island, dark rail (craft m4): host-checkin.png (visible su
 *   rows ≈ 560–1413): `BEGINNER · 20 of 22 checked in`, the `On Rallyo · code or name │ Guest · not on Rallyo`
 *   toggle, the empty code field, the lime `Check in` button (label y ≈ 977–1010).
 * Tile (v2, craft m2): player-card-masked.png crop {878, 691, 230, 136}, centred on the `CHECK-IN` / `7314` ink
 *   (x 910–1076, y 719–798: 32 / 32 su side margins, 28 / 29 su top / bottom; the card border is at x ≥ 1124 there),
 *   zoom 1.45 → 333.5 x 197.2 (digits ≈ 57 px, v1 49 px), left 650, top 812, rotate −2°. It overlaps the right third
 *   of the code field ("this code goes here"): its left edge crosses the placeholder at canvas x ≈ 649, in the gap
 *   between `digits)` (ink ends x 641.6) and `or` (starts x 654.3), so the field reads `Check-in code (4 digits)` and
 *   the capture's cut-off end (`or Rallyo r…`) is under the tile. v1's night patch and connector are gone.
 *   Corners ≈ (647, 818), (980, 806), (987, 1003), (654, 1015).
 * Callout: lime RoughBox on the code field (su {168, 1077, 872, 131}, padding 6 px, stroke 6 px, seed 41); its right
 *   end runs under the tile. Nothing typed, no toast, no checked-in state.
 */

const D = CAROUSEL_DEFAULTS;

const PHONE_W = 878;
const PHONE_K = PHONE_W / 1170;
const PHONE_Y = 470 - 600 * PHONE_K;

const Card04CheckInInner: React.FC<CarouselCardProps<"checkIn">> = ({
  copy = D.cards.checkIn,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
}) => (
  <CarouselCard
    name="Card 4 shell"
    cardIndex={4}
    railLabel={copy.railLabel}
    markSrc={markSrc}
    wordmark={wordmark}
    leadIn
    leadOut
    headline={copy.headline}
    support={copy.support}
    supportAccent={copy.supportAccent}
    glowX={800}
    glowY={800}
    glowR={600}
    glowA={0.07}
    grain={grain}
    colors={colors}
  >
    <CarouselStage name="Stage" clipTop={440} topFade={24} scrimTop={1080} scrimBottom={1200} color={colors.night}>
      <PhoneFrame name="Phone" screenX={96} screenY={PHONE_Y} screenW={PHONE_W} island={false} frameColor={CAROUSEL_RAIL_COLOR}>
        <ScreenImage name="Host check-in" src={screens.hostCheckin} />
        <RoughBox
          name="Box code field"
          rect={{ x: 168, y: 1077, w: 872, h: 131 }}
          at={-30}
          tone="lime"
          padding={6 / PHONE_K}
          strokeWidth={6 / PHONE_K}
          iterations={2}
          seed={41}
        />
      </PhoneFrame>
    </CarouselStage>
    <UiTile
      name="Check-in code tile"
      src={screens.playerCard}
      crop={{ x: 878, y: 691, w: 230, h: 136 }}
      zoom={1.45}
      style={{ left: 650, top: 812, rotate: "-2deg" }}
    />
  </CarouselCard>
);

export const Card04CheckIn = Interactive.create({
  Component: Card04CheckInInner,
  layout: "absolute-fill",
  schema: {},
});

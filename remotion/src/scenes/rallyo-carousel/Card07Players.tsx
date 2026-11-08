import type React from "react";
import { Interactive } from "remotion";
import { UiTile } from "../../elements/UiTile";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 7 · Players (carousel spec v2, section 5, card 7): "No app. No password." / "Player ID in about 20 seconds."
 * Pill FOR PLAYERS, dots 1–7. Glow (540, 760) r 620 a .08.
 * v2 (craft review M2, accuracy findings 4 and 6): rebuilt like cards 3 and 4, one zoomed claim, no device. v1's
 * three-phone fan (UI at ≈ 9–12 px on a phone, a soft-focus ghost over 60% of the hero screen, the map's attribution
 * twice) and the lime box on `4.84 RATING` (it invited a reading as an external federation rating) are gone.
 * Hero: the Player ID card, id-card-games.png crop {30, 18, 1110, 699} = the card's own outer box (3 su olive border
 *   x 30–1139, y 18–716; corner radius ≈ 40 su), zoom .76 → 843.6 x 531.2 at (72, 452) → x 72–915.6, y 452–983.2,
 *   tile radius 30.4 (= the card's), no extra rim (the card draws its own border). It shows `PLAYER ID`, `MAYA KIM`,
 *   `RLY-4821-K · Since Mar 2025`, `4.84 RATING`, `45—11 W—L`, `98% SHOW-UP`, `CHECK-IN 7314` (sample player; the
 *   email is filled in the file; the games list below the card is out of the crop).
 * Proof sticker: id-almost-in.png (the site's "You're almost in" sheet) crop {56, 2681, 396, 65} = `No password, no
 *   app.`, the first sentence of the page's own line "No password, no app. We email you a code to open your ID
 *   anywhere." (ink x 66–444, y 2695–2732; `We` starts at x 458, so the crop ends at 452), zoom 1.15 (455.4 x 74.8)
 *   inside a paper sticker (padding 16 x 12, radius 18, 2 px lime rim, shadow) at left 520, top 572, rotate −3°.
 *   It sits on the card's empty top-right (right of `MAYA KIM`, ink ≤ x 390; below `PLAYER ID`, ink ≤ y 529; above the
 *   `RLY-4821-K…` line, y ≥ 693) and hangs past the card's right edge. The sticker is the callout.
 */

const D = CAROUSEL_DEFAULTS;

const CARD_ZOOM = 0.76;
const STICKER_ZOOM = 1.15;
const STICKER_CROP = { x: 56, y: 2681, w: 396, h: 65 } as const;
const STICKER_PAD = { x: 16, y: 12 } as const;

const Card07PlayersInner: React.FC<CarouselCardProps<"players">> = ({
  copy = D.cards.players,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
}) => (
  <CarouselCard
    name="Card 7 shell"
    cardIndex={7}
    railLabel={copy.railLabel}
    markSrc={markSrc}
    wordmark={wordmark}
    leadIn
    leadOut
    headline={copy.headline}
    support={copy.support}
    supportAccent={copy.supportAccent}
    glowX={540}
    glowY={760}
    glowR={620}
    glowA={0.08}
    grain={grain}
    colors={colors}
  >
    <UiTile
      name="Player ID card tile"
      src={screens.idCardGames}
      sourceW={1170}
      sourceH={2609}
      crop={{ x: 30, y: 18, w: 1110, h: 699 }}
      zoom={CARD_ZOOM}
      radius={40 * CARD_ZOOM}
      borderWidth={0}
      fillColor={colors.night}
      style={{ left: 72, top: 452 }}
    />
    <Interactive.Div
      name="No-password sticker"
      style={{
        position: "absolute",
        left: 520,
        top: 572,
        width: STICKER_CROP.w * STICKER_ZOOM + 2 * STICKER_PAD.x,
        height: STICKER_CROP.h * STICKER_ZOOM + 2 * STICKER_PAD.y,
        borderRadius: 18,
        backgroundColor: colors.paper,
        boxShadow: `inset 0 0 0 2px ${colors.lime}, 0 24px 60px rgba(0, 0, 0, 0.55)`,
        rotate: "-3deg",
      }}
    >
      <UiTile
        name="No-password line"
        src={screens.idAlmostIn}
        sourceW={1170}
        sourceH={2859}
        crop={STICKER_CROP}
        zoom={STICKER_ZOOM}
        radius={0}
        borderWidth={0}
        shadow="none"
        fillColor={colors.paper}
        style={{ left: STICKER_PAD.x, top: STICKER_PAD.y }}
      />
    </Interactive.Div>
  </CarouselCard>
);

export const Card07Players = Interactive.create({
  Component: Card07PlayersInner,
  layout: "absolute-fill",
  schema: {},
});

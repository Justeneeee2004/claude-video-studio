import type React from "react";
import { Interactive } from "remotion";
import { Highlighter } from "../../elements/Annotate";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { UiTile } from "../../elements/UiTile";
import { CarouselStage } from "../../elements/carousel/CarouselStage";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CAROUSEL_RAIL_COLOR, CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 3 · Approve + pay the host (carousel spec v2, section 5, card 3): "You approve. They pay you."
 * Support (v2, accuracy review finding 1): `GCash or cash, straight to you.` (v1 said "No commission.", which the
 * live pricing page qualifies: hosts will pay ₱5 per approved player once prices start.)
 * Pill FOR HOSTS, dots 1–3. Glow (560, 760) r 600 a .06. Stage clipTop 440.
 * Phone: screen x 96, y 518 − 1836k, w 820 (k .70085), no island, dark rail (`CAROUSEL_RAIL_COLOR`, craft m4):
 *   request-payment-safe.png (rows 0–1835 are flat night and merge with the stage; the paper sheet su 1836–2532 fills
 *   canvas x 96–916, y 518–1005.8): `PAYMENT ₱800`, `Cash at the venue`, the note, `Decline` / `Approve`.
 *   No approved state, no toast. v2: 12 px right and 48 px lower than v1, so the GCash tile can sit on the top edge.
 * Callout (v2, craft m6): one lime Highlighter (multiply) behind the note, line 1 su x 102–1039, y 2134–2171,
 *   line 2 su x 102–431, y 2194–2231, padding 4 px. v1's lime-tint band vanished at feed size.
 * Tile (v2, craft m3): id-card-games.png crop {200, 2299, 507, 88} at 1.1 (557.7 x 96.8), left 440, top 444,
 *   rotate −3°, paper fill, 2 px lime rim: `GCash · confirmed by host`. It straddles the sheet's top edge (y 518), off
 *   the cash sheet's content, so the sheet reads "cash" and the tile reads "or GCash"; `PAYMENT ₱800` (y 564–594) and
 *   `Approve` stay fully visible.
 */

const D = CAROUSEL_DEFAULTS;

const PHONE_W = 820;
const PHONE_K = PHONE_W / 1170;
const PHONE_Y = 518 - 1836 * PHONE_K;

const Card03PayInner: React.FC<CarouselCardProps<"pay">> = ({
  copy = D.cards.pay,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
}) => (
  <CarouselCard
    name="Card 3 shell"
    cardIndex={3}
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
        <ScreenImage name="Request payment sheet" src={screens.requestPayment} />
        <Highlighter
          name="Cash note line 1"
          rect={{ x: 102, y: 2134, w: 937, h: 37 }}
          at={-30}
          tone="lime"
          padding={4 / PHONE_K}
          seed={31}
        />
        <Highlighter
          name="Cash note line 2"
          rect={{ x: 102, y: 2194, w: 329, h: 37 }}
          at={-30}
          tone="lime"
          padding={4 / PHONE_K}
          seed={32}
        />
      </PhoneFrame>
    </CarouselStage>
    <UiTile
      name="GCash confirmed tile"
      src={screens.idCardGames}
      sourceW={1170}
      sourceH={2609}
      crop={{ x: 200, y: 2299, w: 507, h: 88 }}
      zoom={1.1}
      fillColor={colors.paper}
      style={{ left: 440, top: 444, rotate: "-3deg" }}
    />
  </CarouselCard>
);

export const Card03Pay = Interactive.create({
  Component: Card03PayInner,
  layout: "absolute-fill",
  schema: {},
});

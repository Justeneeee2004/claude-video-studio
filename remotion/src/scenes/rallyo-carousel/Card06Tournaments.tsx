import type React from "react";
import { Interactive } from "remotion";
import { Connector, RoughBox } from "../../elements/Annotate";
import { UiTile } from "../../elements/UiTile";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 6 · Tournaments (carousel spec v2, section 5, card 6): "Tournament? Auto-call on." / "Winners move up the bracket."
 * Pill FOR HOSTS, dots 1–6. Glow (560, 760) r 600 a .06. No device: two real UI crops in one column (left edge x 72).
 * v2 (craft review M4):
 * Tile B (bracket, the base): demo-tournament-bracket-mhi.png crop {100, 630, 915, 445} at .95 (869.3 x 422.8) at
 *   (72, 586) → x 72–941.3, y 586–1008.8: QUARTERFINALS → SEMIFINALS (seed data; FINAL column outside the crop).
 *   The Bye match (QF 1, su y 690–865) stays: it overlaps the SF slot's rows (su y 790–965), so no rectangle keeps
 *   the whole SF slot without it; it also shows why Diego A. / Marcus T. are already in the semifinal.
 * Tile A (the claim): host-tournament-console-davao-fall-classic-full.png crop {2208, 138, 242, 104}, the
 *   `Auto-call: on` button alone (button x 2222–2435, y 154–226; the neighbours' borders end at x 2205 and start at
 *   2452) with 14–16 su of the lime host bar around it, zoom 1.38 (334 x 143.5), left 676, top 470, rotate −2°. It
 *   overlaps the bracket's empty top-right corner (right of the SEMIFINALS label, ink ends x 671.5; above the SF slot,
 *   top y 738). `Sign-off: Quick` and `End tournament` are out of the crop; no ink box (the button is the only dark
 *   one on the bar, the tile itself is the callout).
 * Callouts (canvas px, above the tiles): lime Connector QF 2 winner row → SF row (5 px), lime RoughBox around the
 *   whole SF slot (su x 576–995, y 790–965 → x 524.2–922.3, y 738–904.3; padding 8, 6 px, seed 62) so no stroke
 *   crosses a name. No `Create bracket` claim, no auto-seed.
 */

const D = CAROUSEL_DEFAULTS;

const BRACKET = { left: 72, top: 586, zoom: 0.95, cropX: 100, cropY: 630 } as const;
/** Bracket source px → canvas px. */
const bx = (su: number): number => BRACKET.left + (su - BRACKET.cropX) * BRACKET.zoom;
const by = (su: number): number => BRACKET.top + (su - BRACKET.cropY) * BRACKET.zoom;

const Card06TournamentsInner: React.FC<CarouselCardProps<"tournaments">> = ({
  copy = D.cards.tournaments,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
}) => (
  <CarouselCard
    name="Card 6 shell"
    cardIndex={6}
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
    <UiTile
      name="Bracket tile"
      src={screens.bracket}
      sourceW={2880}
      sourceH={1800}
      crop={{ x: BRACKET.cropX, y: BRACKET.cropY, w: 915, h: 445 }}
      zoom={BRACKET.zoom}
      style={{ left: BRACKET.left, top: BRACKET.top }}
    />
    <Connector
      name="QF winner to SF"
      d={`M ${bx(540)} ${by(923)} C ${bx(558)} ${by(923)}, ${bx(558)} ${by(886)}, ${bx(576)} ${by(886)}`}
      at={-30}
      strokeWidth={5}
      boxW={1080}
      boxH={1080}
      dots
    />
    <RoughBox
      name="Box semifinal slot"
      rect={{ x: bx(576), y: by(790), w: (995 - 576) * BRACKET.zoom, h: (965 - 790) * BRACKET.zoom }}
      at={-30}
      tone="lime"
      padding={8}
      strokeWidth={6}
      seed={62}
    />
    <UiTile
      name="Auto-call tile"
      src={screens.tournamentConsole}
      sourceW={2880}
      sourceH={3118}
      crop={{ x: 2208, y: 138, w: 242, h: 104 }}
      zoom={1.38}
      fillColor={colors.lime}
      style={{ left: 676, top: 470, rotate: "-2deg" }}
    />
  </CarouselCard>
);

export const Card06Tournaments = Interactive.create({
  Component: Card06TournamentsInner,
  layout: "absolute-fill",
  schema: {},
});

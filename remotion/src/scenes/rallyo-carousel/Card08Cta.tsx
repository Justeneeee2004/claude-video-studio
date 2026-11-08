import type React from "react";
import { Img, Interactive } from "remotion";
import { SoftFocus } from "../../elements/carousel/SoftFocus";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { CarouselStage } from "../../elements/carousel/CarouselStage";
import { asset } from "../../lib/assets";
import { uiText, wordmarkText } from "../../theme/rallyo";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CAROUSEL_RAIL_COLOR, CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 8 · CTA (carousel spec v2, section 5, card 8): "Use Rallyo while it's free." + rallyo.ph.
 * Rail: the Rallyo lockup, all 8 dots, rail in from x 0; the line stops in the full end ball at x 898–942 (v2: pulled
 * in from 964–1008, clear of Instagram's corner badge).
 * Background: the owner-approved footer photo (ph-paddle-tap.webp, option g), full bleed, cover, `objectPosition`
 * right, 10% over night, masked (craft review M5): the four faces span the whole photo, so no crop keeps them out of
 * the headline band; a union of two ramps (x 560 → 860 and y 700 → 940) shows the photo only on the right and along the
 * bottom, never behind the text block (the visible face is right of the headline, x ≈ 720–830). Glow (540, 600) r 640 a .07.
 * Text (v2, M5: one style for the body, one offer line):
 *  - URL `rallyo.ph`: wordmark style (Archivo 900 italic, normal width, −.02em) 150 px lime, x 72, box top 352 (ink
 *    x 73–745, y 368–509); a static 8 px lime underline bar x 73–745, y 526–534 (radius 4).
 *  - Offer `Free for hosts during pre-launch.` fg, Satoshi 700 44 px, box top 566 (ink ≈ x 75–749, y 571–615).
 *  - Support `Website. No app needed.` (the owner's S12 CTA line, decision log round 3) fg2, Satoshi 700 44 px, box
 *    top 622 (ink ≈ x 72–586, y 627–671).
 *  v1's 40 px `Always free for players.` is gone (the players' line lives in card 7's ad description).
 * Stage clipTop 712; phone screen (560, 760 − 1680k), w 440 (k .37607), +4°: mobile home, its top (logo, the site's own
 *   headline and the lead, su ≤ 1574 → y ≤ 720) above the clip (fade 712–736), so it shows `Find a game tonight`
 *   (y ≈ 760–818), `Host an event` and "No sign-up and no app needed…"; the screen's bottom edge sits on the canvas
 *   edge. No third headline on the card.
 */

const D = CAROUSEL_DEFAULTS;

const PHONE_W = 440;
const PHONE_K = PHONE_W / 1170;
/** `Find a game tonight` (su 1680) lands on canvas y 760; the screen's bottom edge then sits on the canvas edge. */
const PHONE_Y = 760 - 1680 * PHONE_K;

type Card08CtaProps = CarouselCardProps<"cta"> & {
  readonly photoSrc?: string;
  readonly photoOpacity?: number;
};

/** Union of two ramps: the photo shows on the right (x ≥ 560 → full at 860) and along the bottom (y ≥ 700 → full at
 * 940), never behind the text block. */
const PHOTO_MASK =
  "linear-gradient(90deg, transparent 0px, transparent 560px, black 860px), linear-gradient(180deg, transparent 0px, transparent 700px, black 940px)";

const Card08CtaInner: React.FC<Card08CtaProps> = ({
  copy = D.cards.cta,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
  photoSrc = D.photos.cta,
  photoOpacity = D.photos.ctaOpacity,
}) => (
  <CarouselCard
    name="Card 8 shell"
    cardIndex={8}
    railLabel={copy.railLabel}
    markSrc={markSrc}
    wordmark={wordmark}
    leadIn
    leadOut={false}
    endBall
    headline={copy.headline}
    support=""
    supportAccent=""
    glowX={540}
    glowY={600}
    glowR={640}
    glowA={0.07}
    grain={grain}
    colors={colors}
    backdrop={
      photoSrc ? (
        <Img
          name="Footer photo"
          src={asset(photoSrc)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1080,
            objectFit: "cover",
            objectPosition: "100% 50%",
            opacity: photoOpacity,
            maskImage: PHOTO_MASK,
            WebkitMaskImage: PHOTO_MASK,
            maskComposite: "add",
            WebkitMaskComposite: "source-over",
          }}
        />
      ) : null
    }
    overlay={
      <>
        <Interactive.Div
          name="URL"
          style={{ ...wordmarkText({ size: 150, color: colors.lime, lineHeight: 1 }), position: "absolute", left: 72, top: 352, whiteSpace: "pre" }}
        >
          {copy.url}
        </Interactive.Div>
        <Interactive.Div
          name="URL underline"
          style={{ position: "absolute", left: 73, top: 526, width: 672, height: 8, borderRadius: 4, backgroundColor: colors.lime }}
        />
        <Interactive.Div
          name="Offer"
          style={{ ...uiText(700, { size: 44, color: colors.fg, lineHeight: 1.2 }), position: "absolute", left: 72, top: 566, whiteSpace: "pre" }}
        >
          {copy.offer}
        </Interactive.Div>
        <Interactive.Div
          name="Support"
          style={{ ...uiText(700, { size: 44, color: colors.fg2, lineHeight: 1.2 }), position: "absolute", left: 72, top: 622, whiteSpace: "pre" }}
        >
          {copy.support}
        </Interactive.Div>
      </>
    }
  >
    <CarouselStage name="Stage" clipTop={712} topFade={24} scrimTop={1080} scrimBottom={1200} color={colors.night}>
      <PhoneFrame name="Phone" screenX={560} screenY={PHONE_Y} screenW={PHONE_W} frameColor={CAROUSEL_RAIL_COLOR} style={{ rotate: "4deg" }}>
        <ScreenImage name="Mobile home" src={screens.mobileHome} />
        <SoftFocus name="Home lead (soft)" rect={{ x: 40, y: 1250, w: 1090, h: 350 }} blur={14} tint={0.3} />
      </PhoneFrame>
    </CarouselStage>
  </CarouselCard>
);

export const Card08Cta = Interactive.create({
  Component: Card08CtaInner,
  layout: "absolute-fill",
  schema: {},
});

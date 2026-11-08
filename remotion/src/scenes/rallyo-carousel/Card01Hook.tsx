import type React from "react";
import { Interactive } from "remotion";
import { ChatScreen } from "../../elements/ChatScreen";
import { SoftFocus } from "../../elements/carousel/SoftFocus";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { CarouselStage } from "../../elements/carousel/CarouselStage";
import { RALLYO_COLORS } from "../../theme/rallyo";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CAROUSEL_RAIL_COLOR, CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 1 · Hook + brand (carousel spec v2, section 5, card 1): "Hosting open plays? Skip the group chat chaos."
 * Rail: the Rallyo lockup, dot 1, no lead-in (the rail begins with the brand), half-ball at the right edge.
 * Headline 3 lines (line 1 fg, 2–3 lime); support at box top 440: `Easy to use. ` fg2 + `Free during pre-launch.`
 * lime. Glow (760, 760) r 620 a .08. Stage clipTop 520 (no side fades, no lower scrim).
 *
 * v2 (craft review M1): the hero shows the pain the headline names, then the fix, and the ad headline is the only
 * headline on the card (the site's own `PADDLES UP. WHO'S GOT NEXT?` is out of frame).
 *  - Back (left): the reel's S1 group chat in its chaos state, built as in the reel (generic chat, no Messenger trade
 *    dress; the bubbles are the reel's canonical English lines, all visible on the still; the host's own lines are
 *    right-aligned lime-tint; unread pill 99+). Screen (114, 556), w 430 (k .3675), rotate −6° (its top-left corner
 *    stays right of x 60), dimmed by a night layer at `chatDim` so it reads as the problem behind the product.
 *  - Front (right): one phone, mobile home, screen (600, 628 − 1680k), w 400 (k .34188), rotate +4°, in its own
 *    stage clipped at y 584 (fade to 608). Its top (logo, the site headline and the lead paragraph, su ≤ 1574 →
 *    y ≤ 592) sits above the clip, so the visible part starts on `Find a game tonight` (su 1680–1835 → y ≈ 628–681),
 *    then `Host an event` and the site's "No sign-up and no app needed…" line; bottom bezel ≈ y 927. The lead keeps
 *    v1's soft-focus layer (blur 14 su + night 30%) in case the clip is moved.
 * No callout: this card makes no UI claim.
 */

const D = CAROUSEL_DEFAULTS;

const CHAT_W = 430;
const HOME_W = 400;
const HOME_K = HOME_W / 1170;
/** `Find a game tonight` (su 1680) lands on canvas y 628. */
const HOME_Y = 628 - 1680 * HOME_K;

type Card01HookProps = CarouselCardProps<"hook"> & {
  /** Night layer over the chat screen (0 = full strength). */
  readonly chatDim?: number;
};

const Card01HookInner: React.FC<Card01HookProps> = ({
  copy = D.cards.hook,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
  chatDim = 0.42,
}) => (
  <CarouselCard
    name="Card 1 shell"
    cardIndex={1}
    railLabel={copy.railLabel}
    markSrc={markSrc}
    wordmark={wordmark}
    leadIn={false}
    leadOut
    headline={copy.headline}
    support={copy.support}
    supportAccent={copy.supportAccent}
    supportTop={440}
    glowX={760}
    glowY={760}
    glowR={620}
    glowA={0.08}
    grain={grain}
    colors={colors}
  >
    <CarouselStage name="Stage" clipTop={520} topFade={24} scrimTop={1080} scrimBottom={1200} color={colors.night}>
      <PhoneFrame name="Chaos chat phone" screenX={114} screenY={556} screenW={CHAT_W} frameColor={CAROUSEL_RAIL_COLOR} style={{ rotate: "-6deg" }}>
        <ChatScreen
          name="Group chat (chaos)"
          messages={copy.chaos}
          anchorSu={1420}
          keyboard={false}
          state="chaos"
          title={copy.chatTitle}
          members={copy.chatMembers}
          ownPicks={copy.ownPicks}
          unreadStart={99}
          unreadBy={0}
          smear={false}
          colors={{ ...RALLYO_COLORS, ...colors }}
        />
        <Interactive.Div
          name="Chat dim"
          style={{ position: "absolute", left: 0, top: 0, width: 1170, height: 2532, backgroundColor: colors.night, opacity: chatDim }}
        />
      </PhoneFrame>
    </CarouselStage>
    <CarouselStage name="Rallyo stage" clipTop={584} topFade={24} scrimTop={1080} scrimBottom={1200} color={colors.night}>
      <PhoneFrame name="Rallyo phone" screenX={600} screenY={HOME_Y} screenW={HOME_W} frameColor={CAROUSEL_RAIL_COLOR} style={{ rotate: "4deg" }}>
        <ScreenImage name="Mobile home" src={screens.mobileHome} />
        <SoftFocus name="Home lead (soft)" rect={{ x: 40, y: 1250, w: 1090, h: 350 }} blur={14} tint={0.3} />
      </PhoneFrame>
    </CarouselStage>
  </CarouselCard>
);

export const Card01Hook = Interactive.create({
  Component: Card01HookInner,
  layout: "absolute-fill",
  schema: {
    chatDim: { type: "number", default: 0.42, min: 0, max: 1, step: 0.01, description: "Chat dim", hiddenFromList: false },
  },
});

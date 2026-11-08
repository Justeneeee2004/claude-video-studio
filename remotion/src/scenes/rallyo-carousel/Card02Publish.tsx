import type React from "react";
import { Interactive } from "remotion";
import { RoughUnderline } from "../../elements/Annotate";
import { ChatScreen } from "../../elements/ChatScreen";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { ScreenImage } from "../../elements/ScreenMedia";
import { CarouselStage } from "../../elements/carousel/CarouselStage";
import { textWidthSu, usePostLayout, usePostText, type PostLine } from "../../lib/post-layout";
import { RALLYO_COLORS } from "../../theme/rallyo";
import { CAROUSEL_DEFAULTS } from "./carousel-copy";
import { CAROUSEL_RAIL_COLOR, CarouselCard, type CarouselCardProps } from "./CarouselCard";

/**
 * Card 2 · Publish + share (carousel spec v2, section 5, card 2): "One form. One post."
 * Pill FOR HOSTS, dots 1–2, rail in from x 0 and out to x 1080. Glow (800, 700) r 600 a .07. Stage clipTop 440.
 * Back phone (the form): screen x 84, y 750, w 360 (k .3077), rotate −6°: new-event-sheet-safe.png, the top 2532
 *   rows. v2 (craft m1, accuracy 5c): the phone sits 160 px lower than v1, so only `NEW EVENT`, the
 *   `Open play │ Tournament │ Court share` tabs, Name, Venue and the top of the One day toggle are in frame; the
 *   Date / Start rows (su ≥ 1181, the sample date `Mon, Oct 26, 2026`) are below the canvas on every column.
 * Front phone (the post): screen x 408, y 540 − 1000k (k .51282), w 600; its right bezel ends at x 1019.7. The calm
 *   generic chat (built, as the reel's S4; only the post text is Rallyo's real output, capture R1 verbatim from
 *   rallyo/data/rookie-cup-post.txt): history = the hook messages at ≤ 0, at full strength in v2 (v1's 35% read as a
 *   render artifact; the visible one is Jun's `+1`, a canonical S1 pair, so the sample host's first name "Migs" is no
 *   longer on a bubble), the host's post at the anchor (su 1740 → bubble su x 288–1110, y 1044–1740 → canvas
 *   x 555.7–977.2, y 562.6–919.5), link shown as `https://rallyo.ph/events/…`. The venue is redacted exactly as S4
 *   draft v3 (residual 3 su blur under a lime-tint cover + a soft rounded ink bar at 12%).
 * Callouts (v2, craft m1 / m6): two night-ink RoughUnderlines on the post, When = line 2 and How much = line 6,
 *   6 px (11.7 su), padding 6 px, iterations 1, seeds 21 / 22, fully drawn on the still (at −30). v1's third
 *   underline (`14 teams in`, line 7) sat right under line 6 and the pair read as a rule.
 */

const D = CAROUSEL_DEFAULTS;

const FRONT_W = 600;
const FRONT_K = FRONT_W / 1170;
/** The post bubble's top (su 1000 in the spec's derivation) lands on canvas y 540. */
const FRONT_Y = 540 - 1000 * FRONT_K;
const ANCHOR_SU = 1740;
/** Glyph box below a row's top (su): the underline sits just under the descenders (S4 UNDERLINE_DROP). */
const UNDERLINE_DROP = 57;
/** Venue cover margins / residual blur (su), as S4 draft v3. */
const VENUE_MARGIN = 10;
const VENUE_BLUR = 3;

/** Post rows per source line (CRLF → LF, trailing newlines dropped), as ShareScene's rowsBySourceLine. */
const rowsBySourceLine = (lines: readonly PostLine[], text: string): PostLine[][] => {
  const source = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  const groups: PostLine[][] = [];
  let r = 0;
  for (const src of source) {
    const g: PostLine[] = [];
    if (r < lines.length && lines[r].link) {
      while (r < lines.length && lines[r].link) {
        g.push(lines[r++]);
      }
    } else if (r < lines.length) {
      let acc = -1;
      do {
        const row = lines[r++];
        g.push(row);
        acc += row.text.length + 1;
      } while (r < lines.length && !lines[r].link && acc < src.length);
    }
    groups.push(g);
  }
  return groups;
};

const Card02PublishInner: React.FC<CarouselCardProps<"publish">> = ({
  copy = D.cards.publish,
  screens = D.screens,
  colors = D.colors,
  grain = D.grain,
  markSrc = D.brand.markSrc,
  wordmark = D.brand.name,
}) => {
  const post = usePostLayout({
    text: "",
    src: copy.postSrc,
    blurVenue: copy.blurVenue,
    linkDisplay: copy.linkDisplay,
    bottomSu: ANCHOR_SU,
  });
  // The verbatim source text (cached by usePostLayout's own fetch), to group the wrapped rows by source line.
  const text = usePostText("", copy.postSrc);
  const groups = rowsBySourceLine(post.lines, text);
  const rowsOf = (i: number): PostLine[] => groups[i] ?? [];
  const stroke = 6 / FRONT_K;

  const underline = (rows: readonly PostLine[], seed: number, key: string) =>
    rows.map((l, j) => (
      <RoughUnderline
        key={`${key}-${j}`}
        name={`Underline ${key}${rows.length > 1 ? ` ${j + 1}` : ""}`}
        rect={{ x: l.x, y: l.y, w: l.w, h: UNDERLINE_DROP }}
        at={-30}
        tone="ink"
        strokeWidth={stroke}
        padding={stroke}
        iterations={1}
        seed={seed + j}
      />
    ));

  const venueRow = copy.blurVenue ? post.lines.find((l) => l.blur !== null) : undefined;
  const venueX = venueRow && venueRow.blur ? venueRow.x + textWidthSu(venueRow.text.slice(0, venueRow.blur[0]), 48, 500) : 0;
  const venueW = venueRow && venueRow.blur ? textWidthSu(venueRow.text.slice(venueRow.blur[0], venueRow.blur[1]), 48, 500) : 0;

  return (
    <CarouselCard
      name="Card 2 shell"
      cardIndex={2}
      railLabel={copy.railLabel}
      markSrc={markSrc}
      wordmark={wordmark}
      leadIn
      leadOut
      headline={copy.headline}
      support={copy.support}
      supportAccent={copy.supportAccent}
      glowX={800}
      glowY={700}
      glowR={600}
      glowA={0.07}
      grain={grain}
      colors={colors}
    >
      <CarouselStage name="Stage" clipTop={440} topFade={24} scrimTop={1080} scrimBottom={1200} color={colors.night}>
        <PhoneFrame name="Form phone" screenX={84} screenY={750} screenW={360} frameColor={CAROUSEL_RAIL_COLOR} style={{ rotate: "-6deg" }}>
          <ScreenImage name="New event sheet" src={screens.newEventSheet} sourceW={1170} sourceH={6573} boxH={2532} cropY={0} />
        </PhoneFrame>
        <PhoneFrame name="Chat phone" screenX={408} screenY={FRONT_Y} screenW={FRONT_W} frameColor={CAROUSEL_RAIL_COLOR}>
          <ChatScreen
            name="Group chat"
            messages={copy.history}
            anchorSu={ANCHOR_SU}
            keyboard={false}
            state="calm"
            title={copy.chatTitle}
            members={copy.chatMembers}
            historyLevel={1}
            smear={false}
            venueBlur={VENUE_BLUR}
            colors={{ ...RALLYO_COLORS, ...colors }}
            outgoing={{ at: -30, text: "", src: copy.postSrc, blurVenue: copy.blurVenue, linkDisplay: copy.linkDisplay }}
            postOverlay={
              <>
                {venueRow && venueW > 0 ? (
                  <>
                    <Interactive.Div
                      name="Venue cover"
                      style={{
                        position: "absolute",
                        left: venueX - VENUE_MARGIN,
                        top: venueRow.y - 3,
                        width: venueW + 2 * VENUE_MARGIN,
                        height: venueRow.h + 11,
                        backgroundColor: colors.limeTint,
                      }}
                    />
                    <Interactive.Div
                      name="Venue bar"
                      style={{
                        position: "absolute",
                        left: venueX,
                        top: venueRow.y + 13,
                        width: venueW,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: RALLYO_COLORS.ink,
                        opacity: 0.12,
                        filter: "blur(2px)",
                      }}
                    />
                  </>
                ) : null}
                {underline(rowsOf(1), 21, "when")}
                {underline(rowsOf(5), 22, "how much")}
              </>
            }
          />
        </PhoneFrame>
      </CarouselStage>
    </CarouselCard>
  );
};

export const Card02Publish = Interactive.create({
  Component: Card02PublishInner,
  layout: "absolute-fill",
  schema: {},
});

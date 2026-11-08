import type React from "react";
import { Easing, Img, Interactive, interpolate, interpolateColors, useCurrentFrame, type InteractivitySchema } from "remotion";
import { CameraRig, rectToTransform, sourceToCanvas, type Rect } from "../../elements/CameraRig";
import { RoughUnderline } from "../../elements/Annotate";
import { ChaosChip } from "../../elements/ChaosChip";
import { ChatScreen, type ChatMessage } from "../../elements/ChatScreen";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { TapRipple } from "../../elements/Pointer";
import { ScreenImage, ScreenSwipe } from "../../elements/ScreenMedia";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { EASE } from "../../lib/motion";
import { POST_SRC, textWidthSu, usePostLayout, usePostText, type PostLine } from "../../lib/post-layout";
import { displayText, RALLYO_COLORS, type RallyoColors } from "../../theme/rallyo";

/**
 * S4 · Share "One post, answers all" (abs 345–480, 135 f). Brief v2.2 section 6 S4, contract section 13, log round 3
 * (chip `When? How much? Who's in?`). Local frame = abs − 345.
 *   0–15    zoomThrough arrival (S4 fades in 9–12 from the night shape, scale 1.25 → 1, at rest by 14).
 *           host-event-rookie-cup.png, camera 0 (k .80, push 1.30): source x 86–1084, y 1077–1727 → frame x 92–890,
 *           y 566–1086, so the three buttons fill the readable width (labels ≈ 37 px) and the "Feature on Tonight's
 *           Board" card, border included, stays behind the stage clip: lime `Tournament console →` y 600–705,
 *           `Share` 739–849, `Copy link only` 868–974.
 *           The paper SESSION SETTINGS sheet below (source y ≥ 1698 → frame ≥ 1063) is shown out of focus under a
 *           night veil inside the screen, so the phone runs down the stage (Stage scrim at the default 1290 / 1590)
 *           and the sheet never reads as text.
 *   9–19    chip slides in (landed 364) after the night shape covered the S3 chip.
 *   12–33   1.5% camera drift about the Share centre (the hold before the tap never freezes).
 *   24 / 30 finger dot / TapRipple on Share, the fingertip just under-right of the label (513, 822; the label centre
 *           is source 585, 1362 → frame 491, 794), so `Share` stays readable (craft #7); press .97 30–33–36 (the
 *           real button pixels, scaled). Draft v3: the dot and ring fade out over 33–36 (gone by abs 381), before
 *           the ScreenSwipe carries the screen away under them.
 *   28–43   headline words (K1) 28, 30, 32, 34 → landed 43 (abs 388).
 *   33–45   ScreenSwipe from-right (smear) to the calm ChatScreen; no share sheet, no "Copied" toast. Camera 33–51 to
 *           the post bubble itself, centred on x 471 inside y 598–1146 (k ≈ .79, post text ≈ 38 px); draft v3:
 *           EASE.out, so the framing has ≈ landed when the post pops at 45 (the anchor change makes this move pan up
 *           ≈ 315 px; with EASE.inOut the new bubble slid up through rail 01 over 45–49).
 *           Draft v3 (craft #12, accuracy #7): the chat is two layers.
 *           - History layer: the hook's earlier bubbles (35%) with their own anchor, which scrolls up by the post's
 *             height + gap over 36–45, so the old bubbles have left the post's slot when it pops: no frame shows the
 *             post over `Where's the bracket?` (draft v2: 389–391). Draft v4 (v3 craft #10, accuracy #10): EASE.in
 *             (was EASE.inOut, which had the history out of view by 43, leaving the chat empty on abs 388–389): the
 *             old bubbles now accelerate up through the slot and clear it on 45, the post's pop frame, so the chat
 *             reads as pushed up by the arriving post and is never empty (the sendPop cue stays on abs 390).
 *           - Post layer (transparent, clipped to the message area so the header / composer are not drawn twice):
 *             the host's post pops at 45 at the anchor.
 *           The anchor is su 2196 (draft v2: 1740), so the chat's composer bar sits right under rail 01
 *           (frame ≈ 1274–1368) and the phone's home bar and bezel run to ≈ 1500 under the soft lower fade: the
 *           lower stage reads as the phone, not as an empty chat. Rail 01 (tray 1160–1246) sits on the plain chat
 *           background between the bubble (ends 1146) and the composer.
 *   45      the post pops (lime-tint, 9 lines of rookie-cup-post.txt verbatim; URL shown as linkDisplay). The venue
 *           (line 3 before " · ") is redacted as a soft rounded ink bar at 12% on a lime-tint cover (draft v3,
 *           craft #12: was a 12 su blur that read as a smudge); the cover tracks the bubble's pop exactly (same
 *           scale curve about its bottom-right corner, colour = the bubble's own fade-in composite).
 *   60 / 75 / 90  night-ink RoughUnderlines (6 px, 9 f) under post line 2 (When), line 6 (How much), line 7
 *           `14 teams in` (Who's in).  93 chip strike + ✓.
 *   57–135  2% hold drift about the URL line's centre (no camera move), continuing under the slide.
 *   105–114 night-ink underline sweep under the URL (full framing, no link push).
 *   120–135 T4 slide from-right.
 *
 * Draft v3 deviation from craft #13's S4 numbers (post ×1.3, x 120–950, y 600–1300): at that size the `Join here:` and
 * URL rows land on y 1135–1260, under rail 01 (pill x 72–496, y 1170–1236), and x 950 leaves the safe box (≤ 918).
 * The post keeps the largest size that ends 14 px above the rail's tray (k .79, was .77); the lower stage is filled
 * by the chat's own composer and the phone's bottom instead.
 */

type ShareSceneProps = {
  readonly chipSender?: string;
  readonly chipText?: string;
  readonly headline1?: string;
  readonly headline2?: string;
  readonly rookieCupSrc?: string;
  readonly chatTitle?: string;
  readonly chatMembers?: string;
  /** Earlier hook bubbles shown compressed at the top in the calm state. */
  readonly history?: readonly ChatMessage[];
  /** Verbatim capture R1 text (props.share.postText); "" reads rallyo/data/rookie-cup-post.txt. */
  readonly postText?: string;
  readonly blurVenue?: boolean;
  readonly linkDisplay?: string;
  readonly colors?: RallyoColors;
};

const SCREEN = phonePlacement();

/** Measured source px (host-event-rookie-cup.png). */
const SHARE_BUTTON = { x: 99, y: 1293, w: 972, h: 138 };
/**
 * Camera 0 (v2 fix, k .80, push 1.30): the button column (source x 86–1084, buttons 99–1071) fills the readable width
 * x 92–890, so the labels read about 37 px tall. Measured: the "Feature on Tonight's Board" card's bottom border
 * (source y 1074–1077) lands at frame ≤ 566, behind the clip and its top fade; `Tournament console →` (1119–1251) →
 * frame y 600–705; Share (1293–1431) → 739–849, its centre (585, 1362) → (491, 794); Copy link only (1455–1587) →
 * 868–974; the host card's bottom border (1656) → 1029. The card's own lime side borders (x 30–33 / 1137–1140) sit in
 * the side fades (x ≈ 47 / 935).
 */
const CAMERA_0 = { sourceRect: { x: 86, y: 1077, w: 998, h: 650 }, frameRect: { x: 92, y: 566, w: 798, h: 520 } };
const SHARE_CENTRE = { x: 585, y: 1362 };
/**
 * The paper SESSION SETTINGS sheet under the host card (source y ≥ 1698, plus the lime tab peeking at 1680–1698) is
 * shown out of focus (16 su blur) under a night veil (80%) inside the screen, so the device can run to the bottom of
 * the stage (director note a) while the sheet reads as a dark card in depth, never as legible text (draft-v1
 * defect 11; v1 used a canvas scrim from y 1000 that left it about 70% dim and partly legible).
 */
const SHEET_VEIL_TOP = 1664;

/**
 * Readable window for the post bubble (canvas px). Draft v3: the bubble ends at y 1146, 14 px above rail 01's tray
 * (1160–1246), and is centred on x 471 (was 491), so the chat composer's + icon (su 36–100) sits fully off the left
 * canvas edge instead of half-clipped in the side fade. Fitting the bubble itself gives k ≈ .787: post text ≈ 38 px
 * (draft v2: k .77, 37 px; v1: k .652, 31 px).
 */
const WINDOW = { x: 72, y: 598, w: 798, h: 548 };

/**
 * Newest-bubble anchor in the calm chat (su, draft v3: was 1740). The post bubble's bottom sits here, so the composer
 * (su 2356–2476) lands 146 su under it: with the bubble ending at frame 1146, the composer reads at ≈ 1274–1368 and
 * the phone's home bar / bezel at ≈ 1460–1500.
 */
const ANCHOR_SU = 2196;
/** ChatScreen gap between bubbles of different senders (CHAT_BUBBLE.gap). */
const BUBBLE_GAP = 18;
/** Calm chat message area (su): below the header (240), above the composer (2356). */
const MESSAGE_TOP = 240;
const MESSAGE_BOTTOM = 2356;
/**
 * Venue cover margins (su): the venue row's box, 10 su wider than the venue text, 3 su higher (ascender blur) and 8 su
 * deeper (the `p` descender's blur), still clear of the comma above and the capitals below.
 */
const VENUE_MARGIN = 10;
/** Residual ChatScreen blur under the cover (su): small, so no halo leaks past the cover's row box. */
const VENUE_BLUR = 3;

/** Glyph box below a row's top (su) used as the underline rect height: the line sits just under the baseline. */
const UNDERLINE_DROP = 57;

/** Post rows per source line (same split as postLayout(): CRLF → LF, trailing newlines dropped). */
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

const ShareSceneInner: React.FC<ShareSceneProps> = ({
  chipSender = "JU",
  chipText = "When? How much? Who's in?",
  headline1 = "ONE POST,",
  headline2 = "ANSWERS ALL.",
  rookieCupSrc = "rallyo/screens/mobile/host-event-rookie-cup.png",
  chatTitle = "Thursday Open Play",
  chatMembers = "47 members",
  history = [],
  postText = "",
  blurVenue = true,
  linkDisplay = "https://rallyo.ph/events/…",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  // The same text and options ChatScreen lays out, so the camera and the underlines sit on its bubble. Every hook gets
  // the constant `postText` prop: usePostText() leaks its delayRender if its `text` argument changes mid-fetch.
  const text = usePostText(postText, POST_SRC);
  const post = usePostLayout({ text: postText, blurVenue, linkDisplay, bottomSu: ANCHOR_SU });

  // Opening framing + a 1.5% hold drift about the Share button (12–33), so the arrival hold never freezes and the
  // tap point stays put (the drift is a camera move, so the post framing below is still hit exactly at 51).
  const t0 = rectToTransform(CAMERA_0.sourceRect, CAMERA_0.frameRect, SCREEN);
  const tap = sourceToCanvas(SHARE_CENTRE, SCREEN, t0);
  const drift0 = 1.015;
  const t0Drift = {
    scale: t0.scale * drift0,
    translateX: tap.x * (1 - drift0) + drift0 * t0.translateX,
    translateY: tap.y * (1 - drift0) + drift0 * t0.translateY,
  };

  // Post framing: the bubble itself, as large as the window allows, centred on x 491 (v1 centred the phone, which
  // left the bubble small in the top-right half: draft-v1 defect 12).
  const bubble = post.bubble;
  const kPost = Math.min(WINDOW.w / bubble.w, WINDOW.h / bubble.h);
  const fw = bubble.w * kPost;
  const fh = bubble.h * kPost;
  const postFrame: Rect = { x: WINDOW.x + (WINDOW.w - fw) / 2, y: WINDOW.y + (WINDOW.h - fh) / 2, w: fw, h: fh };
  const stroke = 6 / kPost;

  // Underline targets: source lines 2 / 6 / 7 (When / How much / Who's in) and the URL inside the link rows.
  const groups = rowsBySourceLine(post.lines, text);
  const rowsOf = (i: number): PostLine[] => groups[i] ?? [];
  const linkRows = post.lines.filter((l) => l.link);
  const urlKey = linkDisplay.slice(0, 8) || "https://";
  const urlRow = linkRows.find((l) => l.text.includes(urlKey)) ?? linkRows[linkRows.length - 1];
  const urlCut = urlRow ? Math.max(0, urlRow.text.indexOf(urlKey)) : 0;
  const urlOffset = urlRow && urlCut > 0 ? textWidthSu(urlRow.text.slice(0, urlCut), 48, 700) : 0;
  const urlRect: Rect | null = urlRow ? { x: urlRow.x + urlOffset, y: urlRow.y, w: urlRow.w - urlOffset, h: UNDERLINE_DROP } : null;

  // Drift pivot = the URL line's centre on the canvas in the post framing.
  const tPost = rectToTransform(bubble, postFrame, SCREEN);
  const pivot = urlRect ? sourceToCanvas({ x: urlRect.x + urlRect.w / 2, y: urlRect.y + urlRect.h / 2 }, SCREEN, tPost) : { x: 491, y: 830 };

  const underline = (rows: readonly PostLine[], at: number, seed: number, key: string) =>
    rows.map((l, j) => (
      <RoughUnderline
        key={`${key}-${j}`}
        name={`Underline ${key}${rows.length > 1 ? ` ${j + 1}` : ""}`}
        rect={{ x: l.x, y: l.y, w: l.w, h: UNDERLINE_DROP }}
        at={at}
        frames={9}
        tone="ink"
        strokeWidth={stroke}
        padding={4}
        seed={seed + j}
      />
    ));

  // Venue redaction (draft v3, craft #12): the venue span of line 3 as a soft rounded ink bar on a lime-tint cover.
  const venueRow = blurVenue ? post.lines.find((l) => l.blur !== null) : undefined;
  const venueX = venueRow && venueRow.blur ? venueRow.x + textWidthSu(venueRow.text.slice(0, venueRow.blur[0]), 48, 500) : 0;
  const venueW = venueRow && venueRow.blur ? textWidthSu(venueRow.text.slice(venueRow.blur[0], venueRow.blur[1]), 48, 500) : 0;
  // The post bubble's pop (ChatScreen: scale .92 → 1 over 12 f, EASE.pop, about its bottom-right corner; opacity
  // .5 → 1 over 3 f), replayed so the cover sits on the bubble at every frame.
  const postAt = 45;
  const popOpacity = interpolate(frame, [postAt, postAt + 3], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const coverColor = interpolateColors(popOpacity, [0, 1], [colors.nightCard, colors.limeTint]);

  const pressing = frame >= 30 && frame <= 36;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <Stage
        name="Stage"
        clipTop={570}
        scrimTop={1290}
        scrimBottom={1590}
        color={colors.night}
      >
        {/* 2% hold drift about the URL line from 6 f after the camera lands (57 → 120), continuing linearly under the
            slide, so the post never freezes while it is read (draft-v1 defect 17). */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${pivot.x}px ${pivot.y}px`,
            scale: interpolate(frame, [57, 120], [1, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "extend" }),
          }}
        >
          <CameraRig
            name="Camera"
            screen={SCREEN}
            moves={[
              { start: 0, end: 0, ...CAMERA_0 },
              { start: 12, end: 33, transform: t0Drift, ease: "linear" },
              // EASE.out (draft v3): the framing is all but landed when the post pops at 45 (≈ 98%), so the bubble pops
              // into place above rail 01 instead of sliding up through it while the camera still pans.
              { start: 33, end: 51, sourceRect: bubble, frameRect: postFrame, ease: "out" },
            ]}
          >
            <PhoneFrame name="Phone" screenX={131} screenY={600} screenW={720}>
              <ScreenSwipe
                name="Share to chat"
                at={33}
                frames={12}
                direction="from-right"
                smear
                before={
                  <>
                    <ScreenImage name="Rookie Cup host sheet" src={rookieCupSrc} />
                    {/* The sheet behind: the same pixels out of focus (16 su) under a night veil, so it reads as a
                        dark card in depth and its text is never legible. */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: SHEET_VEIL_TOP,
                        width: 1170,
                        height: 2532 - SHEET_VEIL_TOP,
                        overflow: "hidden",
                      }}
                    >
                      <Img
                        name="Session sheet (out of focus)"
                        src={asset(rookieCupSrc)}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: -SHEET_VEIL_TOP,
                          width: 1170,
                          height: 2532,
                          maxWidth: "none",
                          filter: "blur(16px)",
                        }}
                      />
                      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.8 }} />
                    </div>
                    {pressing ? (
                      <>
                        {/* Press .97: the real Share button pixels, scaled about their centre over the card colour. */}
                        <div
                          style={{
                            position: "absolute",
                            left: SHARE_BUTTON.x - 2,
                            top: SHARE_BUTTON.y - 2,
                            width: SHARE_BUTTON.w + 4,
                            height: SHARE_BUTTON.h + 4,
                            backgroundColor: colors.nightCard,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: SHARE_BUTTON.x - 2,
                            top: SHARE_BUTTON.y - 2,
                            width: SHARE_BUTTON.w + 4,
                            height: SHARE_BUTTON.h + 4,
                            overflow: "hidden",
                            scale: interpolate(frame, [30, 33, 36], [1, 0.97, 1], {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                              easing: Easing.bezier(0.16, 1, 0.3, 1),
                              output: "perceptual-scale",
                            }),
                          }}
                        >
                          <Img
                            name="Share button (press)"
                            src={asset(rookieCupSrc)}
                            style={{
                              position: "absolute",
                              left: -(SHARE_BUTTON.x - 2),
                              top: -(SHARE_BUTTON.y - 2),
                              width: 1170,
                              height: 2532,
                              maxWidth: "none",
                            }}
                          />
                        </div>
                      </>
                    ) : null}
                  </>
                }
                after={
                  <>
                    {/* History layer: the hook's earlier bubbles; their anchor scrolls up by the post's height + gap
                        over 36–45 (EASE.in, inside the swipe), clearing the post's slot on 45, when it pops. */}
                    <ChatScreen
                      name="Group chat (history)"
                      messages={history}
                      anchorSu={interpolate(frame, [36, 45], [ANCHOR_SU, ANCHOR_SU - post.bubble.h - BUBBLE_GAP], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.7, 0, 0.84, 0),
                      })}
                      keyboard={false}
                      state="calm"
                      title={chatTitle}
                      members={chatMembers}
                      historyLevel={0.35}
                    />
                    {/* Post layer: transparent, clipped to the message area (the history layer draws the header,
                        composer and home bar once). */}
                    <Interactive.Div
                      name="Post layer clip"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 1170,
                        height: 2532,
                        clipPath: `inset(${MESSAGE_TOP}px 0px ${2532 - MESSAGE_BOTTOM}px 0px)`,
                      }}
                    >
                      <ChatScreen
                        name="Group chat (post)"
                        messages={[]}
                        anchorSu={ANCHOR_SU}
                        keyboard={false}
                        state="calm"
                        title={chatTitle}
                        members={chatMembers}
                        bgColor="transparent"
                        venueBlur={VENUE_BLUR}
                        outgoing={{ at: postAt, text: postText, blurVenue, linkDisplay }}
                        postOverlay={
                          <>
                            {venueRow && venueW > 0 && frame >= postAt ? (
                              <Interactive.Div
                                name="Venue redaction"
                                style={{
                                  position: "absolute",
                                  left: post.bubble.x,
                                  top: post.bubble.y,
                                  width: post.bubble.w,
                                  height: post.bubble.h,
                                  transformOrigin: "100% 100%",
                                  scale: interpolate(frame, [postAt, postAt + 12], [0.92, 1], {
                                    extrapolateLeft: "clamp",
                                    extrapolateRight: "clamp",
                                    easing: EASE.pop,
                                    output: "perceptual-scale",
                                  }),
                                }}
                              >
                                <Interactive.Div
                                  name="Venue cover"
                                  style={{
                                    position: "absolute",
                                    left: venueX - VENUE_MARGIN - post.bubble.x,
                                    top: venueRow.y - post.bubble.y - 3,
                                    width: venueW + 2 * VENUE_MARGIN,
                                    height: venueRow.h + 11,
                                    backgroundColor: coverColor,
                                  }}
                                />
                                <Interactive.Div
                                  name="Venue bar"
                                  style={{
                                    position: "absolute",
                                    left: venueX - post.bubble.x,
                                    top: venueRow.y - post.bubble.y + 13,
                                    width: venueW,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: colors.ink,
                                    opacity: 0.12 * popOpacity,
                                    filter: "blur(2px)",
                                  }}
                                />
                              </Interactive.Div>
                            ) : null}
                            {underline(rowsOf(1), 60, 11, "when")}
                            {underline(rowsOf(5), 75, 21, "how much")}
                            {underline(rowsOf(6), 90, 31, "who's in")}
                            {urlRect ? (
                              <RoughUnderline
                                name="Underline URL"
                                rect={urlRect}
                                at={105}
                                frames={9}
                                tone="ink"
                                strokeWidth={stroke}
                                padding={4}
                                seed={41}
                              />
                            ) : null}
                          </>
                        }
                      />
                    </Interactive.Div>
                  </>
                }
              />
            </PhoneFrame>
          </CameraRig>
        </div>
        {/* Share centre (585, 1362) under camera 0 = (491, 794); the 12–33 drift is about this point. The fingertip
            sits just under-right of the label (craft #7) and the dot + ring fade out over 33–36, before the swipe
            carries the screen away (gone by abs 381). */}
        <TapRipple
          name="Tap Share"
          x={513}
          y={822}
          at={30}
          dotLead={6}
          style={{ opacity: interpolate(frame, [33, 36], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
      </Stage>
      <ChaosChip name="Chip" sender={chipSender} text={chipText} enterAt={9} strikeAt={93} />
      <KineticText
        name="Headline line 1"
        from={28}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 376 }}
      />
      <KineticText
        name="Headline line 2"
        from={32}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 457 }}
      />
    </>
  );
};

const shareSceneSchema = {
  chipSender: { type: "string", default: "JU", description: "Chip initials" },
  chipText: { type: "string", default: "When? How much? Who's in?", description: "Chip message (quotes a hook bubble)" },
  headline1: { type: "string", default: "ONE POST,", description: "Headline line 1" },
  headline2: { type: "string", default: "ANSWERS ALL.", description: "Headline line 2 (lime)" },
  rookieCupSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/host-event-rookie-cup.png", description: "Host sheet" },
  blurVenue: { type: "boolean", default: true, description: "Blur venue" },
} as const satisfies InteractivitySchema;

export const ShareScene = Interactive.create({
  Component: ShareSceneInner,
  layout: "absolute-fill",
  schema: shareSceneSchema,
});

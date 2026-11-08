import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { SFX_SOUNDS } from "../lib/rallyo-timeline";

/**
 * Props for RallyoPrelaunch v2.3 (brief rallyo-prelaunch.md section 9, owner decision log rounds 3 + 4; the
 * players chapter strings and screens come from briefs/rallyo-players-chapter.md sections 2 and 10).
 * One file per render: briefs/rallyo-prelaunch.props.json (showGuides false) and .guides.props.json (true).
 * Every on-screen English string lives here (brief section 2 copy table, character for character);
 * scenes never hard-code copy. Visual-only: there is no voice, no caption and no variant field.
 * Rules: chat messages use `sender`, never `from`; no prop is named from / to / durationInFrames /
 * name / style / width / height. Paths are public/-relative (staticFile).
 */

export const rallyoColorsSchema = z.object({
  night: zColor(),
  nightCard: zColor(),
  nightRaised: zColor(),
  court: zColor(),
  lime: zColor(),
  limeHover: zColor(),
  limeTint: zColor(),
  paper: zColor(),
  ink: zColor(),
  fg: zColor(),
  fg2: zColor(),
  dangerSoft: zColor(),
  graphite: zColor(),
  graphiteBubble: zColor(),
  senderGrey: zColor(),
  oliveInk: zColor(),
});

/** Initials + a hook bubble quoted exactly, e.g. { sender: "JU", text: "When? How much? Who's in?" }. */
export const chipSchema = z.object({
  sender: z.string().min(1).max(3),
  text: z.string().min(1),
});

/**
 * Two parts, the second in lime. Archivo 900 italic uppercase, stretch 70%.
 * Slot headlines set them as two lines; one-line heroes (S2 `RELAX,` + `HOST.`, S10d `YOU'RE` + `UP!`)
 * set them on one line with line2 in lime.
 */
export const headlineSchema = z.object({
  line1: z.string(),
  line2: z.string(),
});

export const chatMessageSchema = z.object({
  /** Local frame (S1) the bubble pops; 0 = visible at f0. Multiple of 3. */
  at: z.number().int().min(0),
  /** Initials. */
  sender: z.string().min(1).max(3),
  text: z.string().min(1),
});

/** Chapter card + rail copy: `01` / `FOR HOSTS` → rail `01 · HOSTS`. */
export const chapterSchema = z.object({
  num: z.string().min(1),
  label: z.string().min(1),
  railLabel: z.string().min(1),
});

/** A rect in source px of a served capture (UiTile crop). */
export const cropRectSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

const sfxShape = SFX_SOUNDS.reduce(
  (acc, sound) => {
    acc[sound] = z.string();
    return acc;
  },
  {} as Record<(typeof SFX_SOUNDS)[number], z.ZodString>,
);

export const rallyoSchema = z.object({
  colors: rallyoColorsSchema,
  brand: z.object({
    name: z.string(),
    url: z.string(),
    /** rallyo-logo.png (stacked R mark + wordmark), S12. */
    logoSrc: z.string(),
    /** rallyo-mark.png, S2 lockup. */
    markSrc: z.string(),
  }),
  /** [0] = CH01 hosts, [1] = CH02 players. */
  chapters: z.tuple([chapterSchema, chapterSchema]),
  hook: z.object({
    /** line2 is struck in lime at f105 and set in danger-soft. */
    headline: headlineSchema.extend({
      /** Both lines one size: 90 px fixed in v2.2 (ChatChaosScene clamp 88-100). */
      size: z.number().int().min(88).max(100),
    }),
    chatTitle: z.string(),
    chatMembers: z.string(),
    /** S1 table: English bubbles; every chip quotes one exactly. */
    messages: z.array(chatMessageSchema).min(3),
  }),
  reveal: z.object({
    /** One line: `RELAX,` (fg) + `HOST.` (lime), 96 px. */
    headline: headlineSchema,
    wordmark: z.string(),
    /** `PRE-LAUNCH` kicker pill (true while rallyo.ph is live and free; open item b). */
    badge: z.string(),
  }),
  publish: z.object({ chip: chipSchema, headline: headlineSchema }),
  share: z.object({
    chip: chipSchema,
    headline: headlineSchema,
    /** Capture R1 file (verbatim eventSharePost() text). */
    postSrc: z.string(),
    /** Filled by calculateMetadata from postSrc when empty. Never hand-typed. */
    postText: z.string(),
    /** Open item i: blur the venue span (ChatScreen venueBlur 12 su). */
    blurVenue: z.boolean(),
    /** What the bubble shows for the link (dev-DB id truncated). */
    linkDisplay: z.string(),
  }),
  approve: z.object({ chip: chipSchema, headline: headlineSchema }),
  checkIn: z.object({ chip: chipSchema, headline: headlineSchema }),
  /** No chip in S7: the support line is the accuracy guard. */
  upNext: z.object({ headline: headlineSchema, support: z.string() }),
  whoWon: z.object({ chip: chipSchema, headline: headlineSchema }),
  tournament: z.object({
    chip: chipSchema,
    /** h1 `TOURNAMENT?` / `AUTO-CALL ON.` */
    headline: headlineSchema,
    /** h2 `WINNERS` / `MOVE UP.` (swaps into the same slot at local 94). */
    headline2: headlineSchema,
  }),
  /** 02 FOR PLAYERS, four beats (round 4; players spec section 2). Slot B headlines (88 px), supports 48 px. */
  players: z.object({
    /** S10a h1 `FIND A` / `GAME.` (slot B). */
    headline: headlineSchema,
    /** S10b `JOIN,` / `PAY THE HOST.` + support `GCash or cash.` */
    join: z.object({ headline: headlineSchema, support: z.string() }),
    /** S10c `NO APP.` / `NO PASSWORD.` + support `Player ID in about 20 seconds.` */
    id: z.object({ headline: headlineSchema, support: z.string() }),
    /** S10d one line: `YOU'RE` (fg) + `UP!` (lime), 104 px. */
    headline2: headlineSchema,
    /** S10d `SEE WHERE` / `YOU RANK.` + support `Rallyo ratings only.` */
    rank: z.object({ headline: headlineSchema, support: z.string() }),
    /** S10d closing line `FREE FOR` / `PLAYERS.` (log round 4: players never pay Rallyo). */
    closing: headlineSchema,
    /** S10a: drawn in frame (ODbL attribution) while the maps show; the real strip is in soft focus. */
    osmCredit: z.string(),
  }),
  offer: z.object({
    badge: z.string(),
    /** `FREE`, 180 px lime. */
    hero: z.string(),
    /** `DURING PRE-LAUNCH.`, 92 px fixed. */
    heroSub: z.string(),
    /** Support on 2 lines at 48 px (one line would end at x 962). */
    supportLines: z.tuple([z.string(), z.string()]),
  }),
  cta: z.object({
    /** `USE RALLYO` / `WHILE IT'S FREE.` centred on x 491, 96 px. */
    headline: headlineSchema,
    /** `rallyo.ph`, 160 px wordmark, held 5.0 s. */
    url: z.string(),
    support: z.string(),
  }),
  /** Brief section 8 asset manifest, public/-relative. */
  screens: z.object({
    desktopHome: z.string(),
    mobileHome: z.string(),
    /** S3 + S11 fan: new-event sheet with the queue hint painted out (1170x6573, ScrollShot). */
    newEventSheet: z.string(),
    /** S4 host event page. */
    rookieCup: z.string(),
    /** S5 requests row (night fill from original y 594). */
    rookieCupRequests: z.string(),
    /** S5 payment sheet (rows 0-1835 night). */
    requestPayment: z.string(),
    /** S6 + S11 fan: host check-in. */
    hostCheckin: z.string(),
    /** S7 laptop courts board. */
    openPlayCourts: z.string(),
    /** S7 phone up-next bar. */
    playerUpNext: z.string(),
    /** S8 stepped recording (Freeze f0 / f40 / f90). */
    whoWonClip: z.string(),
    /** S8 + S11 fan. */
    podium: z.string(),
    tournamentConsole: z.string(),
    bracket: z.string(),
    /** v2.2 S10 event map (round 4: unused; the file stays). */
    map: z.string(),
    /** S6 tile (`CHECK-IN 7314`, email masked). */
    playerCard: z.string(),
    /** S11 fan: "On Court 2 now" card. */
    playerLive: z.string(),
    /** S11 fan. */
    hostUpNext: z.string(),
    /** S10a event map, two T pins (1170x1320). */
    findMap: z.string(),
    /** S10a map preview card, City Open Singles, venue blurred (1170x1320). */
    findMapPreview: z.string(),
    /** S10b full read-only request sheet (1170x4836; venue blurred twice; never sent). */
    joinRequestSheet: z.string(),
    /** S10b view-only GCash receipt `Confirmed by host` (1170x1200). */
    payGcashReceipt: z.string(),
    /** S10c Player ID chooser (1170x912, "Takes about 20 seconds."). */
    idChooser: z.string(),
    /** S10c `/account/player/new` sheet, nothing typed, email placeholder blurred (1170x2859). */
    idAlmostIn: z.string(),
    /** S10c Player ID card + the page under it (id-card-games.png, 1170x2609; email masked, hosts and prices blurred). */
    idCard: z.string(),
    /** S10d `On Court 2 now` live page (1170x1215). */
    liveOnCourt: z.string(),
    /** S10d site-wide Rallyo standings (1170x2325). */
    standings: z.string(),
    /** S10d results podium (1170x2532 after the round-4 re-serve; venue blurred). */
    resultsPodium: z.string(),
    /** S6 UiTile crop of playerCard (`CHECK-IN 7314`), source px. */
    codeTile: cropRectSchema,
  }),
  /** Open item g: two footer photos at low opacity, or none (night + lime orbs). */
  photos: z.object({
    enabled: z.boolean(),
    offer: z.string(),
    cta: z.string(),
  }),
  /** public/ path of the pre-rendered music #3 edit (round 4: rallyo-edit-62s.wav, 62.0 s; fades, drop-out 1545–1560,
   * seam and gain baked in). "" = no music. */
  musicSrc: z.string(),
  /** Always 1: the edit file carries the gain (-14.2 LUFS). */
  musicVolume: z.number().min(0).max(1),
  sfxEnabled: z.boolean(),
  /** public/ path per sound id; "" (or a missing file, detected by calculateMetadata) = skipped. */
  sfx: z.object(sfxShape),
  /** ReelsGuide overlay (QA stills only). */
  showGuides: z.boolean(),
  /** Set by calculateMetadata: served files that were missing (blanked so the render never 404s). Shown as a banner. */
  missingAssets: z.array(z.string()).optional(),
});

export type RallyoProps = z.infer<typeof rallyoSchema>;
export type RallyoChatMessage = z.infer<typeof chatMessageSchema>;
export type RallyoChip = z.infer<typeof chipSchema>;
export type RallyoHeadline = z.infer<typeof headlineSchema>;
export type RallyoChapter = z.infer<typeof chapterSchema>;
export type RallyoCropRect = z.infer<typeof cropRectSchema>;

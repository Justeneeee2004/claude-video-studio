import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import { ChapterRail } from "../layers/ChapterRail";
import { ChapterWipe } from "../layers/ChapterWipe";
import { ReelsGuide } from "../layers/ReelsGuide";
import { asset } from "../lib/assets";
import { countWords, OVERLAYS, SCENE, SCENES, SFX_CUES, superById, TOTAL_FRAMES, type SceneId } from "../lib/rallyo-timeline";
import { ApproveScene } from "../scenes/rallyo/ApproveScene";
import { ChatChaosScene } from "../scenes/rallyo/ChatChaosScene";
import { CheckInScene } from "../scenes/rallyo/CheckInScene";
import { OfferScene } from "../scenes/rallyo/OfferScene";
import { PlayersFindScene } from "../scenes/rallyo/PlayersFindScene";
import { PlayersIdScene } from "../scenes/rallyo/PlayersIdScene";
import { PlayersJoinScene } from "../scenes/rallyo/PlayersJoinScene";
import { PlayersLiveScene } from "../scenes/rallyo/PlayersLiveScene";
import { PublishScene } from "../scenes/rallyo/PublishScene";
import { RallyoCtaScene } from "../scenes/rallyo/RallyoCtaScene";
import { RevealScene } from "../scenes/rallyo/RevealScene";
import { ShareScene } from "../scenes/rallyo/ShareScene";
import { TournamentScene } from "../scenes/rallyo/TournamentScene";
import { UpNextScene } from "../scenes/rallyo/UpNextScene";
import { WhoWonScene } from "../scenes/rallyo/WhoWonScene";
import "../theme/rallyo";
import { cutTiming, presentationFor } from "../transitions";
import type { RallyoProps } from "./rallyo-schema";

/**
 * RallyoPrelaunch v2.3 (round 4, 62 s): 1080x1920 · 30 fps · exactly 1860 frames (brief rallyo-prelaunch.md, players
 * chapter spec rallyo-players-chapter.md, contract docs/rallyo-build-contract.md). Visual-only: music #3 (one
 * pre-rendered 62 s edit) + SFX, no voice, no captions.
 *
 * Layers, back to front:
 * 1. Night #0B130D fill under the series (no transition can dip toward black).
 * 2. TransitionSeries of the 15 scenes: 12 × 15 f transitions (presentationFor / cutTiming from src/transitions)
 *    and 2 hard cuts (S2 → S3 at 240, S9 → S10a at 1020) hidden under the chapter wipes. Frames 0–1020 are the
 *    approved v3 cut; S10a–d (1020–1560) are the four players beats; S11 / S12 run +360 (FREE 1560, end 1860).
 * 3. ChapterRail 01 / 02, then ChapterWipe 01 / 02 (top-level overlays: they never shorten the timeline).
 * 4. Missing-asset banner (only when calculateMetadata blanked a file), then ReelsGuide (showGuides).
 * Audio: one music <Audio> (rallyo-edit-62s.wav) from f0 at musicVolume (1), plus the SFX_CUES of the timeline
 * (125: round 4's 122 + the paired hook pops at 69 / 81 + the 1020 slam ding).
 */

// The JSX below hard-codes which cuts have a Transition element; fail loudly if the timeline disagrees.
const HARD_CUTS: readonly SceneId[] = ["reveal", "tournament"];
SCENES.forEach((s) => {
  const expectsElement = !HARD_CUTS.includes(s.id) && s.id !== "cta";
  if (expectsElement !== s.out.frames > 0) {
    throw new Error(`RallyoPrelaunch: the JSX expects ${s.id} → next to be ${expectsElement ? "a transition" : "a hard cut"}`);
  }
});

export const RallyoPrelaunch: React.FC<RallyoProps> = (p) => {
  const frame = useCurrentFrame();
  const c = p.colors;
  const historyForCalm = p.hook.messages.filter((m) => m.at <= 45);
  const [ch01, ch02] = p.chapters;
  const missing = p.missingAssets ?? [];

  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: c.night }} />

      <TransitionSeries name="Rallyo timeline">
        <TransitionSeries.Sequence name="S1 Hook" durationInFrames={SCENE.hook.frames}>
          <ChatChaosScene
            name="Hook scene"
            headline1={p.hook.headline.line1}
            headline2={p.hook.headline.line2}
            headlineSize={p.hook.headline.size}
            chatTitle={p.hook.chatTitle}
            chatMembers={p.hook.chatMembers}
            messages={p.hook.messages}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.hook.out)} timing={cutTiming(SCENE.hook.out)} />
        <TransitionSeries.Sequence name="S2 Brand drop" durationInFrames={SCENE.reveal.frames}>
          <RevealScene
            name="Reveal scene"
            headline1={p.reveal.headline.line1}
            headline2={p.reveal.headline.line2}
            wordmark={p.reveal.wordmark}
            badge={p.reveal.badge}
            markSrc={p.brand.markSrc}
            desktopHomeSrc={p.screens.desktopHome}
            mobileHomeSrc={p.screens.mobileHome}
            colors={c}
          />
        </TransitionSeries.Sequence>
        {/* S2 → S3: hard cut at 240 under ChapterWipe 01 full cover (no Transition element). */}
        <TransitionSeries.Sequence name="S3 01 · Publish" durationInFrames={SCENE.publish.frames}>
          <PublishScene
            name="Publish scene"
            chipSender={p.publish.chip.sender}
            chipText={p.publish.chip.text}
            headline1={p.publish.headline.line1}
            headline2={p.publish.headline.line2}
            sheetSrc={p.screens.newEventSheet}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.publish.out)} timing={cutTiming(SCENE.publish.out)} />
        <TransitionSeries.Sequence name="S4 Share" durationInFrames={SCENE.share.frames}>
          <ShareScene
            name="Share scene"
            chipSender={p.share.chip.sender}
            chipText={p.share.chip.text}
            headline1={p.share.headline.line1}
            headline2={p.share.headline.line2}
            rookieCupSrc={p.screens.rookieCup}
            chatTitle={p.hook.chatTitle}
            chatMembers={p.hook.chatMembers}
            history={historyForCalm}
            postText={p.share.postText}
            blurVenue={p.share.blurVenue}
            linkDisplay={p.share.linkDisplay}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.share.out)} timing={cutTiming(SCENE.share.out)} />
        <TransitionSeries.Sequence name="S5 Approve" durationInFrames={SCENE.approve.frames}>
          <ApproveScene
            name="Approve scene"
            chipSender={p.approve.chip.sender}
            chipText={p.approve.chip.text}
            headline1={p.approve.headline.line1}
            headline2={p.approve.headline.line2}
            requestsSrc={p.screens.rookieCupRequests}
            paymentSrc={p.screens.requestPayment}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.approve.out)} timing={cutTiming(SCENE.approve.out)} />
        <TransitionSeries.Sequence name="S6 Check-in" durationInFrames={SCENE.checkIn.frames}>
          <CheckInScene
            name="Check-in scene"
            chipSender={p.checkIn.chip.sender}
            chipText={p.checkIn.chip.text}
            headline1={p.checkIn.headline.line1}
            headline2={p.checkIn.headline.line2}
            checkinSrc={p.screens.hostCheckin}
            tileSrc={p.screens.playerCard}
            tileCrop={p.screens.codeTile}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.checkIn.out)} timing={cutTiming(SCENE.checkIn.out)} />
        <TransitionSeries.Sequence name="S7 Up next" durationInFrames={SCENE.upNext.frames}>
          <UpNextScene
            name="Up next scene"
            headline1={p.upNext.headline.line1}
            headline2={p.upNext.headline.line2}
            support={p.upNext.support}
            courtsSrc={p.screens.openPlayCourts}
            playerUpNextSrc={p.screens.playerUpNext}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.upNext.out)} timing={cutTiming(SCENE.upNext.out)} />
        <TransitionSeries.Sequence name="S8 Who won" durationInFrames={SCENE.whoWon.frames}>
          <WhoWonScene
            name="Who won scene"
            chipSender={p.whoWon.chip.sender}
            chipText={p.whoWon.chip.text}
            headline1={p.whoWon.headline.line1}
            headline2={p.whoWon.headline.line2}
            clipSrc={p.screens.whoWonClip}
            podiumSrc={p.screens.podium}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.whoWon.out)} timing={cutTiming(SCENE.whoWon.out)} />
        <TransitionSeries.Sequence name="S9 Tournament" durationInFrames={SCENE.tournament.frames}>
          <TournamentScene
            name="Tournament scene"
            chipSender={p.tournament.chip.sender}
            chipText={p.tournament.chip.text}
            headline1={p.tournament.headline.line1}
            headline2={p.tournament.headline.line2}
            secondLine1={p.tournament.headline2.line1}
            secondLine2={p.tournament.headline2.line2}
            consoleSrc={p.screens.tournamentConsole}
            bracketSrc={p.screens.bracket}
            colors={c}
          />
        </TransitionSeries.Sequence>
        {/* S9 → S10a: hard cut at 1020 under ChapterWipe 02 full cover (no Transition element). */}
        <TransitionSeries.Sequence name="S10a 02 · Find a game" durationInFrames={SCENE.playersFind.frames}>
          <PlayersFindScene
            name="Players find scene"
            headline1={p.players.headline.line1}
            headline2={p.players.headline.line2}
            osmCredit={p.players.osmCredit}
            mapSrc={p.screens.findMap}
            previewSrc={p.screens.findMapPreview}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.playersFind.out)} timing={cutTiming(SCENE.playersFind.out)} />
        <TransitionSeries.Sequence name="S10b Join, pay the host" durationInFrames={SCENE.playersJoin.frames}>
          <PlayersJoinScene
            name="Players join scene"
            headline1={p.players.join.headline.line1}
            headline2={p.players.join.headline.line2}
            support={p.players.join.support}
            sheetSrc={p.screens.joinRequestSheet}
            receiptSrc={p.screens.payGcashReceipt}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.playersJoin.out)} timing={cutTiming(SCENE.playersJoin.out)} />
        <TransitionSeries.Sequence name="S10c Player ID" durationInFrames={SCENE.playersId.frames}>
          <PlayersIdScene
            name="Players ID scene"
            headline1={p.players.id.headline.line1}
            headline2={p.players.id.headline.line2}
            support={p.players.id.support}
            chooserSrc={p.screens.idChooser}
            almostInSrc={p.screens.idAlmostIn}
            cardSrc={p.screens.idCard}
            pageSrc={p.screens.mobileHome}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.playersId.out)} timing={cutTiming(SCENE.playersId.out)} />
        <TransitionSeries.Sequence name="S10d You're up, rank, free" durationInFrames={SCENE.playersLive.frames}>
          <PlayersLiveScene
            name="Players live scene"
            upLine1={p.players.headline2.line1}
            upLine2={p.players.headline2.line2}
            rankLine1={p.players.rank.headline.line1}
            rankLine2={p.players.rank.headline.line2}
            rankSupport={p.players.rank.support}
            closeLine1={p.players.closing.line1}
            closeLine2={p.players.closing.line2}
            liveSrc={p.screens.liveOnCourt}
            standingsSrc={p.screens.standings}
            podiumSrc={p.screens.resultsPodium}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.playersLive.out)} timing={cutTiming(SCENE.playersLive.out)} />
        <TransitionSeries.Sequence name="S11 Offer" durationInFrames={SCENE.offer.frames}>
          <OfferScene
            name="Offer scene"
            badge={p.offer.badge}
            hero={p.offer.hero}
            heroSub={p.offer.heroSub}
            supportLine1={p.offer.supportLines[0]}
            supportLine2={p.offer.supportLines[1]}
            fanSrcs={[p.screens.newEventSheet, p.screens.hostCheckin, p.screens.podium, p.screens.hostUpNext, p.screens.playerLive]}
            photoSrc={p.photos.offer}
            photoEnabled={p.photos.enabled}
            colors={c}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentationFor(SCENE.offer.out)} timing={cutTiming(SCENE.offer.out)} />
        <TransitionSeries.Sequence name="S12 CTA" durationInFrames={SCENE.cta.frames}>
          <RallyoCtaScene
            name="CTA scene"
            headline1={p.cta.headline.line1}
            headline2={p.cta.headline.line2}
            url={p.cta.url}
            support={p.cta.support}
            logoSrc={p.brand.logoSrc}
            photoSrc={p.photos.cta}
            photoEnabled={p.photos.enabled}
            colors={c}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Chapter overlays (brief 5.3): rails below the wipes. Frame props on the rails are local to `from`.
          Tray (draft v4, v3 craft #4 / accuracy #6): the 70% night tray reads as a grey smudge on light UI, so it eases
          to .3 while the rail sits on paper, keeping its 6 px blur (the UI under it stays soft); .7 elsewhere. On the
          white live card it is off (0, 1327–1380: the pill already clears the name rows by ≥ 12 px), .2 on the standings.
          Absolute frames: S3 form + camera B 273–354 (back to .7 under T3's night shape); S10a card (the pill rests on its
          bottom-left margin) + S10b request sheet + receipt and the S10c chooser paper 1077–1254 (back to .7 as the
          almost-in sheet lands); S10d live card + standings 1321–1431. The hand-offs (273, 1053) still match
          ChapterWipe's .7 tray frame for frame.
          Rail 02 exit (draft v5, v4 craft #7): the rail FADES over 1536–1539 (ease-out, ≈ 10% by 1538) on top of its own
          retract, so the cap never merges with the GOLD block growing into lime; its on-screen span stays 1053–1536. */}
      <ChapterRail
        name="Rail 01"
        from={OVERLAYS.rail01.start}
        durationInFrames={OVERLAYS.rail01.end - OVERLAYS.rail01.start}
        label={ch01.railLabel}
        railW={OVERLAYS.rail01.rect.w}
        railTop={OVERLAYS.rail01.rect.y}
        dotsAt={OVERLAYS.rail01.dots.map((d) => d - OVERLAYS.rail01.start)}
        fadeOutAt={-1}
        plateOpacity={interpolate(frame, [273, 279, 348, 354], [0.7, 0.3, 0.3, 0.7], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        colors={c}
      />
      <Interactive.Div
        name="Rail 02 exit fade"
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [1536, 1539], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <ChapterRail
          name="Rail 02"
          from={OVERLAYS.rail02.start}
          durationInFrames={OVERLAYS.rail02.end - OVERLAYS.rail02.start}
          label={ch02.railLabel}
          railW={OVERLAYS.rail02.rect.w}
          railTop={OVERLAYS.rail02.rect.y}
          dotsAt={OVERLAYS.rail02.dots.map((d) => d - OVERLAYS.rail02.start)}
          fadeOutAt={OVERLAYS.rail02.fadeOut[0] - OVERLAYS.rail02.start}
          plateOpacity={interpolate(frame, [1077, 1083, 1248, 1254, 1321, 1327, 1380, 1386, 1425, 1431], [0.7, 0.3, 0.3, 0.7, 0.7, 0, 0, 0.2, 0.2, 0.7], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
          colors={c}
        />
      </Interactive.Div>
      <ChapterWipe
        name="Chapter wipe 01"
        from={OVERLAYS.ch01.start}
        durationInFrames={OVERLAYS.ch01.frames}
        num={ch01.num}
        label={ch01.label}
        railLabel={ch01.railLabel}
        railW={OVERLAYS.rail01.rect.w}
        railTop={OVERLAYS.rail01.rect.y}
        colors={c}
      />
      <ChapterWipe
        name="Chapter wipe 02"
        from={OVERLAYS.ch02.start}
        durationInFrames={OVERLAYS.ch02.frames}
        num={ch02.num}
        label={ch02.label}
        railLabel={ch02.railLabel}
        railW={OVERLAYS.rail02.rect.w}
        railTop={OVERLAYS.rail02.rect.y}
        colors={c}
      />

      {/* Music: ONE pre-rendered file from f0 (rallyo-edit-62s.wav: fades, drop-out 1545-1560, seam and gain baked in). */}
      {p.musicSrc ? <Audio name="Music #3 edit" src={asset(p.musicSrc)} volume={p.musicVolume} /> : null}

      {/* SFX: skipped when disabled or when calculateMetadata found the file missing (path ""). */}
      {p.sfxEnabled
        ? SFX_CUES.map((cue) => {
            const src = p.sfx[cue.sound];
            return src ? (
              <Audio
                key={`${cue.sound}-${cue.at}`}
                name={`SFX ${cue.sound} ${cue.at}`}
                from={cue.at}
                durationInFrames={cue.frames}
                trimBefore={cue.trimBefore}
                src={asset(src)}
                volume={cue.volume}
              />
            ) : null;
          })
        : null}

      {missing.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: 24,
            padding: "12px 18px",
            borderRadius: 12,
            backgroundColor: "#B00020",
            color: "#FFFFFF",
            fontFamily: "Consolas, Menlo, monospace",
            fontSize: 22,
            lineHeight: 1.3,
          }}
        >
          {`MISSING ASSETS (blanked, do not publish): ${missing.join(" · ")}`}
        </div>
      ) : null}

      {p.showGuides ? <ReelsGuide name="Reels guide" /> : null}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// calculateMetadata: duration stays 1860; copy checks; post text; blank missing files (banner).
// ---------------------------------------------------------------------------------------------

const fileExists = async (src: string, signal: AbortSignal): Promise<boolean> => {
  try {
    const res = await fetch(asset(src), { method: "HEAD", signal });
    return res.ok;
  } catch {
    return false;
  }
};

const readText = async (src: string, signal: AbortSignal): Promise<string> => {
  if (!src) {
    return "";
  }
  try {
    const res = await fetch(asset(src), { signal });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
};

const join = (...parts: readonly string[]): string => parts.join(" ").replace(/\s+/g, " ").trim();

/** Props copy per reading-time row (SUPERS ids in lib/rallyo-timeline.ts). */
const copyBySuper = (p: RallyoProps): Record<string, string> => ({
  hookHeadline: join(p.hook.headline.line1, p.hook.headline.line2),
  revealHeadline: join(p.reveal.headline.line1, p.reveal.headline.line2),
  revealLockup: p.reveal.wordmark,
  revealBadge: p.reveal.badge,
  rail01: p.chapters[0].railLabel,
  publishChip: p.publish.chip.text,
  publishHeadline: join(p.publish.headline.line1, p.publish.headline.line2),
  shareChip: p.share.chip.text,
  shareHeadline: join(p.share.headline.line1, p.share.headline.line2),
  approveChip: p.approve.chip.text,
  approveHeadline: join(p.approve.headline.line1, p.approve.headline.line2),
  checkInChip: p.checkIn.chip.text,
  checkInHeadline: join(p.checkIn.headline.line1, p.checkIn.headline.line2),
  upNextHeadline: join(p.upNext.headline.line1, p.upNext.headline.line2),
  upNextSupport: p.upNext.support,
  whoWonChip: p.whoWon.chip.text,
  whoWonHeadline: join(p.whoWon.headline.line1, p.whoWon.headline.line2),
  tournamentChip: p.tournament.chip.text,
  tournamentH1: join(p.tournament.headline.line1, p.tournament.headline.line2),
  tournamentH2: join(p.tournament.headline2.line1, p.tournament.headline2.line2),
  rail02: p.chapters[1].railLabel,
  playersFindH1: join(p.players.headline.line1, p.players.headline.line2),
  playersJoinHeadline: join(p.players.join.headline.line1, p.players.join.headline.line2),
  playersJoinSupport: p.players.join.support,
  playersIdHeadline: join(p.players.id.headline.line1, p.players.id.headline.line2),
  playersIdSupport: p.players.id.support,
  playersUp: join(p.players.headline2.line1, p.players.headline2.line2),
  playersRankHeadline: join(p.players.rank.headline.line1, p.players.rank.headline.line2),
  playersRankSupport: p.players.rank.support,
  playersClose: join(p.players.closing.line1, p.players.closing.line2),
  offerHero: join(p.offer.hero, p.offer.heroSub),
  offerBadge: p.offer.badge,
  offerSupport: join(...p.offer.supportLines),
  ctaUrl: p.cta.url,
  ctaHeadline: join(p.cta.headline.line1, p.cta.headline.line2),
  ctaSupport: p.cta.support,
});

/**
 * Throws when the copy would break the timeline: a chip that does not quote its hook bubble (text and sender),
 * or a super with more words than its reading-time row allows. Copy that differs from the canonical table
 * with the same or fewer words only warns (the owner may reword; QA reports it).
 */
const checkCopy = (p: RallyoProps): void => {
  const chips: [string, RallyoProps["publish"]["chip"]][] = [
    ["publish", p.publish.chip],
    ["share", p.share.chip],
    ["approve", p.approve.chip],
    ["checkIn", p.checkIn.chip],
    ["whoWon", p.whoWon.chip],
    ["tournament", p.tournament.chip],
  ];
  chips.forEach(([where, chip]) => {
    const quoted = p.hook.messages.some((m) => m.text === chip.text && m.sender === chip.sender);
    if (!quoted) {
      throw new Error(`RallyoPrelaunch: the ${where} chip "${chip.sender}: ${chip.text}" does not quote a hook bubble exactly`);
    }
  });
  const copy = copyBySuper(p);
  Object.keys(copy).forEach((id) => {
    const spec = superById(id);
    const words = countWords(copy[id]);
    if (words > spec.words) {
      throw new Error(
        `RallyoPrelaunch: "${copy[id]}" (${id}) has ${words} words; its reading-time row (${spec.landed}-${spec.until}) is built for ${spec.words}. Retime lib/rallyo-timeline.ts first.`,
      );
    }
    if (join(copy[id]) !== join(spec.text)) {
      console.warn(`RallyoPrelaunch: ${id} copy "${copy[id]}" differs from the canonical "${spec.text}"`);
    }
  });
};

export const calculateRallyoMetadata: CalculateMetadataFunction<RallyoProps> = async ({ props, abortSignal }) => {
  checkCopy(props);

  // Post text (capture R1): only from the data file, never hand-typed.
  const postText = props.share.postText || (await readText(props.share.postSrc, abortSignal));

  // Served files: blank any missing one so the render never 404s, and list it on a banner.
  const missing: string[] = [];
  const blankIfMissing = async (src: string): Promise<string> => {
    if (!src) {
      return src;
    }
    if (await fileExists(src, abortSignal)) {
      return src;
    }
    missing.push(src);
    return "";
  };

  const screens = { ...props.screens };
  const screenKeys = (Object.keys(screens) as (keyof typeof screens)[]).filter((k) => typeof screens[k] === "string");
  const checked = await Promise.all(screenKeys.map((k) => blankIfMissing(screens[k] as string)));
  screenKeys.forEach((k, i) => {
    (screens as Record<string, unknown>)[k] = checked[i];
  });

  const [logoSrc, markSrc, photoOffer, photoCta, musicSrc] = await Promise.all([
    blankIfMissing(props.brand.logoSrc),
    blankIfMissing(props.brand.markSrc),
    props.photos.enabled ? blankIfMissing(props.photos.offer) : Promise.resolve(props.photos.offer),
    props.photos.enabled ? blankIfMissing(props.photos.cta) : Promise.resolve(props.photos.cta),
    blankIfMissing(props.musicSrc),
  ]);

  // SFX: blank missing files (shared files are checked once).
  let sfx = props.sfx;
  if (props.sfxEnabled) {
    const keys = Object.keys(props.sfx) as (keyof RallyoProps["sfx"])[];
    const unique = Array.from(new Set(keys.map((k) => props.sfx[k]).filter(Boolean)));
    const present = new Map<string, boolean>();
    await Promise.all(
      unique.map(async (src) => {
        present.set(src, await fileExists(src, abortSignal));
      }),
    );
    const next = { ...props.sfx };
    keys.forEach((k) => {
      if (next[k] && !present.get(next[k])) {
        if (!missing.includes(next[k])) {
          missing.push(next[k]);
        }
        next[k] = "";
      }
    });
    sfx = next;
  }

  if (missing.length > 0) {
    console.warn(`RallyoPrelaunch: missing served files (blanked): ${missing.join(", ")}`);
  }

  return {
    durationInFrames: TOTAL_FRAMES,
    props: {
      ...props,
      share: { ...props.share, postText },
      screens,
      brand: { ...props.brand, logoSrc, markSrc },
      photos: { ...props.photos, offer: photoOffer, cta: photoCta },
      musicSrc,
      sfx,
      missingAssets: missing,
    },
  };
};

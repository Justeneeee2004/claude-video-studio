import "./index.css";
import { Composition, Folder, Still } from "remotion";
import { KineticCaptions } from "./captions/KineticCaptions";
import { CaptionedClip } from "./compositions/CaptionedClip";
import { ProductPromo } from "./compositions/ProductPromo";
import {
  calculateShowcaseMetadata,
  ScreenshotShowcase,
  showcaseSchema,
} from "./compositions/ScreenshotShowcase";
import { promoSchema } from "./compositions/schema";
import { SocialReel } from "./compositions/SocialReel";
import { SquareAd } from "./compositions/SquareAd";
import { Thumbnail, thumbnailSchema } from "./compositions/Thumbnail";
import { Counter } from "./elements/Counter";
import { CtaButton } from "./elements/CtaButton";
import { DeviceFrame } from "./elements/DeviceFrame";
import { KineticText } from "./elements/KineticText";
import { LogoLockup } from "./elements/LogoLockup";
import { LowerThird } from "./elements/LowerThird";
import { LightLeakOverlay } from "./layers/LightLeakOverlay";
import { CtaScene } from "./scenes/CtaScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { HookScene } from "./scenes/HookScene";
import { LogoStingScene } from "./scenes/LogoStingScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ProofScene } from "./scenes/ProofScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { calculateRallyoMetadata, RallyoPrelaunch } from "./compositions/RallyoPrelaunch";
import { rallyoSchema } from "./compositions/rallyo-schema";
import { Confetti, Connector, Highlighter, RiseMask, RoughBox, RoughRing, RoughUnderline, RowFlash } from "./elements/Annotate";
import { CameraRig } from "./elements/CameraRig";
import { ChaosChip, LabelPill } from "./elements/ChaosChip";
import { ChatScreen } from "./elements/ChatScreen";
import { DeviceCombo, LaptopFrame } from "./elements/LaptopFrame";
import { PhoneFrame } from "./elements/PhoneFrame";
import { PhoneFan } from "./elements/PhoneFan";
import { PinPulse } from "./elements/PinPulse";
import { Spotlight } from "./elements/Spotlight";
import { StrikeLine } from "./elements/StrikeLine";
import { UiTile } from "./elements/UiTile";
import { Cursor, TapRipple } from "./elements/Pointer";
import { ScreenClip, ScreenImage, ScreenSwipe, ScrollShot } from "./elements/ScreenMedia";
import { ChapterRail } from "./layers/ChapterRail";
import { ChapterWipe } from "./layers/ChapterWipe";
import { ReelsGuide } from "./layers/ReelsGuide";
import { Stage } from "./layers/Stage";
import { ApproveScene } from "./scenes/rallyo/ApproveScene";
import { ChatChaosScene } from "./scenes/rallyo/ChatChaosScene";
import { CheckInScene } from "./scenes/rallyo/CheckInScene";
import { OfferScene } from "./scenes/rallyo/OfferScene";
import { PlayersFindScene } from "./scenes/rallyo/PlayersFindScene";
import { PlayersIdScene } from "./scenes/rallyo/PlayersIdScene";
import { PlayersJoinScene } from "./scenes/rallyo/PlayersJoinScene";
import { PlayersLiveScene } from "./scenes/rallyo/PlayersLiveScene";
import { PublishScene } from "./scenes/rallyo/PublishScene";
import { RallyoCtaScene } from "./scenes/rallyo/RallyoCtaScene";
import { RevealScene } from "./scenes/rallyo/RevealScene";
import { ShareScene } from "./scenes/rallyo/ShareScene";
import { TournamentScene } from "./scenes/rallyo/TournamentScene";
import { UpNextScene } from "./scenes/rallyo/UpNextScene";
import { WhoWonScene } from "./scenes/rallyo/WhoWonScene";
import { TransitionPreview } from "./transitions/TransitionPreview";
import { RallyoCarousel } from "./compositions/RallyoCarousel";
import { rallyoCarouselSchema } from "./compositions/rallyo-carousel-schema";

// Keep defaultProps inline on each <Composition> so Studio can write edits back.
// The three social compositions share promoSchema: one props JSON renders all formats.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Marketing">
        <Composition
          id="ProductPromo"
          component={ProductPromo}
          durationInFrames={810}
          fps={30}
          width={1920}
          height={1080}
          schema={promoSchema}
          defaultProps={{
            brandName: "SkedAI",
            logoSrc: "",
            kicker: "For PH clinics",
            headline: "Stop losing patients to no-shows",
            accentWords: "no-shows",
            sub: "SkedAI confirms every appointment automatically, on SMS and Messenger.",
            problemTitle: "Sounds familiar?",
            pains: [
              "Staff calling patients all morning",
              "20% no-shows every single week",
              "Double-booked slots and angry patients",
            ],
            productName: "SkedAI",
            tagline: "AI appointment confirmations that run themselves.",
            screenshotSrc: "",
            deviceVariant: "phone",
            featureTitle: "How it works",
            features: [
              { title: "Auto-confirm", desc: "SMS + Messenger reminders 24h and 2h before." },
              { title: "Smart reschedule", desc: "Patients reply, SkedAI rebooks the slot." },
              { title: "Clinic dashboard", desc: "Confirmations, no-shows and revenue saved." },
            ],
            stat1: { value: 38, suffix: "%", label: "fewer no-shows (placeholder)" },
            stat2: { value: 12, suffix: "h", label: "staff time saved weekly (placeholder)" },
            quote: "We stopped calling patients manually in week one.",
            author: "Placeholder testimonial — replace with a real clinic",
            ctaHeadline: "Try SkedAI free for 14 days",
            ctaLabel: "Start free trial",
            url: "skedai.ph",
            note: "No credit card. Setup in 10 minutes.",
            musicSrc: "",
            sfxEnabled: false,
            primary: "#6366F1",
            accent: "#22D3EE",
            bg: "#0B0F19",
            bg2: "#1E1B4B",
            danger: "#F43F5E",
          }}
        />
        <Composition
          id="SocialReel"
          component={SocialReel}
          durationInFrames={399}
          fps={30}
          width={1080}
          height={1920}
          schema={promoSchema}
          defaultProps={{
            brandName: "SkedAI",
            logoSrc: "",
            kicker: "For PH clinics",
            headline: "Stop losing patients to no-shows",
            accentWords: "no-shows",
            sub: "SkedAI confirms every appointment automatically, on SMS and Messenger.",
            problemTitle: "Sounds familiar?",
            pains: [
              "Staff calling patients all morning",
              "20% no-shows every single week",
              "Double-booked slots and angry patients",
            ],
            productName: "SkedAI",
            tagline: "AI appointment confirmations that run themselves.",
            screenshotSrc: "",
            deviceVariant: "phone",
            featureTitle: "How it works",
            features: [
              { title: "Auto-confirm", desc: "SMS + Messenger reminders 24h and 2h before." },
              { title: "Smart reschedule", desc: "Patients reply, SkedAI rebooks the slot." },
              { title: "Clinic dashboard", desc: "Confirmations, no-shows and revenue saved." },
            ],
            stat1: { value: 38, suffix: "%", label: "fewer no-shows (placeholder)" },
            stat2: { value: 12, suffix: "h", label: "staff time saved weekly (placeholder)" },
            quote: "We stopped calling patients manually in week one.",
            author: "Placeholder testimonial — replace with a real clinic",
            ctaHeadline: "Try SkedAI free for 14 days",
            ctaLabel: "Start free trial",
            url: "skedai.ph",
            note: "No credit card. Setup in 10 minutes.",
            musicSrc: "",
            sfxEnabled: false,
            primary: "#6366F1",
            accent: "#22D3EE",
            bg: "#0B0F19",
            bg2: "#1E1B4B",
            danger: "#F43F5E",
          }}
        />
        <Composition
          id="SquareAd"
          component={SquareAd}
          durationInFrames={291}
          fps={30}
          width={1080}
          height={1080}
          schema={promoSchema}
          defaultProps={{
            brandName: "SkedAI",
            logoSrc: "",
            kicker: "For PH clinics",
            headline: "Stop losing patients to no-shows",
            accentWords: "no-shows",
            sub: "SkedAI confirms every appointment automatically, on SMS and Messenger.",
            problemTitle: "Sounds familiar?",
            pains: [
              "Staff calling patients all morning",
              "20% no-shows every single week",
              "Double-booked slots and angry patients",
            ],
            productName: "SkedAI",
            tagline: "AI appointment confirmations that run themselves.",
            screenshotSrc: "",
            deviceVariant: "phone",
            featureTitle: "How it works",
            features: [
              { title: "Auto-confirm", desc: "SMS + Messenger reminders 24h and 2h before." },
              { title: "Smart reschedule", desc: "Patients reply, SkedAI rebooks the slot." },
              { title: "Clinic dashboard", desc: "Confirmations, no-shows and revenue saved." },
            ],
            stat1: { value: 38, suffix: "%", label: "fewer no-shows (placeholder)" },
            stat2: { value: 12, suffix: "h", label: "staff time saved weekly (placeholder)" },
            quote: "We stopped calling patients manually in week one.",
            author: "Placeholder testimonial — replace with a real clinic",
            ctaHeadline: "Try SkedAI free for 14 days",
            ctaLabel: "Start free trial",
            url: "skedai.ph",
            note: "No credit card. Setup in 10 minutes.",
            musicSrc: "",
            sfxEnabled: false,
            primary: "#6366F1",
            accent: "#22D3EE",
            bg: "#0B0F19",
            bg2: "#1E1B4B",
            danger: "#F43F5E",
          }}
        />
        <Composition
          id="ScreenshotShowcase"
          component={ScreenshotShowcase}
          durationInFrames={360}
          fps={30}
          width={1920}
          height={1080}
          schema={showcaseSchema}
          calculateMetadata={calculateShowcaseMetadata}
          defaultProps={{
            brandName: "SkedAI",
            logoSrc: "",
            secondsPerSlide: 4,
            slides: [
              { src: "", caption: "Patients confirm with one tap", variant: "phone" },
              { src: "", caption: "Your whole week at a glance", variant: "browser" },
              { src: "", caption: "No-shows drop. Revenue stays.", variant: "phone" },
            ],
            musicSrc: "",
            primary: "#6366F1",
            accent: "#22D3EE",
            bg: "#0B0F19",
            bg2: "#1E1B4B",
          }}
        />
        <Composition
          id="LogoSting"
          component={LogoStingScene}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            brandName: "SkedAI",
            logoSrc: "",
            tagline: "Appointments that confirm themselves",
            bg: "#0B0F19",
            bg2: "#1E1B4B",
            primary: "#6366F1",
            accent: "#22D3EE",
          }}
        />
        <Composition
          id="CaptionedClip"
          component={CaptionedClip}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>

      <Folder name="Stills">
        <Still
          id="Thumbnail"
          component={Thumbnail}
          width={1280}
          height={720}
          schema={thumbnailSchema}
          defaultProps={{
            kicker: "For PH clinics",
            headline: "Stop losing patients to no-shows",
            accentWords: "no-shows",
            brandName: "SkedAI",
            logoSrc: "",
            screenshotSrc: "",
            primary: "#6366F1",
            accent: "#22D3EE",
            bg: "#0B0F19",
            bg2: "#1E1B4B",
          }}
        />
      </Folder>

      <Folder name="Scenes">
        <Composition
          id="HookScene"
          component={HookScene}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            kicker: "For PH clinics",
            headline: "Stop losing patients to no-shows",
            accentWords: "no-shows",
            sub: "SkedAI confirms every appointment automatically, on SMS and Messenger.",
          }}
        />
        <Composition
          id="ProblemScene"
          component={ProblemScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: "Sounds familiar?",
            pain1: "Staff calling patients all morning",
            pain2: "20% no-shows every single week",
            pain3: "Double-booked slots and angry patients",
          }}
        />
        <Composition
          id="SolutionScene"
          component={SolutionScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            productName: "SkedAI",
            tagline: "AI appointment confirmations that run themselves.",
            screenshotSrc: "",
            deviceVariant: "phone",
          }}
        />
        <Composition
          id="FeatureScene"
          component={FeatureScene}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: "How it works",
            feature1Title: "Auto-confirm",
            feature1Desc: "SMS + Messenger reminders 24h and 2h before.",
            feature2Title: "Smart reschedule",
            feature2Desc: "Patients reply, SkedAI rebooks the slot.",
            feature3Title: "Clinic dashboard",
            feature3Desc: "Confirmations, no-shows and revenue saved.",
          }}
        />
        <Composition
          id="ProofScene"
          component={ProofScene}
          durationInFrames={120}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            stat1Value: 38,
            stat1Suffix: "%",
            stat1Label: "fewer no-shows (placeholder)",
            stat2Value: 12,
            stat2Suffix: "h",
            stat2Label: "staff time saved weekly (placeholder)",
            quote: "We stopped calling patients manually in week one.",
            author: "Placeholder testimonial — replace with a real clinic",
          }}
        />
        <Composition
          id="CtaScene"
          component={CtaScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            brandName: "SkedAI",
            headline: "Try SkedAI free for 14 days",
            ctaLabel: "Start free trial",
            url: "skedai.ph",
            note: "No credit card. Setup in 10 minutes.",
          }}
        />
      </Folder>

      <Folder name="Elements">
        <Composition
          id="KineticText"
          component={KineticText}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            text: "Motion that actually sells",
            by: "word",
            stagger: 3,
            enter: 14,
            accentWords: "sells",
            accentColor: "#22D3EE",
            style: { padding: 140 },
          }}
        />
        <Composition
          id="Counter"
          component={Counter}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            to: 1280,
            prefix: "₱",
            suffix: "K",
            countFrames: 45,
            style: { padding: 140 },
          }}
        />
        <Composition
          id="CtaButton"
          component={CtaButton}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            children: "Start free trial",
            color: "#6366F1",
            textColor: "#FFFFFF",
            style: { margin: 140 },
          }}
        />
        <Composition
          id="DeviceFrame"
          component={DeviceFrame}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            src: "",
            variant: "phone",
            style: { margin: 100 },
          }}
        />
        <Composition
          id="LogoLockup"
          component={LogoLockup}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            brandName: "SkedAI",
            logoSrc: "",
            size: 120,
            style: { margin: 140 },
          }}
        />
        <Composition
          id="LowerThird"
          component={LowerThird}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            children: "Dr. Reyes, Dental Clinic, Cebu",
            accentColor: "#22D3EE",
          }}
        />
        <Composition
          id="LightLeakOverlay"
          component={LightLeakOverlay}
          durationInFrames={30}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ seed: 3, hueShift: 220 }}
        />
        <Composition
          id="KineticCaptions"
          component={KineticCaptions}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            width: 900,
            highlightColor: "#22D3EE",
            style: { position: "absolute", bottom: 480, translate: "90px 0px" },
            captions: [
              { text: "Motion", startMs: 0, endMs: 500, timestampMs: 250, confidence: null },
              { text: " that", startMs: 500, endMs: 800, timestampMs: 650, confidence: null },
              { text: " sells.", startMs: 800, endMs: 1600, timestampMs: 1200, confidence: null },
            ],
          }}
        />
      </Folder>

      {/* Rallyo pre-launch reel v2.3, round 4, 62 s (briefs/rallyo-prelaunch.md + briefs/rallyo-players-chapter.md).
          Contract: docs/rallyo-build-contract.md. PlayersScene (v2.2 S10) was retired in round 4 and its file deleted in draft v4 (S10a–S10d replace it). */}
      <Folder name="Rallyo">
        <Composition
          id="RallyoPrelaunch"
          component={RallyoPrelaunch}
          durationInFrames={1860}
          fps={30}
          width={1080}
          height={1920}
          schema={rallyoSchema}
          calculateMetadata={calculateRallyoMetadata}
          defaultProps={{
            colors: {
              night: "#0B130D",
              nightCard: "#111B14",
              nightRaised: "#16241A",
              court: "#24432F",
              lime: "#C8F23A",
              limeHover: "#DFFF6E",
              limeTint: "#E3F3A6",
              paper: "#EEEFE8",
              ink: "#121812",
              fg: "#EEF1EA",
              fg2: "#C3CBC1",
              dangerSoft: "#F28B7A",
              graphite: "#3A423B",
              graphiteBubble: "#2A302B",
              senderGrey: "#8E988F",
              oliveInk: "#3F5A0A"
            },
            brand: {
              name: "Rallyo",
              url: "rallyo.ph",
              logoSrc: "rallyo/brand/rallyo-logo.png",
              markSrc: "rallyo/brand/rallyo-mark.png"
            },
            chapters: [
              {
                num: "01",
                label: "FOR HOSTS",
                railLabel: "01 · HOSTS"
              },
              {
                num: "02",
                label: "FOR PLAYERS",
                railLabel: "02 · PLAYERS"
              }
            ],
            hook: {
              headline: {
                line1: "HOSTING OPEN PLAYS?",
                line2: "GROUP CHAT CHAOS?",
                size: 90
              },
              chatTitle: "Thursday Open Play",
              chatMembers: "47 members",
              messages: [
                {
                  at: 0,
                  sender: "KT",
                  text: "Who's in for Thursday?"
                },
                {
                  at: 0,
                  sender: "KT",
                  text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___"
                },
                {
                  at: 0,
                  sender: "MG",
                  text: "+1"
                },
                {
                  at: 9,
                  sender: "BE",
                  text: "+1, bringing a guest"
                },
                {
                  at: 15,
                  sender: "DX",
                  text: "Who's next on Court 2??"
                },
                {
                  at: 21,
                  sender: "AN",
                  text: "Who hasn't paid yet?"
                },
                {
                  at: 27,
                  sender: "JU",
                  text: "When? How much? Who's in?"
                },
                {
                  at: 33,
                  sender: "RC",
                  text: "Joining! Cash or GCash?"
                },
                {
                  at: 39,
                  sender: "MG",
                  text: "Who won last night?"
                },
                {
                  at: 45,
                  sender: "BE",
                  text: "Where's the bracket?"
                },
                {
                  at: 51,
                  sender: "JU",
                  text: "+1"
                },
                {
                  at: 57,
                  sender: "KT",
                  text: "How many are here??"
                },
                {
                  at: 63,
                  sender: "RC",
                  text: "Court 3 free?"
                },
                {
                  at: 66,
                  sender: "AN",
                  text: "+1"
                },
                {
                  at: 69,
                  sender: "MG",
                  text: "+1"
                },
                {
                  at: 72,
                  sender: "DX",
                  text: "who's next?!"
                },
                {
                  at: 75,
                  sender: "BE",
                  text: "+1"
                },
                {
                  at: 78,
                  sender: "KT",
                  text: "list??"
                },
                {
                  at: 81,
                  sender: "RC",
                  text: "+2"
                },
                {
                  at: 84,
                  sender: "JU",
                  text: "+1"
                },
                {
                  at: 87,
                  sender: "AN",
                  text: "???"
                }
              ]
            },
            reveal: {
              headline: {
                line1: "RELAX,",
                line2: "HOST."
              },
              wordmark: "Rallyo",
              badge: "PRE-LAUNCH"
            },
            publish: {
              chip: {
                sender: "KT",
                text: "Who's in for Thursday?"
              },
              headline: {
                line1: "ONE FORM,",
                line2: "PUBLISHED."
              }
            },
            share: {
              chip: {
                sender: "JU",
                text: "When? How much? Who's in?"
              },
              headline: {
                line1: "ONE POST,",
                line2: "ANSWERS ALL."
              },
              postSrc: "rallyo/data/rookie-cup-post.txt",
              postText: "",
              blurVenue: true,
              linkDisplay: "https://rallyo.ph/events/…"
            },
            approve: {
              chip: {
                sender: "RC",
                text: "Joining! Cash or GCash?"
              },
              headline: {
                line1: "STRAIGHT",
                line2: "TO YOU."
              }
            },
            checkIn: {
              chip: {
                sender: "KT",
                text: "How many are here??"
              },
              headline: {
                line1: "CHECK-IN",
                line2: "BY CODE."
              }
            },
            upNext: {
              headline: {
                line1: "UP NEXT,",
                line2: "AUTOMATIC."
              },
              support: "You send each match."
            },
            whoWon: {
              chip: {
                sender: "MG",
                text: "Who won last night?"
              },
              headline: {
                line1: "CLEAR",
                line2: "WINNERS."
              }
            },
            tournament: {
              chip: {
                sender: "BE",
                text: "Where's the bracket?"
              },
              headline: {
                line1: "TOURNAMENT?",
                line2: "AUTO-CALL ON."
              },
              headline2: {
                line1: "WINNERS",
                line2: "MOVE UP."
              }
            },
            players: {
              headline: {
                line1: "FIND A",
                line2: "GAME."
              },
              join: {
                headline: {
                  line1: "JOIN,",
                  line2: "PAY THE HOST."
                },
                support: "GCash or cash."
              },
              id: {
                headline: {
                  line1: "NO APP.",
                  line2: "NO PASSWORD."
                },
                support: "Player ID in about 20 seconds."
              },
              headline2: {
                line1: "YOU'RE",
                line2: "UP!"
              },
              rank: {
                headline: {
                  line1: "SEE WHERE",
                  line2: "YOU RANK."
                },
                support: "Rallyo ratings only."
              },
              closing: {
                line1: "FREE FOR",
                line2: "PLAYERS."
              },
              osmCredit: "© OpenStreetMap contributors"
            },
            offer: {
              badge: "FOR HOSTS",
              hero: "FREE",
              heroSub: "DURING PRE-LAUNCH.",
              supportLines: [
                "Open plays, tournaments,",
                "every feature."
              ]
            },
            cta: {
              headline: {
                line1: "USE RALLYO",
                line2: "WHILE IT'S FREE."
              },
              url: "rallyo.ph",
              support: "Website. No app needed."
            },
            screens: {
              desktopHome: "rallyo/screens/desktop/home.png",
              mobileHome: "rallyo/screens/mobile/home.png",
              newEventSheet: "rallyo/screens/mobile/new-event-sheet-safe.png",
              rookieCup: "rallyo/screens/mobile/host-event-rookie-cup.png",
              rookieCupRequests: "rallyo/screens/mobile/rookie-cup-requests-safe.png",
              requestPayment: "rallyo/screens/mobile/request-payment-safe.png",
              hostCheckin: "rallyo/screens/mobile/host-checkin.png",
              openPlayCourts: "rallyo/screens/desktop/demo-open-play-host-courts.png",
              playerUpNext: "rallyo/screens/mobile/player-upnext-crop.png",
              whoWonClip: "rallyo/clips/open-play-who-won.mp4",
              podium: "rallyo/screens/mobile/podium-demo-crop.png",
              tournamentConsole: "rallyo/screens/desktop/host-tournament-console-davao-fall-classic-full.png",
              bracket: "rallyo/screens/desktop/demo-tournament-bracket-mhi.png",
              map: "rallyo/screens/mobile/map.png",
              playerCard: "rallyo/screens/mobile/player-card-masked.png",
              playerLive: "rallyo/screens/mobile/player-live-crop.png",
              hostUpNext: "rallyo/screens/mobile/host-up-next.png",
              findMap: "rallyo/screens/players/find-map.png",
              findMapPreview: "rallyo/screens/players/find-map-preview.png",
              joinRequestSheet: "rallyo/screens/players/join-request-sheet.png",
              payGcashReceipt: "rallyo/screens/players/pay-gcash-receipt.png",
              idChooser: "rallyo/screens/players/id-chooser.png",
              idAlmostIn: "rallyo/screens/players/id-almost-in.png",
              idCard: "rallyo/screens/players/id-card-games.png",
              liveOnCourt: "rallyo/screens/players/live-on-court.png",
              standings: "rallyo/screens/players/standings-rallyo.png",
              resultsPodium: "rallyo/screens/players/results-podium.png",
              codeTile: {
                x: 850,
                y: 695,
                w: 270,
                h: 130
              }
            },
            photos: {
              enabled: true,
              offer: "rallyo/photos/ph-open-play-night.webp",
              cta: "rallyo/photos/ph-paddle-tap.webp"
            },
            musicSrc: "rallyo/music/rallyo-edit-62s.wav",
            musicVolume: 1,
            sfxEnabled: true,
            sfx: {
              pop: "rallyo/sfx/pop.wav",
              riser: "rallyo/sfx/riser.wav",
              whoosh: "rallyo/sfx/whoosh-1.wav",
              whooshLong: "rallyo/sfx/whoosh-2.wav",
              logoHit: "rallyo/sfx/hit.wav",
              shimmer: "rallyo/sfx/shimmer.wav",
              tap: "rallyo/sfx/tap.wav",
              whip: "rallyo/sfx/swipe.wav",
              sendPop: "rallyo/sfx/pop.wav",
              swish: "rallyo/sfx/swipe.wav",
              strikeTick: "rallyo/sfx/tick.wav",
              ringPing: "rallyo/sfx/ding.wav",
              swipe: "rallyo/sfx/swipe.wav",
              marker: "rallyo/sfx/swipe.wav",
              boxTick: "rallyo/sfx/tick.wav",
              click: "rallyo/sfx/click.wav",
              highlighter: "rallyo/sfx/swipe.wav",
              thump: "rallyo/sfx/hit.wav",
              rustle: "rallyo/sfx/shimmer.wav",
              ringTick: "rallyo/sfx/tick.wav",
              scrollSwish: "rallyo/sfx/swipe.wav",
              blip: "rallyo/sfx/tick.wav",
              connector: "rallyo/sfx/swipe.wav",
              ding: "rallyo/sfx/ding.wav",
              swell: "rallyo/sfx/riser.wav",
              slam: "rallyo/sfx/hit.wav",
              impact: "rallyo/sfx/hit.wav",
              pulseTick: "rallyo/sfx/tick.wav",
              tileTick: "rallyo/sfx/tick.wav"
            },
            showGuides: false
          }}
        />
      </Folder>

      <Folder name="Rallyo-Scenes">
        <Composition
          id="Rallyo-S01-Hook"
          component={ChatChaosScene}
          durationInFrames={135}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "HOSTING OPEN PLAYS?",
            headline2: "GROUP CHAT CHAOS?",
            headlineSize: 90,
            chatTitle: "Thursday Open Play",
            chatMembers: "47 members",
            messages: [
              { at: 0, sender: "KT", text: "Who's in for Thursday?" },
              { at: 0, sender: "KT", text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___" },
              { at: 0, sender: "MG", text: "+1" },
              { at: 9, sender: "BE", text: "+1, bringing a guest" },
              { at: 15, sender: "DX", text: "Who's next on Court 2??" },
              { at: 21, sender: "AN", text: "Who hasn't paid yet?" },
              { at: 27, sender: "JU", text: "When? How much? Who's in?" },
              { at: 33, sender: "RC", text: "Joining! Cash or GCash?" },
              { at: 39, sender: "MG", text: "Who won last night?" },
              { at: 45, sender: "BE", text: "Where's the bracket?" },
              { at: 51, sender: "JU", text: "+1" },
              { at: 57, sender: "KT", text: "How many are here??" },
              { at: 63, sender: "RC", text: "Court 3 free?" },
              { at: 66, sender: "AN", text: "+1" },
              { at: 69, sender: "MG", text: "+1" },
              { at: 72, sender: "DX", text: "who's next?!" },
              { at: 75, sender: "BE", text: "+1" },
              { at: 78, sender: "KT", text: "list??" },
              { at: 81, sender: "RC", text: "+2" },
              { at: 84, sender: "JU", text: "+1" },
              { at: 87, sender: "AN", text: "???" },
            ],
          }}
        />
        <Composition
          id="Rallyo-S02-Reveal"
          component={RevealScene}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "RELAX,",
            headline2: "HOST.",
            wordmark: "Rallyo",
            badge: "PRE-LAUNCH",
            markSrc: "rallyo/brand/rallyo-mark.png",
            desktopHomeSrc: "rallyo/screens/desktop/home.png",
            mobileHomeSrc: "rallyo/screens/mobile/home.png",
          }}
        />
        <Composition
          id="Rallyo-S03-Publish"
          component={PublishScene}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            chipSender: "KT",
            chipText: "Who's in for Thursday?",
            headline1: "ONE FORM,",
            headline2: "PUBLISHED.",
            sheetSrc: "rallyo/screens/mobile/new-event-sheet-safe.png",
          }}
        />
        <Composition
          id="Rallyo-S04-Share"
          component={ShareScene}
          durationInFrames={135}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            chipSender: "JU",
            chipText: "When? How much? Who's in?",
            headline1: "ONE POST,",
            headline2: "ANSWERS ALL.",
            rookieCupSrc: "rallyo/screens/mobile/host-event-rookie-cup.png",
            postText: "",
            blurVenue: true,
            linkDisplay: "https://rallyo.ph/events/…",
          }}
        />
        <Composition
          id="Rallyo-S05-Approve"
          component={ApproveScene}
          durationInFrames={105}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            chipSender: "RC",
            chipText: "Joining! Cash or GCash?",
            headline1: "STRAIGHT",
            headline2: "TO YOU.",
            requestsSrc: "rallyo/screens/mobile/rookie-cup-requests-safe.png",
            paymentSrc: "rallyo/screens/mobile/request-payment-safe.png",
          }}
        />
        <Composition
          id="Rallyo-S06-CheckIn"
          component={CheckInScene}
          durationInFrames={105}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            chipSender: "KT",
            chipText: "How many are here??",
            headline1: "CHECK-IN",
            headline2: "BY CODE.",
            checkinSrc: "rallyo/screens/mobile/host-checkin.png",
            tileSrc: "rallyo/screens/mobile/player-card-masked.png",
            tileCrop: { x: 850, y: 695, w: 270, h: 130 },
          }}
        />
        <Composition
          id="Rallyo-S07-UpNext"
          component={UpNextScene}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "UP NEXT,",
            headline2: "AUTOMATIC.",
            support: "You send each match.",
            courtsSrc: "rallyo/screens/desktop/demo-open-play-host-courts.png",
            playerUpNextSrc: "rallyo/screens/mobile/player-upnext-crop.png",
          }}
        />
        <Composition
          id="Rallyo-S08-WhoWon"
          component={WhoWonScene}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            chipSender: "MG",
            chipText: "Who won last night?",
            headline1: "CLEAR",
            headline2: "WINNERS.",
            clipSrc: "rallyo/clips/open-play-who-won.mp4",
            podiumSrc: "rallyo/screens/mobile/podium-demo-crop.png",
          }}
        />
        <Composition
          id="Rallyo-S09-Tournament"
          component={TournamentScene}
          durationInFrames={165}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            chipSender: "BE",
            chipText: "Where's the bracket?",
            headline1: "TOURNAMENT?",
            headline2: "AUTO-CALL ON.",
            secondLine1: "WINNERS",
            secondLine2: "MOVE UP.",
            consoleSrc: "rallyo/screens/desktop/host-tournament-console-davao-fall-classic-full.png",
            bracketSrc: "rallyo/screens/desktop/demo-tournament-bracket-mhi.png",
          }}
        />
        <Composition
          id="Rallyo-S10a-PlayersFind"
          component={PlayersFindScene}
          durationInFrames={105}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "FIND A",
            headline2: "GAME.",
            osmCredit: "© OpenStreetMap contributors",
            mapSrc: "rallyo/screens/players/find-map.png",
            previewSrc: "rallyo/screens/players/find-map-preview.png",
          }}
        />
        <Composition
          id="Rallyo-S10b-PlayersJoin"
          component={PlayersJoinScene}
          durationInFrames={105}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "JOIN,",
            headline2: "PAY THE HOST.",
            support: "GCash or cash.",
            sheetSrc: "rallyo/screens/players/join-request-sheet.png",
            receiptSrc: "rallyo/screens/players/pay-gcash-receipt.png",
          }}
        />
        <Composition
          id="Rallyo-S10c-PlayersId"
          component={PlayersIdScene}
          durationInFrames={135}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "NO APP.",
            headline2: "NO PASSWORD.",
            support: "Player ID in about 20 seconds.",
            chooserSrc: "rallyo/screens/players/id-chooser.png",
            almostInSrc: "rallyo/screens/players/id-almost-in.png",
            cardSrc: "rallyo/screens/players/id-card-games.png",
          }}
        />
        <Composition
          id="Rallyo-S10d-PlayersLive"
          component={PlayersLiveScene}
          durationInFrames={240}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            upLine1: "YOU'RE",
            upLine2: "UP!",
            rankLine1: "SEE WHERE",
            rankLine2: "YOU RANK.",
            rankSupport: "Rallyo ratings only.",
            closeLine1: "FREE FOR",
            closeLine2: "PLAYERS.",
            liveSrc: "rallyo/screens/players/live-on-court.png",
            standingsSrc: "rallyo/screens/players/standings-rallyo.png",
            podiumSrc: "rallyo/screens/players/results-podium.png",
          }}
        />
        <Composition
          id="Rallyo-S11-Offer"
          component={OfferScene}
          durationInFrames={165}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            badge: "FOR HOSTS",
            hero: "FREE",
            heroSub: "DURING PRE-LAUNCH.",
            supportLine1: "Open plays, tournaments,",
            supportLine2: "every feature.",
            fanSrcs: [
              "rallyo/screens/mobile/new-event-sheet-safe.png",
              "rallyo/screens/mobile/host-checkin.png",
              "rallyo/screens/mobile/podium-demo-crop.png",
              "rallyo/screens/mobile/host-up-next.png",
              "rallyo/screens/mobile/player-live-crop.png",
            ],
            photoSrc: "rallyo/photos/ph-open-play-night.webp",
            photoEnabled: true,
          }}
        />
        <Composition
          id="Rallyo-S12-Cta"
          component={RallyoCtaScene}
          durationInFrames={165}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline1: "USE RALLYO",
            headline2: "WHILE IT'S FREE.",
            url: "rallyo.ph",
            support: "Website. No app needed.",
            logoSrc: "rallyo/brand/rallyo-logo.png",
            photoSrc: "rallyo/photos/ph-paddle-tap.webp",
            photoEnabled: true,
          }}
        />
      </Folder>

      {/* Each preview: scene A 30 f → the reel's own presentation + timing (15 f) → scene B 30 f. */}
      <Folder name="Rallyo-Transitions">
        <Composition
          id="Rallyo-T01-CircleReveal"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "circleReveal" }}
        />
        <Composition
          id="Rallyo-T03-ZoomThrough"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "zoomThrough" }}
        />
        <Composition
          id="Rallyo-T04-SlideRight"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "slideRight" }}
        />
        <Composition
          id="Rallyo-T05-WipeLeft"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "wipeLeft" }}
        />
        <Composition
          id="Rallyo-T06-Whip"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "whip" }}
        />
        <Composition
          id="Rallyo-T07-PushCut"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "pushCut" }}
        />
        <Composition
          id="Rallyo-T08-SlideBottom"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "slideBottom" }}
        />
        <Composition
          id="Rallyo-T10-LimeFlood"
          component={TransitionPreview}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ cutId: "limeFlood" }}
        />
      </Folder>

      <Folder name="Rallyo-Elements">
        <Composition
          id="Rallyo-PhoneFrame"
          component={PhoneFrame}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ screenX: 131, screenY: 600, screenW: 720, label: "PhoneFrame" }}
        />
        <Composition
          id="Rallyo-PhoneFan"
          component={PhoneFan}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            screens: [
              { src: "rallyo/screens/mobile/new-event-sheet-safe.png" },
              { src: "rallyo/screens/mobile/host-checkin.png" },
              { src: "rallyo/screens/mobile/podium-demo-crop.png" },
              { src: "rallyo/screens/mobile/host-up-next.png" },
              { src: "rallyo/screens/mobile/player-live-crop.png", offsetY: 140 },
            ],
            enterAt: 18,
            style: { backgroundColor: "#0B130D" },
          }}
        />
        <Composition
          id="Rallyo-LaptopFrame"
          component={LaptopFrame}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ screenX: 71, screenY: 590, screenW: 840, showDeck: true, label: "LaptopFrame" }}
        />
        <Composition
          id="Rallyo-DeviceCombo"
          component={DeviceCombo}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            arrangement: "reveal",
            laptopSrc: "rallyo/screens/desktop/home.png",
            phoneSrc: "rallyo/screens/mobile/home.png",
            backgroundColor: "#0B130D",
          }}
        />
        <Composition
          id="Rallyo-ScreenImage"
          component={ScreenImage}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ src: "rallyo/screens/mobile/host-event-rookie-cup.png", sourceW: 1170, sourceH: 2532 }}
        />
        <Composition
          id="Rallyo-ScrollShot"
          component={ScrollShot}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            src: "rallyo/screens/desktop/host-tournament-console-davao-fall-classic-full.png",
            imageW: 2880,
            imageH: 3118,
            windowH: 1800,
            maxScrollY: 1318,
            scrollMoves: [
              { start: 0, end: 0, y: 0 },
              { start: 30, end: 48, y: 1300 },
            ],
            style: { scale: 0.375, transformOrigin: "0px 0px" },
          }}
        />
        <Composition
          id="Rallyo-ScreenClip"
          component={ScreenClip}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ src: "rallyo/clips/open-play-who-won.mp4", sourceW: 1170, sourceH: 2532 }}
        />
        <Composition
          id="Rallyo-ScreenSwipe"
          component={ScreenSwipe}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            at: 24,
            frames: 12,
            direction: "from-right",
            smear: true,
            boxW: 1170,
            boxH: 2532,
            style: { scale: 0.6, transformOrigin: "0px 0px" },
          }}
        />
        <Composition
          id="Rallyo-CameraRig"
          component={CameraRig}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            debug: true,
            previewSrc: "rallyo/screens/mobile/host-event-rookie-cup.png",
            screen: { x: 131, y: 600, k: 0.6154 },
            moves: [
              { start: 0, end: 0, sourceRect: { x: 0, y: 0, w: 1170, h: 2532 }, frameRect: { x: 131, y: 600, w: 720, h: 1558 } },
              { start: 30, end: 54, sourceRect: { x: 40, y: 890, w: 1090, h: 550 }, frameRect: { x: 92, y: 610, w: 798, h: 403 } },
            ],
          }}
        />
        <Composition
          id="Rallyo-Stage"
          component={Stage}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ clipTop: 570, topFade: 24, scrimTop: 1290, scrimBottom: 1590, color: "#0B130D" }}
        />
        <Composition
          id="Rallyo-Cursor"
          component={Cursor}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            path: [
              { at: 6, x: 930, y: 1060 },
              { at: 24, x: 760, y: 1025 },
            ],
            pressAt: [36],
            size: 56,
            color: "#FFFFFF",
          }}
        />
        <Composition
          id="Rallyo-TapRipple"
          component={TapRipple}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ x: 491, y: 955, at: 12, dotLead: 3, ringColor: "#C8F23A" }}
        />
        <Composition
          id="Rallyo-ChaosChip"
          component={ChaosChip}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ sender: "JU", text: "When? How much? Who's in?", strikeAt: 36 }}
        />
        <Composition
          id="Rallyo-StrikeLine"
          component={StrikeLine}
          durationInFrames={30}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 66, y: 399, w: 797, h: 40 }, at: 6 }}
        />
        <Composition
          id="Rallyo-Spotlight"
          component={Spotlight}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            stops: [
              { at: 12, rect: { x: 92, y: 776, w: 266, h: 105 } },
              { at: 27, rect: { x: 358, y: 776, w: 266, h: 105 } },
              { at: 42, rect: { x: 624, y: 776, w: 266, h: 105 } },
            ],
            fadeInAt: 6,
            fadeOutAt: 51,
            boxW: 1080,
            boxH: 1920,
          }}
        />
        <Composition
          id="Rallyo-UiTile"
          component={UiTile}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            src: "rallyo/screens/mobile/player-card-masked.png",
            crop: { x: 850, y: 695, w: 270, h: 130 },
            zoom: 1.185,
            radius: 18,
            borderWidth: 2,
            borderColor: "#C8F23A",
            shadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
            fillColor: "#111B14",
            style: { left: 380, top: 883 },
          }}
        />
        <Composition
          id="Rallyo-PinPulse"
          component={PinPulse}
          durationInFrames={30}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            x: 540,
            y: 960,
            at: 3,
            frames: 18,
            radiusStart: 24,
            radiusEnd: 64,
            ringWidth: 4,
            peak: 0.9,
            core: 0.55,
            color: "#C8F23A",
          }}
        />
        <Composition
          id="Rallyo-LabelPill"
          component={LabelPill}
          durationInFrames={30}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ label: "PRE-LAUNCH", variant: "kicker", style: { left: 72, top: 544 } }}
        />
        <Composition
          id="Rallyo-RoughRing"
          component={RoughRing}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 326, y: 659, w: 205, h: 102 }, at: 6, frames: 18, tone: "lime", strokeWidth: 6 }}
        />
        <Composition
          id="Rallyo-RoughBox"
          component={RoughBox}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 139, y: 603, w: 722, h: 133 }, at: 6, frames: 15, tone: "lime", strokeWidth: 6 }}
        />
        <Composition
          id="Rallyo-RoughUnderline"
          component={RoughUnderline}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 117, y: 718, w: 187, h: 30 }, at: 6, frames: 10, tone: "lime", strokeWidth: 6 }}
        />
        <Composition
          id="Rallyo-Highlighter"
          component={Highlighter}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 612, y: 724, w: 172, h: 37 }, at: 6, frames: 16, tone: "tint" }}
        />
        <Composition
          id="Rallyo-RowFlash"
          component={RowFlash}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 145, y: 940, w: 692, h: 58 }, at: 6, frames: 13, tone: "tint", peak: 0.75 }}
        />
        <Composition
          id="Rallyo-Connector"
          component={Connector}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            d: "M 474 900 C 496 900, 496 884, 518 884",
            at: 6,
            frames: 15,
            strokeWidth: 6,
            boxW: 1080,
            boxH: 1920,
          }}
        />
        <Composition
          id="Rallyo-RiseMask"
          component={RiseMask}
          durationInFrames={45}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ rect: { x: 239, y: 870, w: 504, h: 200 }, at: 6, frames: 18, boxW: 1080, boxH: 1920 }}
        />
        <Composition
          id="Rallyo-Confetti"
          component={Confetti}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ area: { x: 92, y: 590, w: 798, h: 480 }, at: 6, frames: 33, count: 24, seed: "preview" }}
        />
        <Composition
          id="Rallyo-ChatScreen"
          component={ChatScreen}
          durationInFrames={135}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            messages: [
              { at: 0, sender: "KT", text: "Who's in for Thursday?" },
              { at: 0, sender: "KT", text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___" },
              { at: 0, sender: "MG", text: "+1" },
              { at: 9, sender: "BE", text: "+1, bringing a guest" },
              { at: 15, sender: "DX", text: "Who's next on Court 2??" },
              { at: 21, sender: "AN", text: "Who hasn't paid yet?" },
              { at: 27, sender: "JU", text: "When? How much? Who's in?" },
              { at: 33, sender: "RC", text: "Joining! Cash or GCash?" },
              { at: 39, sender: "MG", text: "Who won last night?" },
              { at: 45, sender: "BE", text: "Where's the bracket?" },
              { at: 51, sender: "JU", text: "+1" },
              { at: 57, sender: "KT", text: "How many are here??" },
              { at: 63, sender: "RC", text: "Court 3 free?" },
              { at: 66, sender: "AN", text: "+1" },
              { at: 69, sender: "MG", text: "+1" },
              { at: 72, sender: "DX", text: "who's next?!" },
              { at: 75, sender: "BE", text: "+1" },
              { at: 78, sender: "KT", text: "list??" },
              { at: 81, sender: "RC", text: "+2" },
              { at: 84, sender: "JU", text: "+1" },
              { at: 87, sender: "AN", text: "???" },
            ],
            anchorSu: 840,
            keyboard: true,
            state: "chaos",
            title: "Thursday Open Play",
            members: "47 members",
            unreadBy: 87,
            rush: [87, 108],
            freezeAt: 108,
            style: { scale: 0.6154, transformOrigin: "0px 0px", left: 131, top: 600 },
          }}
        />
        <Composition
          id="Rallyo-ChatScreen-Calm"
          component={ChatScreen}
          durationInFrames={135}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            messages: [
              { at: 0, sender: "KT", text: "Who's in for Thursday?" },
              { at: 0, sender: "KT", text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___" },
              { at: 0, sender: "MG", text: "+1" },
              { at: 9, sender: "BE", text: "+1, bringing a guest" },
              { at: 15, sender: "DX", text: "Who's next on Court 2??" },
              { at: 21, sender: "AN", text: "Who hasn't paid yet?" },
              { at: 27, sender: "JU", text: "When? How much? Who's in?" },
              { at: 33, sender: "RC", text: "Joining! Cash or GCash?" },
              { at: 39, sender: "MG", text: "Who won last night?" },
              { at: 45, sender: "BE", text: "Where's the bracket?" },
            ],
            anchorSu: 1740,
            keyboard: false,
            state: "calm",
            title: "Thursday Open Play",
            members: "47 members",
            freezeAt: 9999,
            outgoing: { at: 45, text: "", blurVenue: true, linkDisplay: "https://rallyo.ph/events/…" },
            style: { scale: 0.6154, transformOrigin: "0px 0px", left: 131, top: 140 },
          }}
        />
        <Composition
          id="Rallyo-ChapterWipe"
          component={ChapterWipe}
          durationInFrames={48}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ num: "01", label: "FOR HOSTS", railLabel: "01 · HOSTS", railW: 424, railTop: 1170 }}
        />
        <Composition
          id="Rallyo-ChapterWipe-02"
          component={ChapterWipe}
          durationInFrames={48}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ num: "02", label: "FOR PLAYERS", railLabel: "02 · PLAYERS", railW: 394, railTop: 1170 }}
        />
        <Composition
          id="Rallyo-ChapterRail"
          component={ChapterRail}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ label: "01 · HOSTS", railW: 424, railTop: 1170, dotsAt: [3, 12, 21, 30, 39, 48, 57], fadeOutAt: 78 }}
        />
        <Composition
          id="Rallyo-ChapterRail-02"
          component={ChapterRail}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ label: "02 · PLAYERS", railW: 394, railTop: 1170, dotsAt: [3, 21, 39, 57], fadeOutAt: 78 }}
        />
        <Composition
          id="Rallyo-ReelsGuide"
          component={ReelsGuide}
          durationInFrames={30}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ showReadable: true, showStage: true, showTextStack: true, showFrameLabel: true }}
        />
      </Folder>
      <Folder name="Rallyo-Carousel">
        {/* 8-card 1:1 carousel ad (briefs/rallyo-carousel.md v1). Frame n renders card n + 1; defaultProps = briefs/rallyo-carousel.props.json. */}
        <Composition
          id="RallyoCarousel"
          component={RallyoCarousel}
          durationInFrames={8}
          fps={30}
          width={1080}
          height={1080}
          schema={rallyoCarouselSchema}
          defaultProps={{
            colors: {
              night: "#0B130D",
              nightCard: "#111B14",
              lime: "#C8F23A",
              limeTint: "#E3F3A6",
              paper: "#EEEFE8",
              fg: "#EEF1EA",
              fg2: "#C3CBC1",
            },
            grain: false,
            brand: { name: "Rallyo", url: "rallyo.ph", markSrc: "rallyo/brand/rallyo-mark.png" },
            ads: {
              primaryText: "Hosting open plays? Skip the group chat chaos. Rallyo makes it easy, and it's free during pre-launch.",
              ctaButton: "Learn More",
              ctaAlternative: "Apply Now",
              destination: "https://rallyo.ph",
              displayLink: "rallyo.ph",
            },
            cards: {
              hook: {
                railLabel: "",
                headline: ["HOSTING OPEN PLAYS?", "SKIP THE GROUP", "CHAT CHAOS."],
                support: "Easy to use. ",
                supportAccent: "Free during pre-launch.",
                adHeadline: "Skip the group chat chaos",
                adDescription: "Easy to use",
                chatTitle: "Thursday Open Play",
                chatMembers: "47 members",
                chaos: [
                  { at: 0, sender: "KT", text: "Who's in for Thursday?" },
                  { at: 0, sender: "KT", text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___" },
                  { at: 0, sender: "BE", text: "+1, bringing a guest" },
                  { at: 0, sender: "DX", text: "Who's next on Court 2??" },
                  { at: 0, sender: "AN", text: "Who hasn't paid yet?" },
                  { at: 0, sender: "RC", text: "Joining! Cash or GCash?" },
                  { at: 0, sender: "JU", text: "When? How much? Who's in?" },
                  { at: 0, sender: "BE", text: "Where's the bracket?" },
                  { at: 0, sender: "DX", text: "who's next?!" },
                  { at: 0, sender: "AN", text: "???" },
                ],
                ownPicks: [1, 4],
              },
              publish: {
                railLabel: "FOR HOSTS",
                headline: ["ONE FORM.", "ONE POST."],
                support: "Publish, then paste it in your group chat.",
                supportAccent: "",
                adHeadline: "One form, one group-chat post",
                adDescription: "Publish, then share",
                chatTitle: "Thursday Open Play",
                chatMembers: "47 members",
                history: [
                  { at: 0, sender: "KT", text: "Who's in for Thursday?" },
                  { at: 0, sender: "KT", text: "Slot list: 1. Migs 2. Bea 3. Jun 4. ___" },
                  { at: 0, sender: "JU", text: "+1" },
                ],
                postSrc: "rallyo/data/rookie-cup-post.txt",
                linkDisplay: "https://rallyo.ph/events/…",
                blurVenue: true,
              },
              pay: {
                railLabel: "FOR HOSTS",
                headline: ["YOU APPROVE.", "THEY PAY YOU."],
                support: "GCash or cash, straight to you.",
                supportAccent: "",
                adHeadline: "Players pay you directly",
                adDescription: "GCash or cash",
              },
              checkIn: {
                railLabel: "FOR HOSTS",
                headline: ["CHECK-IN", "BY 4-DIGIT CODE."],
                support: "Players show it. You type it.",
                supportAccent: "",
                adHeadline: "Check players in by 4-digit code",
                adDescription: "See who's here",
              },
              upNext: {
                railLabel: "FOR HOSTS",
                headline: ["UP NEXT,", "AUTOMATIC."],
                support: "You send each match.",
                supportAccent: "",
                adHeadline: "Up next, automatic. You hit Play",
                adDescription: "You send each match",
              },
              tournaments: {
                railLabel: "FOR HOSTS",
                headline: ["TOURNAMENT?", "AUTO-CALL ON."],
                support: "Winners move up the bracket.",
                supportAccent: "",
                adHeadline: "Tournaments: Auto-call on",
                adDescription: "Winners move up",
              },
              players: {
                railLabel: "FOR PLAYERS",
                headline: ["NO APP.", "NO PASSWORD."],
                support: "Player ID in about 20 seconds.",
                supportAccent: "",
                adHeadline: "Players: no app, no password",
                adDescription: "Free for players",
              },
              cta: {
                railLabel: "",
                headline: ["USE RALLYO", "WHILE IT'S FREE."],
                support: "Website. No app needed.",
                supportAccent: "",
                adHeadline: "Use Rallyo while it's free",
                adDescription: "rallyo.ph",
                url: "rallyo.ph",
                offer: "Free for hosts during pre-launch.",
              },
            },
            screens: {
              mobileHome: "rallyo/screens/mobile/home.png",
              newEventSheet: "rallyo/screens/mobile/new-event-sheet-safe.png",
              requestPayment: "rallyo/screens/mobile/request-payment-safe.png",
              idCardGames: "rallyo/screens/players/id-card-games.png",
              idAlmostIn: "rallyo/screens/players/id-almost-in.png",
              hostCheckin: "rallyo/screens/mobile/host-checkin.png",
              playerCard: "rallyo/screens/mobile/player-card-masked.png",
              hostUpNext: "rallyo/screens/mobile/host-up-next.png",
              tournamentConsole: "rallyo/screens/desktop/host-tournament-console-davao-fall-classic-full.png",
              bracket: "rallyo/screens/desktop/demo-tournament-bracket-mhi.png",
            },
            photos: { cta: "rallyo/photos/ph-paddle-tap.webp", ctaOpacity: 0.1 },
          }}
        />
      </Folder>
    </>
  );
};

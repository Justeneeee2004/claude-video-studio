import { StrikeThrough } from "@remotion/rough-notation";
import type React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";
import { RALLYO_COLORS, RALLYO_FONTS } from "../theme/rallyo";

/**
 * ChaosChip + LabelPill (brief build item 10). Owner: overlays implementer.
 *
 * ChaosChip (brief section 5 "Chaos chip"): 52 px initials avatar (graphite #3A423B, #EEF1EA
 * letters) + graphite chat bubble #2A302B with the hook's exact message, Satoshi 700 44 px, in the
 * chip slot x 72-900, y 286-356 (70 px tall). Slides in from the left over enterAt → enterAt + 10
 * (EASE.out). At strikeAt: a lime rough strike-through (@remotion/rough-notation StrikeThrough,
 * 12 f), a lime ✓ pop (scale .6 → 1, EASE.pop) from strikeAt + 6, then the avatar and bubble fade
 * to 45% while the ✓ stays at full strength.
 *
 * Measured (Satoshi 700 44 px, brief v2.2 section 2): the widest v2.2 chip, "When? How much? Slots left?" (round 3 replaced it with "...Who's in?"),
 * is 612 px, so its bubble ends at x 802. A ✓ after the bubble could cross the 918 safe edge for longer
 * text, so the ✓ pops OVER THE AVATAR (a lime disc with a night SVG check that covers the initials).
 * Every chip stays inside x 72-900 whatever its text.
 *
 * LabelPill (v2.2 badges: S2 PRE-LAUNCH, S11 FOR HOSTS): one pill for every exact-string label. Same
 * anatomy as the house `Badge` (inline-flex pill, radius 999, optional glowing dot) in Rallyo colours/fonts.
 *   variant "kicker":  lime fill, night text, Satoshi 900 44 px UPPERCASE, letter-spacing .08em, 64 px tall
 *                      (PRE-LAUNCH, FOR HOSTS)
 *   variant "label":   lime text on #16241A, 2 px lime border, radius 999, Satoshi 900 48 px, case as given, 78 px tall
 *   variant "outline": lime text, 3 px lime outline, Satoshi 900 44 px UPPERCASE, letter-spacing .1em, 66 px tall
 * Measured widths: PRE-LAUNCH 332 px of text → pill x 72-456; FOR HOSTS 284 px → pill x 72-408.
 * Animate pills at the call site (style opacity / translate / scale with perceptual-scale).
 */

type ChaosChipProps = {
  /** Initials of the hook sender, e.g. "JU". */
  readonly sender: string;
  /** Exact hook message, e.g. "When? How much? Who's in?". */
  readonly text: string;
  /** Local frame of the strike (v2.2: S3 93, S4 93, S5 78, S6 66, S8 93, S9 120). */
  readonly strikeAt: number;
  /** Local frame the slide-in starts (default 0). */
  readonly enterAt?: number;
  readonly enterFrames?: number;
  readonly strikeFrames?: number;
  /** Opacity of the avatar and bubble after the strike (the ✓ stays at 1). */
  readonly settleOpacity?: number;
  readonly avatarColor?: string;
  readonly bubbleColor?: string;
  readonly textColor?: string;
  readonly strikeColor?: string;
  /** Strike stroke in px. */
  readonly strikeWidth?: number;
  /** rough-notation seed for the strike (deterministic wobble). */
  readonly seed?: number;
  readonly style?: React.CSSProperties;
};

const ChaosChipInner: React.FC<ChaosChipProps> = ({
  sender,
  text,
  strikeAt,
  enterAt = 0,
  enterFrames = 10,
  strikeFrames = 12,
  settleOpacity = 0.45,
  avatarColor = RALLYO_COLORS.graphite,
  bubbleColor = RALLYO_COLORS.graphiteBubble,
  textColor = RALLYO_COLORS.fg,
  strikeColor = RALLYO_COLORS.lime,
  strikeWidth = 6,
  seed = 7,
  style,
}) => {
  const frame = useCurrentFrame();
  const enterLen = Math.max(1, enterFrames);
  const strikeLen = Math.max(1, strikeFrames);
  const checkAt = strikeAt + 6;
  const settled = interpolate(
    frame,
    [strikeAt + strikeLen, strikeAt + strikeLen + 12],
    [1, settleOpacity],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 286,
        height: 70,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(frame, [enterAt, enterAt + enterLen], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: `${interpolate(
            frame,
            [enterAt, enterAt + enterLen],
            [-120, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          )}px 0px`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 52,
            height: 52,
            flexShrink: 0,
            alignSelf: "flex-end",
            marginBottom: 2,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: avatarColor,
              color: textColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: RALLYO_FONTS.ui,
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: "0.02em",
              lineHeight: 1,
              opacity: settled,
            }}
          >
            {sender}
          </div>
          <div
            style={{
              position: "absolute",
              left: -3,
              top: -3,
              width: 58,
              height: 58,
              borderRadius: "50%",
              backgroundColor: strikeColor,
              boxShadow: `0 0 0 3px ${RALLYO_COLORS.night}, 0 0 22px rgba(200, 242, 58, 0.45)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: interpolate(frame, [checkAt, checkAt + 3], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              scale: interpolate(frame, [checkAt, checkAt + 12], [0.6, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 14, stiffness: 160 }),
                output: "perceptual-scale",
              }),
            }}
          >
            <svg
              width={34}
              height={34}
              viewBox="0 0 24 24"
              style={{ overflow: "visible" }}
            >
              <path
                d="M4.5 12.8 L9.6 17.6 L19.5 6.8"
                fill="none"
                stroke={RALLYO_COLORS.night}
                strokeWidth={3.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div
          style={{
            height: 70,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            padding: "0px 26px",
            borderRadius: "35px 35px 35px 10px",
            backgroundColor: bubbleColor,
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
            color: textColor,
            fontFamily: RALLYO_FONTS.ui,
            fontWeight: 700,
            fontSize: 44,
            lineHeight: 1,
            whiteSpace: "nowrap",
            opacity: settled,
          }}
        >
          {/* The strike runs through the tracker's centre: paddingBottom 14 drops it 7 px below the
              em-box centre (Satoshi's x-height middle); the relative top re-centres the text. */}
          <span style={{ position: "relative", top: 7 }}>
            <StrikeThrough
              name="Chip strike"
              progress={interpolate(
                frame,
                [strikeAt, strikeAt + strikeLen],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              )}
              color={strikeColor}
              strokeWidth={strikeWidth}
              iterations={2}
              roughness={1.2}
              bowing={0.6}
              maxRandomnessOffset={2}
              seed={seed}
              style={{ paddingBottom: 14 }}
            >
              {text}
            </StrikeThrough>
          </span>
        </div>
      </div>
    </div>
  );
};

export const ChaosChip = Interactive.create({
  Component: ChaosChipInner,
  layout: "none",
  schema: {
    sender: { type: "string", default: "JU", description: "Initials" },
    text: { type: "string", default: "", description: "Message" },
    strikeAt: {
      type: "number",
      default: 108,
      min: 0,
      step: 3,
      integer: true,
      description: "Strike frame",
      hiddenFromList: false,
    },
    enterAt: {
      type: "number",
      default: 0,
      min: 0,
      step: 3,
      integer: true,
      description: "Enter frame",
      hiddenFromList: false,
    },
    settleOpacity: {
      type: "number",
      default: 0.45,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Settled opacity",
      hiddenFromList: false,
    },
    strikeColor: {
      type: "color",
      default: "#C8F23A",
      description: "Strike + check",
    },
  } as const satisfies InteractivitySchema,
});

type LabelPillProps = {
  /** Exact on-screen wording (never paraphrased). */
  readonly label: string;
  readonly variant?: "kicker" | "label" | "outline";
  readonly limeColor?: string;
  readonly nightColor?: string;
  readonly fillColor?: string;
  /** Badge-style glowing dot before the label (off by default: labels are plain quotes). */
  readonly dot?: boolean;
  readonly style?: React.CSSProperties;
};

const LabelPillInner: React.FC<LabelPillProps> = ({
  label,
  variant = "kicker",
  limeColor = RALLYO_COLORS.lime,
  nightColor = RALLYO_COLORS.night,
  fillColor = RALLYO_COLORS.nightRaised,
  dot = false,
  style,
}) => {
  const kicker = variant === "kicker";
  const outline = variant === "outline";
  const tracking = kicker ? "0.08em" : outline ? "0.1em" : "0em";
  const ink = kicker ? nightColor : limeColor;
  return (
    <div
      style={{
        position: "absolute",
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        boxSizing: "border-box",
        height: kicker ? 64 : outline ? 66 : 78,
        padding: kicker ? "0px 26px" : "0px 30px",
        borderRadius: 999,
        backgroundColor: kicker
          ? limeColor
          : outline
            ? "rgba(0, 0, 0, 0)"
            : fillColor,
        border: kicker ? "none" : `${outline ? 3 : 2}px solid ${limeColor}`,
        boxShadow: kicker ? "0 10px 28px rgba(0, 0, 0, 0.35)" : "none",
        color: ink,
        fontFamily: RALLYO_FONTS.ui,
        fontWeight: 900,
        fontSize: variant === "label" ? 48 : 44,
        lineHeight: 1,
        letterSpacing: tracking,
        textTransform: variant === "label" ? "none" : "uppercase",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: ink,
            boxShadow: kicker ? "none" : `0 0 18px ${limeColor}`,
            flexShrink: 0,
          }}
        />
      ) : null}
      <span style={{ marginRight: `-${tracking}`, paddingTop: 2 }}>
        {label}
      </span>
    </div>
  );
};

export const LabelPill = Interactive.create({
  Component: LabelPillInner,
  layout: "none",
  schema: {
    label: { type: "string", default: "", description: "Exact label" },
    variant: {
      type: "enum",
      default: "kicker",
      description: "Variant",
      variants: { kicker: {}, label: {}, outline: {} },
    },
    dot: { type: "boolean", default: false, description: "Glowing dot" },
    limeColor: { type: "color", default: "#C8F23A", description: "Lime" },
    nightColor: { type: "color", default: "#0B130D", description: "Night" },
    fillColor: { type: "color", default: "#16241A", description: "Label fill" },
  } as const satisfies InteractivitySchema,
});

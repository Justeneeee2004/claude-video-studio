import type React from "react";
import { Interactive, useCurrentFrame, type InteractivitySchema } from "remotion";
import { sceneAt } from "../lib/rallyo-timeline";
import {
  BOOST_ZONE,
  HEADER_ZONE,
  RAIL_BAND,
  RAIL_BAND_FALLBACK,
  RAIL_ZONE,
  READABLE_WINDOW,
  SAFE_BOX,
  STAGE,
  SUPPORT_SLOT,
  TEXT_STACK,
  type Edges,
} from "../lib/reels";
import { RALLYO_FONTS } from "../theme/rallyo";

type ReelsGuideProps = {
  /** Draw the readable window (pushed UI targets, x 92-890 y 590-1070). */
  readonly showReadable?: boolean;
  /** Draw the stage clip lines (y 520 / 570) and scrim band (1290-1590). */
  readonly showStage?: boolean;
  /** Draw the text slots of the current scene: chip + headline slot A, or slot B + support (S7, S10a–d). */
  readonly showTextStack?: boolean;
  /** Draw the chapter rail band y 1170-1236 (solid) and its fallback y 1100-1166 (dotted, open item e). */
  readonly showRail?: boolean;
  /** Print "abs f / scene / local f" in the header band (QA stills). */
  readonly showFrameLabel?: boolean;
  readonly style?: React.CSSProperties;
};

const box = (e: Edges): React.CSSProperties => ({
  position: "absolute",
  left: e.left,
  top: e.top,
  width: e.right - e.left,
  height: e.bottom - e.top,
});

const tag: React.CSSProperties = {
  position: "absolute",
  fontFamily: "Consolas, Menlo, monospace",
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1,
  padding: "4px 8px",
  borderRadius: 6,
  whiteSpace: "nowrap",
};

/** Scenes whose headline sits in slot B (no chip; brief 5.1): S7 up next and the four players beats S10a–d. */
const SLOT_B_SCENES: readonly string[] = ["upNext", "playersFind", "playersJoin", "playersId", "playersLive"];
/** Slot B scenes that also set a support line in SUPPORT_SLOT (y 486–546): S7, S10b, S10c, S10d. */
const SUPPORT_SCENES: readonly string[] = ["upNext", "playersJoin", "playersId", "playersLive"];

// QA overlay (v2.3): Reels safe zones, rail band and the current scene's text slots. Render only when
// props.showGuides is true. No caption plate: v2.2 has no voice and no speech captions.
const ReelsGuideInner: React.FC<ReelsGuideProps> = ({
  showReadable = true,
  showStage = true,
  showTextStack = true,
  showRail = true,
  showFrameLabel = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { scene, local } = sceneAt(frame);
  const slotB = SLOT_B_SCENES.includes(scene.id);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <div style={{ ...box(HEADER_ZONE), backgroundColor: "rgba(255, 64, 64, 0.16)" }} />
      <div style={{ ...box(BOOST_ZONE), backgroundColor: "rgba(255, 64, 64, 0.16)" }} />
      <div style={{ ...box(RAIL_ZONE), backgroundColor: "rgba(255, 160, 0, 0.18)" }} />
      <div style={{ ...tag, left: 922, top: 1260, color: "#FFB000", backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
        rail
      </div>
      <div style={{ ...tag, left: 12, top: 1860, color: "#FF6B6B", backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
        boosted bottom zone (y ≥ 1248)
      </div>

      <div style={{ ...box(SAFE_BOX), outline: "3px dashed #C8F23A", outlineOffset: -3 }} />
      <div style={{ ...tag, left: SAFE_BOX.left + 6, top: SAFE_BOX.bottom - 30, color: "#0B130D", backgroundColor: "#C8F23A" }}>
        safe x 65-918 · y 270-1248
      </div>

      {showRail ? (
        <>
          <div
            style={{
              ...box(RAIL_BAND_FALLBACK),
              outline: "2px dotted rgba(34, 211, 238, 0.6)",
              outlineOffset: -2,
              borderRadius: 33,
            }}
          />
          <div
            style={{
              ...box(RAIL_BAND),
              outline: "3px solid #22D3EE",
              outlineOffset: -3,
              borderRadius: 33,
              backgroundColor: "rgba(34, 211, 238, 0.06)",
            }}
          />
          <div
            style={{
              ...tag,
              left: RAIL_BAND.right + 8,
              top: RAIL_BAND.top + 21,
              color: "#0B130D",
              backgroundColor: "#22D3EE",
            }}
          >
            rail y 1170-1236 (fb 1100)
          </div>
        </>
      ) : null}

      {showReadable ? (
        <>
          <div style={{ ...box(READABLE_WINDOW), outline: "2px dashed rgba(255, 255, 255, 0.7)", outlineOffset: -2 }} />
          <div
            style={{
              ...tag,
              left: READABLE_WINDOW.right - 250,
              top: READABLE_WINDOW.top + 6,
              color: "#FFFFFF",
              backgroundColor: "rgba(0, 0, 0, 0.55)",
            }}
          >
            readable 92-890 · 590-1070
          </div>
        </>
      ) : null}

      {showStage ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: STAGE.clipTop,
              borderTop: "2px dotted rgba(255, 255, 255, 0.55)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: STAGE.clipTopHookReveal,
              borderTop: "2px dotted rgba(255, 255, 255, 0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: STAGE.scrimTop,
              height: STAGE.scrimBottom - STAGE.scrimTop,
              outline: "1px dotted rgba(255, 255, 255, 0.35)",
            }}
          />
        </>
      ) : null}

      {showTextStack && slotB ? (
        <>
          <div style={{ ...box(TEXT_STACK.headlineB), outline: "2px solid rgba(242, 139, 122, 0.5)", outlineOffset: -2 }} />
          {SUPPORT_SCENES.includes(scene.id) ? (
            <div style={{ ...box(SUPPORT_SLOT), outline: "2px dashed rgba(242, 139, 122, 0.6)", outlineOffset: -2 }} />
          ) : null}
        </>
      ) : null}
      {showTextStack && !slotB ? (
        <>
          <div style={{ ...box(TEXT_STACK.chip), outline: "2px solid rgba(242, 139, 122, 0.8)", outlineOffset: -2 }} />
          <div style={{ ...box(TEXT_STACK.headline), outline: "2px solid rgba(242, 139, 122, 0.5)", outlineOffset: -2 }} />
        </>
      ) : null}

      {showFrameLabel ? (
        <div
          style={{
            ...tag,
            left: 24,
            top: 120,
            fontSize: 30,
            padding: "8px 14px",
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
        >
          {`f${frame} · ${scene.label} · local ${local}`}
        </div>
      ) : null}
    </div>
  );
};

const reelsGuideSchema = {
  showReadable: { type: "boolean", default: true, description: "Readable window" },
  showStage: { type: "boolean", default: true, description: "Stage lines" },
  showTextStack: { type: "boolean", default: true, description: "Text stack slots" },
  showRail: { type: "boolean", default: true, description: "Chapter rail band" },
  showFrameLabel: { type: "boolean", default: true, description: "Frame label" },
} as const satisfies InteractivitySchema;

export const ReelsGuide = Interactive.create({
  Component: ReelsGuideInner,
  layout: "none",
  schema: reelsGuideSchema,
});

type StubTagProps = {
  readonly label: string;
  readonly style?: React.CSSProperties;
};

/**
 * Temporary marker for not-yet-implemented Rallyo stubs (scenes/elements). Shows the stub name
 * and the local frame. Remove its usages as the real implementations land.
 */
export const StubTag: React.FC<StubTagProps> = ({ label, style }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 1272,
        padding: "8px 16px",
        borderRadius: 10,
        border: "2px dashed #F28B7A",
        backgroundColor: "rgba(11, 19, 13, 0.85)",
        color: "#F28B7A",
        fontFamily: RALLYO_FONTS.ui,
        fontWeight: 700,
        fontSize: 26,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {`STUB · ${label} · local f${frame}`}
    </div>
  );
};

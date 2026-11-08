import type React from "react";
import { Img, Interactive, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { RALLYO_FONTS } from "../theme/rallyo";
import type { ScreenPlacement } from "./CameraRig";

/**
 * Phone mockup with a children slot (brief build item 4). CSS gradients only, no images.
 *
 * Children are laid out in SCREEN UNITS (su) = source px of a 1170x2532 capture; the frame scales
 * that box by k = screenW / 1170 (brief section 5 "Phone base": screen 720x1558 at k 0.6154,
 * x 131-851, screen top y 600, 14 px bezel, radius 64). The root is the phone BODY, absolutely
 * positioned so the SCREEN's top-left lands exactly at (screenX, screenY). Animate it with style
 * translate / rotate / scale; transformOrigin defaults to the body centre (= the screen centre).
 *
 * Layers (back to front): titanium rail (frameColor) → black glass bezel (bezelColor) → screen
 * (screenColor, children in su) → dynamic island (su, PHONE_ISLAND) → glass glare. Side buttons
 * sit outside the body (action + volume on the left, side button on the right). Every size scales
 * with screenW / 720, so the S2 (w 250) and S5 (w 300) phones are the same phone, smaller.
 *
 * With no children the screen shows `previewSrc` (preview compositions); pass previewSrc "" to get
 * the labelled su placeholder instead. Scenes always pass children, so previewSrc never shows there.
 */

export const PHONE_SOURCE = { w: 1170, h: 2532 } as const;

/** Brief section 5 phone base (scenes 3, 4, 6, 8). Scene 1 uses screenY 540; scene 2 screenW 250; scene 5 screenW 300. */
export const PHONE_BASE = { screenX: 131, screenY: 600, screenW: 720, bezel: 14, radius: 64 } as const;

/**
 * Dynamic-island pill in su: centred, 196x58 (iPhone's 3.4:1 shape at ≈ 60% of its size), top 28.
 * It is drawn OVER the screen content, so it is sized to sit in the empty gaps of every Rallyo
 * capture: between the stats "60" (ends x 447) and "4" (starts x 685) of player-upnext-crop,
 * right of the home "Rallyo" wordmark (ends x 430), above the podium "BEGINNER" (starts y 91).
 * Keep readable UI out of x 487-683, y 28-86 su, or pass `island={false}`.
 */
export const PHONE_ISLAND = { x: 487, y: 28, w: 196, h: 58 } as const;

export const phoneK = (screenW: number = PHONE_BASE.screenW): number => screenW / PHONE_SOURCE.w;

/** ScreenPlacement for CameraRig rect moves (rotation ignored). */
export const phonePlacement = (
  screenX: number = PHONE_BASE.screenX,
  screenY: number = PHONE_BASE.screenY,
  screenW: number = PHONE_BASE.screenW,
): ScreenPlacement => ({ x: screenX, y: screenY, k: phoneK(screenW) });

type PhoneFrameProps = {
  /** Screen content in su (a 1170x2532 box): ScreenImage, ScreenClip, ScreenSwipe, ChatScreen, annotations. */
  readonly children?: React.ReactNode;
  /** Canvas x of the screen's left edge. */
  readonly screenX?: number;
  /** Canvas y of the screen's top edge. */
  readonly screenY?: number;
  /** Screen width in canvas px; height = screenW × 2532 / 1170. */
  readonly screenW?: number;
  /** Bezel thickness (rail + glass) in canvas px at screenW 720 (scales with screenW). */
  readonly bezel?: number;
  /** Outer corner radius in canvas px at screenW 720 (scales with screenW). */
  readonly radius?: number;
  /** Black glass around the screen. */
  readonly bezelColor?: string;
  /** Screen fill behind the children. */
  readonly screenColor?: string;
  /** Titanium rail + buttons base colour (sheen is layered on top). */
  readonly frameColor?: string;
  /** Draw the dynamic-island pill (PHONE_ISLAND, su). */
  readonly island?: boolean;
  /** Glass glare strength 0-1 (a soft diagonal sheen at the top-left of the screen). */
  readonly glare?: number;
  /** public/ path shown full-screen when there are no children (previews); "" = labelled placeholder. */
  readonly previewSrc?: string;
  /** Placeholder text when there are no children and no previewSrc. */
  readonly label?: string;
  readonly style?: React.CSSProperties;
};

const PhoneFrameInner: React.FC<PhoneFrameProps> = ({
  children,
  screenX = PHONE_BASE.screenX,
  screenY = PHONE_BASE.screenY,
  screenW = PHONE_BASE.screenW,
  bezel = PHONE_BASE.bezel,
  radius = PHONE_BASE.radius,
  bezelColor = "#050806",
  screenColor = "#111B14",
  frameColor = "#3A413B",
  island = true,
  glare = 0.6,
  previewSrc = "rallyo/screens/mobile/home.png",
  label = "PhoneFrame",
  style,
}) => {
  const k = phoneK(screenW);
  const u = screenW / PHONE_BASE.screenW; // canvas px per "720-phone" px
  const b = bezel * u;
  const r = radius * u;
  const rail = Math.max(1, 3.5 * u);
  const hair = Math.max(1, u);
  const screenH = screenW * (PHONE_SOURCE.h / PHONE_SOURCE.w);
  const bodyW = screenW + 2 * b;
  const bodyH = screenH + 2 * b;
  const btnDepth = Math.max(1.5, 4.5 * u);
  const btnRadius = Math.max(1, 2.5 * u);

  return (
    <div
      style={{
        position: "absolute",
        left: screenX - b,
        top: screenY - b,
        width: bodyW,
        height: bodyH,
        borderRadius: r,
        // Drop shadow only; the body itself is the rail layer below (drawn over the button roots).
        boxShadow: `0 ${10 * u}px ${24 * u}px rgba(0, 0, 0, 0.45), 0 ${40 * u}px ${90 * u}px ${-12 * u}px rgba(0, 0, 0, 0.75)`,
        ...style,
      }}
    >
      {/* Action button (left, short) */}
      <div
        style={{
          position: "absolute",
          left: -btnDepth,
          top: bodyH * 0.17,
          width: btnDepth + rail,
          height: bodyH * 0.036,
          borderRadius: `${btnRadius}px 0px 0px ${btnRadius}px`,
          backgroundColor: frameColor,
          backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.26) 0%, rgba(0, 0, 0, 0.3) 100%)",
          boxShadow: `0 ${hair}px ${2 * u}px rgba(0, 0, 0, 0.45)`,
        }}
      />
      {/* Volume up (left) */}
      <div
        style={{
          position: "absolute",
          left: -btnDepth,
          top: bodyH * 0.245,
          width: btnDepth + rail,
          height: bodyH * 0.062,
          borderRadius: `${btnRadius}px 0px 0px ${btnRadius}px`,
          backgroundColor: frameColor,
          backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.26) 0%, rgba(0, 0, 0, 0.3) 100%)",
          boxShadow: `0 ${hair}px ${2 * u}px rgba(0, 0, 0, 0.45)`,
        }}
      />
      {/* Volume down (left) */}
      <div
        style={{
          position: "absolute",
          left: -btnDepth,
          top: bodyH * 0.327,
          width: btnDepth + rail,
          height: bodyH * 0.062,
          borderRadius: `${btnRadius}px 0px 0px ${btnRadius}px`,
          backgroundColor: frameColor,
          backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.26) 0%, rgba(0, 0, 0, 0.3) 100%)",
          boxShadow: `0 ${hair}px ${2 * u}px rgba(0, 0, 0, 0.45)`,
        }}
      />
      {/* Side button (right, long) */}
      <div
        style={{
          position: "absolute",
          left: bodyW - rail,
          top: bodyH * 0.265,
          width: btnDepth + rail,
          height: bodyH * 0.1,
          borderRadius: `0px ${btnRadius}px ${btnRadius}px 0px`,
          backgroundColor: frameColor,
          backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%)",
          boxShadow: `0 ${hair}px ${2 * u}px rgba(0, 0, 0, 0.45)`,
        }}
      />
      {/* Titanium rail = the body (drawn over the button roots so the edge stays continuous) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          backgroundColor: frameColor,
          backgroundImage:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.06) 16%, rgba(0, 0, 0, 0.28) 44%, rgba(255, 255, 255, 0.12) 68%, rgba(0, 0, 0, 0.4) 100%)",
          boxShadow: `inset 0 0 0 ${hair}px rgba(255, 255, 255, 0.16)`,
        }}
      />
      {/* Black glass bezel */}
      <div
        style={{
          position: "absolute",
          left: rail,
          top: rail,
          width: bodyW - 2 * rail,
          height: bodyH - 2 * rail,
          borderRadius: Math.max(0, r - rail),
          backgroundColor: bezelColor,
          boxShadow: `inset 0 0 0 ${hair}px rgba(255, 255, 255, 0.07), inset 0 ${2 * u}px ${3 * u}px rgba(255, 255, 255, 0.05)`,
        }}
      />
      {/* Screen */}
      <div
        style={{
          position: "absolute",
          left: b,
          top: b,
          width: screenW,
          height: screenH,
          borderRadius: Math.max(0, r - b),
          overflow: "hidden",
          backgroundColor: screenColor,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PHONE_SOURCE.w,
            height: PHONE_SOURCE.h,
            transformOrigin: "0px 0px",
            scale: k,
          }}
        >
          {children ??
            (previewSrc ? (
              <Img
                name="Preview screenshot"
                src={asset(previewSrc)}
                style={{ position: "absolute", left: 0, top: 0, width: PHONE_SOURCE.w, height: PHONE_SOURCE.h }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "8px dashed rgba(200, 242, 58, 0.5)",
                  color: "rgba(238, 241, 234, 0.7)",
                  fontFamily: RALLYO_FONTS.ui,
                  fontWeight: 700,
                  fontSize: 72,
                  textAlign: "center",
                }}
              >
                {`${label} · 1170x2532 su`}
              </div>
            ))}
          {island ? (
            <div
              style={{
                position: "absolute",
                left: PHONE_ISLAND.x,
                top: PHONE_ISLAND.y,
                width: PHONE_ISLAND.w,
                height: PHONE_ISLAND.h,
                borderRadius: PHONE_ISLAND.h / 2,
                backgroundColor: "#000000",
                boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Front camera lens */}
              <div
                style={{
                  position: "absolute",
                  left: PHONE_ISLAND.w - PHONE_ISLAND.h / 2 - 12,
                  top: PHONE_ISLAND.h / 2 - 12,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundImage:
                    "radial-gradient(circle at 36% 34%, rgba(120, 140, 190, 0.55) 0%, rgba(30, 38, 66, 0.9) 26%, #05070C 58%, #000000 100%)",
                  boxShadow: "0 0 0 2px rgba(24, 28, 26, 0.9)",
                }}
              />
            </div>
          ) : null}
        </div>
        {/* Glass: recessed edge + glare (canvas px, above the content) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: Math.max(0, r - b),
            boxShadow: `inset 0 0 ${2 * u}px ${hair}px rgba(0, 0, 0, 0.55)`,
            backgroundImage:
              "linear-gradient(118deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.035) 24%, rgba(255, 255, 255, 0) 40%)",
            opacity: glare,
          }}
        />
      </div>
    </div>
  );
};

const phoneFrameSchema = {
  screenX: { type: "number", default: 131, step: 1, description: "Screen x", hiddenFromList: false },
  screenY: { type: "number", default: 600, step: 1, description: "Screen y", hiddenFromList: false },
  screenW: { type: "number", default: 720, min: 50, step: 1, description: "Screen width", hiddenFromList: false },
  bezelColor: { type: "color", default: "#050806", description: "Bezel" },
  frameColor: { type: "color", default: "#3A413B", description: "Rail + buttons" },
  island: { type: "boolean", default: true, description: "Dynamic island" },
  glare: { type: "number", default: 0.6, min: 0, max: 1, step: 0.05, description: "Glass glare", hiddenFromList: false },
  previewSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/home.png", description: "Preview screenshot (no children)" },
  label: { type: "string", default: "PhoneFrame", description: "Placeholder label" },
} as const satisfies InteractivitySchema;

export const PhoneFrame = Interactive.create({
  Component: PhoneFrameInner,
  layout: "none",
  schema: phoneFrameSchema,
});

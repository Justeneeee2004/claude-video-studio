import type React from "react";
import { Img, Interactive, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { RALLYO_COLORS, RALLYO_FONTS } from "../theme/rallyo";
import type { ScreenPlacement } from "./CameraRig";
import { PhoneFrame } from "./PhoneFrame";

/**
 * Laptop mockup: bezel, camera dot, hinge, deck, children slot (brief build item 5).
 * CSS gradients only, no images.
 *
 * Children are laid out in SOURCE px of a 2880x1800 desktop capture; the screen scales that box
 * by k = screenW / 2880 (brief section 5 "Laptop base": screen 840x525 at k 0.2917,
 * x 71-911, screen top y 590; bezel and deck below). The root is the LID, absolutely positioned so
 * the SCREEN's top-left lands exactly at (screenX, screenY); animate it with style translate /
 * rotate / scale (transformOrigin defaults to the lid centre). Hinge, deck and floor shadow hang
 * below the lid and move with it.
 *
 * Layers (back to front): floor shadow → deck (tapered aluminium top face + front lip with the
 * thumb notch) → hinge → lid rim (deckColor) → black glass bezel (lidColor) with camera dot →
 * screen (screenColor, children in source px) → glass glare. Every size scales with screenW / 840.
 *
 * `deckTilt` > 0 swaps the flat deck for a 3D one (CSS perspective + an x-axis rotate on the deck
 * only): the keyboard well and trackpad show, the front edge flares. The lid and the screen stay
 * flat, so CameraRig source → frame math is unchanged.
 *
 * With no children the screen shows `previewSrc` (preview compositions); pass previewSrc "" to get
 * the labelled placeholder instead. Scenes always pass children, so previewSrc never shows there.
 */

export const LAPTOP_SOURCE = { w: 2880, h: 1800 } as const;

/** Brief section 5 laptop base (scenes 5, 7). Scene 2 uses screenY 580. */
export const LAPTOP_BASE = { screenX: 71, screenY: 590, screenW: 840, bezel: 14 } as const;

export const laptopK = (screenW: number = LAPTOP_BASE.screenW): number => screenW / LAPTOP_SOURCE.w;

/**
 * ScreenPlacement for CameraRig rect moves. For a ScrollShot pass the scroll offset so source
 * rects stay in full-image px: y = screenY − scrollY × k.
 */
export const laptopPlacement = (
  screenX: number = LAPTOP_BASE.screenX,
  screenY: number = LAPTOP_BASE.screenY,
  screenW: number = LAPTOP_BASE.screenW,
  scrollY = 0,
): ScreenPlacement => ({ x: screenX, y: screenY - scrollY * laptopK(screenW), k: laptopK(screenW) });

type LaptopFrameProps = {
  /** Screen content in source px (a 2880x1800 box): ScreenImage, ScrollShot, ScreenSwipe, annotations. */
  readonly children?: React.ReactNode;
  readonly screenX?: number;
  readonly screenY?: number;
  /** Screen width in canvas px; height = screenW × 1800 / 2880. */
  readonly screenW?: number;
  /** Lid bezel (top and sides) in canvas px at screenW 840 (scales with screenW). The chin is 1.5×. */
  readonly bezel?: number;
  /** Draw the hinge, deck and floor shadow below the lid. */
  readonly showDeck?: boolean;
  /** Black glass bezel. */
  readonly lidColor?: string;
  /** Aluminium base tone for the lid rim and the deck (sheen is layered on top). */
  readonly deckColor?: string;
  /** Screen fill behind the children. */
  readonly screenColor?: string;
  /** Viewing elevation in degrees for a 3D deck (0 = flat front view). Typical 4-10. */
  readonly deckTilt?: number;
  /** CSS perspective distance for the 3D deck, in canvas px at screenW 840. */
  readonly deckPerspective?: number;
  /** Glass glare strength 0-1. */
  readonly glare?: number;
  /** public/ path shown full-screen when there are no children (previews); "" = labelled placeholder. */
  readonly previewSrc?: string;
  /** Placeholder text when there are no children and no previewSrc. */
  readonly label?: string;
  readonly style?: React.CSSProperties;
};

const LaptopFrameInner: React.FC<LaptopFrameProps> = ({
  children,
  screenX = LAPTOP_BASE.screenX,
  screenY = LAPTOP_BASE.screenY,
  screenW = LAPTOP_BASE.screenW,
  bezel = LAPTOP_BASE.bezel,
  showDeck = true,
  lidColor = "#050806",
  deckColor = "#5A615B",
  screenColor = "#111B14",
  deckTilt = 0,
  deckPerspective = 3200,
  glare = 0.5,
  previewSrc = "rallyo/screens/desktop/home.png",
  label = "LaptopFrame",
  style,
}) => {
  const k = laptopK(screenW);
  const u = screenW / LAPTOP_BASE.screenW; // canvas px per "840-laptop" px
  const b = bezel * u;
  const chin = b * 1.5;
  const rim = Math.max(1, 2.5 * u);
  const hair = Math.max(1, u);
  const screenH = screenW * (LAPTOP_SOURCE.h / LAPTOP_SOURCE.w);
  const lidW = screenW + 2 * b;
  const lidH = screenH + b + chin;
  const rTop = 22 * u;
  const rBot = 6 * u;

  // Hinge + deck geometry (flat front view)
  const hingeH = 7 * u;
  const deckTop = lidH + hingeH - 2 * u;
  const flare = 52 * u; // front edge overhang per side
  const backFlare = 6 * u; // back edge overhang per side
  const faceH = 10 * u;
  const lipH = 13 * u;
  const deckW = lidW + 2 * flare;
  const notchW = 150 * u;

  // 3D deck (deckTilt > 0)
  const tilted = deckTilt > 0;
  const depth = 0.65 * lidW;
  const persp = deckPerspective * u;
  const faceAngle = 90 - deckTilt;
  const zFront = depth * Math.cos((deckTilt * Math.PI) / 180);
  const sFront = persp / Math.max(1, persp - zFront);
  const yFront = depth * Math.sin((deckTilt * Math.PI) / 180) * sFront;
  const deckBottom = tilted ? deckTop + yFront + lipH * sFront : deckTop + faceH + lipH;
  const shadowW = tilted ? lidW * sFront + 40 * u : deckW + 40 * u;

  return (
    <div
      style={{
        position: "absolute",
        left: screenX - b,
        top: screenY - b,
        width: lidW,
        height: lidH,
        borderRadius: `${rTop}px ${rTop}px ${rBot}px ${rBot}px`,
        boxShadow: `0 ${24 * u}px ${70 * u}px ${-14 * u}px rgba(0, 0, 0, 0.6)`,
        ...style,
      }}
    >
      {showDeck ? (
        <>
          {/* Floor shadow: wide soft ellipse + tight contact line */}
          <div
            style={{
              position: "absolute",
              left: (lidW - shadowW) / 2,
              top: deckBottom - 22 * u,
              width: shadowW,
              height: 70 * u,
              backgroundImage:
                "radial-gradient(ellipse 50% 50% at 50% 32%, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.38) 42%, rgba(0, 0, 0, 0) 74%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: (lidW - shadowW) / 2 + 30 * u,
              top: deckBottom - 4 * u,
              width: shadowW - 60 * u,
              height: 10 * u,
              backgroundImage:
                "radial-gradient(ellipse 50% 50% at 50% 30%, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0) 100%)",
            }}
          />
          {tilted ? (
            /* 3D deck: perspective on this wrapper only; the lid stays flat */
            <div
              style={{
                position: "absolute",
                left: 0,
                top: deckTop,
                width: lidW,
                height: 1,
                perspective: `${persp}px`,
                perspectiveOrigin: "50% 0px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: lidW,
                  height: depth,
                  transformOrigin: "50% 0px",
                  transformStyle: "preserve-3d",
                  rotate: `x ${faceAngle}deg`,
                  borderRadius: `0px 0px ${30 * u}px ${30 * u}px`,
                  backgroundColor: deckColor,
                  backgroundImage:
                    "linear-gradient(180deg, rgba(0, 0, 0, 0.22) 0%, rgba(255, 255, 255, 0.08) 40%, rgba(255, 255, 255, 0.24) 100%)",
                }}
              >
                {/* Keyboard well */}
                <div
                  style={{
                    position: "absolute",
                    left: lidW * 0.085,
                    top: depth * 0.07,
                    width: lidW * 0.83,
                    height: depth * 0.4,
                    borderRadius: 10 * u,
                    backgroundColor: "rgba(5, 8, 6, 0.82)",
                    backgroundImage: `repeating-linear-gradient(90deg, rgba(255, 255, 255, 0) 0px, rgba(255, 255, 255, 0) ${44 * u}px, rgba(90, 97, 91, 0.55) ${44 * u}px, rgba(90, 97, 91, 0.55) ${48 * u}px), repeating-linear-gradient(180deg, rgba(255, 255, 255, 0) 0px, rgba(255, 255, 255, 0) ${36 * u}px, rgba(90, 97, 91, 0.55) ${36 * u}px, rgba(90, 97, 91, 0.55) ${40 * u}px)`,
                    boxShadow: `inset 0 0 0 ${hair}px rgba(0, 0, 0, 0.6)`,
                  }}
                />
                {/* Trackpad */}
                <div
                  style={{
                    position: "absolute",
                    left: lidW * 0.31,
                    top: depth * 0.53,
                    width: lidW * 0.38,
                    height: depth * 0.36,
                    borderRadius: 14 * u,
                    backgroundColor: "rgba(255, 255, 255, 0.07)",
                    boxShadow: `inset 0 0 0 ${hair}px rgba(0, 0, 0, 0.35)`,
                  }}
                />
                {/* Front lip, stood back up to vertical (faces the viewer) */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: depth,
                    width: lidW,
                    height: lipH,
                    transformOrigin: "50% 0px",
                    rotate: `x ${-faceAngle}deg`,
                    borderRadius: `0px 0px ${lipH}px ${lipH}px`,
                    backgroundColor: deckColor,
                    backgroundImage:
                      "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.14) 14%, rgba(0, 0, 0, 0.12) 46%, rgba(0, 0, 0, 0.58) 100%)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: (lidW - notchW) / 2,
                      top: 0,
                      width: notchW,
                      height: lipH * 0.55,
                      borderRadius: `0px 0px ${8 * u}px ${8 * u}px`,
                      backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.18) 100%)",
                      boxShadow: `inset 0 ${hair}px ${2 * u}px rgba(0, 0, 0, 0.5)`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Deck top face: tapered (back = lid width, front flares out) */}
              <div
                style={{
                  position: "absolute",
                  left: -flare,
                  top: deckTop,
                  width: deckW,
                  height: faceH,
                  clipPath: `polygon(${flare - backFlare}px 0px, ${deckW - flare + backFlare}px 0px, ${deckW}px ${faceH}px, 0px ${faceH}px)`,
                  backgroundColor: deckColor,
                  backgroundImage:
                    "linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.34) 100%)",
                }}
              />
              {/* Deck front lip with the thumb notch */}
              <div
                style={{
                  position: "absolute",
                  left: -flare,
                  top: deckTop + faceH,
                  width: deckW,
                  height: lipH,
                  borderRadius: `${2 * u}px ${2 * u}px ${lipH}px ${lipH}px`,
                  backgroundColor: deckColor,
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.14) 14%, rgba(0, 0, 0, 0.12) 46%, rgba(0, 0, 0, 0.58) 100%)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: (deckW - notchW) / 2,
                    top: 0,
                    width: notchW,
                    height: lipH * 0.55,
                    borderRadius: `0px 0px ${8 * u}px ${8 * u}px`,
                    backgroundImage: "linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.18) 100%)",
                    boxShadow: `inset 0 ${hair}px ${2 * u}px rgba(0, 0, 0, 0.5)`,
                  }}
                />
              </div>
            </>
          )}
          {/* Hinge */}
          <div
            style={{
              position: "absolute",
              left: lidW * 0.045,
              top: lidH - hair,
              width: lidW * 0.91,
              height: hingeH,
              borderRadius: `0px 0px ${3 * u}px ${3 * u}px`,
              backgroundImage:
                "linear-gradient(180deg, #050706 0%, #262B27 42%, #3A403B 58%, #0B0E0C 100%)",
            }}
          />
        </>
      ) : null}
      {/* Lid rim (aluminium edge) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: `${rTop}px ${rTop}px ${rBot}px ${rBot}px`,
          backgroundColor: deckColor,
          backgroundImage:
            "linear-gradient(160deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(0, 0, 0, 0.22) 70%, rgba(255, 255, 255, 0.1) 100%)",
        }}
      />
      {/* Black glass bezel */}
      <div
        style={{
          position: "absolute",
          left: rim,
          top: rim,
          width: lidW - 2 * rim,
          height: lidH - 2 * rim,
          borderRadius: `${Math.max(0, rTop - rim)}px ${Math.max(0, rTop - rim)}px ${Math.max(0, rBot - rim)}px ${Math.max(0, rBot - rim)}px`,
          backgroundColor: lidColor,
          boxShadow: `inset 0 0 0 ${hair}px rgba(255, 255, 255, 0.06)`,
        }}
      />
      {/* Camera dot (top bezel centre) */}
      <div
        style={{
          position: "absolute",
          left: lidW / 2 - Math.max(2, 2.75 * u),
          top: rim + (b - rim) / 2 - Math.max(2, 2.75 * u),
          width: Math.max(4, 5.5 * u),
          height: Math.max(4, 5.5 * u),
          borderRadius: "50%",
          backgroundImage:
            "radial-gradient(circle at 36% 34%, rgba(110, 130, 175, 0.6) 0%, rgba(28, 36, 60, 0.95) 32%, #030405 70%)",
          boxShadow: `0 0 0 ${hair}px rgba(40, 46, 42, 0.9)`,
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
          borderRadius: `${4 * u}px ${4 * u}px 0px 0px`,
          overflow: "hidden",
          backgroundColor: screenColor,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: LAPTOP_SOURCE.w,
            height: LAPTOP_SOURCE.h,
            transformOrigin: "0px 0px",
            scale: k,
          }}
        >
          {children ??
            (previewSrc ? (
              <Img
                name="Preview screenshot"
                src={asset(previewSrc)}
                style={{ position: "absolute", left: 0, top: 0, width: LAPTOP_SOURCE.w, height: LAPTOP_SOURCE.h }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "16px dashed rgba(200, 242, 58, 0.5)",
                  color: "rgba(238, 241, 234, 0.7)",
                  fontFamily: RALLYO_FONTS.ui,
                  fontWeight: 700,
                  fontSize: 160,
                }}
              >
                {`${label} · 2880x1800 px`}
              </div>
            ))}
        </div>
        {/* Glass: recessed edge + glare */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 ${2 * u}px ${hair}px rgba(0, 0, 0, 0.55)`,
            backgroundImage:
              "linear-gradient(122deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 22%, rgba(255, 255, 255, 0) 38%)",
            opacity: glare,
          }}
        />
      </div>
    </div>
  );
};

const laptopFrameSchema = {
  screenX: { type: "number", default: 71, step: 1, description: "Screen x", hiddenFromList: false },
  screenY: { type: "number", default: 590, step: 1, description: "Screen y", hiddenFromList: false },
  screenW: { type: "number", default: 840, min: 50, step: 1, description: "Screen width", hiddenFromList: false },
  showDeck: { type: "boolean", default: true, description: "Deck" },
  deckColor: { type: "color", default: "#5A615B", description: "Aluminium" },
  deckTilt: { type: "number", default: 0, min: 0, max: 20, step: 0.5, description: "3D deck tilt (deg)", hiddenFromList: false },
  glare: { type: "number", default: 0.5, min: 0, max: 1, step: 0.05, description: "Glass glare", hiddenFromList: false },
  previewSrc: { type: "asset", assetType: "image", default: "rallyo/screens/desktop/home.png", description: "Preview screenshot (no children)" },
  label: { type: "string", default: "LaptopFrame", description: "Placeholder label" },
} as const satisfies InteractivitySchema;

export const LaptopFrame = Interactive.create({
  Component: LaptopFrameInner,
  layout: "none",
  schema: laptopFrameSchema,
});

// ---------------------------------------------------------------------------------------------
// DeviceCombo: preview of the two combo shots (brief section 5), laptop behind phone.
//   reveal (S2): laptop screen x 71-911, y 580; phone screen 652/830 w 250 (k 0.2137), rotate −4°.
//   upNext (S5): laptop screen x 71-911, y 590; phone screen 600/800 w 300 (k 0.2564), rotate −3°.
// Scenes place their own devices; this exists for the Rallyo-Elements preview only.
// ---------------------------------------------------------------------------------------------

type DeviceComboProps = {
  readonly arrangement?: "reveal" | "upNext";
  /** public/ path of the desktop screenshot (2880x1800). */
  readonly laptopSrc?: string;
  /** public/ path of the mobile screenshot (1170x2532). */
  readonly phoneSrc?: string;
  readonly backgroundColor?: string;
  readonly style?: React.CSSProperties;
};

const DeviceComboInner: React.FC<DeviceComboProps> = ({
  arrangement = "reveal",
  laptopSrc = "rallyo/screens/desktop/home.png",
  phoneSrc = "rallyo/screens/mobile/home.png",
  backgroundColor = RALLYO_COLORS.night,
  style,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor, ...style }}>
      {arrangement === "reveal" ? (
        <>
          <LaptopFrame name="Laptop (S2)" screenX={71} screenY={580} screenW={840} previewSrc={laptopSrc} />
          <PhoneFrame name="Phone (S2)" screenX={652} screenY={830} screenW={250} previewSrc={phoneSrc} style={{ rotate: "-4deg" }} />
        </>
      ) : (
        <>
          <LaptopFrame name="Laptop (S5)" screenX={71} screenY={590} screenW={840} previewSrc={laptopSrc} />
          <PhoneFrame name="Phone (S5)" screenX={600} screenY={800} screenW={300} previewSrc={phoneSrc} style={{ rotate: "-3deg" }} />
        </>
      )}
    </div>
  );
};

export const DeviceCombo = Interactive.create({
  Component: DeviceComboInner,
  layout: "none",
  schema: {
    arrangement: {
      type: "enum",
      default: "reveal",
      description: "Combo shot",
      variants: { reveal: {}, upNext: {} },
    },
    laptopSrc: { type: "asset", assetType: "image", default: "rallyo/screens/desktop/home.png", description: "Laptop screenshot" },
    phoneSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/home.png", description: "Phone screenshot" },
    backgroundColor: { type: "color", default: "#0B130D", description: "Background" },
  } as const satisfies InteractivitySchema,
});

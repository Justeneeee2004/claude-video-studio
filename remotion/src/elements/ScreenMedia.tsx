import { Video } from "@remotion/media";
import type React from "react";
import { useId } from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { RALLYO_FONTS } from "../theme/rallyo";

/**
 * Screen primitives rendered INSIDE a PhoneFrame / LaptopFrame children slot, in source px
 * (phone su box 1170x2532, laptop box 2880x1800). Owner: camera-screens implementer.
 *
 * They never translate content past the image's end (brief section 5 "Camera"): tall pages are
 * pre-cropped to 1170x2532 windows; only the desktop console ScrollShot scrolls (scrollY ≤ 1318),
 * and every offset is clamped to the image.
 * An empty `src` draws a labelled placeholder instead of loading media.
 */

const placeholder = (w: number, h: number, accent: string): React.CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  width: w,
  height: h,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
  boxSizing: "border-box",
  border: `${Math.round(w / 120)}px dashed ${accent}`,
  backgroundColor: "#16241A",
  color: "rgba(238, 241, 234, 0.75)",
  fontFamily: RALLYO_FONTS.ui,
  fontWeight: 700,
  fontSize: Math.round(w / 22),
  textAlign: "center",
  padding: Math.round(w / 20),
  wordBreak: "break-all",
});

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------------------------
// ScreenImage
// ---------------------------------------------------------------------------------------------

type ScreenImageProps = {
  /** public/ path, e.g. "rallyo/screens/mobile/host-event-rookie-cup.png". */
  readonly src: string;
  /** Image width in px (1170 phone, 2880 desktop). */
  readonly sourceW?: number;
  /** Image height in px (2532 phone window, 1800 desktop window, or the crop's height). */
  readonly sourceH?: number;
  /**
   * Width of the screen box the image is fitted to, in the device's units (phone 1170, laptop 2880).
   * Defaults to sourceW (1:1, so source px = box px). The image always spans the full box width.
   */
  readonly boxW?: number;
  /** Visible box height in box units. Defaults to the whole fitted image. */
  readonly boxH?: number;
  /** Crop offset: the image row (source px) shown at the top of the box. Clamped to the image end. */
  readonly cropY?: number;
  /** Optional dim overlay 0-1 (night). */
  readonly dim?: number;
  readonly style?: React.CSSProperties;
};

const ScreenImageInner: React.FC<ScreenImageProps> = ({
  src,
  sourceW = 1170,
  sourceH = 2532,
  boxW = sourceW,
  boxH,
  cropY = 0,
  dim = 0,
  style,
}) => {
  const fit = boxW / sourceW;
  const fittedH = sourceH * fit;
  const visibleH = boxH ?? fittedH;
  const offset = clamp(cropY * fit, 0, Math.max(0, fittedH - visibleH));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: boxW, height: visibleH, overflow: "hidden", ...style }}>
      {src ? (
        <Img
          name="Screen image"
          src={asset(src)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: boxW,
            height: fittedH,
            maxWidth: "none",
            display: "block",
            translate: `0px ${-offset}px`,
          }}
        />
      ) : (
        <div style={placeholder(boxW, visibleH, "rgba(200, 242, 58, 0.55)")}>
          <div>ScreenImage</div>
          <div style={{ fontSize: Math.round(boxW / 34), fontWeight: 500 }}>(no src)</div>
        </div>
      )}
      {dim > 0 ? <div style={{ position: "absolute", inset: 0, backgroundColor: "#0B130D", opacity: dim }} /> : null}
    </div>
  );
};

export const ScreenImage = Interactive.create({
  Component: ScreenImageInner,
  layout: "none",
  schema: {
    src: { type: "asset", assetType: "image", default: "", description: "Screen image" },
    cropY: { type: "number", default: 0, min: 0, step: 1, description: "Crop offset y (source px)", hiddenFromList: false },
    dim: { type: "number", default: 0, min: 0, max: 1, step: 0.05, description: "Dim", hiddenFromList: false },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// ScrollShot (desktop console only)
// ---------------------------------------------------------------------------------------------

export type ScrollMove = {
  readonly start: number;
  readonly end: number;
  /** Target scrollY in image px (clamped to 0 … maxScrollY). */
  readonly y: number;
};

/**
 * scrollY at a local frame: holds, then eases (EASE.inOut) between moves. moves[0] = opening scrollY.
 * Every value is clamped to 0 … maxScrollY, so the window never runs past the image's end.
 */
export const scrollYAt = (frame: number, moves: readonly ScrollMove[], maxScrollY: number): number => {
  if (moves.length === 0) {
    return 0;
  }
  const max = Math.max(0, maxScrollY);
  let y = clamp(moves[0].y, 0, max);
  for (let i = 1; i < moves.length; i++) {
    const m = moves[i];
    if (frame < m.start) {
      break;
    }
    const target = clamp(m.y, 0, max);
    y =
      m.end <= m.start
        ? target
        : interpolate(frame, [m.start, m.end], [y, target], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.83, 0, 0.17, 1),
          });
    if (frame < m.end) {
      break;
    }
  }
  return y;
};

type ScrollShotProps = {
  readonly src: string;
  /** Annotations in FULL-IMAGE px (they scroll with the image, e.g. S7 Auto-call ring, Maya K. row flash). */
  readonly children?: React.ReactNode;
  /** Full image size in px (console capture: 2880x3118). */
  readonly imageW?: number;
  readonly imageH?: number;
  /** Visible window height in source px (desktop screen: 1800). */
  readonly windowH?: number;
  /** Scroll limit; the effective limit is min(maxScrollY, imageH − windowH) (1318 for the console). */
  readonly maxScrollY?: number;
  readonly scrollMoves?: readonly ScrollMove[];
  readonly style?: React.CSSProperties;
};

const ScrollShotInner: React.FC<ScrollShotProps> = ({
  src,
  children,
  imageW = 2880,
  imageH = 3118,
  windowH = 1800,
  maxScrollY = 1318,
  scrollMoves = [],
  style,
}) => {
  const frame = useCurrentFrame();
  const limit = Math.max(0, Math.min(maxScrollY, imageH - windowH));
  const scrollY = scrollYAt(frame, scrollMoves, limit);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: imageW, height: windowH, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: imageW, height: imageH, translate: `0px ${-scrollY}px` }}>
        {src ? (
          <Img
            name="Tall capture"
            src={asset(src)}
            style={{ position: "absolute", left: 0, top: 0, width: imageW, height: imageH, maxWidth: "none", display: "block" }}
          />
        ) : (
          <div style={placeholder(imageW, imageH, "rgba(200, 242, 58, 0.55)")}>
            <div>ScrollShot</div>
            <div style={{ fontSize: 90 }}>{`scrollY ${Math.round(scrollY)}`}</div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const ScrollShot = Interactive.create({
  Component: ScrollShotInner,
  layout: "none",
  schema: {
    src: { type: "asset", assetType: "image", default: "", description: "Tall capture" },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// ScreenClip (muted screen recording)
// ---------------------------------------------------------------------------------------------

type ScreenClipProps = {
  /** public/ path, e.g. "rallyo/clips/open-play-who-won.mp4" (pre-trimmed, 1170x2532, 30 fps). */
  readonly src: string;
  readonly sourceW?: number;
  readonly sourceH?: number;
  readonly style?: React.CSSProperties;
};

/**
 * Muted `<Video>` from @remotion/media, `objectFit: cover` into the source box. Plays from the
 * component's own frame 0. To start later in the clip, put the standard timing prop
 * `trimBefore={n}` on <ScreenClip>: Interactive.create applies it to its sequence, so the Video
 * starts n frames into the file (no separate prop, so nothing collides with the timing props).
 */
const ScreenClipInner: React.FC<ScreenClipProps> = ({ src, sourceW = 1170, sourceH = 2532, style }) => {
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: sourceW, height: sourceH, overflow: "hidden", ...style }}>
      {src ? (
        <Video
          name="Screen recording"
          src={asset(src)}
          muted
          objectFit="cover"
          style={{ position: "absolute", left: 0, top: 0, width: sourceW, height: sourceH }}
        />
      ) : (
        <div style={placeholder(sourceW, sourceH, "rgba(34, 211, 238, 0.6)")}>
          <div>ScreenClip (muted)</div>
          <div style={{ fontSize: Math.round(sourceW / 34), fontWeight: 500 }}>(no src)</div>
        </div>
      )}
    </div>
  );
};

export const ScreenClip = Interactive.create({
  Component: ScreenClipInner,
  layout: "none",
  schema: {
    src: { type: "asset", assetType: "video", default: "", description: "Screen recording" },
  } as const satisfies InteractivitySchema,
});

// ---------------------------------------------------------------------------------------------
// ScreenSwipe (in-screen slide between two screens, 12 f, optional smear)
// ---------------------------------------------------------------------------------------------

export type SwipeDirection = "from-right" | "from-left" | "from-bottom" | "from-top";

type ScreenSwipeProps = {
  /** Outgoing screen (source px box). Shares the parent's time base: no Sequence offset. */
  readonly before?: React.ReactNode;
  /** Incoming screen (source px box). Its keyframes use the same local frames as the scene. */
  readonly after?: React.ReactNode;
  /** Local frame the swipe starts. Before it only `before` renders; after at + frames only `after`. */
  readonly at: number;
  readonly frames?: number;
  readonly direction?: SwipeDirection;
  /**
   * Smear: a directional blur along the swipe axis, sized to the per-frame travel (a 180° shutter),
   * so it peaks on the two fastest frames mid-swipe and is zero at rest. Both screens are blurred
   * once each; nothing is rendered twice (safe with a ScreenClip inside).
   */
  readonly smear?: boolean;
  /**
   * Smear cap as a fraction of the travel axis (box units). Draft v3 (accuracy #6): .014 (phone 16 su,
   * laptop 25 su; was .03), plus a cross-axis blur of 12% of σ that softens glyph strokes, so a page streaks
   * as a moving page, never as a white slab or a vertical "barcode" of smeared digits.
   */
  readonly maxSmear?: number;
  /**
   * Brightness drop at full smear (the S3 ScrollSmear treatment): both screens dim by `dim` × σ ÷ cap, so the
   * peak frames sit at 70% and every rest frame is untouched (no filter at all). 0 = off.
   */
  readonly dim?: number;
  /** Source box size (phone 1170x2532, laptop 2880x1800). */
  readonly boxW?: number;
  readonly boxH?: number;
  readonly style?: React.CSSProperties;
};

const SWIPE_EASE = Easing.bezier(0.83, 0, 0.17, 1);

const PreviewPanel: React.FC<{ readonly label: string; readonly w: number; readonly h: number; readonly color: string }> = ({
  label,
  w,
  h,
  color,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: color,
      backgroundImage:
        "linear-gradient(rgba(11, 19, 13, 0.25) 3px, transparent 3px), linear-gradient(90deg, rgba(11, 19, 13, 0.25) 3px, transparent 3px)",
      backgroundSize: "120px 120px",
      color: "#0B130D",
      fontFamily: RALLYO_FONTS.ui,
      fontWeight: 900,
      fontSize: Math.round(Math.min(w, h) / 4),
    }}
  >
    {label}
  </div>
);

const ScreenSwipeInner: React.FC<ScreenSwipeProps> = ({
  before,
  after,
  at,
  frames = 12,
  direction = "from-right",
  smear = true,
  maxSmear = 0.014,
  dim = 0.3,
  boxW = 1170,
  boxH = 2532,
  style,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const filterId = `swipe-smear-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const progress = (f: number) =>
    interpolate(f, [at, at + frames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SWIPE_EASE,
    });
  const p = progress(frame);
  const horizontal = direction === "from-right" || direction === "from-left";
  const sign = direction === "from-right" || direction === "from-bottom" ? 1 : -1;
  const size = horizontal ? boxW : boxH;
  const inOffset = sign * size * (1 - p);
  const outOffset = -sign * size * p;
  // Per-frame travel in box units; a 180° shutter smears half of it (Gaussian sigma ≈ length / 3.5).
  const travel = Math.abs(progress(frame + 0.5) - progress(frame - 0.5)) * size;
  const cap = size * Math.max(0, maxSmear);
  const sigma = smear && cap > 0 ? Math.min(travel * 0.5 * 0.29, cap) : 0;
  const blurring = sigma >= 0.5;
  const cross = sigma * 0.12;
  // Draft v3 (accuracy #6): the bright page dims with the smear (70% at the cap), so no white bar or barcode flashes.
  const brightness = blurring ? 1 - Math.min(1, Math.max(0, dim)) * Math.min(1, sigma / cap) : 1;
  const layerFilter = blurring
    ? [`url(#${filterId})`, brightness < 0.999 ? `brightness(${brightness.toFixed(3)})` : ""].filter(Boolean).join(" ")
    : undefined;
  const tr = (v: number) => (horizontal ? `${v}px 0px` : `0px ${v}px`);
  const showPreview = before === undefined && after === undefined;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: boxW, height: boxH, overflow: "hidden", ...style }}>
      {blurring ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter
              id={filterId}
              x={horizontal ? "-10%" : "-2%"}
              y={horizontal ? "-2%" : "-10%"}
              width={horizontal ? "120%" : "104%"}
              height={horizontal ? "104%" : "120%"}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation={horizontal ? `${sigma.toFixed(2)} ${cross.toFixed(2)}` : `${cross.toFixed(2)} ${sigma.toFixed(2)}`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      {p < 1 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            translate: tr(outOffset),
            filter: layerFilter,
          }}
        >
          {showPreview ? <PreviewPanel label="A" w={boxW} h={boxH} color="#C3CBC1" /> : before}
        </div>
      ) : null}
      {p > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            translate: tr(inOffset),
            filter: layerFilter,
          }}
        >
          {showPreview ? <PreviewPanel label="B" w={boxW} h={boxH} color="#C8F23A" /> : after}
        </div>
      ) : null}
    </div>
  );
};

export const ScreenSwipe = Interactive.create({
  Component: ScreenSwipeInner,
  layout: "none",
  schema: {
    at: { type: "number", default: 0, min: 0, step: 3, integer: true, description: "Swipe start (local f)", hiddenFromList: false },
    frames: { type: "number", default: 12, min: 3, step: 3, integer: true, description: "Swipe frames", hiddenFromList: false },
    direction: {
      type: "enum",
      default: "from-right",
      description: "Direction",
      variants: { "from-right": {}, "from-left": {}, "from-bottom": {}, "from-top": {} },
    },
    smear: { type: "boolean", default: true, description: "Smear (directional blur)" },
    maxSmear: { type: "number", default: 0.014, min: 0, max: 0.05, step: 0.002, description: "Smear cap (× travel axis)", hiddenFromList: false },
    dim: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Dim at full smear", hiddenFromList: false },
  } as const satisfies InteractivitySchema,
});

import type React from "react";
import { useId } from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { RALLYO_FONTS } from "../theme/rallyo";

/**
 * CameraRig (brief section 5 "Camera", contract section 2). Owner: camera-screens implementer.
 *
 * Maps a SOURCE rect (pixels of the image shown in a device screen, or of a derived crop) to a
 * FRAME rect (canvas px on 1080x1920) by scaling + translating the whole device group. Applied
 * through the `scale` / `translate` style props on a full-canvas wrapper with transformOrigin
 * "0px 0px", never a `transform` string.
 *
 * Math (origin 0,0): canvas = T + s · base, base = screen.{x,y} + source · screen.k
 *   k_target = min(frame.w / source.w, frame.h / source.h)   (fit "contain"; "width"/"height" use one axis)
 *   s = k_target / screen.k      (= the brief's "push")
 *   T = frameCenter − s · baseCenter
 * Verified: S3 local 0, source x 40-1130 y 890-1440 → frame x 92-890 y 610-1013 gives s 1.19,
 * T (−93.1, −755.2), and source (40, 890) lands on canvas (92, 610.2).
 *
 * Moves (EASE.inOut by default). Scale is interpolated with `output: "perceptual-scale"`. The
 * translate follows the scale: each move is a zoom about its own fixed point (the one canvas
 * point both framings share), so content travels on straight lines and nothing swings sideways
 * mid-move. When the scale does not change, the translate is a plain linear pan. Both framings
 * are hit exactly at `start` and `end`.
 *
 * Motion blur (whips, brief S5 "at most 4 motion-blur samples"): a move with `blur` 2-4 (or the
 * rig's `blur`) renders the device group that many times at sub-frame camera positions spread over
 * `shutter` frames, averaged by stacked opacity (1, 1/2, 1/3, 1/4). Only the camera is sampled;
 * the children render at the integer frame. A 1-D Gaussian ALONG the travel direction (an SVG
 * filter on a wrapper rotated to that direction) fills the gaps between samples, so the whip reads
 * as one streak, never as strobing copies and never as defocus. Frames that barely move render once,
 * unblurred, so every landing frame is sharp.
 */

export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/** Where source px (0,0) lands on the canvas with the camera at rest, and canvas px per source px. */
export type ScreenPlacement = {
  readonly x: number;
  readonly y: number;
  readonly k: number;
};

export type CameraFit = "contain" | "width" | "height";

export type CameraTransform = {
  readonly scale: number;
  readonly translateX: number;
  readonly translateY: number;
};

export type CameraEase = "inOut" | "out" | "in" | "linear";

/** Frame the source rect inside the frame rect, arriving at `end` (eases from the framing at `start`). */
export type CameraRectMove = {
  readonly start: number;
  readonly end: number;
  readonly sourceRect: Rect;
  readonly frameRect: Rect;
  readonly fit?: CameraFit;
  /** Placement of the image the source rect refers to (defaults to the rig's `screen`). */
  readonly screen?: ScreenPlacement;
  readonly ease?: CameraEase;
  /** Motion-blur samples while this move runs (0 or 1 = off, max 4). Defaults to the rig's `blur`. */
  readonly blur?: number;
};

/** Arrive at an explicit transform at `end` (e.g. pushAbout(1.15, 491, 830) for the S5 combo shot). */
export type CameraTransformMove = {
  readonly start: number;
  readonly end: number;
  readonly transform: CameraTransform;
  readonly ease?: CameraEase;
  /** Motion-blur samples while this move runs (0 or 1 = off, max 4). Defaults to the rig's `blur`. */
  readonly blur?: number;
};

export type CameraMove = CameraRectMove | CameraTransformMove;

export const IDENTITY: CameraTransform = { scale: 1, translateX: 0, translateY: 0 };

export const rectToTransform = (
  sourceRect: Rect,
  frameRect: Rect,
  screen: ScreenPlacement,
  fit: CameraFit = "contain",
): CameraTransform => {
  const sw = Math.max(sourceRect.w, 1e-6);
  const sh = Math.max(sourceRect.h, 1e-6);
  const kw = frameRect.w / sw;
  const kh = frameRect.h / sh;
  const kTarget = fit === "width" ? kw : fit === "height" ? kh : Math.min(kw, kh);
  const scale = kTarget / screen.k;
  const baseCx = screen.x + (sourceRect.x + sw / 2) * screen.k;
  const baseCy = screen.y + (sourceRect.y + sh / 2) * screen.k;
  const frameCx = frameRect.x + frameRect.w / 2;
  const frameCy = frameRect.y + frameRect.h / 2;
  return {
    scale,
    translateX: frameCx - scale * baseCx,
    translateY: frameCy - scale * baseCy,
  };
};

/** Uniform push `p` about canvas point (cx, cy). */
export const pushAbout = (p: number, cx: number, cy: number): CameraTransform => ({
  scale: p,
  translateX: (1 - p) * cx,
  translateY: (1 - p) * cy,
});

/** Where a source point lands on the canvas under a transform (QA helper). */
export const sourceToCanvas = (
  point: { readonly x: number; readonly y: number },
  screen: ScreenPlacement,
  t: CameraTransform,
): { x: number; y: number } => ({
  x: t.translateX + t.scale * (screen.x + point.x * screen.k),
  y: t.translateY + t.scale * (screen.y + point.y * screen.k),
});

const EASINGS: Record<CameraEase, (t: number) => number> = {
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  linear: Easing.linear,
};

const resolve = (move: CameraMove, screen: ScreenPlacement): CameraTransform =>
  "transform" in move ? move.transform : rectToTransform(move.sourceRect, move.frameRect, move.screen ?? screen, move.fit);

/** Index of the last move (among the first `count`) that has started by `frame`, or -1. */
const lastStarted = (frame: number, moves: readonly CameraMove[], count: number): number => {
  let idx = -1;
  for (let i = 0; i < count; i++) {
    if (moves[i].start <= frame) {
      idx = i;
    }
  }
  return idx;
};

const stateAt = (frame: number, moves: readonly CameraMove[], screen: ScreenPlacement, count: number): CameraTransform => {
  const idx = lastStarted(frame, moves, count);
  // moves[0] is the opening framing: it holds until the first later move starts.
  if (idx <= 0) {
    return resolve(moves[0], screen);
  }
  const move = moves[idx];
  const target = resolve(move, screen);
  if (move.end <= move.start || frame >= move.end) {
    return target;
  }
  // Ease from wherever the camera is when this move starts (an earlier move may still be running).
  const from = stateAt(move.start, moves, screen, idx);
  const easing = EASINGS[move.ease ?? "inOut"];
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing } as const;
  const scale = interpolate(frame, [move.start, move.end], [from.scale, target.scale], {
    ...opts,
    output: "perceptual-scale",
  });
  const ratio = target.scale / from.scale;
  if (Math.abs(ratio - 1) < 1e-4) {
    return {
      scale,
      translateX: interpolate(frame, [move.start, move.end], [from.translateX, target.translateX], opts),
      translateY: interpolate(frame, [move.start, move.end], [from.translateY, target.translateY], opts),
    };
  }
  // Zoom about the move's fixed point q (the canvas point both framings share): T = q (1 − r) + r · T0.
  const qx = (target.translateX - ratio * from.translateX) / (1 - ratio);
  const qy = (target.translateY - ratio * from.translateY) / (1 - ratio);
  const r = scale / from.scale;
  return {
    scale,
    translateX: qx * (1 - r) + r * from.translateX,
    translateY: qy * (1 - r) + r * from.translateY,
  };
};

/**
 * Camera transform at a local frame (fractional frames allowed). Before the first later move: the
 * opening framing. Between moves: hold. During a move: ease from the framing at its start.
 */
export const cameraAt = (frame: number, moves: readonly CameraMove[], screen: ScreenPlacement): CameraTransform => {
  if (moves.length === 0) {
    return IDENTITY;
  }
  return stateAt(frame, moves, screen, moves.length);
};

/** The move running at `frame` (start < frame < end), if any. */
const runningMove = (frame: number, moves: readonly CameraMove[]): CameraMove | null => {
  const idx = lastStarted(frame, moves, moves.length);
  if (idx <= 0) {
    return null;
  }
  const move = moves[idx];
  return frame > move.start && frame < move.end ? move : null;
};

/** Largest canvas displacement between two transforms over the 1080x1920 canvas (corners). */
const maxShift = (a: CameraTransform, b: CameraTransform): number => {
  let max = 0;
  for (const [x, y] of [
    [0, 0],
    [1080, 0],
    [0, 1920],
    [1080, 1920],
  ]) {
    const dx = a.translateX + a.scale * x - (b.translateX + b.scale * x);
    const dy = a.translateY + a.scale * y - (b.translateY + b.scale * y);
    max = Math.max(max, Math.hypot(dx, dy));
  }
  return max;
};

type CameraRigProps = {
  /** The device group (PhoneFrame / LaptopFrame + in-screen annotations), positioned in canvas px. */
  readonly children?: React.ReactNode;
  /** Ordered moves in the rig's local frames. moves[0] is the opening framing (start = end = 0). */
  readonly moves?: readonly CameraMove[];
  /** Default placement for rect moves (e.g. phonePlacement() / laptopPlacement()). */
  readonly screen?: ScreenPlacement;
  /** Default motion-blur samples for moves without their own `blur` (0 = off, max 4). */
  readonly blur?: number;
  /** Shutter in frames for motion blur (0.5 = 180°). */
  readonly shutter?: number;
  /** Draw the target frame rects (QA). */
  readonly debug?: boolean;
  /** Preview only (no children): image shown in a bare screen at `screen`, in source px. */
  readonly previewSrc?: string;
  readonly previewW?: number;
  readonly previewH?: number;
  readonly style?: React.CSSProperties;
};

const PHONE_REST: ScreenPlacement = { x: 131, y: 600, k: 720 / 1170 };

/** Bare screen for the element's own preview composition (no device, no children). */
const PreviewScreen: React.FC<{
  readonly screen: ScreenPlacement;
  readonly src: string;
  readonly w: number;
  readonly h: number;
}> = ({ screen, src, w, h }) => (
  <div
    style={{
      position: "absolute",
      left: screen.x,
      top: screen.y,
      width: w,
      height: h,
      transformOrigin: "0px 0px",
      scale: screen.k,
      overflow: "hidden",
      backgroundColor: "#111B14",
      backgroundImage:
        "linear-gradient(rgba(200, 242, 58, 0.25) 2px, transparent 2px), linear-gradient(90deg, rgba(200, 242, 58, 0.25) 2px, transparent 2px)",
      backgroundSize: "100px 100px",
    }}
  >
    {src ? (
      <Img name="Preview screen" src={asset(src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h }} />
    ) : (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(238, 241, 234, 0.7)",
          fontFamily: RALLYO_FONTS.ui,
          fontWeight: 700,
          fontSize: Math.round(w / 16),
        }}
      >
        {`CameraRig · ${w}x${h} source px`}
      </div>
    )}
  </div>
);

const CameraRigInner: React.FC<CameraRigProps> = ({
  children,
  moves = [],
  screen = PHONE_REST,
  blur = 0,
  shutter = 0.5,
  debug = false,
  previewSrc = "",
  previewW = 1170,
  previewH = 2532,
  style,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const filterId = `camera-streak-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const content = children ?? <PreviewScreen screen={screen} src={previewSrc} w={previewW} h={previewH} />;

  const running = runningMove(frame, moves);
  const samples = Math.max(1, Math.min(4, Math.round(running?.blur ?? blur)));
  const centre = cameraAt(frame, moves, screen);
  let transforms: CameraTransform[] = [centre];
  let streak = 0;
  let angle = 0;
  if (samples > 1 && shutter > 0) {
    const sampled = Array.from({ length: samples }, (_, j) =>
      cameraAt(frame + shutter * (j / (samples - 1) - 0.5), moves, screen),
    );
    // Below ~1 px of travel inside the shutter, blur is invisible: render once.
    if (maxShift(sampled[0], sampled[samples - 1]) >= 1) {
      transforms = sampled;
      // Fill the gaps between neighbouring samples with a 1-D blur ALONG the travel (measured at
      // the readable window's centre), so the copies read as one streak instead of strobing.
      // No blur across the travel. It falls to 0 as the move lands.
      const a = sampled[0];
      const b = sampled[samples - 1];
      const px = (491 - a.translateX) / a.scale;
      const py = (830 - a.translateY) / a.scale;
      const dx = b.translateX + b.scale * px - 491;
      const dy = b.translateY + b.scale * py - 830;
      streak = Math.min(24, (0.5 * Math.hypot(dx, dy)) / (samples - 1));
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }
  }
  const streaking = streak >= 0.5;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>
      {/* Motion-blur lens: its local x axis is the travel direction, so the filter blurs along it only. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 960px",
          rotate: streaking ? `${angle.toFixed(3)}deg` : undefined,
          filter: streaking ? `url(#${filterId})` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "540px 960px",
            rotate: streaking ? `${(-angle).toFixed(3)}deg` : undefined,
          }}
        >
          {transforms.map((t, j) => (
            <div
              // One copy per motion-blur sample; copy 0 is the plain camera when not blurring.
              key={`sample-${j}`}
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: "0px 0px",
                scale: t.scale,
                translate: `${t.translateX}px ${t.translateY}px`,
                opacity: 1 / (j + 1),
              }}
            >
              {content}
            </div>
          ))}
        </div>
      </div>
      {streaking ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${streak.toFixed(2)} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      {debug
        ? moves.map((m, i) =>
            "frameRect" in m ? (
              <div
                key={`${i}-${m.start}`}
                style={{
                  position: "absolute",
                  left: m.frameRect.x,
                  top: m.frameRect.y,
                  width: m.frameRect.w,
                  height: m.frameRect.h,
                  outline: "2px dashed rgba(200, 242, 58, 0.8)",
                }}
              />
            ) : null,
          )
        : null}
    </div>
  );
};

const cameraRigSchema = {
  blur: { type: "number", default: 0, min: 0, max: 4, step: 1, integer: true, description: "Motion-blur samples", keyframable: false, hiddenFromList: false },
  shutter: { type: "number", default: 0.5, min: 0, max: 1, step: 0.05, description: "Shutter (frames)", keyframable: false, hiddenFromList: false },
  debug: { type: "boolean", default: false, description: "Show frame rects" },
  previewSrc: { type: "asset", assetType: "image", default: "", description: "Preview image (no children)" },
} as const satisfies InteractivitySchema;

export const CameraRig = Interactive.create({
  Component: CameraRigInner,
  layout: "none",
  schema: cameraRigSchema,
});

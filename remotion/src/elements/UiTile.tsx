import type React from "react";
import { Img, Interactive, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { RALLYO_COLORS } from "../theme/rallyo";
import type { Rect } from "./CameraRig";

/**
 * UiTile (brief v2.2 section 5.4 "UI cut-out tile", S6). Owner: S5/S6 scene implementer.
 *
 * A CSS crop of a served capture: `crop` (source px of `src`) is shown at `zoom` canvas px per source px,
 * so the tile is crop.w × zoom by crop.h × zoom. The pixels are the capture's own (real UI, never
 * recreated): the image is sized to sourceW × zoom by sourceH × zoom and offset by −crop × zoom, so the
 * browser resamples it once, with no CSS scale on the bitmap (crisp at 1.185×).
 *
 * Chrome (all optional): corner `radius`, an inner `borderWidth` px border in `borderColor` drawn OVER the
 * crop's edge (so the crop-to-canvas mapping stays exact), and an outer `shadow`. The S6 code tile uses the
 * defaults: radius 18, 2 px lime, `0 24px 60px rgba(0, 0, 0, 0.55)`, zoom 1.185 (270x130 → 320x154).
 *
 * With radius 0, no border and no shadow it is a plain same-pixel overlay: the S5/S6 button presses put a
 * zoom-1 tile exactly over a button (plus a margin of flat background) inside the screen and scale it
 * .97 about its centre.
 *
 * Position with style `left` / `top` (default 0, 0) and animate at the call site with the `translate` /
 * `rotate` / `scale` / `opacity` style props (scale pivots on the tile centre).
 */

type UiTileProps = {
  /** public/ path of the capture, e.g. "rallyo/screens/mobile/player-card-masked.png". */
  readonly src?: string;
  /** Source-px rect of `src` shown in the tile. */
  readonly crop?: Rect;
  /** Natural size of `src` in px. */
  readonly sourceW?: number;
  readonly sourceH?: number;
  /** Canvas (parent) px per source px. */
  readonly zoom?: number;
  /** Corner radius in parent px. */
  readonly radius?: number;
  /** Inner border in parent px (0 = none), drawn over the crop's outer edge. */
  readonly borderWidth?: number;
  readonly borderColor?: string;
  /** CSS box-shadow ("none" = no shadow). */
  readonly shadow?: string;
  /** Fill behind the crop (shows only where the crop runs past the image). */
  readonly fillColor?: string;
  readonly style?: React.CSSProperties;
};

const UiTileInner: React.FC<UiTileProps> = ({
  src = "rallyo/screens/mobile/player-card-masked.png",
  crop = { x: 850, y: 695, w: 270, h: 130 },
  sourceW = 1170,
  sourceH = 2532,
  zoom = 1.185,
  radius = 18,
  borderWidth = 2,
  borderColor = RALLYO_COLORS.lime,
  shadow = "0 24px 60px rgba(0, 0, 0, 0.55)",
  fillColor = RALLYO_COLORS.nightCard,
  style,
}) => {
  const w = crop.w * zoom;
  const h = crop.h * zoom;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: h,
        borderRadius: radius,
        boxShadow: shadow === "none" ? undefined : shadow,
        backgroundColor: fillColor,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          overflow: "hidden",
        }}
      >
        {src ? (
          <Img
            name="Tile crop"
            src={asset(src)}
            style={{
              position: "absolute",
              left: -crop.x * zoom,
              top: -crop.y * zoom,
              width: sourceW * zoom,
              height: sourceH * zoom,
              maxWidth: "none",
              display: "block",
            }}
          />
        ) : null}
      </div>
      {borderWidth > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: `inset 0 0 0 ${borderWidth}px ${borderColor}`,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};

const uiTileSchema = {
  src: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/player-card-masked.png", description: "Capture" },
  zoom: { type: "number", default: 1.185, min: 0.1, max: 4, step: 0.005, description: "Zoom (px per source px)", hiddenFromList: false },
  radius: { type: "number", default: 18, min: 0, step: 1, description: "Corner radius", hiddenFromList: false },
  borderWidth: { type: "number", default: 2, min: 0, step: 0.5, description: "Border", hiddenFromList: false },
  borderColor: { type: "color", default: "#C8F23A", description: "Border colour" },
  shadow: { type: "string", default: "0 24px 60px rgba(0, 0, 0, 0.55)", description: "Shadow (CSS)" },
  fillColor: { type: "color", default: "#111B14", description: "Fill" },
} as const satisfies InteractivitySchema;

export const UiTile = Interactive.create({
  Component: UiTileInner,
  layout: "none",
  schema: uiTileSchema,
});

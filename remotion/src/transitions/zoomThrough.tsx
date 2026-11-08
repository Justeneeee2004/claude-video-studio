import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import type React from "react";
import { Easing, interpolate, interpolateColors } from "remotion";
import { RALLYO_COLORS, RALLYO_FONTS } from "../theme/rallyo";

/**
 * T3 zoomThrough (S3 → S4, abs 345–360): through the night Publish button into the dark host sheet (a shape match
 * and a night-to-night colour match). linearTiming({durationInFrames: 15}); easing inside; p = (abs − 345) / 15.
 *
 * Anticipation: the night shape covers the canvas at 354 (p 0.6), S4 lands on bar 6 (360).
 * - Exiting, kept fully opaque. Two siblings inside the exiting wrapper, both about
 *   transformOrigin `${originX}px ${originY}px`, same curve {easing: Easing.bezier(0.5, 0, 0.75, 0),
 *   output: "perceptual-scale", clamp} over p 0–0.6:
 *   1. the scene: scale interpolate(p, [0, 0.6], [1, outScale]);
 *   2. above it, the shape: a rounded rect on the Publish button's frame rect (x shapeX…shapeX+shapeW,
 *      y shapeY…shapeY+shapeH, radius shapeRadius): scale interpolate(p, [0, 0.6], [1, shapeTo]) → 1.7× at 347,
 *      4.7× at 349, 6.9× at 350, 9.8× at 351, 13.2× at 352, 22× at 354 (whole canvas: from the draft-v3 button rect
 *      the farthest edge needs 18.7×). The shape always scales at least as fast as the scene, so the scaled button
 *      stays inside it. f345 shows the untouched button (shape opacity 0); the shape is opaque from 346 (p 0.067).
 *   Draft v3 (craft #9, "the zoomThrough reads as a grey slab"):
 *   - Colour: the shape starts as the button's own ink (`shapeStartColor` #121812, so the fade-in never changes the
 *     button) and reaches night (`shapeColor` #0B130D) by p 0.267 (349, 4.7×): from there it is exactly the canvas
 *     night, so it reads as the button swallowing the screen, never as a lighter slab with a band of night below.
 *   - Feather: a box-shadow `0 0 featherBlur featherSpread` in the shape's own colour, on the shape itself, so it
 *     scales with it (60 / 40 px at 1×, opening over 345–347): no hard edge at any frame.
 *   - Label: `label` (the button's real word in its measured face: Satoshi 700, 37.7 px = the captured label at the
 *     S3 hold drift's 1.02, lime, centred on the button; checked pixel-for-pixel against f345) rides the shape, so it
 *     scales with it (≈ 4.7× at 349) and passes the camera: it fades over p 0.267–0.4 (349–351).
 *   From p 0.6 the scene is hidden (visibility, so it is never rasterised above outScale); the shape stays as the
 *   full cover under the entering fade, so 354–357 dissolve from night.
 * - Entering: opacity interpolate(p, [0.6, 0.8], [0, 1], clamp) (354–357), scale interpolate(p, [0.6, 1],
 *   [inScale, 1], {easing: Easing.bezier(0.16, 1, 0.3, 1), output: "perceptual-scale", clamp}) about
 *   (originX, originY): 1.09 at 355, 1.01 at 357, at rest by 359.
 * Draft v3 defaults follow the S3 camera B move (position only, no timing change): button rect (98, 1012, 786x114),
 * origin = its centre (491, 1069).
 * The composition's night AbsoluteFill under the series means no frame dips below night; rail 01 (a top-level
 * overlay) stays visible over the shape.
 */

export type ZoomThroughProps = {
  /** Zoom origin = the Publish button centre, canvas px. */
  readonly originX: number;
  readonly originY: number;
  /** The Publish button's frame rect (canvas px) the night shape grows from. */
  readonly shapeX: number;
  readonly shapeY: number;
  readonly shapeW: number;
  readonly shapeH: number;
  readonly shapeRadius: number;
  /** Shape scale at p 0.6 (covers the canvas). */
  readonly shapeTo: number;
  /** Outgoing scene scale at p 0.6. */
  readonly outScale: number;
  /** Incoming scene start scale. */
  readonly inScale: number;
  /** Shape colour from p 0.267 on (night, so the cover never reads as a lighter slab). */
  readonly shapeColor: string;
  /** Shape colour at p 0 (the button's own fill). */
  readonly shapeStartColor: string;
  /** Edge feather at 1× (canvas px): box-shadow blur and spread in the shape colour, scaled with the shape. */
  readonly featherBlur: number;
  readonly featherSpread: number;
  /** The button's label, carried on the shape ("" = none). */
  readonly label: string;
  readonly labelColor: string;
  readonly labelFont: string;
  readonly labelWeight: number;
  /** Label font size at 1× (canvas px). */
  readonly labelSize: number;
  /** Label glyph-box centre offset from the shape centre (canvas px). */
  readonly labelDx: number;
  readonly labelDy: number;
};

export const ZOOM_THROUGH_DEFAULTS: ZoomThroughProps = {
  originX: 491,
  originY: 1069,
  shapeX: 98,
  shapeY: 1012,
  shapeW: 786,
  shapeH: 114,
  shapeRadius: 15,
  shapeTo: 22,
  outScale: 1.35,
  inScale: 1.25,
  shapeColor: RALLYO_COLORS.night,
  shapeStartColor: RALLYO_COLORS.ink,
  featherBlur: 60,
  featherSpread: 40,
  label: "Publish",
  labelColor: RALLYO_COLORS.lime,
  labelFont: RALLYO_FONTS.ui,
  labelWeight: 700,
  labelSize: 37.7,
  labelDx: 0,
  labelDy: 0,
};

const ZoomThroughPresentation: React.FC<TransitionPresentationComponentProps<ZoomThroughProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {
    originX,
    originY,
    shapeX,
    shapeY,
    shapeW,
    shapeH,
    shapeRadius,
    shapeTo,
    outScale,
    inScale,
    shapeColor,
    shapeStartColor,
    featherBlur,
    featherSpread,
    label,
    labelColor,
    labelFont,
    labelWeight,
    labelSize,
    labelDx,
    labelDy,
  } = passedProps;
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    // Button ink → night by 349 (4.7×), so the growing cover is exactly the canvas night from there on.
    const fill = interpolateColors(p, [0, 0.267], [shapeStartColor, shapeColor]);
    const feather = interpolate(p, [0, 0.133], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            visibility: p >= 0.6 ? "hidden" : "visible",
            transformOrigin: `${originX}px ${originY}px`,
            scale: interpolate(p, [0, 0.6], [1, outScale], {
              easing: Easing.bezier(0.5, 0, 0.75, 0),
              output: "perceptual-scale",
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {children}
        </div>
        <div
          style={{
            position: "absolute",
            left: shapeX,
            top: shapeY,
            width: shapeW,
            height: shapeH,
            borderRadius: shapeRadius,
            backgroundColor: fill,
            // Feather in the shape's own colour; it scales with the shape, so no hard edge ever shows. It opens over
            // 345–347 so the dark halo grows out of the button instead of popping in at 346.
            boxShadow: `0px 0px ${featherBlur * feather}px ${featherSpread * feather}px ${fill}`,
            // f345 is the untouched button; from 346 the shape (button ink + its own label) is opaque, so the real
            // and the carried label never cross-fade at two different scales (no double label).
            opacity: interpolate(p, [0, 0.067], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            transformOrigin: `${originX - shapeX}px ${originY - shapeY}px`,
            scale: interpolate(p, [0, 0.6], [1, shapeTo], {
              easing: Easing.bezier(0.5, 0, 0.75, 0),
              output: "perceptual-scale",
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {label ? (
            // The button's word rides the shape (≈ 4.7× at 349) and passes the camera: gone by 351.
            <div
              style={{
                position: "absolute",
                left: labelDx,
                top: labelDy,
                width: shapeW,
                height: shapeH,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: labelFont,
                fontWeight: labelWeight,
                fontSize: labelSize,
                lineHeight: 1,
                color: labelColor,
                whiteSpace: "pre",
                opacity: interpolate(p, [0.267, 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(p, [0.6, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transformOrigin: `${originX}px ${originY}px`,
        scale: interpolate(p, [0.6, 1], [inScale, 1], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          output: "perceptual-scale",
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {children}
    </div>
  );
};

export const zoomThrough = (props: Partial<ZoomThroughProps> = {}): TransitionPresentation<ZoomThroughProps> => ({
  component: ZoomThroughPresentation,
  props: { ...ZOOM_THROUGH_DEFAULTS, ...props },
});

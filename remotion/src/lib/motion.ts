import { Easing, interpolate } from "remotion";

/**
 * Motion presets. Rule of thumb:
 *  - enters: EASE.out (fast start, soft landing)
 *  - exits:  EASE.in
 *  - moves between two on-screen states: EASE.inOut
 *  - "push" springs have no bounce; "pop" overshoots slightly (CTAs, logos, badges)
 *
 * Inside Interactive elements prefer writing the literal `Easing.bezier(0.16, 1, 0.3, 1)`
 * inline so Remotion Studio can edit the keyframes. Use these helpers in custom code.
 */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  push: Easing.spring({ damping: 200 }),
  pop: Easing.spring({ damping: 14, stiffness: 160 }),
  linear: Easing.linear,
};

/** Configs for the frame-based spring() function. */
export const SPRING = {
  gentle: { damping: 200 },
  snappy: { damping: 18, stiffness: 220, mass: 0.7 },
  bouncy: { damping: 9, stiffness: 140 },
  heavy: { damping: 26, stiffness: 90, mass: 1.6 },
} as const;

export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Standard durations in frames at 30 fps. */
export const DUR = { micro: 6, fast: 12, base: 18, slow: 30, hero: 45 } as const;

export const stagger = (index: number, step = 3): number => index * step;

export const sec = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);

/** Opacity + rise. Spread into a style object. */
export const fadeUp = (
  frame: number,
  start: number,
  duration: number = DUR.base,
  distance = 32,
) => ({
  opacity: interpolate(frame, [start, start + duration], [0, 1], {
    ...CLAMP,
    easing: EASE.out,
  }),
  translate: `0px ${interpolate(frame, [start, start + duration], [distance, 0], {
    ...CLAMP,
    easing: EASE.out,
  })}px`,
});

/** Scale-in with slight overshoot. Spread into a style object. */
export const popIn = (
  frame: number,
  start: number,
  duration: number = DUR.base,
) => ({
  opacity: interpolate(frame, [start, start + Math.min(duration, 10)], [0, 1], CLAMP),
  scale: interpolate(frame, [start, start + duration], [0.8, 1], {
    ...CLAMP,
    easing: EASE.pop,
    output: "perceptual-scale",
  }),
});

/** Fade + drop out, ending at `end`. Spread into a style object. */
export const exitDown = (
  frame: number,
  end: number,
  duration: number = DUR.fast,
  distance = 24,
) => ({
  opacity: interpolate(frame, [end - duration, end], [1, 0], {
    ...CLAMP,
    easing: EASE.in,
  }),
  translate: `0px ${interpolate(frame, [end - duration, end], [0, distance], {
    ...CLAMP,
    easing: EASE.in,
  })}px`,
});

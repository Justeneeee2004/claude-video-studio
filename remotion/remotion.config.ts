/**
 * Remotion CLI config (Studio + `npx remotion render`).
 * Note: when using the Node.js APIs, this file does not apply; pass options directly.
 * All options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Colour tagging (Rallyo draft v3, accuracy #2 / DEFECTS #19): encode limited-range yuv420p tagged BT.709
// (matrix, primaries, transfer; Remotion converts with zscale), so phone players and FB's re-encode read brand
// lime #C8F23A and the night base the same way. Draft v2 shipped yuvj420p, full range, bt470bg, unset trc.
// Equivalent to `--pixel-format=yuv420p --color-space=bt709` (Remotion 4.0.536 Config API, checked in
// node_modules/@remotion/cli/dist/config/index.d.ts).
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.overrideBundlerConfig(enableTailwind);

// WebGL effects (@remotion/effects: lightLeak, glow, vignette, ...) need a GPU-capable
// renderer during renders. Equivalent to `npx remotion render --gl=angle`.
Config.setChromiumOpenGlRenderer("angle");

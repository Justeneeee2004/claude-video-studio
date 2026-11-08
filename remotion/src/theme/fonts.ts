import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";

// Display face for headlines / numbers, body face for support text.
// Loaded once per bundle; Remotion blocks rendering until fonts are ready.
const sora = loadSora("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin"],
});

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const fonts = {
  display: sora.fontFamily,
  body: inter.fontFamily,
  waitUntilDone: () =>
    Promise.all([sora.waitUntilDone(), inter.waitUntilDone()]),
};

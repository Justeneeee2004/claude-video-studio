export const FPS = 30;

export const FORMATS = {
  landscape: { width: 1920, height: 1080, ratio: "16:9", use: "YouTube, FB feed, website, ads" },
  vertical: { width: 1080, height: 1920, ratio: "9:16", use: "Reels, TikTok, Shorts, Stories" },
  square: { width: 1080, height: 1080, ratio: "1:1", use: "FB / IG feed, LinkedIn" },
  portrait: { width: 1080, height: 1350, ratio: "4:5", use: "IG feed (tallest feed format)" },
} as const;

export type Orientation = "landscape" | "vertical" | "square";

export const orientationOf = (width: number, height: number): Orientation => {
  if (height > width * 1.2) {
    return "vertical";
  }
  if (width > height * 1.2) {
    return "landscape";
  }
  return "square";
};

export type SafeArea = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  o: Orientation;
};

/**
 * Padding (px) that keeps key content clear of platform UI:
 * vertical = Reels/TikTok profile bar (top) and caption/CTA stack (bottom).
 */
export const safeArea = (width: number, height: number): SafeArea => {
  const o = orientationOf(width, height);
  if (o === "vertical") {
    return { top: 240, bottom: 420, left: 72, right: 72, o };
  }
  if (o === "square") {
    return { top: 96, bottom: 96, left: 96, right: 96, o };
  }
  return { top: 100, bottom: 100, left: 140, right: 140, o };
};

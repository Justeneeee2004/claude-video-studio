import { staticFile } from "remotion";

/** Resolve a props path: remote URLs pass through, anything else maps to public/. */
export const asset = (src: string): string => {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }
  return staticFile(src);
};

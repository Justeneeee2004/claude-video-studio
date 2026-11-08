import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { RALLYO_FONTS } from "../../theme/rallyo";

/**
 * ₱ for live Satoshi text in the carousel (card 2's share post). Satoshi has no U+20B1, so without this the browser
 * fell back to a thin system serif for `₱800` (seen on the first still). This registers the brand's own Archivo
 * latin-ext ₱ (the face theme/rallyo.ts loads for ₱) as an extra "Satoshi" face limited to U+20B1, once per
 * Satoshi weight (500 / 700 / 900, the same descriptors as the theme's faces), so every other glyph stays Satoshi.
 *
 * Scoped to the carousel: the faces are registered when RallyoCarousel first mounts (not at import), so a render of
 * the reel (RallyoPrelaunch) never loads them and its output is unchanged. useCarouselPesoFace() holds a
 * delayRender until the faces are in; the composition renders nothing until then, so post-layout's measureText runs
 * with the ₱ face already present.
 */

const PESO_FILE = "rallyo/fonts/Archivo-latin-ext.woff2";
const WEIGHTS = ["500", "700", "900"] as const;

let pesoPromise: Promise<void> | null = null;
let pesoLoaded = false;

const loadPesoFaces = (): Promise<void> => {
  if (pesoPromise) {
    return pesoPromise;
  }
  if (typeof document === "undefined" || typeof FontFace === "undefined") {
    pesoLoaded = true;
    pesoPromise = Promise.resolve();
    return pesoPromise;
  }
  pesoPromise = Promise.all(
    WEIGHTS.map((weight) => {
      const face = new FontFace(RALLYO_FONTS.ui, `url("${staticFile(PESO_FILE)}") format("woff2")`, {
        weight,
        style: "normal",
        unicodeRange: "U+20B1",
      });
      return face.load().then((loaded) => {
        document.fonts.add(loaded);
      });
    }),
  ).then(() => {
    pesoLoaded = true;
  });
  return pesoPromise;
};

export const useCarouselPesoFace = (): boolean => {
  const [ready, setReady] = useState(pesoLoaded);
  const [handle] = useState(() => (pesoLoaded ? null : delayRender("Carousel ₱ face (Archivo latin-ext as Satoshi U+20B1)")));
  useEffect(() => {
    if (handle === null) {
      return;
    }
    if (ready) {
      continueRender(handle);
      return;
    }
    let alive = true;
    loadPesoFaces()
      .then(() => {
        if (alive) {
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        cancelRender(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      alive = false;
    };
  }, [ready, handle]);
  useEffect(
    () => () => {
      if (handle !== null) {
        continueRender(handle);
      }
    },
    [handle],
  );
  return ready;
};

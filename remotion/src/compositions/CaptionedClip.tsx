import { Video } from "@remotion/media";
import type React from "react";
import { useVideoConfig } from "remotion";
import { KineticCaptions } from "../captions/KineticCaptions";

/**
 * Footage + word-highlight captions (talking head / UGC style, 9:16).
 * Replace `src` with staticFile("footage/clip.mp4") and paste transcribed captions
 * (scripts/transcribe.mts) into the inline `captions` array below.
 * The sample video and timings are placeholders to show the styling.
 */
export const CaptionedClip: React.FC = () => {
  const { width } = useVideoConfig();

  return (
    <>
      <Video
        name="Footage"
        src="https://remotion.media/video.mp4"
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "45%",
          background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%)",
          pointerEvents: "none",
        }}
      />
      <KineticCaptions
        name="Captions"
        width={900}
        highlightColor="#22D3EE"
        fontSize={72}
        style={{
          position: "absolute",
          bottom: 480,
          translate: `${(width - 900) / 2}px 0px`,
        }}
        captions={[
          { text: "Stop", startMs: 200, endMs: 520, timestampMs: 360, confidence: null },
          { text: " losing", startMs: 520, endMs: 860, timestampMs: 690, confidence: null },
          { text: " patients", startMs: 860, endMs: 1300, timestampMs: 1080, confidence: null },
          { text: " to", startMs: 1300, endMs: 1460, timestampMs: 1380, confidence: null },
          { text: " no-shows.", startMs: 1460, endMs: 2100, timestampMs: 1780, confidence: null },
          { text: "SkedAI", startMs: 2500, endMs: 2950, timestampMs: 2720, confidence: null },
          { text: " confirms", startMs: 2950, endMs: 3350, timestampMs: 3150, confidence: null },
          { text: " every", startMs: 3350, endMs: 3600, timestampMs: 3470, confidence: null },
          { text: " appointment", startMs: 3600, endMs: 4200, timestampMs: 3900, confidence: null },
          { text: " automatically.", startMs: 4200, endMs: 5000, timestampMs: 4600, confidence: null },
          { text: "On", startMs: 5400, endMs: 5600, timestampMs: 5500, confidence: null },
          { text: " SMS", startMs: 5600, endMs: 5950, timestampMs: 5770, confidence: null },
          { text: " and", startMs: 5950, endMs: 6100, timestampMs: 6020, confidence: null },
          { text: " Messenger.", startMs: 6100, endMs: 6800, timestampMs: 6450, confidence: null },
          { text: "Try", startMs: 7300, endMs: 7500, timestampMs: 7400, confidence: null },
          { text: " it", startMs: 7500, endMs: 7650, timestampMs: 7570, confidence: null },
          { text: " free", startMs: 7650, endMs: 8000, timestampMs: 7820, confidence: null },
          { text: " today.", startMs: 8000, endMs: 8600, timestampMs: 8300, confidence: null },
        ]}
      />
    </>
  );
};

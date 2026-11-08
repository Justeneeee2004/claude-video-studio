import { zColor } from "@remotion/zod-types";
import type React from "react";
import { z } from "zod";
import { Badge } from "../elements/Badge";
import { DEVICE_SIZE, DeviceFrame } from "../elements/DeviceFrame";
import { KineticText } from "../elements/KineticText";
import { LogoLockup } from "../elements/LogoLockup";
import { AmbientOrbs } from "../layers/AmbientOrbs";
import { GradientBackdrop } from "../layers/GradientBackdrop";
import { VignetteOverlay } from "../layers/VignetteOverlay";

/** 1280x720 still for YouTube thumbnails / link previews. */
export const thumbnailSchema = z.object({
  kicker: z.string(),
  headline: z.string(),
  accentWords: z.string(),
  brandName: z.string(),
  logoSrc: z.string(),
  screenshotSrc: z.string(),
  primary: zColor(),
  accent: zColor(),
  bg: zColor(),
  bg2: zColor(),
});

export type ThumbnailProps = z.infer<typeof thumbnailSchema>;

const PHONE_SCALE = 0.62;

export const Thumbnail: React.FC<ThumbnailProps> = (p) => {
  return (
    <>
      <GradientBackdrop name="Backdrop" colorA={p.bg} colorB={p.bg2} angle={160} />
      <AmbientOrbs name="Orbs" colorA={p.primary} colorB={p.accent} intensity={0.6} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          gap: 40,
          padding: "0 72px",
        }}
      >
        <div
          style={{
            flex: "0 0 62%",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <Badge name="Kicker" color={p.accent} style={{ alignSelf: "flex-start", fontSize: 20 }}>
            {p.kicker}
          </Badge>
          <KineticText
            name="Headline"
            text={p.headline}
            accentWords={p.accentWords}
            accentColor={p.accent}
            instant
            style={{ fontSize: 76 }}
          />
          <LogoLockup
            name="Logo"
            brandName={p.brandName}
            logoSrc={p.logoSrc}
            size={40}
            color={p.primary}
            color2={p.accent}
          />
        </div>
        <div
          style={{
            width: DEVICE_SIZE.phone.width * PHONE_SCALE,
            height: DEVICE_SIZE.phone.height * PHONE_SCALE,
            rotate: "-6deg",
          }}
        >
          <div
            style={{
              width: DEVICE_SIZE.phone.width,
              height: DEVICE_SIZE.phone.height,
              scale: PHONE_SCALE,
              transformOrigin: "top left",
            }}
          >
            <DeviceFrame name="Device" src={p.screenshotSrc} variant="phone" />
          </div>
        </div>
      </div>
      <VignetteOverlay name="Vignette" amount={0.5} />
    </>
  );
};

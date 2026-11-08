import type React from "react";
import { Img, Interactive, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { fonts } from "../theme/fonts";

type LogoLockupProps = {
  readonly brandName?: string;
  /** Path in public/ (e.g. "brand/logo.png") or URL. Empty = generated monogram. */
  readonly logoSrc?: string;
  readonly size?: number;
  readonly color?: string;
  readonly color2?: string;
  readonly textColor?: string;
  readonly showName?: boolean;
  readonly style?: React.CSSProperties;
};

const LogoLockupInner: React.FC<LogoLockupProps> = ({
  brandName = "YourBrand",
  logoSrc = "",
  size = 72,
  color = "#6366F1",
  color2 = "#22D3EE",
  textColor = "#F9FAFB",
  showName = true,
  style,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.3,
        ...style,
      }}
    >
      {logoSrc ? (
        <Img src={asset(logoSrc)} style={{ height: size, width: "auto" }} />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.28,
            background: `linear-gradient(135deg, ${color}, ${color2})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: size * 0.55,
            color: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          {brandName.slice(0, 1).toUpperCase()}
        </div>
      )}
      {showName ? (
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: size * 0.62,
            letterSpacing: "-0.02em",
            color: textColor,
            whiteSpace: "nowrap",
          }}
        >
          {brandName}
        </div>
      ) : null}
    </div>
  );
};

const logoLockupSchema = {
  brandName: { type: "string", default: "YourBrand", description: "Brand name" },
  logoSrc: { type: "asset", assetType: "image", default: "", description: "Logo image" },
  size: {
    type: "number",
    min: 24,
    max: 400,
    step: 1,
    default: 72,
    description: "Size",
    hiddenFromList: false,
  },
  color: { type: "color", default: "#6366F1", description: "Monogram color" },
  color2: { type: "color", default: "#22D3EE", description: "Monogram color 2" },
  textColor: { type: "color", default: "#F9FAFB", description: "Name color" },
  showName: { type: "boolean", default: true, description: "Show name" },
} as const satisfies InteractivitySchema;

export const LogoLockup = Interactive.create({
  Component: LogoLockupInner,
  layout: "none",
  schema: logoLockupSchema,
});

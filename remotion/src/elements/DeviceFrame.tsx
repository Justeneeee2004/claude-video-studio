import type React from "react";
import { Img, Interactive, type InteractivitySchema } from "remotion";
import { asset } from "../lib/assets";
import { fonts } from "../theme/fonts";

type DeviceFrameProps = {
  /** Path in public/ (e.g. "screenshots/app.png") or URL. Empty = placeholder. */
  readonly src?: string;
  readonly variant?: "phone" | "browser";
  readonly label?: string;
  readonly style?: React.CSSProperties;
};

/** Natural sizes; scale at the call site with a sized wrapper + `scale` + transformOrigin. */
export const DEVICE_SIZE = {
  phone: { width: 430, height: 880 },
  browser: { width: 1120, height: 700 },
} as const;

const Placeholder: React.FC<{ readonly label: string }> = ({ label }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: 32,
      background: "linear-gradient(160deg, #1E1B4B 0%, #0EA5E9 100%)",
      color: "rgba(255, 255, 255, 0.85)",
      fontFamily: fonts.body,
      fontWeight: 600,
      fontSize: 26,
      lineHeight: 1.3,
    }}
  >
    {label}
  </div>
);

const Screen: React.FC<{ readonly src: string; readonly label: string }> = ({ src, label }) =>
  src ? (
    <Img
      src={asset(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  ) : (
    <Placeholder label={label} />
  );

const DeviceFrameInner: React.FC<DeviceFrameProps> = ({
  src = "",
  variant = "phone",
  label = "Add a screenshot to public/screenshots",
  style,
}) => {
  if (variant === "browser") {
    const { width, height } = DEVICE_SIZE.browser;
    return (
      <div
        style={{
          width,
          height,
          borderRadius: 22,
          backgroundColor: "#121826",
          border: "1.5px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 40px 120px -30px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          ...style,
        }}
      >
        <div
          style={{
            height: 48,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
            backgroundColor: "#1B2232",
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28C840" }} />
          <div
            style={{
              flex: 1,
              marginLeft: 12,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            }}
          />
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <Screen src={src} label={label} />
        </div>
      </div>
    );
  }

  const { width, height } = DEVICE_SIZE.phone;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 60,
        backgroundColor: "#0A0A0A",
        padding: 14,
        boxShadow: "0 40px 120px -30px rgba(0, 0, 0, 0.8), inset 0 0 0 2px rgba(255, 255, 255, 0.12)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 48,
          overflow: "hidden",
          backgroundColor: "#111",
        }}
      >
        <Screen src={src} label={label} />
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            translate: "-50% 0px",
            width: 120,
            height: 34,
            borderRadius: 20,
            backgroundColor: "#000",
          }}
        />
      </div>
    </div>
  );
};

const deviceFrameSchema = {
  src: { type: "asset", assetType: "image", default: "", description: "Screenshot" },
  variant: {
    type: "enum",
    default: "phone",
    description: "Device",
    variants: { phone: {}, browser: {} },
  },
  label: {
    type: "string",
    default: "Add a screenshot to public/screenshots",
    description: "Placeholder label",
  },
} as const satisfies InteractivitySchema;

export const DeviceFrame = Interactive.create({
  Component: DeviceFrameInner,
  layout: "none",
  schema: deviceFrameSchema,
});

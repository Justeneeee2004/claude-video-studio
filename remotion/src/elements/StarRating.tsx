import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";

type StarRatingProps = {
  readonly rating?: number;
  readonly size?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

const STAR = "M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3 6 20.6l1.3-6.6L2.4 9.4l6.7-.8z";

const StarRatingInner: React.FC<StarRatingProps> = ({
  rating = 5,
  size = 36,
  color = "#FBBF24",
  style,
}) => {
  return (
    <div style={{ display: "inline-flex", gap: size * 0.15, ...style }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path
            d={STAR}
            fill={i < Math.round(rating) ? color : "rgba(255, 255, 255, 0.18)"}
          />
        </svg>
      ))}
    </div>
  );
};

const starRatingSchema = {
  rating: {
    type: "number",
    min: 0,
    max: 5,
    step: 1,
    integer: true,
    default: 5,
    description: "Stars",
    hiddenFromList: false,
  },
  size: {
    type: "number",
    min: 12,
    max: 120,
    step: 1,
    default: 36,
    description: "Size",
    hiddenFromList: false,
  },
  color: { type: "color", default: "#FBBF24", description: "Star color" },
} as const satisfies InteractivitySchema;

export const StarRating = Interactive.create({
  Component: StarRatingInner,
  layout: "none",
  schema: starRatingSchema,
});

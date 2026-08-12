import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export default function RatingStars({
  rating,
  reviewCount,
  size = "sm",
  showCount = true,
}: RatingStarsProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const roundedRating = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = roundedRating >= starValue;
          const halfFilled = !filled && roundedRating >= starValue - 0.5;

          return (
            <Star
              key={starValue}
              className={`${starSize} ${
                filled || halfFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs text-slate-500">
          {rating > 0 ? rating.toFixed(1) : "0.0"}
          {reviewCount !== undefined && ` (${reviewCount.toLocaleString()})`}
        </span>
      )}
    </div>
  );
}

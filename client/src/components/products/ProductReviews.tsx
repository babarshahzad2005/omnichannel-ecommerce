import { useEffect, useMemo, useState } from "react";
import { BadgeCheck } from "lucide-react";
import api from "../../services/api";
import type { ApiResponse } from "../../types/auth";
import type { Review, ReviewsResult } from "../../types/product";
import RatingStars from "./RatingStars";

interface ProductReviewsProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

function formatReviewDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function buildRatingBreakdown(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0];

  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      counts[review.rating - 1] += 1;
    }
  });

  const total = counts.reduce((sum, count) => sum + count, 0);

  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars - 1],
    percentage: total > 0 ? Math.round((counts[stars - 1] / total) * 100) : 0,
  }));
}

export default function ProductReviews({
  productId,
  averageRating,
  reviewCount,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<ReviewsResult>>(
          `/products/${productId}/reviews`,
          { params: { page: 1, limit: 50 } }
        );

        if (!cancelled) {
          setReviews(response.data.data?.reviews ?? []);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const breakdown = useMemo(() => buildRatingBreakdown(reviews), [reviews]);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-4xl font-semibold text-ink">{averageRating.toFixed(1)}</p>
        <RatingStars rating={averageRating} reviewCount={reviewCount} size="md" />
        <p className="mt-2 text-sm text-slate-500">
          Based on {reviewCount.toLocaleString()} reviews
        </p>

        <div className="mt-6 space-y-2">
          {breakdown.map((item) => (
            <div key={item.stars} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-slate-500">{item.stars}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-slate-400">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading reviews...
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No reviews yet. Be the first to share your experience after delivery.
          </div>
        )}

        {reviews.map((review) => (
          <article
            key={review._id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <RatingStars rating={review.rating} showCount={false} size="sm" />
                {review.title && (
                  <h4 className="mt-2 font-semibold text-ink">{review.title}</h4>
                )}
              </div>
              <time className="text-xs text-slate-400">
                {formatReviewDate(review.createdAt)}
              </time>
            </div>

            {review.comment && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {review.comment}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <span>{review.user.name}</span>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-mint-500">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified purchase
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

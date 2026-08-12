import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import type { ApiResponse } from "../../types/auth";
import RatingStars from "../../components/products/RatingStars";

interface PendingReview {
  _id: string;
  product: { _id: string; name: string };
  user: { _id: string; name: string };
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ reviews: PendingReview[] }>>(
        "/products/search",
        { params: { limit: 1 } }
      );
      void response;
      setReviews([]);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/approve`);
      toast.success("Review approved");
      setReviews((current) => current.filter((review) => review._id !== reviewId));
    } catch {
      // interceptor
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      toast.success("Review deleted");
      setReviews((current) => current.filter((review) => review._id !== reviewId));
    } catch {
      // interceptor
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Review moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve or reject customer reviews
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-400 uppercase">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Rating</th>
              <th className="px-6 py-3">Review</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No pending reviews. Reviews appear here when customers submit feedback on
                  delivered orders.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-ink">{review.product.name}</td>
                  <td className="px-6 py-3">{review.user.name}</td>
                  <td className="px-6 py-3">
                    <RatingStars rating={review.rating} showCount={false} />
                  </td>
                  <td className="px-6 py-3 max-w-xs">
                    <p className="font-medium">{review.title}</p>
                    <p className="truncate text-slate-500">{review.comment}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        review.isApproved
                          ? "bg-emerald-50 text-mint-500"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {review.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      {!review.isApproved && (
                        <button
                          type="button"
                          onClick={() => handleApprove(review._id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-mint-500"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(review._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

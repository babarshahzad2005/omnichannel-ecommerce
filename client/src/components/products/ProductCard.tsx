import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { addToCart } from "../../services/cartService";
import type { Product, StockStatus } from "../../types/product";
import {
  formatPrice,
  getDiscountPercent,
  getPrimaryImage,
} from "../../utils/product";
import RatingStars from "./RatingStars";
import StockBadge from "./StockBadge";

interface ProductCardProps {
  product: Product;
  stockStatus?: StockStatus;
}

export default function ProductCard({ product, stockStatus }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const primaryImage = getPrimaryImage(product.images);
  const discount = getDiscountPercent(product.price, product.compareAtPrice);
  const isOutOfStock = stockStatus === "out_of_stock";

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isOutOfStock) return;

    setAdding(true);
    try {
      await addToCart({ productId: product._id, qty: 1 });
      toast.success("Added to cart");
    } catch {
      // Error toast handled by axios interceptor
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/products/${product._id}`} className="relative block aspect-square bg-slate-50">
        {discount !== null && (
          <span className="absolute top-3 left-3 z-10 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            {discount}% OFF
          </span>
        )}
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt ?? product.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink transition group-hover:text-cobalt-600">
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <p className="mt-1 text-xs text-slate-500">{product.brand}</p>
        )}

        <div className="mt-2">
          <RatingStars
            rating={product.averageRating}
            reviewCount={product.reviewCount}
            size="sm"
          />
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-ink">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="mt-2">
          <StockBadge status={stockStatus} />
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || isOutOfStock}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cobalt-600 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {adding ? "Adding..." : isOutOfStock ? "Out of stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

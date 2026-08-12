import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import toast from "react-hot-toast";
import ImageGallery from "../../components/products/ImageGallery";
import ProductReviews from "../../components/products/ProductReviews";
import RatingStars from "../../components/products/RatingStars";
import StockBadge from "../../components/products/StockBadge";
import api from "../../services/api";
import { useCartStore } from "../../store/cartStore";
import type { ApiResponse } from "../../types/auth";
import type { Product, PublicStockStatus, StockStatus, VariantOption } from "../../types/product";
import {
  formatPrice,
  getCategoryName,
  getDiscountPercent,
  getProductDisplayPrice,
  getSelectedVariantSku,
  initializeVariantSelection,
} from "../../utils/product";

type TabId = "description" | "reviews" | "shipping";

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "reviews", label: "Reviews" },
  { id: "shipping", label: "Shipping" },
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [stockStatus, setStockStatus] = useState<StockStatus>("in_stock");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, VariantOption | undefined>
  >({});

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [productResponse, stockResponse] = await Promise.all([
          api.get<ApiResponse<Product>>(`/products/${id}`),
          api.get<ApiResponse<PublicStockStatus>>(`/inventory/public/${id}`),
        ]);

        if (cancelled) return;

        const productData = productResponse.data.data ?? null;
        setProduct(productData);
        setStockStatus(stockResponse.data.data?.status ?? "out_of_stock");

        if (productData) {
          setSelectedOptions(initializeVariantSelection(productData.variants));
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    return getProductDisplayPrice(product, selectedOptions);
  }, [product, selectedOptions]);

  const discount = product
    ? getDiscountPercent(displayPrice, product.compareAtPrice)
    : null;

  const variantSku = product ? getSelectedVariantSku(product, selectedOptions) : undefined;
  const isOutOfStock = stockStatus === "out_of_stock";
  const categoryName = product ? getCategoryName(product.category) : undefined;
  const reviewsTabLabel =
    product && product.reviewCount > 0
      ? `Reviews (${product.reviewCount.toLocaleString()})`
      : "Reviews";

  const handleVariantSelect = (type: string, option: VariantOption) => {
    setSelectedOptions((current) => ({ ...current, [type]: option }));
  };

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (!product || isOutOfStock) return;

    if (product.variants.length > 0 && !variantSku) {
      toast.error("Please select all product options");
      return;
    }

    setAdding(true);
    try {
      await addItem(product._id, quantity, variantSku);
      toast.success(redirectToCheckout ? "Proceeding to checkout..." : "Added to cart");

      if (redirectToCheckout) {
        navigate("/checkout");
      }
    } catch {
      // Error toast handled by axios interceptor
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cobalt-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-sm text-cobalt-600 hover:text-cobalt-700">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-cobalt-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-cobalt-600">
          Products
        </Link>
        {categoryName && (
          <>
            <span className="mx-2">/</span>
            <span>{categoryName}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="space-y-6">
          <div>
            {product.brand && (
              <p className="text-sm font-medium text-slate-500">{product.brand}</p>
            )}
            <h1 className="mt-1 text-3xl font-semibold text-ink">{product.name}</h1>

            <div className="mt-3">
              <RatingStars
                rating={product.averageRating}
                reviewCount={product.reviewCount}
                size="md"
              />
            </div>

            {product.createdBy && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                Sold by {product.createdBy.name}
                <BadgeCheck className="h-4 w-4 text-cobalt-600" />
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-semibold text-ink">
              {formatPrice(displayPrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > displayPrice && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            {discount !== null && (
              <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                {discount}% OFF
              </span>
            )}
          </div>

          <StockBadge status={stockStatus} />

          {product.variants.map((variant) => (
            <div key={variant.type}>
              <p className="mb-2 text-sm font-medium text-ink">
                {variant.type}
                {selectedOptions[variant.type] && (
                  <span className="ml-1 font-normal text-slate-500">
                    : {selectedOptions[variant.type]?.name}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => {
                  const isSelected = selectedOptions[variant.type]?.sku === option.sku;
                  const isDisabled = option.stock <= 0;

                  return (
                    <button
                      key={option.sku}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleVariantSelect(variant.type, option)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-cobalt-600 bg-cobalt-600 text-white"
                          : "border-slate-200 bg-white text-ink hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      }`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Quantity</p>
            <div className="inline-flex items-center rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x border-slate-200 text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={adding || isOutOfStock}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cobalt-600 py-3 text-sm font-medium text-white transition hover:bg-cobalt-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {adding ? "Adding..." : isOutOfStock ? "Out of stock" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={adding || isOutOfStock}
              className="flex flex-1 items-center justify-center rounded-lg border border-cobalt-600 py-3 text-sm font-medium text-cobalt-600 transition hover:bg-cobalt-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-2 text-mint-500">
              <Truck className="h-4 w-4" />
              <span className="font-medium">Free delivery on orders over $75</span>
            </div>
            <p className="mt-2">Standard shipping 3–5 business days. Express options at checkout.</p>
          </div>
        </div>
      </div>

      {product.attributes.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Product specifications</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {product.attributes.map((attribute) => (
              <div key={attribute.key} className="border-b border-slate-100 pb-3">
                <dt className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                  {attribute.key}
                </dt>
                <dd className="mt-1 text-sm text-ink">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section>
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 pb-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-cobalt-600 text-cobalt-600"
                    : "border-transparent text-slate-500 hover:text-ink"
                }`}
              >
                {tab.id === "reviews" ? reviewsTabLabel : tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6">
          {activeTab === "description" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
              {product.richDescription && (
                <div
                  className="prose prose-sm mt-4 max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ __html: product.richDescription }}
                />
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <ProductReviews
              productId={product._id}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          )}

          {activeTab === "shipping" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Shipping & returns</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Standard delivery: 3–5 business days</li>
                <li>Express delivery: 1–2 business days (where available)</li>
                <li>Free shipping on orders over $75</li>
                <li>30-day free returns on eligible items</li>
                <li>Stock is reserved for 15 minutes during checkout</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

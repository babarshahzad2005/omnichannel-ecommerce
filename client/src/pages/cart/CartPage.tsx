import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import CartItemRow from "../../components/checkout/CartItemRow";
import OrderSummary from "../../components/checkout/OrderSummary";
import { useCartStore } from "../../store/cartStore";

export default function CartPage() {
  const {
    items,
    loading,
    couponInput,
    appliedCoupon,
    fetchCart,
    updateItem,
    removeItem,
    applyCoupon,
    clearCoupon,
    setCouponInput,
    getTotals,
  } = useCartStore();

  const [updatingItemKey, setUpdatingItemKey] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const totals = getTotals();

  const handleUpdateQty = async (
    productId: string,
    qty: number,
    variantSku?: string
  ) => {
    const itemKey = `${productId}:${variantSku ?? "default"}`;
    setUpdatingItemKey(itemKey);
    try {
      await updateItem(productId, qty, variantSku);
    } finally {
      setUpdatingItemKey(null);
    }
  };

  const handleRemove = async (productId: string, variantSku?: string) => {
    const itemKey = `${productId}:${variantSku ?? "default"}`;
    setUpdatingItemKey(itemKey);
    try {
      await removeItem(productId, variantSku);
      toast.success("Item removed");
    } finally {
      setUpdatingItemKey(null);
    }
  };

  const handleApplyCoupon = async () => {
    setApplyingCoupon(true);
    try {
      await applyCoupon();
      toast.success("Coupon applied");
    } catch {
      // Error toast from axios interceptor
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cobalt-600 border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <ShoppingBag className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse our catalog and add items to get started.
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex rounded-lg bg-cobalt-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-cobalt-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Shopping cart</h1>
        <p className="mt-1 text-sm text-slate-500">
          {items.length} item{items.length !== 1 ? "s" : ""} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map((item) => {
            const itemKey = `${item.productId}:${item.variantSku ?? "default"}`;

            return (
              <CartItemRow
                key={itemKey}
                item={item}
                updating={updatingItemKey === itemKey}
                onUpdateQty={(qty) =>
                  handleUpdateQty(item.productId, qty, item.variantSku)
                }
                onRemove={() => handleRemove(item.productId, item.variantSku)}
              />
            );
          })}
        </div>

        <OrderSummary
          items={items}
          totals={totals}
          couponInput={couponInput}
          appliedCoupon={appliedCoupon}
          onCouponInputChange={setCouponInput}
          onApplyCoupon={handleApplyCoupon}
          onClearCoupon={clearCoupon}
          applyingCoupon={applyingCoupon}
          showItems={false}
          action={
            <Link
              to="/checkout"
              className="flex w-full items-center justify-center rounded-lg bg-cobalt-600 py-3 text-sm font-medium text-white transition hover:bg-cobalt-700"
            >
              Proceed to Checkout
            </Link>
          }
        />
      </div>
    </div>
  );
}

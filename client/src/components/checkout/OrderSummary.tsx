import { Check, Tag, X } from "lucide-react";
import type { AppliedCoupon, CartItem, OrderTotals } from "../../types/cart";
import { formatPrice } from "../../utils/product";
import CartItemRow from "./CartItemRow";

interface OrderSummaryProps {
  items: CartItem[];
  totals: OrderTotals;
  couponInput: string;
  appliedCoupon: AppliedCoupon | null;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  onClearCoupon: () => void;
  applyingCoupon?: boolean;
  showItems?: boolean;
  onUpdateQty?: (productId: string, qty: number, variantSku?: string) => void;
  onRemoveItem?: (productId: string, variantSku?: string) => void;
  updatingItemKey?: string | null;
  action?: React.ReactNode;
}

export default function OrderSummary({
  items,
  totals,
  couponInput,
  appliedCoupon,
  onCouponInputChange,
  onApplyCoupon,
  onClearCoupon,
  applyingCoupon = false,
  showItems = true,
  onUpdateQty,
  onRemoveItem,
  updatingItemKey,
  action,
}: OrderSummaryProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Order summary</h2>

      {showItems && items.length > 0 && (
        <div className="mt-4 divide-y divide-slate-100">
          {items.map((item) => {
            const itemKey = `${item.productId}:${item.variantSku ?? "default"}`;

            return (
              <CartItemRow
                key={itemKey}
                item={item}
                compact
                updating={updatingItemKey === itemKey}
                onUpdateQty={
                  onUpdateQty
                    ? (qty) => onUpdateQty(item.productId, qty, item.variantSku)
                    : () => undefined
                }
                onRemove={
                  onRemoveItem
                    ? () => onRemoveItem(item.productId, item.variantSku)
                    : () => undefined
                }
              />
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <label htmlFor="coupon" className="mb-1.5 block text-sm font-medium text-ink">
          Promotion code
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            type="text"
            value={couponInput}
            onChange={(event) => onCouponInputChange(event.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            disabled={applyingCoupon || !couponInput.trim()}
            className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cobalt-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>

        {appliedCoupon && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-mint-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              <Tag className="h-3.5 w-3.5" />
              {appliedCoupon.code} applied
              {appliedCoupon.description && (
                <span className="text-emerald-700">— {appliedCoupon.description}</span>
              )}
            </span>
            <button
              type="button"
              onClick={onClearCoupon}
              className="rounded p-0.5 hover:bg-emerald-100"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>Subtotal</dt>
          <dd className="font-medium text-ink">{formatPrice(totals.subtotal)}</dd>
        </div>

        {totals.discount > 0 && (
          <div className="flex justify-between text-mint-500">
            <dt>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}</dt>
            <dd className="font-medium">-{formatPrice(totals.discount)}</dd>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <dt>Shipping</dt>
          <dd className={`font-medium ${totals.shippingCost === 0 ? "text-mint-500" : "text-ink"}`}>
            {totals.shippingCost === 0 ? "Free" : formatPrice(totals.shippingCost)}
          </dd>
        </div>

        <div className="flex justify-between text-slate-600">
          <dt>Tax</dt>
          <dd className="font-medium text-ink">{formatPrice(totals.tax)}</dd>
        </div>

        <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-ink">
          <dt>Total</dt>
          <dd>{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      {action && <div className="mt-6">{action}</div>}
    </aside>
  );
}

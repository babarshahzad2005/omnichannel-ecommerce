import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "../../types/cart";
import { formatPrice } from "../../utils/product";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
  updating?: boolean;
  compact?: boolean;
}

export default function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
  updating = false,
  compact = false,
}: CartItemRowProps) {
  return (
    <div
      className={`flex gap-4 ${compact ? "py-3" : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"}`}
    >
      <Link
        to={`/products/${item.productId}`}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
      >
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/products/${item.productId}`}
              className="font-medium text-ink hover:text-cobalt-600"
            >
              {item.name}
            </Link>
            {item.variantSku && (
              <p className="mt-0.5 text-xs text-slate-500">Variant: {item.variantSku}</p>
            )}
            <p className="mt-1 text-sm text-slate-600">{formatPrice(item.price)} each</p>
          </div>

          {!compact && (
            <p className="text-sm font-semibold text-ink">{formatPrice(item.subtotal)}</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center rounded-lg border border-slate-200">
            <button
              type="button"
              disabled={updating || item.qty <= 1}
              onClick={() => onUpdateQty(item.qty - 1)}
              className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 w-10 items-center justify-center border-x border-slate-200 text-sm font-medium">
              {item.qty}
            </span>
            <button
              type="button"
              disabled={updating}
              onClick={() => onUpdateQty(item.qty + 1)}
              className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {compact && (
              <span className="text-sm font-semibold text-ink">
                {formatPrice(item.subtotal)}
              </span>
            )}
            <button
              type="button"
              disabled={updating}
              onClick={onRemove}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

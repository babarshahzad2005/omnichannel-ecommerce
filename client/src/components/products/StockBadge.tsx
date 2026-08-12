import type { StockStatus } from "../../types/product";

const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const STOCK_STYLES: Record<StockStatus, string> = {
  in_stock: "bg-emerald-50 text-mint-500",
  low_stock: "bg-amber-50 text-amber-500",
  out_of_stock: "bg-red-50 text-red-600",
};

interface StockBadgeProps {
  status?: StockStatus;
}

export default function StockBadge({ status = "in_stock" }: StockBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STOCK_STYLES[status]}`}
    >
      {STOCK_LABELS[status]}
    </span>
  );
}

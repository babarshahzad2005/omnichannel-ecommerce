import type { OrderStatus, PaymentStatus } from "../../types/admin";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-600 ring-amber-200",
  processing: "bg-blue-50 text-cobalt-600 ring-blue-200",
  confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  shipped: "bg-cobalt-50 text-cobalt-700 ring-cobalt-200",
  delivered: "bg-emerald-50 text-mint-500 ring-emerald-200",
  cancelled: "bg-red-50 text-red-600 ring-red-200",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-600 ring-amber-200",
  paid: "bg-emerald-50 text-mint-500 ring-emerald-200",
  failed: "bg-red-50 text-red-600 ring-red-200",
  refunded: "bg-slate-100 text-slate-600 ring-slate-200",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  processing: "Processing",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type: "order" | "payment";
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const styles =
    type === "order"
      ? ORDER_STATUS_STYLES[status as OrderStatus]
      : PAYMENT_STATUS_STYLES[status as PaymentStatus];

  const label =
    type === "order"
      ? ORDER_STATUS_LABELS[status as OrderStatus]
      : PAYMENT_STATUS_LABELS[status as PaymentStatus];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}

export { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS };

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, Package } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/admin/Modal";
import StatusBadge, { ORDER_STATUS_LABELS } from "../../components/admin/StatusBadge";
import {
  downloadAdminInvoice,
  downloadPackingSlip,
  fetchAdminOrder,
  updateOrderStatus,
} from "../../services/adminService";
import type { AdminOrder, OrderStatus } from "../../types/admin";
import { formatPrice } from "../../utils/product";

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchAdminOrder(id);
      setOrder(data);
      setNewStatus(data.orderStatus);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order._id, {
        orderStatus: newStatus,
        tracking: statusNote ? { description: statusNote } : undefined,
      });
      setOrder(updated);
      setStatusModalOpen(false);
      setStatusNote("");
      toast.success("Order status updated");
    } catch {
      // interceptor handles toast
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cobalt-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-ink">Order not found</p>
        <Link to="/admin/orders" className="mt-4 inline-block text-sm text-cobalt-600">
          Back to orders
        </Link>
      </div>
    );
  }

  const customer = typeof order.user === "object" ? order.user : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/admin/orders" className="text-sm text-cobalt-600 hover:text-cobalt-700">
            ← Back to orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={order.orderStatus} type="order" />
            <StatusBadge status={order.paymentStatus} type="payment" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusModalOpen(true)}
            className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white hover:bg-cobalt-700"
          >
            Update Status
          </button>
          <button
            type="button"
            onClick={() => downloadAdminInvoice(order._id)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            Invoice
          </button>
          <button
            type="button"
            onClick={() => downloadPackingSlip(order._id)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            <Package className="h-4 w-4" />
            Packing Slip
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Order items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, index) => (
                    <tr key={`${item.product}-${index}`}>
                      <td className="py-3">
                        <p className="font-medium text-ink">{item.name}</p>
                        {item.variant && (
                          <p className="text-xs text-slate-400">{item.variant}</p>
                        )}
                      </td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">{formatPrice(item.price)}</td>
                      <td className="py-3 text-right font-medium">
                        {formatPrice(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-mint-500">
                  <dt>Discount</dt>
                  <dd>-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Shipping</dt>
                <dd>{formatPrice(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tax</dt>
                <dd>{formatPrice(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Order timeline</h2>
            <ol className="mt-4 space-y-0">
              {[...order.trackingInfo].reverse().map((event, index) => (
                <li key={`${event.timestamp}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < order.trackingInfo.length - 1 && (
                    <span className="absolute top-3 left-[7px] h-full w-0.5 bg-slate-200" />
                  )}
                  <span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-cobalt-600 bg-white" />
                  <div>
                    <p className="text-sm font-medium text-ink capitalize">
                      {event.status.replace("_", " ")}
                    </p>
                    {event.description && (
                      <p className="text-sm text-slate-600">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-xs text-slate-400">{event.location}</p>
                    )}
                    <time className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Customer</h2>
            {customer ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-slate-400">Name</dt>
                  <dd className="font-medium text-ink">{customer.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="text-ink">{customer.email}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Customer info unavailable</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Shipping address</h2>
            <address className="mt-3 text-sm not-italic text-slate-600">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.addressLine1}<br />
              {order.shippingAddress.addressLine2 && (
                <>{order.shippingAddress.addressLine2}<br /></>
              )}
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}<br />
              {order.shippingAddress.phone}
            </address>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Method</dt>
                <dd className="uppercase">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <StatusBadge status={order.paymentStatus} type="payment" />
                </dd>
              </div>
              {order.couponCode && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Coupon</dt>
                  <dd>{order.couponCode}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      <Modal
        open={statusModalOpen}
        title="Update order status"
        onClose={() => setStatusModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={updating}
              className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white hover:bg-cobalt-700 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update status"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="orderStatus" className="mb-1.5 block text-sm font-medium text-ink">
              New status
            </label>
            <select
              id="orderStatus"
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as OrderStatus)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:outline-none"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="statusNote" className="mb-1.5 block text-sm font-medium text-ink">
              Tracking note (optional)
            </label>
            <textarea
              id="statusNote"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:outline-none"
              placeholder="e.g. Package picked up by carrier"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

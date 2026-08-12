import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, Search } from "lucide-react";
import Pagination from "../../components/products/Pagination";
import StatusBadge from "../../components/admin/StatusBadge";
import {
  downloadAdminInvoice,
  fetchAdminOrders,
} from "../../services/adminService";
import type { AdminOrder, OrderStatus } from "../../types/admin";
import { formatPrice } from "../../utils/product";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "processing", label: "Processing" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await fetchAdminOrders({
        page,
        limit: 10,
        orderStatus: statusFilter ? (statusFilter as OrderStatus) : undefined,
      });
      setOrders(result.orders);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadOrders(1);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = search.trim().toLowerCase();
      const customerName =
        typeof order.user === "object" ? order.user.name.toLowerCase() : "";
      const customerEmail =
        typeof order.user === "object" ? order.user.email.toLowerCase() : "";
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query);

      const orderDate = new Date(order.createdAt);
      const matchesStart = !startDate || orderDate >= new Date(startDate);
      const matchesEnd =
        !endDate || orderDate <= new Date(`${endDate}T23:59:59`);

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [orders, search, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Order management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pagination.total} total orders
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order #, customer..."
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-10 text-sm focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:outline-none"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                <th className="px-6 py-3">Order #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-ink">{order.orderNumber}</td>
                    <td className="px-6 py-3">
                      <p className="text-ink">
                        {typeof order.user === "object" ? order.user.name : "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {typeof order.user === "object" ? order.user.email : ""}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{order.items.length}</td>
                    <td className="px-6 py-3 font-medium text-ink">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={order.orderStatus} type="order" />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={order.paymentStatus} type="payment" />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cobalt-600"
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => downloadAdminInvoice(order._id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cobalt-600"
                          title="Download invoice"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={loadOrders}
            />
          </div>
        )}
      </div>
    </div>
  );
}

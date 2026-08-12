import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import RevenueChart from "../../components/admin/RevenueChart";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import {
  fetchAdminOrders,
  fetchCustomerStats,
  fetchInventoryReport,
  fetchLowStock,
  fetchRevenueChart,
  fetchSalesOverview,
} from "../../services/adminService";
import type { AdminOrder, LowStockItem, RevenueChartPoint } from "../../types/admin";
import { formatPrice } from "../../utils/product";

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchSalesOverview>> | null>(null);
  const [customerStats, setCustomerStats] = useState<Awaited<ReturnType<typeof fetchCustomerStats>> | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [inventoryReport, setInventoryReport] = useState<Awaited<ReturnType<typeof fetchInventoryReport>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const range = getDefaultDateRange();

    const load = async () => {
      setLoading(true);
      try {
        const [sales, customers, chart, orders, lowStock, inventory] = await Promise.all([
          fetchSalesOverview(range),
          fetchCustomerStats(range),
          fetchRevenueChart({ ...range, granularity: "day" }),
          fetchAdminOrders({ page: 1, limit: 8 }),
          fetchLowStock(),
          fetchInventoryReport(),
        ]);

        setOverview(sales);
        setCustomerStats(customers);
        setChartData(chart);
        setRecentOrders(orders.orders);
        setLowStockItems(lowStock.slice(0, 5));
        setInventoryReport(inventory);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cobalt-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(overview?.totalRevenue ?? 0)}
          icon={DollarSign}
          trend={12.4}
          trendLabel="vs last 30 days"
        />
        <StatCard
          title="Total Orders"
          value={(overview?.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingBag}
          trend={8.2}
          trendLabel="vs last 30 days"
        />
        <StatCard
          title="Avg Order Value"
          value={formatPrice(overview?.avgOrderValue ?? 0)}
          icon={TrendingUp}
          trend={3.1}
          trendLabel="vs last 30 days"
        />
        <StatCard
          title="Total Customers"
          value={(customerStats?.totalCustomers ?? 0).toLocaleString()}
          icon={Users}
          trendLabel={`${customerStats?.newCustomers ?? 0} new this month`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Revenue</h2>
            <span className="text-xs text-slate-400">Last 30 days</span>
          </div>
          <RevenueChart data={chartData} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-ink">Low stock alerts</h2>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-500">All inventory levels are healthy.</p>
          ) : (
            <ul className="space-y-3">
              {lowStockItems.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {typeof item.product === "object" ? item.product.name : "Product"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.quantity - item.reservedQty} available · reorder at {item.reorderLevel}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
                    Low
                  </span>
                </li>
              ))}
            </ul>
          )}

          {inventoryReport && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
              <div>
                <p className="font-semibold text-ink">{inventoryReport.lowStock}</p>
                <p className="text-slate-400">Low stock</p>
              </div>
              <div>
                <p className="font-semibold text-red-600">{inventoryReport.outOfStock}</p>
                <p className="text-slate-400">Out of stock</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-cobalt-600 hover:text-cobalt-700">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                <th className="px-6 py-3">Order #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="font-medium text-cobalt-600 hover:text-cobalt-700"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {typeof order.user === "object" ? order.user.name : "—"}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 font-medium text-ink">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={order.orderStatus} type="order" />
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={order.paymentStatus} type="payment" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

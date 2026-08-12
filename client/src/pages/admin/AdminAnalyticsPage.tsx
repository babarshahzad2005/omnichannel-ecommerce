import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RevenueChart from "../../components/admin/RevenueChart";
import StatCard from "../../components/admin/StatCard";
import {
  fetchCustomerStats,
  fetchRevenueChart,
  fetchSalesOverview,
  fetchTopProducts,
} from "../../services/adminService";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { formatPrice } from "../../utils/product";

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchSalesOverview>> | null>(null);
  const [chartData, setChartData] = useState<Awaited<ReturnType<typeof fetchRevenueChart>>>([]);
  const [topProducts, setTopProducts] = useState<
    Awaited<ReturnType<typeof fetchTopProducts>>
  >([]);
  const [customerStats, setCustomerStats] = useState<Awaited<
    ReturnType<typeof fetchCustomerStats>
  > | null>(null);

  useEffect(() => {
    const range = getDefaultDateRange();
    const load = async () => {
      setLoading(true);
      try {
        const [sales, chart, products, customers] = await Promise.all([
          fetchSalesOverview(range),
          fetchRevenueChart({ ...range, granularity: "day" }),
          fetchTopProducts({ ...range, limit: 10 }),
          fetchCustomerStats(range),
        ]);
        setOverview(sales);
        setChartData(chart);
        setTopProducts(products);
        setCustomerStats(customers);
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
      <div>
        <h1 className="text-2xl font-semibold text-ink">Sales analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Last 30 days performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(overview?.totalRevenue ?? 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={(overview?.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingBag}
        />
        <StatCard
          title="Avg Order Value"
          value={formatPrice(overview?.avgOrderValue ?? 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Customers"
          value={(customerStats?.totalCustomers ?? 0).toLocaleString()}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-ink">Daily revenue</h2>
          <RevenueChart data={chartData} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-ink">Orders by status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={overview?.statusBreakdown.map((item) => ({
                status: item.status.replace("_", " "),
                count: item.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Top products</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Revenue</th>
              <th className="px-6 py-3">Qty sold</th>
              <th className="px-6 py-3">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topProducts.map((product) => (
              <tr key={String(product.productId)}>
                <td className="px-6 py-3 font-medium text-ink">{product.name}</td>
                <td className="px-6 py-3">{formatPrice(product.totalRevenue)}</td>
                <td className="px-6 py-3">{product.totalQuantity}</td>
                <td className="px-6 py-3">{product.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import Modal from "../../components/admin/Modal";
import { fetchCustomerStats, fetchCustomersFromOrders } from "../../services/adminService";
import type { AdminCustomer, CustomerStats } from "../../types/admin";
import { formatPrice } from "../../utils/product";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [customerList, customerStats] = await Promise.all([
        fetchCustomersFromOrders(),
        fetchCustomerStats(),
      ]);
      setCustomers(customerList);
      setStats(customerStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Customer overview from order history
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total customers", value: stats.totalCustomers },
            { label: "New this month", value: stats.newCustomers },
            { label: "With orders", value: stats.customersWithOrders },
            { label: "Repeat rate", value: `${stats.repeatRate}%` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-400 uppercase">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Orders</th>
              <th className="px-6 py-3">Total spent</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No customer data yet
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-ink">{customer.name}</td>
                  <td className="px-6 py-3 text-slate-600">{customer.email}</td>
                  <td className="px-6 py-3">{customer.orderCount}</td>
                  <td className="px-6 py-3 font-medium">
                    {formatPrice(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(customer)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-cobalt-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selected)}
        title="Customer details"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="font-medium text-ink">{selected.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd>{selected.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Orders placed</dt>
              <dd>{selected.orderCount}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Total spent</dt>
              <dd className="font-semibold">{formatPrice(selected.totalSpent)}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}

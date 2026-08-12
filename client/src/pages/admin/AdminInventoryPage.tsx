import { useCallback, useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/admin/Modal";
import { fetchInventory, restockInventory } from "../../services/adminService";
import type { AdminInventoryItem } from "../../types/admin";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState<AdminInventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState("10");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInventory({ limit: 50 });
      setItems(result.inventory);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestock = async () => {
    if (!restockModal) return;
    setSaving(true);
    try {
      await restockInventory({
        productId: restockModal.product._id,
        qty: Number(restockQty),
        warehouse: restockModal.warehouse,
      });
      toast.success("Inventory restocked");
      setRestockModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (item: AdminInventoryItem) => {
    const available = item.quantity - item.reservedQty;
    if (available <= 0) return { label: "Out of stock", className: "bg-red-50 text-red-600" };
    if (available <= item.reorderLevel)
      return { label: "Low stock", className: "bg-amber-50 text-amber-600" };
    return { label: "In stock", className: "bg-emerald-50 text-mint-500" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">Warehouse stock levels</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-400 uppercase">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Warehouse</th>
              <th className="px-6 py-3">On hand</th>
              <th className="px-6 py-3">Reserved</th>
              <th className="px-6 py-3">Available</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const available = item.quantity - item.reservedQty;
                const status = getStockStatus(item);
                return (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-ink">{item.product.name}</td>
                    <td className="px-6 py-3 text-slate-500">{item.product.sku}</td>
                    <td className="px-6 py-3">{item.warehouse}</td>
                    <td className="px-6 py-3">{item.quantity}</td>
                    <td className="px-6 py-3">{item.reservedQty}</td>
                    <td className="px-6 py-3 font-medium">{available}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setRestockModal(item);
                          setRestockQty("10");
                        }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cobalt-600 hover:bg-cobalt-50"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(restockModal)}
        title="Restock inventory"
        onClose={() => setRestockModal(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setRestockModal(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRestock}
              disabled={saving}
              className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Restock
            </button>
          </>
        }
      >
        {restockModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Add stock for <strong>{restockModal.product.name}</strong> at{" "}
              {restockModal.warehouse}
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">Quantity to add</label>
              <input
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

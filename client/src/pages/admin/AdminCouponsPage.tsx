import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/admin/Modal";
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  updateCoupon,
} from "../../services/adminService";
import type { AdminCoupon } from "../../types/admin";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage" as AdminCoupon["discountType"],
  discountValue: "10",
  minOrderAmount: "0",
  maxUses: "",
  maxUsesPerUser: "1",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await fetchCoupons());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setForm({
      ...EMPTY_FORM,
      validFrom: now.toISOString().slice(0, 16),
      validUntil: nextMonth.toISOString().slice(0, 16),
    });
    setModalOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      maxUsesPerUser: String(coupon.maxUsesPerUser),
      validFrom: coupon.validFrom.slice(0, 16),
      validUntil: coupon.validUntil.slice(0, 16),
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        maxUsesPerUser: Number(form.maxUsesPerUser),
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
        isActive: form.isActive,
      };

      if (editing) {
        await updateCoupon(editing._id, payload);
        toast.success("Coupon updated");
      } else {
        await createCoupon(payload);
        toast.success("Coupon created");
      }

      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: AdminCoupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await deleteCoupon(coupon._id);
      toast.success("Coupon deleted");
      await load();
    } catch {
      // interceptor
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500">Promotions and discount codes</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white hover:bg-cobalt-700"
        >
          <Plus className="h-4 w-4" />
          Add coupon
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-400 uppercase">
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Value</th>
              <th className="px-6 py-3">Uses</th>
              <th className="px-6 py-3">Valid until</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-ink">{coupon.code}</td>
                  <td className="px-6 py-3 capitalize">{coupon.discountType.replace("_", " ")}</td>
                  <td className="px-6 py-3">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `$${coupon.discountValue}`}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {coupon.usedCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        coupon.isActive
                          ? "bg-emerald-50 text-mint-500"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(coupon)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-cobalt-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit coupon" : "Add coupon"}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              disabled={Boolean(editing)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Discount type</label>
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountType: e.target.value as AdminCoupon["discountType"],
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
              <option value="free_shipping">Free shipping</option>
              <option value="bogo">BOGO</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Discount value</label>
            <input
              type="number"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Min order amount</label>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valid from</label>
            <input
              type="datetime-local"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valid until</label>
            <input
              type="datetime-local"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}

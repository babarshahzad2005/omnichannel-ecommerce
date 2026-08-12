import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/admin/Modal";
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
} from "../../services/adminService";
import type { AdminCategory, AdminProduct } from "../../types/admin";
import { formatPrice } from "../../utils/product";

const EMPTY_FORM = {
  name: "",
  sku: "",
  description: "",
  brand: "",
  category: "",
  price: "",
  compareAtPrice: "",
  isActive: true,
  isFeatured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productResult, categoryList] = await Promise.all([
        fetchProducts({ limit: 50 }),
        fetchCategories(),
      ]);
      setProducts(productResult.products);
      setCategories(categoryList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?._id ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: "",
      brand: product.brand ?? "",
      category:
        typeof product.category === "object" ? product.category._id : product.category,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description || form.name,
        brand: form.brand || undefined,
        category: form.category,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      if (editing) {
        await updateProduct(editing._id, payload);
        toast.success("Product updated");
      } else {
        await createProduct(payload);
        toast.success("Product created");
      }

      setModalOpen(false);
      await load();
    } catch {
      // interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!window.confirm(`Deactivate "${product.name}"?`)) return;
    try {
      await deleteProduct(product._id);
      toast.success("Product deactivated");
      await load();
    } catch {
      // interceptor
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Products</h1>
          <p className="mt-1 text-sm text-slate-500">{products.length} products</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white hover:bg-cobalt-700"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-400 uppercase">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Rating</th>
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
              products.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-ink">{product.name}</td>
                  <td className="px-6 py-3 text-slate-500">{product.sku}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {typeof product.category === "object" ? product.category.name : "—"}
                  </td>
                  <td className="px-6 py-3">{formatPrice(product.price)}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {product.averageRating.toFixed(1)} ({product.reviewCount})
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.isActive
                          ? "bg-emerald-50 text-mint-500"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cobalt-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
        title={editing ? "Edit product" : "Add product"}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-medium text-white hover:bg-cobalt-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["name", "Name", "text"],
              ["sku", "SKU", "text"],
              ["brand", "Brand", "text"],
              ["price", "Price", "number"],
              ["compareAtPrice", "Compare at price", "number"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key} className={key === "name" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:outline-none"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-ink">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cobalt-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Featured
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

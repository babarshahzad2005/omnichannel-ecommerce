import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  LogOut,
  Package,
  Search,
  ShoppingCart,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function StorefrontLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  };

  const isStaff =
    user?.role === "superAdmin" ||
    user?.role === "vendorManager" ||
    user?.role === "warehouseStaff";

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <Package className="h-7 w-7 text-cobalt-600" />
            <span className="text-lg font-semibold text-ink">OmniChannel</span>
          </Link>

          <form onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 md:block">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm text-ink placeholder:text-slate-400 focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/20 focus:outline-none"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cobalt-600 px-1 text-[10px] font-medium text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {isAuthenticated ? user?.name : "Account"}
                </span>
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {isAuthenticated ? (
                      <>
                        {isStaff && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setMenuOpen(false)}
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          Sign in
                        </Link>
                        <Link
                          to="/register"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          Create account
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

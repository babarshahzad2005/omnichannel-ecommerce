import { useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types/auth";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    roles: ["superAdmin", "vendorManager", "warehouseStaff"],
  },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
    roles: ["superAdmin"],
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Package,
    roles: ["superAdmin", "vendorManager"],
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
    roles: ["superAdmin", "vendorManager", "warehouseStaff"],
  },
  {
    label: "Fulfillment",
    path: "/admin/fulfillment",
    icon: Truck,
    roles: ["superAdmin", "warehouseStaff"],
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: Boxes,
    roles: ["superAdmin", "warehouseStaff"],
  },
  {
    label: "Reviews",
    path: "/admin/reviews",
    icon: Star,
    roles: ["superAdmin"],
  },
  {
    label: "Coupons",
    path: "/admin/coupons",
    icon: Tag,
    roles: ["superAdmin"],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  superAdmin: "Super Admin",
  vendorManager: "Vendor Manager",
  warehouseStaff: "Warehouse Staff",
  customer: "Customer",
};

function breadcrumbLabel(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  const segment = pathname.split("/").filter(Boolean).pop() ?? "Dashboard";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)),
    [user]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <Package className="h-6 w-6 text-cobalt-600" />
          <span className="font-semibold text-white">OmniChannel</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-cobalt-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Admin
            </p>
            <h1 className="text-lg font-semibold text-ink">
              {breadcrumbLabel(location.pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-slate-600 transition hover:text-cobalt-600"
            >
              View Storefront
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

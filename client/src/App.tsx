import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import StorefrontLayout from "./layouts/StorefrontLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminFulfillmentPage from "./pages/admin/AdminFulfillmentPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import CartPage from "./pages/cart/CartPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import HomePage from "./pages/HomePage";
import OrderDetailPage from "./pages/orders/OrderDetailPage";
import OrdersPage from "./pages/orders/OrdersPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import ProductsPage from "./pages/products/ProductsPage";
import { useAuthStore } from "./store/authStore";

const ADMIN_ROLES = ["superAdmin", "vendorManager", "warehouseStaff"] as const;

function AppRoutes() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cobalt-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute roles={[...ADMIN_ROLES]} />
        }
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="fulfillment" element={<AdminFulfillmentPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm",
          success: {
            style: {
              background: "#ecfdf5",
              color: "#065f46",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

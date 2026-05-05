import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './contexts/LangContext'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import SnowEffect from './components/ui/SnowEffect'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ActivityFeed from './components/ui/ActivityFeed'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

const HomePage        = lazy(() => import('./pages/HomePage'))
const ProductsPage    = lazy(() => import('./pages/ProductsPage'))
const ProductDetail   = lazy(() => import('./pages/ProductDetailPage'))
const CartPage        = lazy(() => import('./pages/CartPage'))
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage'))
const PaymentPage     = lazy(() => import('./pages/PaymentPage'))
const OrdersPage      = lazy(() => import('./pages/OrdersPage'))
const WishlistPage    = lazy(() => import('./pages/WishlistPage'))
const LoginPage       = lazy(() => import('./pages/LoginPage'))
const RegisterPage    = lazy(() => import('./pages/RegisterPage'))
const PolicyPage      = lazy(() => import('./pages/PolicyPage'))

const AdminLayout          = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard       = lazy(() => import('./pages/admin/DashboardPage'))
const AdminTrips           = lazy(() => import('./pages/admin/TripsPage'))
const AdminProducts        = lazy(() => import('./pages/admin/ProductsPage'))
const AdminProductEdit     = lazy(() => import('./pages/admin/ProductEditPage'))
const AdminCategories      = lazy(() => import('./pages/admin/CategoriesPage'))
const AdminOrders          = lazy(() => import('./pages/admin/OrdersPage'))
const AdminPaymentSettings = lazy(() => import('./pages/admin/PaymentSettingsPage'))
const AdminDelivery        = lazy(() => import('./pages/admin/DeliverySettingsPage'))
const AdminContact         = lazy(() => import('./pages/admin/ContactSettingsPage'))
const AdminPolicies        = lazy(() => import('./pages/admin/PoliciesPage'))
const AdminActivity        = lazy(() => import('./pages/admin/ActivitySettingsPage'))
const AdminAdmins          = lazy(() => import('./pages/admin/AdminsPage'))
const AdminCreateOrder     = lazy(() => import('./pages/admin/CreateOrderPage'))
const AdminCoupons         = lazy(() => import('./pages/admin/CouponsPage'))
const AccountPage          = lazy(() => import('./pages/AccountPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function CheersApp() {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <SnowEffect />
              <div className="page-content min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/tos" element={<PolicyPage type="tos" />} />
                      <Route path="/privacy" element={<PolicyPage type="privacy" />} />
                      <Route path="/refund" element={<PolicyPage type="refund" />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      <Route element={<ProtectedRoute />}>
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/payment/:orderId" element={<PaymentPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/account" element={<AccountPage />} />
                      </Route>

                      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="trips" element={<AdminTrips />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="products/new" element={<AdminProductEdit />} />
                        <Route path="products/:id" element={<AdminProductEdit />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="settings/payment" element={<AdminPaymentSettings />} />
                        <Route path="settings/delivery" element={<AdminDelivery />} />
                        <Route path="settings/contact" element={<AdminContact />} />
                        <Route path="settings/policies" element={<AdminPolicies />} />
                        <Route path="settings/activity" element={<AdminActivity />} />
                        <Route path="admins" element={<AdminAdmins />} />
                        <Route path="orders/new" element={<AdminCreateOrder />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                      </Route>

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <ActivityFeed />
              </div>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  )
}

import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../lib/firebase'
import { applyFonts } from './lib/fontConfig'
import { LangProvider } from './contexts/LangContext'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import SnowEffect from './components/ui/SnowEffect'
import AnnouncementBanner from './components/ui/AnnouncementBanner'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ActivityFeed from './components/ui/ActivityFeed'
import CartDrawer from './components/ui/CartDrawer'
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
const AdminReport          = lazy(() => import('./pages/admin/ReportPage'))
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
const AdminHomeSettings    = lazy(() => import('./pages/admin/HomeSettingsPage'))
const AdminAdmins          = lazy(() => import('./pages/admin/AdminsPage'))
const AdminCreateOrder     = lazy(() => import('./pages/admin/CreateOrderPage'))
const AdminCoupons         = lazy(() => import('./pages/admin/CouponsPage'))
const AdminFontSettings    = lazy(() => import('./pages/admin/FontSettingsPage'))
const AdminGuide           = lazy(() => import('./pages/admin/GuidePage'))
const AccountPage          = lazy(() => import('./pages/AccountPage'))

const db = getFirestore(app)

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const isCart = pathname === '/cart'

  useEffect(() => {
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        const { fontEn, fontZh } = snap.data()
        if (fontEn || fontZh) applyFonts(fontEn, fontZh)
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="page-content min-h-screen flex flex-col">
      <Navbar />
      {!isAdmin && <AnnouncementBanner />}
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
              <Route path="settings/home" element={<AdminHomeSettings />} />
              <Route path="settings/fonts" element={<AdminFontSettings />} />
              <Route path="admins" element={<AdminAdmins />} />
              <Route path="orders/new" element={<AdminCreateOrder />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="report" element={<AdminReport />} />
            </Route>
            <Route path="/admin/guide" element={<AdminRoute><AdminGuide /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {!isAdmin && <ActivityFeed />}
      {!isAdmin && !isCart && <CartDrawer />}
    </div>
  )
}

export default function CheersApp() {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
              <SnowEffect />
              <AppShell />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  )
}

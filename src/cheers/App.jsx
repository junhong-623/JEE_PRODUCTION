import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../lib/firebase'
import { applyFonts } from './lib/fontConfig'
import { captureTrafficSource } from './lib/tracking'
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
  const { pathname, key } = useLocation()
  const navType = useNavigationType()
  const isAdmin = pathname.startsWith('/admin')
  const isCart = pathname === '/cart'

  useEffect(() => {
    captureTrafficSource()
    getDoc(doc(db, 'cheers_settings', 'global')).then(snap => {
      if (snap.exists()) {
        const { fontEn, fontZh } = snap.data()
        if (fontEn || fontZh) applyFonts(fontEn, fontZh)
      }
    }).catch(() => {})
  }, [])

  // 实时保存每个历史条目的滚动位置（用 location.key 区分不同条目）
  useEffect(() => {
    const save = () => sessionStorage.setItem(`scroll:${key}`, String(window.scrollY))
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [key])

  // 前进/替换：滚到顶；后退：恢复上次位置（等内容渲染后再恢复，应对 Firestore 异步加载）
  useEffect(() => {
    if (navType === 'POP') {
      const y = parseInt(sessionStorage.getItem(`scroll:${key}`) || '0', 10)
      window.scrollTo(0, y)
      const t = setTimeout(() => window.scrollTo(0, y), 300)
      return () => clearTimeout(t)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, navType, key])

  return (
    <div className="page-content min-h-screen flex flex-col">
      {!isAdmin && <AnnouncementBanner />}
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
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/payment/:orderId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="report" element={<AdminReport />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductEdit />} />
              <Route path="products/:id" element={<AdminProductEdit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/new" element={<AdminCreateOrder />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="settings/payment" element={<AdminPaymentSettings />} />
              <Route path="settings/delivery" element={<AdminDelivery />} />
              <Route path="settings/contact" element={<AdminContact />} />
              <Route path="settings/policies" element={<AdminPolicies />} />
              <Route path="settings/activity" element={<AdminActivity />} />
              <Route path="settings/home" element={<AdminHomeSettings />} />
              <Route path="settings/font" element={<AdminFontSettings />} />
              <Route path="admins" element={<AdminAdmins />} />
              <Route path="guide" element={<AdminGuide />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {!isAdmin && <ActivityFeed />}
      {!isAdmin && !isCart && <CartDrawer />}
      <SnowEffect />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppShell />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  )
}

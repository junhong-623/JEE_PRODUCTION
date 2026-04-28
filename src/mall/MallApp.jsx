import { Routes, Route, Navigate } from 'react-router-dom'
import { MallProvider } from './contexts/MallContext'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import MallIntroPage from './pages/MallIntroPage'
import './mall.css'

export default function MallApp() {
  return (
    <MallProvider>
      <Routes>
        <Route path="/intro" element={<MallIntroPage />} />
        <Route path="/" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="*" element={<Navigate to="/mall" replace />} />
      </Routes>
    </MallProvider>
  )
}

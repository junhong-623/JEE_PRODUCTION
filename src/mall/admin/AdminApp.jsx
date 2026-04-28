import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import DashboardPage from './DashboardPage'
import CategoriesPage from './CategoriesPage'
import ProductsPage from './ProductsPage'
import TransactionsPage from './TransactionsPage'
import SettingsPage from './SettingsPage'

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="categories"   element={<CategoriesPage />} />
        <Route path="products"     element={<ProductsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="settings"     element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

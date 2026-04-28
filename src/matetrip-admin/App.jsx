import { Routes, Route, Navigate } from "react-router-dom";
import { LangProvider } from "./contexts/LangContext";
import { DataProvider } from "./contexts/DataContext";
import Layout        from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TripsPage     from "./pages/TripsPage";
import UsersPage     from "./pages/UsersPage";
import ReceiptsPage  from "./pages/ReceiptsPage";
import PushPage      from "./pages/PushPage";
import BroadcastPage from "./pages/BroadcastPage";
import PhotosPage    from "./pages/PhotosPage";
import FeaturesPage  from "./pages/FeaturesPage";
import "./admin.css";

export default function AdminApp() {
  return (
    <LangProvider>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="trips"      element={<TripsPage />} />
            <Route path="users"      element={<UsersPage />} />
            <Route path="receipts"   element={<ReceiptsPage />} />
            <Route path="push"       element={<PushPage />} />
            <Route path="broadcast"  element={<BroadcastPage />} />
            <Route path="photos"     element={<PhotosPage />} />
            <Route path="features"   element={<FeaturesPage />} />
          </Route>
        </Routes>
      </DataProvider>
    </LangProvider>
  );
}

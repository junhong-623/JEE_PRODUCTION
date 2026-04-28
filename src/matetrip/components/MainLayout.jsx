import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTrip } from "../contexts/TripContext";
import { useLang, LANGUAGES } from "../contexts/LangContext";
import { useMember, MEMBER_LEVELS } from "../contexts/MemberContext";
import { useToast, ToastContainer } from "../hooks/useToast";
import TripsPage from "./trips/TripsPage";
import ReceiptsPage from "./receipts/ReceiptsPage";
import GalleryPage from "./gallery/GalleryPage";
import PeoplePage from "./people/PeoplePage";
import SummaryPage from "./summary/SummaryPage";
import SettingsPage from "./settings/SettingsPage";
import PlanPage from "./plan/PlanPage";
import "./MainLayout.css";

export default function MainLayout() {
  const [tab, setTab] = useState("trips");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { activeTrip } = useTrip();
  const { tr, lang, changeLang } = useLang();
  const { memberLevel, getLimits, isGuest, showUpgrade } = useMember();
  const toast = useToast();

  const limits = getLimits(activeTrip?.limits || {});
  const levelInfo = MEMBER_LEVELS[memberLevel] || MEMBER_LEVELS.member;

  const NAV = [
    { id: "trips",    icon: "🗺",  label: tr.trips,    locked: false },
    { id: "receipts", icon: "🧾",  label: tr.receipts, locked: false },
    { id: "gallery",  icon: "📷",  label: tr.gallery,  locked: false },
    { id: "plan",     icon: "📅",  label: tr.plan,     locked: false },
    { id: "people",   icon: "👥",  label: tr.people,   locked: false },
    { id: "summary",  icon: "💰",  label: tr.summary,  locked: false },
  ];

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const handleNavClick = (n) => {
    if (n.locked) {
      showUpgrade(lang === "zh"
        ? `「${n.label}」功能需要升级会员才能使用。`
        : `"${n.label}" requires a higher plan. Upgrade to unlock.`);
      return;
    }
    setTab(n.id);
  };

  const renderPage = () => {
    const props = { toast, tripId: activeTrip?.id, readOnly: isGuest };
    switch (tab) {
      case "trips":    return <TripsPage {...props} onNavigate={setTab} />;
      case "receipts": return <ReceiptsPage {...props} />;
      case "gallery":  return <GalleryPage {...props} />;
      case "people":   return <PeoplePage {...props} />;
      case "summary":  return <SummaryPage {...props} reportLocked={!limits.report} />;
      case "settings": return <SettingsPage {...props} />;
      case "plan":     return <PlanPage {...props} chatLocked={!limits.chat} />;
      default:         return <TripsPage {...props} onNavigate={setTab} />;
    }
  };

  const initials = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-inner">

          {/* Logo — click to go to trips */}
          <button
            className="app-brand"
            onClick={() => setTab("trips")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img src="/matetrip/icons/icon-192.png" alt="" className="app-brand-icon-img" />
            <div className="app-brand-text">
              <span className="app-brand-name">{tr.appName}</span>
              <span className="app-brand-slogan">{tr.appSubtitle}</span>
            </div>
          </button>

          {/* Active trip pill — click to go to trips */}
          {activeTrip && (
            <button
              className="app-trip-pill"
              onClick={() => setTab("trips")}
              style={{ cursor: "pointer", border: "none" }}
            >
              <span className="app-trip-name">{activeTrip.name}</span>
              <span className="app-trip-currency">{activeTrip.baseCurrency}</span>
            </button>
          )}

          <div className="app-header-actions">
            <button className="btn btn-icon" title={tr.settings}
              onClick={() => setTab("settings")}>⚙</button>

            <div className="user-menu-wrap">
              <button className="user-avatar-btn" onClick={() => setShowUserMenu(v => !v)}>
                <span className="user-initials">{initials}</span>
              </button>

              {showUserMenu && (
                <>
                  <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} />
                  <div className="user-menu">
                    <div className="user-menu-info">
                      <div className="user-menu-avatar">{initials}</div>
                      <div>
                        <div className="user-menu-name">{user?.displayName || "User"}</div>
                        <div className="user-menu-email">{user?.email || (isGuest ? "Guest" : "")}</div>
                        <div style={{ marginTop: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                            background: levelInfo.color + "22", color: levelInfo.color, letterSpacing: "0.05em" }}>
                            {lang === "zh" ? levelInfo.labelZh : levelInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="user-menu-divider" />
                    <div className="user-menu-section-label">{tr.language}</div>
                    <div className="user-menu-langs">
                      {LANGUAGES.map(l => (
                        <button key={l.code}
                          className={`user-menu-lang-btn ${lang === l.code ? "active" : ""}`}
                          onClick={() => changeLang(l.code)}>
                          {l.flag} {l.label}
                        </button>
                      ))}
                    </div>
                    <div className="user-menu-divider" />
                    <button className="user-menu-logout" onClick={handleLogout}>
                      🚪 {tr.signOut}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`app-main${tab === "plan" ? " app-main--plan" : ""}`}>{renderPage()}</main>

      <nav className="app-nav">
        {NAV.map(n => (
          <button key={n.id}
            className={`nav-item ${tab === n.id ? "active" : ""} ${n.locked ? "nav-locked" : ""}`}
            onClick={() => handleNavClick(n)}>
            <span className="nav-icon-bg">
              <span className="nav-icon">{n.locked ? "🔒" : n.icon}</span>
            </span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      <ToastContainer toasts={toast.toasts} />
    </div>
  );
}

function LockedPage({ label, onUpgrade }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      minHeight:"60vh",gap:16,padding:24,textAlign:"center" }}>
      <span style={{ fontSize:48 }}>🔒</span>
      <div style={{ fontWeight:700,fontSize:18,color:"var(--ink)" }}>{label}</div>
      <p style={{ fontSize:14,color:"var(--ink-muted)",maxWidth:280,lineHeight:1.6 }}>
        This feature is not available on your current plan.
      </p>
      <button className="btn btn-primary" onClick={onUpgrade}>🚀 Upgrade Plan</button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useLang } from "../contexts/LangContext";
import { ToastProvider } from "./ui";

const NAV_KEYS = [
  { to: "dashboard",  icon: "▦",  labelKey: "dashboard" },
  { to: "trips",      icon: "🗺", labelKey: "trips",    countKey: "trips" },
  { to: "users",      icon: "👤", labelKey: "users",    countKey: "users" },
  { to: "photos",     icon: "🖼️", labelKey: "photos" },
  { to: "receipts",   icon: "🧾", labelKey: "receipts" },
  { to: "push",       icon: "🔔", labelKey: "pushSubs" },
  { to: "broadcast",  icon: "📢", labelKey: "broadcast" },
  { to: "features",   icon: "⚙️", labelKey: "features" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { trips, users, reload } = useData();
  const { tr, lang, toggle } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const counts = { trips: trips.length, users: users.length };

  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const sidebarVisible = open || !isMobile;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 99,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: "var(--sidebar-w)", flexShrink: 0,
        background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        transform: sidebarVisible ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.22s ease",
      }}>
        {/* Logo + close button */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/matetrip-admin/icon-192.png" alt="MateTrip Admin"
            style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, objectFit: "cover" }}
            onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
          />
          <div style={{ width:34,height:34,background:"var(--accent)",borderRadius:9,display:"none",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🧳</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily:"var(--font-mono)",fontSize:13,fontWeight:700,color:"var(--text)" }}>MateTrip</div>
            <div style={{ fontSize:10,color:"var(--text3)" }}>{tr.adminConsole}</div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            style={{
              display: isMobile ? "flex" : "none",
              alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: "var(--surface2)", border: "1px solid var(--border)",
              color: "var(--text3)", fontSize: 16, cursor: "pointer",
            }}
          >✕</button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:"10px 0",overflowY:"auto" }}>
          <SectionLabel>{tr.overview}</SectionLabel>
          {NAV_KEYS.slice(0,1).map(n => <NavItem key={n.to} {...n} label={tr[n.labelKey]} count={n.countKey ? counts[n.countKey] : null} />)}
          <SectionLabel>{tr.data}</SectionLabel>
          {NAV_KEYS.slice(1,6).map(n => <NavItem key={n.to} {...n} label={tr[n.labelKey]} count={n.countKey ? counts[n.countKey] : null} />)}
          <SectionLabel>{tr.tools}</SectionLabel>
          {NAV_KEYS.slice(6).map(n => <NavItem key={n.to} {...n} label={tr[n.labelKey]} />)}
        </nav>

        {/* Footer */}
        <div style={{ padding:"14px 16px",borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
            <div style={{ width:28,height:28,borderRadius:"50%",background:"var(--accent-pale)",color:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0 }}>
              {(user?.displayName||user?.email||"A")[0].toUpperCase()}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--text)" }}>{user?.displayName||user?.email}</div>
              <div style={{ fontSize:10,color:"var(--accent)" }}>{tr.superAdmin}</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:5,marginBottom:12 }}>
            <FooterBtn onClick={toggle}>{lang==="zh"?"EN":"中文"}</FooterBtn>
            <FooterBtn onClick={reload}>↻ {tr.refresh}</FooterBtn>
            <FooterBtn onClick={handleLogout} danger>{tr.signOut}</FooterBtn>
          </div>
          {/* Powered by */}
          <a
            href="https://www.jeeprod.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", textAlign: "center",
              fontSize: 10, color: "var(--text3)",
              textDecoration: "none", letterSpacing: "0.5px",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
          >
            powered by jeeprod.com
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        marginLeft: isMobile ? 0 : "var(--sidebar-w)",
        flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh",
      }}>
        {/* Mobile topbar */}
        {isMobile && (
          <div style={{
            position: "sticky", top: 0, zIndex: 50,
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px",
            background: "var(--surface)", borderBottom: "1px solid var(--border)",
          }}>
            <button
              onClick={() => setOpen(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: "var(--surface2)", border: "1px solid var(--border)",
                color: "var(--text)", fontSize: 16, cursor: "pointer",
              }}
            >☰</button>
            <img src="/matetrip-admin/icon-192.png" alt=""
              style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }}
            />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              MateTrip Admin
            </span>
          </div>
        )}
        <Outlet />
      </main>

      <ToastProvider />
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ padding:"14px 16px 5px",fontSize:10,letterSpacing:1,textTransform:"uppercase",color:"var(--text3)",fontWeight:600 }}>{children}</div>;
}

function NavItem({ to, icon, label, count }) {
  return (
    <NavLink to={to} style={({ isActive }) => ({
      display:"flex",alignItems:"center",gap:10,
      padding:"9px 16px",fontSize:13,fontWeight:isActive?500:400,
      color:isActive?"var(--accent)":"var(--text2)",
      background:isActive?"var(--accent-pale)":"transparent",
      borderLeft:`2px solid ${isActive?"var(--accent)":"transparent"}`,
      cursor:"pointer",transition:"all 0.12s",textDecoration:"none",margin:"1px 0",
    })}>
      <span style={{ width:16,textAlign:"center",fontSize:14 }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {count!=null && <span style={{ background:"var(--accent)",color:"white",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10 }}>{count}</span>}
    </NavLink>
  );
}

function FooterBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick}
      style={{ flex:1,padding:"6px 0",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text3)",fontSize:11,transition:"all 0.15s",cursor:"pointer" }}
      onMouseEnter={e=>e.target.style.color=danger?"var(--red)":"var(--text)"}
      onMouseLeave={e=>e.target.style.color="var(--text3)"}>
      {children}
    </button>
  );
}

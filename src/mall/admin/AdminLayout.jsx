import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { to: 'dashboard',    icon: '📊', label: 'Dashboard' },
  { to: 'categories',   icon: '🗂️', label: 'Categories' },
  { to: 'products',     icon: '🛍️', label: 'Products' },
  { to: 'transactions', icon: '📦', label: 'Transactions' },
  { to: 'settings',     icon: '⚙️', label: 'Settings' },
]

const S = {
  root: { display:'flex', minHeight:'100vh', fontFamily:"'DM Sans',sans-serif", background:'#f7f5f0', color:'#0d0d0d' },
  overlay: { position:'fixed',inset:0,zIndex:99,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(2px)' },
  aside: (open, isMobile) => ({
    width:220, flexShrink:0,
    background:'#0d0d0d', color:'white',
    display:'flex', flexDirection:'column',
    position:'fixed', top:0, left:0, bottom:0, zIndex:100,
    transform: (open||!isMobile) ? 'translateX(0)' : 'translateX(-100%)',
    transition:'transform 0.22s ease',
    boxShadow:'2px 0 16px rgba(0,0,0,0.3)',
  }),
  logo: { padding:'16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 },
  logoText: { fontWeight:800, fontSize:15, color:'white' },
  logoSub: { fontSize:10, color:'rgba(255,255,255,0.45)', letterSpacing:1, textTransform:'uppercase' },
  nav: { flex:1, padding:'10px 0', overflowY:'auto' },
  main: (isMobile) => ({
    marginLeft: isMobile ? 0 : 220,
    flex:1, display:'flex', flexDirection:'column', minHeight:'100vh',
    color:'#0d0d0d', background:'#f7f5f0',
  }),
  topbar: {
    position:'sticky', top:0, zIndex:50,
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 16px',
    background:'#0d0d0d', color:'white',
    boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
  },
  menuBtn: {
    width:34,height:34,borderRadius:8,flexShrink:0,cursor:'pointer',
    background:'rgba(255,255,255,0.1)',border:'none',color:'white',fontSize:18,
    display:'flex',alignItems:'center',justifyContent:'center',
  },
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  return (
    <div style={S.root}>
      {open && isMobile && <div style={S.overlay} onClick={() => setOpen(false)} />}

      <aside style={S.aside(open, isMobile)}>
        <div style={S.logo}>
          <img src="/logo.svg" alt="JeeProd" style={{ width:34,height:34,borderRadius:8,objectFit:'cover',flexShrink:0 }} />
          <div>
            <div style={S.logoText}>Mall Admin</div>
            <div style={S.logoSub}>JeeProd</div>
          </div>
        </div>

        <nav style={S.nav}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
              display:'flex',alignItems:'center',gap:10,
              padding:'10px 16px',fontSize:13,fontWeight:isActive?600:400,
              color:isActive?'#e8440a':'rgba(255,255,255,0.65)',
              background:isActive?'rgba(232,68,10,0.12)':'transparent',
              borderLeft:`3px solid ${isActive?'#e8440a':'transparent'}`,
              textDecoration:'none',transition:'all 0.12s',
            })}>
              <span style={{ fontSize:16 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:6 }}>
          <button
            onClick={() => navigate('/mall')}
            style={{ flex:1,padding:'7px',background:'rgba(255,255,255,0.08)',border:'none',borderRadius:7,color:'rgba(255,255,255,0.6)',fontSize:11,cursor:'pointer' }}
          >← View Shop</button>
          <button
            onClick={() => navigate('/')}
            style={{ flex:1,padding:'7px',background:'rgba(255,255,255,0.08)',border:'none',borderRadius:7,color:'rgba(255,255,255,0.6)',fontSize:11,cursor:'pointer' }}
          >Home</button>
        </div>
      </aside>

      <main style={S.main(isMobile)}>
        {isMobile && (
          <div style={S.topbar}>
            <button style={S.menuBtn} onClick={() => setOpen(true)}>☰</button>
            <img src="/logo.svg" alt="JeeProd" style={{ width:28,height:28,borderRadius:6,objectFit:'cover' }} />
            <span style={{ fontWeight:700, fontSize:14 }}>Mall Admin</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}

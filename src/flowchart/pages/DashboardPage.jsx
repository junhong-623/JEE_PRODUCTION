import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from '../../components/AuthModal'
import {
  getMyFlowcharts, getMyGroups, createFlowchart, createGroup,
  deleteFlowchart, deleteGroup, updateFlowchart, renameGroup,
  getSharedFlowcharts, joinByCode, leaveSharedFlowchart,
} from '../services/firestore'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [flowcharts, setFlowcharts] = useState([])
  const [groups, setGroups]         = useState([])
  const [shared, setShared]         = useState([])
  const [tab, setTab]               = useState('all') // 'all' | 'shared' | groupId
  const [loading, setLoading]       = useState(true)
  const [showAuth, setShowAuth]     = useState(false)
  const [showNewGroup, setShowNewGroup]   = useState(false)
  const [newGroupName, setNewGroupName]   = useState('')
  const [renamingGroup, setRenamingGroup] = useState(null)
  const [joinCode, setJoinCode]     = useState('')
  const [joinError, setJoinError]   = useState('')
  const [joining, setJoining]       = useState(false)
  const [ctxMenu, setCtxMenu]       = useState(null)
  const [loadError, setLoadError]   = useState('')

  useEffect(() => { if (user) { loadAll() } else { setLoading(false) } }, [user])

  const loadAll = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [fcs, grps, sh] = await Promise.all([
        getMyFlowcharts(user.uid),
        getMyGroups(user.uid),
        getSharedFlowcharts(user.uid),
      ])
      setFlowcharts(fcs)
      setGroups(grps)
      setShared(sh)
    } catch (e) {
      setLoadError(e.message)
    } finally { setLoading(false) }
  }

  const handleNew = async () => {
    const title = prompt('Flowchart title:')
    if (!title?.trim()) return
    const groupId = tab !== 'all' && tab !== 'shared' ? tab : null
    const id = await createFlowchart(user.uid, title.trim(), groupId)
    navigate(`/flowchart/editor/${id}`)
  }

  const handleNewGroup = async (e) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    await createGroup(user.uid, newGroupName.trim())
    setNewGroupName('')
    setShowNewGroup(false)
    await loadAll()
  }

  const handleRenameGroup = async (e) => {
    e.preventDefault()
    if (!renamingGroup?.name.trim()) return
    await renameGroup(renamingGroup.id, renamingGroup.name.trim())
    setRenamingGroup(null)
    await loadAll()
  }

  const handleDeleteGroup = async (id) => {
    if (!confirm('Delete this group? Flowcharts will become ungrouped.')) return
    await Promise.all(flowcharts.filter(f => f.groupId === id).map(f => updateFlowchart(f.id, { groupId: null })))
    await deleteGroup(id)
    if (tab === id) setTab('all')
    await loadAll()
  }

  const handleDeleteFlowchart = async (id) => {
    if (!confirm('Delete this flowchart? This cannot be undone.')) return
    await deleteFlowchart(id)
    setFlowcharts(fcs => fcs.filter(f => f.id !== id))
  }

  const handleLeave = async (flowchartId) => {
    if (!confirm('Leave this shared flowchart? You can rejoin with the invite code.')) return
    await leaveSharedFlowchart(flowchartId, user.uid)
    setShared(s => s.filter(x => x.flowchartId !== flowchartId))
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setJoining(true)
    setJoinError('')
    try {
      await joinByCode(joinCode.trim(), user.uid)
      setJoinCode('')
      setTab('shared')
      await loadAll()
    } catch (err) {
      setJoinError(err.message)
    } finally { setJoining(false) }
  }

  const filtered = tab === 'all' ? flowcharts
    : tab === 'shared' ? []
    : flowcharts.filter(f => f.groupId === tab)

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center aurora-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink dark:border-paper/20 dark:border-t-paper" />
    </div>
  )

  if (!user) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 aurora-bg">
      <div className="text-center space-y-3">
        <span className="block text-5xl opacity-25">◈</span>
        <h2 className="font-display text-3xl">FlowCraft</h2>
        <p className="text-sm text-ink/45 dark:text-paper/45">Sign in to create and manage flowcharts</p>
      </div>
      <button
        onClick={() => setShowAuth(true)}
        className="rounded-2xl bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-accent transition-colors dark:bg-paper dark:text-ink"
      >
        Sign in to continue
      </button>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  )

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden aurora-bg" onClick={() => setCtxMenu(null)}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-ink/8 dark:border-paper/8 bg-paper/60 dark:bg-ink/50 backdrop-blur">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-ink/8 dark:border-paper/8">
          <a href="/" className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/28 dark:text-paper/28 hover:text-ink/55 dark:hover:text-paper/55 transition-colors mb-4">
            ← Home
          </a>
          <div className="flex items-center gap-2">
            <span className="text-xl opacity-60">◈</span>
            <span className="font-display text-lg">FlowCraft</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <NavItem active={tab === 'all'} onClick={() => setTab('all')} icon="⊞" label="All" badge={flowcharts.length} />
          <NavItem active={tab === 'shared'} onClick={() => setTab('shared')} icon="⟳" label="Shared with me" badge={shared.length} />

          {groups.length > 0 && (
            <p className="pt-4 pb-1 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink/22 dark:text-paper/22">Groups</p>
          )}

          {groups.map(g =>
            renamingGroup?.id === g.id ? (
              <form key={g.id} onSubmit={handleRenameGroup} className="px-1 py-0.5">
                <input
                  autoFocus value={renamingGroup.name}
                  onChange={e => setRenamingGroup(r => ({ ...r, name: e.target.value }))}
                  onBlur={() => setRenamingGroup(null)}
                  className="w-full rounded-lg border border-ink/12 dark:border-paper/12 bg-paper dark:bg-ink px-2 py-1.5 text-xs outline-none"
                />
              </form>
            ) : (
              <NavItem
                key={g.id} active={tab === g.id}
                onClick={() => setTab(g.id)}
                icon="▸" label={g.name}
                badge={flowcharts.filter(f => f.groupId === g.id).length}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ type: 'group', id: g.id, x: e.clientX, y: e.clientY }) }}
              />
            )
          )}

          {showNewGroup ? (
            <form onSubmit={handleNewGroup} className="px-1 py-0.5">
              <input
                autoFocus value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onBlur={() => setShowNewGroup(false)}
                placeholder="Group name"
                className="w-full rounded-lg border border-ink/12 dark:border-paper/12 bg-paper dark:bg-ink px-2 py-1.5 text-xs outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setShowNewGroup(true)}
              className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-ink/30 dark:text-paper/30 hover:text-ink/55 dark:hover:text-paper/55 transition-colors"
            >
              ＋ <span>New Group</span>
            </button>
          )}
        </nav>

        {/* Join code */}
        <div className="px-4 py-3 border-t border-ink/8 dark:border-paper/8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/25 dark:text-paper/25 mb-2">Join by code</p>
          <form onSubmit={handleJoin} className="flex gap-1.5">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="min-w-0 flex-1 rounded-xl border border-ink/10 dark:border-paper/10 bg-paper dark:bg-ink px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider outline-none focus:border-ink/25 dark:focus:border-paper/25"
            />
            <button
              type="submit" disabled={joining || !joinCode.trim()}
              className="rounded-xl bg-ink/8 dark:bg-paper/8 px-2.5 py-1.5 text-xs text-ink/50 dark:text-paper/50 hover:bg-ink/14 dark:hover:bg-paper/14 transition-colors disabled:opacity-40"
            >
              {joining ? '…' : '→'}
            </button>
          </form>
          {joinError && <p className="mt-1.5 text-[10px] leading-4 text-red-500">{joinError}</p>}
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t border-ink/8 dark:border-paper/8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/12 text-[11px] font-semibold text-accent">
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <span className="min-w-0 truncate text-[11px] text-ink/40 dark:text-paper/40">
              {user.displayName || user.email}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-ink/8 dark:border-paper/8 bg-paper/30 dark:bg-ink/20 backdrop-blur shrink-0">
          <div>
            <h2 className="font-display text-2xl">
              {tab === 'all' ? 'All Flowcharts'
                : tab === 'shared' ? 'Shared with me'
                : groups.find(g => g.id === tab)?.name || 'Group'}
            </h2>
            <p className="mt-0.5 text-[11px] text-ink/30 dark:text-paper/30">
              {tab === 'shared'
                ? `${shared.length} shared`
                : `${filtered.length} flowchart${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {tab !== 'shared' && (
            <button
              onClick={handleNew}
              className="flex items-center gap-2 rounded-2xl bg-ink dark:bg-paper px-4 py-2.5 text-sm font-medium text-paper dark:text-ink hover:bg-accent dark:hover:bg-accent dark:hover:text-paper transition-colors"
            >
              ＋ New Flowchart
            </button>
          )}
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {loadError ? (
            <div className="rounded-[1.5rem] border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-6 py-5 text-sm text-red-600 dark:text-red-400">
              Failed to load: {loadError}
            </div>
          ) : loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0,1,2,3].map(i => <div key={i} className="h-40 animate-pulse rounded-[1.5rem] border border-ink/6 dark:border-paper/6 bg-paper/50 dark:bg-ink/30" />)}
            </div>
          ) : tab === 'shared' ? (
            <SharedGrid items={shared} onOpen={id => navigate(`/flowchart/editor/${id}`)} onLeave={handleLeave} />
          ) : filtered.length === 0 ? (
            <EmptyState onNew={handleNew} isGroup={tab !== 'all'} />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(fc => (
                <FlowchartCard
                  key={fc.id} fc={fc} groups={groups}
                  onOpen={() => navigate(`/flowchart/editor/${fc.id}`)}
                  onDelete={() => handleDeleteFlowchart(fc.id)}
                  onMove={async (gid) => { await updateFlowchart(fc.id, { groupId: gid }); await loadAll() }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && ctxMenu.type === 'group' && (
        <CtxMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onRename={() => {
            const g = groups.find(x => x.id === ctxMenu.id)
            setRenamingGroup({ id: ctxMenu.id, name: g?.name || '' })
            setCtxMenu(null)
          }}
          onDeleteGroup={() => { handleDeleteGroup(ctxMenu.id); setCtxMenu(null) }}
        />
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function NavItem({ active, onClick, icon, label, badge, onContextMenu }) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
        active
          ? 'bg-ink/8 dark:bg-paper/8 font-medium text-ink dark:text-paper'
          : 'text-ink/45 dark:text-paper/45 hover:bg-ink/4 dark:hover:bg-paper/4 hover:text-ink/65 dark:hover:text-paper/65'
      }`}
    >
      <span className="flex items-center gap-2 truncate min-w-0">
        <span className="opacity-50 shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      {badge > 0 && (
        <span className="shrink-0 rounded-full bg-ink/6 dark:bg-paper/6 px-1.5 py-0.5 font-mono text-[9px] text-ink/35 dark:text-paper/35">
          {badge}
        </span>
      )}
    </button>
  )
}

function FlowchartCard({ fc, groups, onOpen, onDelete, onMove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const updatedAt = fc.updatedAt?.toDate?.() ?? new Date()
  const nodeCount = fc.nodes?.length ?? 0

  const currentGroup = groups.find(g => g.id === fc.groupId)

  return (
    <div
      className="group relative cursor-pointer rounded-[1.5rem] border border-ink/8 dark:border-paper/8 bg-paper/70 dark:bg-ink/50 backdrop-blur hover:border-accent/25 hover:shadow-[0_4px_24px_rgba(232,68,10,0.08)] transition-all duration-200"
      onClick={onOpen}
    >
      {/* Mini preview */}
      <div className="h-24 rounded-t-[1.5rem] bg-gradient-to-br from-ink/2 to-ink/5 dark:from-paper/2 dark:to-paper/5 flex items-center justify-center overflow-hidden border-b border-ink/5 dark:border-paper/5">
        <MiniPreview nodes={fc.nodes ?? []} />
      </div>

      <div className="px-4 py-3.5">
        <h3 className="text-sm font-medium text-ink dark:text-paper truncate">{fc.title}</h3>
        <div className="mt-1 flex items-center gap-2.5 font-mono text-[10px] text-ink/28 dark:text-paper/28">
          <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{timeAgo(updatedAt)}</span>
          {currentGroup && (
            <>
              <span>·</span>
              <span className="truncate">{currentGroup.name}</span>
            </>
          )}
        </div>
      </div>

      {/* ⋯ menu button */}
      <button
        onClick={e => { e.stopPropagation(); setMenuOpen(m => !m) }}
        className="absolute right-3 top-3 hidden h-7 w-7 items-center justify-center rounded-full border border-ink/8 dark:border-paper/8 bg-paper/90 dark:bg-ink/90 text-sm text-ink/40 dark:text-paper/40 hover:border-ink/20 hover:text-ink dark:hover:text-paper group-hover:flex transition-colors"
      >
        ···
      </button>

      {/* Inline dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={e => { e.stopPropagation(); setMenuOpen(false) }} />
          <div
            className="absolute right-2 top-11 z-40 min-w-44 overflow-hidden rounded-[14px] border border-ink/10 dark:border-paper/10 bg-paper dark:bg-ink shadow-[0_8px_32px_rgba(0,0,0,0.16)] py-1"
            onClick={e => e.stopPropagation()}
          >
            <p className="px-3 pt-1.5 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/25 dark:text-paper/25">
              Move to group
            </p>
            <DropItem
              onClick={() => { onMove(null); setMenuOpen(false) }}
              icon="⊞" label="Ungrouped"
              active={!fc.groupId}
            />
            {groups.map(g => (
              <DropItem
                key={g.id}
                onClick={() => { onMove(g.id); setMenuOpen(false) }}
                icon="▸" label={g.name}
                active={fc.groupId === g.id}
              />
            ))}
            <div className="my-1 border-t border-ink/6 dark:border-paper/6" />
            <DropItem
              onClick={() => { onDelete(); setMenuOpen(false) }}
              icon="✕" label="Delete" danger
            />
          </div>
        </>
      )}
    </div>
  )
}

function MiniPreview({ nodes }) {
  if (nodes.length === 0) return (
    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/12 dark:text-paper/12">empty</span>
  )
  const colors = { start: '#22c55e', end: '#ef4444', process: '#3b82f6', decision: '#eab308', io: '#8b5cf6' }
  return (
    <svg width="130" height="72" viewBox="0 0 130 72" className="opacity-60">
      {nodes.slice(0, 10).map((n, i) => (
        <circle key={n.id} cx={15 + (i % 5) * 24} cy={16 + Math.floor(i / 5) * 32}
          r={6} fill={colors[n.type] ?? '#94a3b8'} opacity={0.65} />
      ))}
    </svg>
  )
}

function SharedGrid({ items, onOpen, onLeave }) {
  if (items.length === 0) return (
    <div className="rounded-[2rem] border border-dashed border-ink/10 dark:border-paper/10 px-8 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/22 dark:text-paper/22">
        No shared flowcharts yet.<br />Enter an invite code in the sidebar to join one.
      </p>
    </div>
  )
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(item => (
        <div key={item.flowchartId}
          className="group relative rounded-[1.5rem] border border-ink/8 dark:border-paper/8 bg-paper/70 dark:bg-ink/50 p-5 hover:border-accent/25 transition-all"
        >
          <div
            className="cursor-pointer"
            onClick={() => onOpen(item.flowchartId)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-ink dark:text-paper truncate">{item.flowchartTitle}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                item.permission === 'edit'
                  ? 'bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400'
                  : 'bg-ink/6 text-ink/38 dark:bg-paper/6 dark:text-paper/38'
              }`}>{item.permission}</span>
            </div>
            <p className="font-mono text-[10px] text-ink/28 dark:text-paper/28">Click to open →</p>
          </div>

          {/* Leave button */}
          <button
            onClick={() => onLeave(item.flowchartId)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink/8 dark:border-paper/8 py-1.5 text-[11px] text-ink/35 dark:text-paper/35 hover:border-red-200 dark:hover:border-red-800 hover:text-red-500 transition-colors"
          >
            <span>↩</span> Leave
          </button>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onNew, isGroup }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-ink/10 dark:border-paper/10 px-8 py-24 text-center">
      <div className="mb-4 text-5xl opacity-15">◈</div>
      <p className="font-display text-xl text-ink/35 dark:text-paper/35 mb-2">
        {isGroup ? 'No flowcharts in this group' : 'No flowcharts yet'}
      </p>
      <p className="text-sm text-ink/25 dark:text-paper/25 mb-6">Create your first flowchart to get started</p>
      <button
        onClick={onNew}
        className="rounded-2xl bg-ink dark:bg-paper px-5 py-2.5 text-sm font-medium text-paper dark:text-ink hover:bg-accent transition-colors"
      >
        ＋ New Flowchart
      </button>
    </div>
  )
}

function CtxMenu({ menu, onClose, onRename, onDeleteGroup }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-40 overflow-hidden rounded-[14px] border border-ink/10 dark:border-paper/10 bg-paper dark:bg-ink shadow-[0_8px_32px_rgba(0,0,0,0.16)] py-1"
        style={{ left: menu.x, top: menu.y }}
        onClick={e => e.stopPropagation()}
      >
        <DropItem onClick={onRename} icon="✎" label="Rename" />
        <DropItem onClick={onDeleteGroup} icon="✕" label="Delete" danger />
      </div>
    </>
  )
}

function DropItem({ onClick, icon, label, danger, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition-colors ${
        danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
               : active ? 'bg-ink/5 dark:bg-paper/5 text-ink dark:text-paper font-medium'
               : 'text-ink/60 dark:text-paper/60 hover:bg-ink/4 dark:hover:bg-paper/4'
      }`}
    >
      <span className="opacity-60 w-3 shrink-0">{icon}</span> {label}
    </button>
  )
}

function timeAgo(date) {
  const d = Math.floor((Date.now() - date) / 1000)
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`
  return date.toLocaleDateString()
}

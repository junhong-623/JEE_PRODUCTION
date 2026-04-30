import { useState, useEffect } from 'react'
import { db, functions } from '../../lib/firebase'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import GlassCard from '../components/GlassCard'

const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]

// ── Donations section ─────────────────────────────────────────────────────────
function DonationsCard({ zh }) {
  const [donations, setDonations] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'jsave_donations_all'), orderBy('createdAt', 'desc'), limit(50))
        const snap = await getDocs(q)
        setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const total = donations ? donations.reduce((s, d) => s + (d.amount || 0), 0) : 0

  return (
    <GlassCard className="jsave-settings-card">
      <h2 className="jsave-settings-section">☕ {zh ? '咖啡捐款' : 'Coffee Donations'}</h2>
      {error && <p className="jsave-error">{error}</p>}
      {donations === null && !error && <p className="jsave-section-sub">{zh ? '加载中…' : 'Loading…'}</p>}
      {donations !== null && (
        <>
          <div className="jsave-admin-stat-row">
            <span className="jsave-admin-stat-label">{zh ? '总计' : 'Total'}</span>
            <span className="jsave-admin-stat-value" style={{ color: '#10b981' }}>RM {total.toFixed(2)}</span>
          </div>
          <div className="jsave-admin-stat-row">
            <span className="jsave-admin-stat-label">{zh ? '笔数' : 'Count'}</span>
            <span className="jsave-admin-stat-value">{donations.length}</span>
          </div>
          {donations.length > 0 ? (
            <div className="jsave-admin-list" style={{ marginTop: 12 }}>
              {donations.map(d => (
                <div key={d.id} className="jsave-admin-list-row">
                  <span className="jsave-section-sub" style={{ fontSize: 12 }}>{d.date}</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>RM {Number(d.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="jsave-section-sub" style={{ marginTop: 8 }}>{zh ? '暂无捐款记录' : 'No donations yet'}</p>
          )}
        </>
      )}
    </GlassCard>
  )
}

// ── Users activity section ────────────────────────────────────────────────────
function UsersCard({ zh, users, usersError }) {
  const checkedInCount = users ? users.filter(u => u.checkedIn).length : 0

  return (
    <GlassCard className="jsave-settings-card">
      <h2 className="jsave-settings-section">👥 {zh ? '用户活跃' : 'User Activity'}</h2>
      {usersError && <p className="jsave-error">{usersError}</p>}
      {users === null && !usersError && <p className="jsave-section-sub">{zh ? '加载中…' : 'Loading…'}</p>}
      {users !== null && (
        <>
          <div className="jsave-admin-stat-row">
            <span className="jsave-admin-stat-label">{zh ? '订阅推送' : 'Push subscribers'}</span>
            <span className="jsave-admin-stat-value">{users.length}</span>
          </div>
          <div className="jsave-admin-stat-row" style={{ marginBottom: 12 }}>
            <span className="jsave-admin-stat-label">
              {zh ? `今日已记账（${today}）` : `Checked in today (${today})`}
            </span>
            <span className="jsave-admin-stat-value" style={{ color: '#10b981' }}>
              {checkedInCount} / {users.length}
            </span>
          </div>
          {users.length > 0 && (
            <div className="jsave-admin-list">
              {users.map(u => (
                <div key={u.uid} className="jsave-admin-list-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.uid.slice(0, 16)}…</span>
                    <span className="jsave-section-sub" style={{ fontSize: 11 }}>
                      {u.language === 'zh' ? '中文' : 'EN'} · {u.dailyReminder ? '🔔' : '🔕'}
                    </span>
                  </div>
                  <span style={{ fontSize: 20 }}>
                    {u.checkedIn === null ? '?' : u.checkedIn ? '✅' : '⬜'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </GlassCard>
  )
}

// ── Broadcast push section ────────────────────────────────────────────────────
function BroadcastCard({ zh, users }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selected, setSelected] = useState(new Set()) // empty = all
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const allUids = users ? users.map(u => u.uid) : []
  const allSelected = allUids.length > 0 && allUids.every(uid => selected.has(uid))
  const noneSelected = selected.size === 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allUids))
    }
  }

  function toggleUser(uid) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError(zh ? '标题和内容不能为空' : 'Title and body are required.')
      return
    }
    setSending(true)
    setError('')
    setResult(null)
    try {
      const fn = httpsCallable(functions, 'jsaveAdminBroadcast')
      // send to selected UIDs, or all if none selected
      const uids = noneSelected ? null : [...selected]
      const res = await fn({ title: title.trim(), body: body.trim(), uids })
      setResult(res.data)
      setTitle('')
      setBody('')
      setSelected(new Set())
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const targetLabel = noneSelected
    ? (zh ? '所有用户' : 'All users')
    : (zh ? `已选 ${selected.size} 人` : `${selected.size} selected`)

  return (
    <GlassCard className="jsave-settings-card">
      <h2 className="jsave-settings-section">📢 {zh ? '发送通知' : 'Send Push'}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          className="jsave-input"
          placeholder={zh ? '通知标题' : 'Notification title'}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="jsave-input jsave-admin-textarea"
          placeholder={zh ? '通知内容' : 'Notification body'}
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
        />

        {/* User selection */}
        {users && users.length > 0 && (
          <div className="jsave-admin-user-select">
            <div className="jsave-admin-user-select-header">
              <span className="jsave-section-sub" style={{ fontSize: 12 }}>
                {zh ? '接收对象：' : 'Recipients:'} <strong>{targetLabel}</strong>
              </span>
              <button className="jsave-admin-select-all-btn" onClick={toggleAll}>
                {allSelected ? (zh ? '取消全选' : 'Deselect all') : (zh ? '全选' : 'Select all')}
              </button>
            </div>
            <div className="jsave-admin-list" style={{ maxHeight: 160 }}>
              {users.map(u => (
                <label key={u.uid} className="jsave-admin-list-row jsave-admin-user-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      className="jsave-admin-checkbox"
                      checked={selected.has(u.uid)}
                      onChange={() => toggleUser(u.uid)}
                    />
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.uid.slice(0, 14)}…</span>
                      <span className="jsave-section-sub" style={{ fontSize: 11, marginLeft: 6 }}>
                        {u.language === 'zh' ? '中文' : 'EN'} · {u.checkedIn ? '✅' : '⬜'} · 📱×{u.devices}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="jsave-error">{error}</p>}
        {result && (
          <p className="jsave-section-sub" style={{ color: '#10b981' }}>
            {zh
              ? `已发送 ${result.sent}，失败 ${result.failed}，清理 ${result.cleaned}`
              : `Sent: ${result.sent} · Failed: ${result.failed} · Cleaned: ${result.cleaned}`}
          </p>
        )}
        <button
          className="jsave-btn-primary jsave-btn-full"
          onClick={handleSend}
          disabled={sending}
          style={{ opacity: sending ? 0.6 : 1 }}
        >
          {sending
            ? (zh ? '发送中…' : 'Sending…')
            : (zh ? `发送给 ${targetLabel}` : `Send to ${targetLabel}`)}
        </button>
      </div>
    </GlassCard>
  )
}

// ── Admin page root ───────────────────────────────────────────────────────────
export default function AdminPage({ zh, onClose }) {
  const [users, setUsers] = useState(null)
  const [usersError, setUsersError] = useState('')

  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await getDocs(collection(db, 'jsavePushSubs'))
        // Group device docs by uid
        const byUid = {}
        for (const d of snap.docs) {
          const data = d.data()
          const uid = data.uid || d.id // fallback for old single-device docs
          if (!byUid[uid]) byUid[uid] = { uid, language: data.language, devices: 0 }
          byUid[uid].devices++
          byUid[uid].language = data.language // last device's language
        }
        const users = Object.values(byUid)
        const withActivity = await Promise.all(users.map(async u => {
          try {
            const txSnap = await getDocs(
              query(collection(db, 'users', u.uid, 'jsave_transactions'), where('date', '==', today))
            )
            const checkedIn = txSnap.docs.some(d => {
              const tx = d.data()
              return !tx.deleted && tx.type !== 'transfer'
            })
            return { ...u, checkedIn }
          } catch {
            return { ...u, checkedIn: null }
          }
        }))
        setUsers(withActivity)
      } catch (e) {
        setUsersError(e.message)
      }
    }
    loadUsers()
  }, [])

  return (
    <div className="jsave-admin-overlay">
      <div className="jsave-admin-header">
        <button className="jsave-modal-close" onClick={onClose} style={{ marginRight: 8 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>
          🔐 {zh ? '管理面板' : 'Admin Panel'}
        </span>
      </div>
      <div className="jsave-page" style={{ paddingTop: 0 }}>
        <DonationsCard zh={zh} />
        <UsersCard zh={zh} users={users} usersError={usersError} />
        <BroadcastCard zh={zh} users={users} />
      </div>
    </div>
  )
}

import React, { useEffect, useState, useMemo } from 'react'
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

const db = getFirestore(app)

const TAB = { personal: 'personal', promo: 'promo' }

function formatDiscount(discount, type) {
  return type === 'fixed' ? `RM ${Number(discount).toFixed(2)} OFF` : `${discount}% OFF`
}

// ── Personal Coupons Tab ─────────────────────────────────────────────────────
function PersonalTab({ adminUid }) {
  const [users, setUsers] = useState([])
  const [coupons, setCoupons] = useState({}) // uid → coupon data
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', discountType: 'percentage', discount: '10' })
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const [usersSnap, couponsSnap] = await Promise.all([
      getDocs(collection(db, 'cheers_users')),
      getDocs(collection(db, 'cheers_coupons')),
    ])
    setUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })))
    const map = {}
    couponsSnap.forEach(d => { map[d.id] = d.data() })
    setCoupons(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(t) { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  function toggleSelect(uid) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  function toggleAll(filtered) {
    const ids = filtered.map(u => u.uid)
    const allSelected = ids.every(id => selected.has(id))
    setSelected(allSelected ? new Set() : new Set(ids))
  }

  async function handleIssue() {
    if (!selected.size) { flash('请先选择用户'); return }
    const d = parseFloat(form.discount)
    if (isNaN(d) || d <= 0) { flash('请输入有效折扣'); return }
    if (form.discountType === 'percentage' && d > 100) { flash('百分比不能超过100'); return }
    setIssuing(true)
    const discountValue = form.discountType === 'percentage' ? d / 100 : d
    await Promise.all([...selected].map(uid =>
      setDoc(doc(db, 'cheers_coupons', uid), {
        code: `ADMIN${Math.floor(Math.random() * 9000 + 1000)}`,
        title: form.title || (form.discountType === 'percentage' ? `${d}% 折扣` : `RM${d} 减免`),
        discount: discountValue,
        discountType: form.discountType,
        type: form.discountType,
        used: false,
        grantedAt: serverTimestamp(),
        usedAt: null,
        grantedBy: adminUid,
      })
    ))
    flash(`已发放给 ${selected.size} 位用户`)
    setSelected(new Set())
    load()
    setIssuing(false)
  }

  async function handleVoid(uid) {
    if (!confirm('确认作废此优惠券？')) return
    await updateDoc(doc(db, 'cheers_coupons', uid), { used: true, usedAt: serverTimestamp() })
    flash('已作废')
    load()
  }

  const filtered = useMemo(() =>
    users.filter(u => !search || u.email?.includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  )

  return (
    <div className="space-y-5">
      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}

      {/* Issue form */}
      <div className="card p-4 space-y-3">
        <h2 className="font-medium text-cheers-dark-brown">发放设置</h2>
        <div>
          <label className="label">优惠券标题</label>
          <input className="input" placeholder="例：VIP专属折扣" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">折扣类型</label>
            <select className="input" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
              <option value="percentage">百分比 (%)</option>
              <option value="fixed">固定金额 (RM)</option>
            </select>
          </div>
          <div>
            <label className="label">{form.discountType === 'percentage' ? '折扣 (%)' : '金额 (RM)'}</label>
            <input type="number" min="1" max={form.discountType === 'percentage' ? 100 : undefined}
              className="input" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
          </div>
        </div>
        <button onClick={handleIssue} disabled={issuing || !selected.size}
          className="btn-primary w-full py-2">
          {issuing ? '发放中…' : `发放给已选 ${selected.size} 位用户`}
        </button>
      </div>

      {/* User list */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-cheers-cream flex items-center gap-3">
          <h2 className="font-medium text-cheers-dark-brown flex-1">Cheers 用户 ({users.length})</h2>
          <input className="input w-48 text-sm py-1" placeholder="搜索邮箱/姓名"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={() => toggleAll(filtered)}
            className="text-xs text-cheers-brown hover:text-cheers-dark-brown">
            {filtered.every(u => selected.has(u.uid)) ? '取消全选' : '全选'}
          </button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-cheers-brown/40">加载中…</div>
        ) : (
          <div className="divide-y divide-cheers-cream max-h-80 overflow-y-auto">
            {filtered.map(u => {
              const coupon = coupons[u.uid]
              return (
                <label key={u.uid} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cheers-cream/20 cursor-pointer">
                  <input type="checkbox" checked={selected.has(u.uid)} onChange={() => toggleSelect(u.uid)}
                    className="w-4 h-4 accent-cheers-brown flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cheers-dark-brown truncate">{u.displayName || '（无名称）'}</p>
                    <p className="text-xs text-cheers-brown/50 truncate">{u.email}</p>
                  </div>
                  {coupon && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-cheers-brown">{coupon.title || coupon.code}</span>
                      <span className={`badge-status ${coupon.used ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'}`}>
                        {coupon.used ? '已使用' : '可用'}
                      </span>
                      {!coupon.used && (
                        <button type="button" onClick={e => { e.preventDefault(); handleVoid(u.uid) }}
                          className="text-xs text-red-400 hover:text-red-600">作废</button>
                      )}
                    </div>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Promo Codes Tab ──────────────────────────────────────────────────────────
function PromoTab({ adminUid }) {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', title: '', discountType: 'percentage', discount: '10', maxUses: '' })
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'cheers_promo_codes'))
    setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(t) { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  async function handleCreate(e) {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (!code) { flash('请填写优惠码'); return }
    const d = parseFloat(form.discount)
    if (isNaN(d) || d <= 0) { flash('请输入有效折扣'); return }
    setCreating(true)
    const discountValue = form.discountType === 'percentage' ? d / 100 : d
    await setDoc(doc(db, 'cheers_promo_codes', code), {
      code,
      title: form.title || code,
      discount: discountValue,
      discountType: form.discountType,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      usedCount: 0,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: adminUid,
    })
    flash(`优惠码 ${code} 已创建`)
    setForm(f => ({ ...f, code: '', title: '' }))
    load()
    setCreating(false)
  }

  async function toggleActive(id, current) {
    await updateDoc(doc(db, 'cheers_promo_codes', id), { active: !current })
    load()
  }

  return (
    <div className="space-y-5">
      {msg && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}

      <div className="card p-4 space-y-3">
        <h2 className="font-medium text-cheers-dark-brown">创建优惠码</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">优惠码 *</label>
              <input className="input font-mono uppercase" placeholder="SUMMER10" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </div>
            <div>
              <label className="label">标题</label>
              <input className="input" placeholder="夏季优惠" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">折扣类型</label>
              <select className="input" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                <option value="percentage">百分比</option>
                <option value="fixed">固定 RM</option>
              </select>
            </div>
            <div>
              <label className="label">{form.discountType === 'percentage' ? '折扣 (%)' : '金额 (RM)'}</label>
              <input type="number" min="1" className="input" value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">最多使用次数</label>
              <input type="number" min="1" className="input" placeholder="不限" value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary w-full py-2">
            {creating ? '创建中…' : '创建优惠码'}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-cheers-cream">
          <h2 className="font-medium text-cheers-dark-brown">优惠码列表</h2>
        </div>
        {loading ? (
          <div className="py-8 text-center text-cheers-brown/40">加载中…</div>
        ) : codes.length === 0 ? (
          <div className="py-8 text-center text-cheers-brown/40">暂无优惠码</div>
        ) : (
          <div className="divide-y divide-cheers-cream">
            {codes.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-cheers-brown">{c.code}</span>
                    <span className="text-xs text-cheers-dark-brown">{c.title}</span>
                    <span className="text-xs font-medium text-cheers-brown">{formatDiscount(c.discountType === 'percentage' ? Math.round(c.discount * 100) : c.discount, c.discountType)}</span>
                  </div>
                  <p className="text-xs text-cheers-brown/50 mt-0.5">
                    已使用 {c.usedCount || 0}{c.maxUses ? ` / ${c.maxUses}` : ''} 次
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge-status ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.active ? '启用' : '停用'}
                  </span>
                  <button onClick={() => toggleActive(c.id, c.active)}
                    className="text-xs text-cheers-brown hover:text-cheers-dark-brown">
                    {c.active ? '停用' : '启用'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CouponsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState(TAB.personal)

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-4">优惠券管理</h1>

      <div className="flex gap-1 mb-5 border-b border-cheers-cream">
        {[
          { key: TAB.personal, label: '个人优惠券' },
          { key: TAB.promo,    label: '优惠码' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-cheers-brown text-cheers-brown' : 'border-transparent text-cheers-brown/50 hover:text-cheers-brown'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === TAB.personal && <PersonalTab adminUid={user?.uid} />}
      {tab === TAB.promo    && <PromoTab    adminUid={user?.uid} />}
    </div>
  )
}

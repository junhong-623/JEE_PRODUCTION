import React, { useEffect, useState } from 'react'
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, where, limit } from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

const db = getFirestore(app)

export default function CouponsPage() {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [newDiscount, setNewDiscount] = useState('10')
  const [msg, setMsg] = useState('')

  async function load() {
    const [couponSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, 'cheers_coupons')),
      getDocs(collection(db, 'cheers_users')),
    ])
    const usersMap = {}
    usersSnap.forEach(d => { usersMap[d.id] = d.data() })
    setCoupons(couponSnap.docs.map(d => ({
      uid: d.id,
      ...d.data(),
      userEmail: usersMap[d.id]?.email || '—',
      userName: usersMap[d.id]?.displayName || '—',
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(text) { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  async function handleSearch(e) {
    e.preventDefault()
    const email = searchEmail.trim().toLowerCase()
    if (!email) return
    setSearching(true)
    setSearchResult(null)
    try {
      const snap = await getDocs(query(collection(db, 'cheers_users'), where('email', '==', email), limit(1)))
      setSearchResult(snap.empty ? 'not_found' : { uid: snap.docs[0].id, ...snap.docs[0].data() })
    } finally { setSearching(false) }
  }

  async function handleGrant(found) {
    const discount = parseFloat(newDiscount) / 100
    if (isNaN(discount) || discount <= 0 || discount > 1) { flash('请输入有效折扣（1-100）'); return }
    await setDoc(doc(db, 'cheers_coupons', found.uid), {
      code: `ADMIN${Math.floor(Math.random() * 9000 + 1000)}`,
      discount,
      type: 'percentage',
      used: false,
      grantedAt: serverTimestamp(),
      usedAt: null,
      grantedBy: user.uid,
    })
    flash(`已发放 ${Math.round(discount * 100)}% 优惠券给 ${found.email}`)
    setSearchEmail('')
    setSearchResult(null)
    load()
  }

  async function handleVoid(uid) {
    if (!confirm('确认作废此优惠券？')) return
    await updateDoc(doc(db, 'cheers_coupons', uid), { used: true, usedAt: serverTimestamp() })
    flash('已作废')
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">优惠券管理</h1>

      {msg && <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>}

      {/* Grant coupon */}
      <div className="card p-4 mb-6 space-y-3">
        <h2 className="font-medium text-cheers-dark-brown">手动发放优惠券</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input className="input flex-1" type="email" placeholder="搜索用户邮箱"
            value={searchEmail} onChange={e => { setSearchEmail(e.target.value); setSearchResult(null) }} />
          <button type="submit" disabled={searching} className="btn-primary px-4">{searching ? '…' : '搜索'}</button>
        </form>

        {searchResult === 'not_found' && (
          <p className="text-sm text-cheers-brown/60">找不到该用户（需先登录过 Cheers 网站）</p>
        )}
        {searchResult && searchResult !== 'not_found' && (
          <div className="bg-cheers-cream/30 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-cheers-dark-brown">{searchResult.displayName || '（无名称）'} · {searchResult.email}</p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-cheers-brown">折扣 %</label>
              <input type="number" min="1" max="100" className="input w-20 text-sm" value={newDiscount}
                onChange={e => setNewDiscount(e.target.value)} />
              <button onClick={() => handleGrant(searchResult)} className="btn-primary text-sm py-1.5 px-4">发放</button>
            </div>
          </div>
        )}
      </div>

      {/* Coupon list */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-cheers-cream flex items-center justify-between">
          <h2 className="font-medium text-cheers-dark-brown">所有优惠券 ({coupons.length})</h2>
        </div>
        {loading ? (
          <div className="py-8 text-center text-cheers-brown/40">加载中…</div>
        ) : coupons.length === 0 ? (
          <div className="py-8 text-center text-cheers-brown/40">暂无优惠券</div>
        ) : (
          <div className="divide-y divide-cheers-cream">
            {coupons.map(c => (
              <div key={c.uid} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-cheers-dark-brown truncate">{c.userName}</p>
                    <span className="font-mono text-xs bg-cheers-cream px-2 py-0.5 rounded">{c.code}</span>
                    <span className="text-xs text-cheers-brown font-medium">{Math.round(c.discount * 100)}%</span>
                  </div>
                  <p className="text-xs text-cheers-brown/50 mt-0.5">{c.userEmail}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge-status ${c.used ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                    {c.used ? '已使用' : '可使用'}
                  </span>
                  {!c.used && (
                    <button onClick={() => handleVoid(c.uid)} className="text-xs text-red-400 hover:text-red-600">作废</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

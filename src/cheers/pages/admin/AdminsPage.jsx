import React, { useEffect, useState } from 'react'
import {
  getFirestore, collection, getDocs, doc, setDoc,
  deleteDoc, query, where, limit, serverTimestamp, getDoc,
} from 'firebase/firestore'
import app from '../../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

const db = getFirestore(app)
const SUPER_ADMIN_UID = import.meta.env.VITE_ADMIN_UID

export default function AdminsPage() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [uidInput, setUidInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  async function loadAdmins() {
    const snap = await getDocs(collection(db, 'cheers_admins'))
    setAdmins(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { loadAdmins() }, [])

  function flash(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSearch(e) {
    e.preventDefault()
    const email = searchEmail.trim().toLowerCase()
    if (!email) return
    setSearching(true)
    setSearchResult(null)
    try {
      const snap = await getDocs(
        query(collection(db, 'cheers_users'), where('email', '==', email), limit(1))
      )
      setSearchResult(snap.empty ? 'not_found' : { uid: snap.docs[0].id, ...snap.docs[0].data() })
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(found) {
    if (admins.find(a => a.uid === found.uid)) { flash('该用户已是管理员'); return }
    await setDoc(doc(db, 'cheers_admins', found.uid), {
      email: found.email,
      displayName: found.displayName || '',
      addedBy: user.uid,
      addedAt: serverTimestamp(),
    })
    flash(`已将 ${found.email} 加为管理员`)
    setSearchEmail('')
    setSearchResult(null)
    loadAdmins()
  }

  async function handleAddByUid(e) {
    e.preventDefault()
    const uid = uidInput.trim()
    if (!uid) return
    if (admins.find(a => a.uid === uid)) { flash('该用户已是管理员'); return }
    // Try to get user profile from cheers_users, fall back to uid-only
    const userSnap = await getDoc(doc(db, 'cheers_users', uid)).catch(() => null)
    const profile = userSnap?.exists() ? userSnap.data() : {}
    await setDoc(doc(db, 'cheers_admins', uid), {
      email: profile.email || '（未知）',
      displayName: profile.displayName || '（未知）',
      addedBy: user.uid,
      addedAt: serverTimestamp(),
    })
    flash('已添加，对方重新登录后生效')
    setUidInput('')
    loadAdmins()
  }

  async function handleRemove(uid) {
    if (uid === SUPER_ADMIN_UID) return
    if (!confirm('确认移除此管理员权限？')) return
    await deleteDoc(doc(db, 'cheers_admins', uid))
    flash('已移除管理员权限')
    loadAdmins()
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl text-cheers-dark-brown mb-6">管理员管理</h1>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{msg}</div>
      )}

      {/* Search by email */}
      <div className="card p-4 mb-4">
        <h2 className="font-medium text-cheers-dark-brown mb-3">按电子邮件搜索</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input flex-1"
            type="email"
            placeholder="输入用户电子邮件"
            value={searchEmail}
            onChange={e => { setSearchEmail(e.target.value); setSearchResult(null) }}
          />
          <button type="submit" disabled={searching} className="btn-primary px-4">
            {searching ? '…' : '搜索'}
          </button>
        </form>

        {searchResult === 'not_found' && (
          <div className="mt-3 text-sm text-cheers-brown/70 bg-cheers-cream/30 rounded-lg px-3 py-2">
            <p className="font-medium mb-0.5">找不到该用户</p>
            <p className="text-xs text-cheers-brown/50">该用户需要先通过 Cheers 网站登录一次，或使用下方 UID 方式手动添加。</p>
          </div>
        )}

        {searchResult && searchResult !== 'not_found' && (
          <div className="mt-3 flex items-center justify-between bg-cheers-cream/30 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-cheers-dark-brown">{searchResult.displayName || '（无名称）'}</p>
              <p className="text-xs text-cheers-brown/60">{searchResult.email}</p>
            </div>
            {admins.find(a => a.uid === searchResult.uid) ? (
              <span className="text-xs text-green-600 font-medium">已是管理员</span>
            ) : (
              <button onClick={() => handleAdd(searchResult)} className="btn-primary text-sm py-1.5 px-4">
                加为管理员
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add by UID */}
      <div className="card p-4 mb-6">
        <h2 className="font-medium text-cheers-dark-brown mb-1">按 UID 直接添加</h2>
        <p className="text-xs text-cheers-brown/50 mb-3">如搜索不到用户，可从 Firebase Console → Authentication 复制 UID</p>
        <form onSubmit={handleAddByUid} className="flex gap-2">
          <input
            className="input flex-1 font-mono text-sm"
            placeholder="User UID"
            value={uidInput}
            onChange={e => setUidInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary px-4 text-sm">添加</button>
        </form>
      </div>

      {/* Current admins */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-cheers-cream">
          <h2 className="font-medium text-cheers-dark-brown">当前管理员</h2>
        </div>
        {loading ? (
          <div className="py-8 text-center text-cheers-brown/40">加载中…</div>
        ) : admins.length === 0 ? (
          <div className="py-8 text-center text-cheers-brown/40">暂无额外管理员</div>
        ) : (
          <div className="divide-y divide-cheers-cream">
            {admins.map(a => (
              <div key={a.uid} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cheers-dark-brown truncate">{a.displayName || '（无名称）'}</p>
                  <p className="text-xs text-cheers-brown/50 truncate">{a.email}</p>
                </div>
                {a.uid !== SUPER_ADMIN_UID && (
                  <button onClick={() => handleRemove(a.uid)}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">
                    移除
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

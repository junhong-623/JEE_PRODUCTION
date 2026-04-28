import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const CLOUDINARY_CLOUD = 'db2ixn8zh'
const CLOUDINARY_PRESET = 'H-Agency'

const STATUS_COLOR = { pending: 'text-yellow-500', approved: 'text-emerald-500', rejected: 'text-red-500' }
const STATUS_LABEL = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }

const emptyStreamer = { nameZh: '', nameEn: '', income: '', hours: '', fansGrowth: '', badgeZh: '优秀主播', badgeEn: 'Top Streamer', order: 0, photoUrl: '', tiktokUrl: '', bigoUrl: '', instaUrl: '' }

async function uploadToCloudinary(file, folder) {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', CLOUDINARY_PRESET)
  form.append('folder', folder)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('图片上传失败')
  return (await res.json()).secure_url
}

export default function HAgencyAdmin() {
  const [tab, setTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  // Leaderboard form
  const [editingStreamer, setEditingStreamer] = useState(null)
  const [streamerForm, setStreamerForm] = useState(emptyStreamer)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [savingStreamer, setSavingStreamer] = useState(false)
  const avatarInputRef = useRef(null)
  const formRef = useRef(null)
  const importInputRef = useRef(null)

  // Drag reorder
  const dragItem = useRef(null)
  const dragTarget = useRef(null)

  // Posts form
  const [postFile, setPostFile] = useState(null)
  const [postPreview, setPostPreview] = useState(null)
  const [postFileType, setPostFileType] = useState('image') // 'image' | 'video'
  const [postCaptionZh, setPostCaptionZh] = useState('')
  const [postCaptionEn, setPostCaptionEn] = useState('')
  const [uploadingPost, setUploadingPost] = useState(false)
  const fileInputRef = useRef(null)

  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), notice.duration || 3500)
    return () => clearTimeout(t)
  }, [notice])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [subSnap, lbSnap, postSnap] = await Promise.all([
        getDocs(query(collection(db, 'hagency_submissions'), orderBy('submittedAt', 'desc'))),
        getDocs(query(collection(db, 'hagency_leaderboard'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'hagency_posts'), orderBy('createdAt', 'desc'))),
      ])
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLeaderboard(lbSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setPosts(postSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      setNotice({ ok: false, msg: '加载失败: ' + e.message })
    }
    setLoading(false)
  }

  // ── Submissions ──────────────────────────────────────────
  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'hagency_submissions', id), { status })
      setSubmissions(s => s.map(x => x.id === id ? { ...x, status } : x))
      setNotice({ ok: true, msg: '状态已更新' })
    } catch (e) {
      setNotice({ ok: false, msg: e.message })
    }
  }

  // ── Leaderboard ──────────────────────────────────────────
  const openForm = (s) => {
    setEditingStreamer(s.id)
    setStreamerForm({
      nameZh: s.nameZh || '', nameEn: s.nameEn || '',
      income: s.income || '', hours: s.hours || '', fansGrowth: s.fansGrowth || '',
      badgeZh: s.badgeZh || '优秀主播', badgeEn: s.badgeEn || 'Top Streamer',
      order: s.order || 0,
      photoUrl: s.photoUrl || '', tiktokUrl: s.tiktokUrl || '',
      bigoUrl: s.bigoUrl || '', instaUrl: s.instaUrl || '',
    })
    setAvatarFile(null)
    setAvatarPreview(s.photoUrl || null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const promoteSubmission = (sub) => {
    setTab('leaderboard')
    setEditingStreamer('new')
    setStreamerForm({ ...emptyStreamer, nameZh: sub.name, order: leaderboard.length + 1 })
    setAvatarFile(null)
    setAvatarPreview(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const saveStreamer = async () => {
    if (!streamerForm.nameZh) { setNotice({ ok: false, msg: '请填写主播名称' }); return }
    setSavingStreamer(true)
    try {
      let photoUrl = streamerForm.photoUrl
      if (avatarFile) photoUrl = await uploadToCloudinary(avatarFile, 'hagency/avatars')

      const data = {
        ...streamerForm, photoUrl,
        income: Number(streamerForm.income) || 0,
        hours: Number(streamerForm.hours) || 0,
        fansGrowth: Number(streamerForm.fansGrowth) || 0,
        order: Number(streamerForm.order) || 0,
      }
      if (editingStreamer === 'new') {
        const ref = await addDoc(collection(db, 'hagency_leaderboard'), data)
        setLeaderboard(l => [...l, { id: ref.id, ...data }].sort((a, b) => a.order - b.order))
      } else {
        await updateDoc(doc(db, 'hagency_leaderboard', editingStreamer), data)
        setLeaderboard(l => l.map(x => x.id === editingStreamer ? { ...x, ...data } : x).sort((a, b) => a.order - b.order))
      }
      setNotice({ ok: true, msg: '保存成功' })
      setEditingStreamer(null)
      setStreamerForm(emptyStreamer)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (e) {
      setNotice({ ok: false, msg: e.message })
    }
    setSavingStreamer(false)
  }

  const deleteStreamer = async (id) => {
    if (!confirm('确定删除这位主播？')) return
    try {
      await deleteDoc(doc(db, 'hagency_leaderboard', id))
      setLeaderboard(l => l.filter(x => x.id !== id))
      setNotice({ ok: true, msg: '删除成功' })
    } catch (e) {
      setNotice({ ok: false, msg: e.message })
    }
  }

  const handleDragStart = (i) => { dragItem.current = i }
  const handleDragEnter = (i) => { dragTarget.current = i }
  const handleDragEnd = async () => {
    const from = dragItem.current
    const to = dragTarget.current
    if (from === null || to === null || from === to) return
    const reordered = [...leaderboard]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    const updated = reordered.map((s, i) => ({ ...s, order: i + 1 }))
    setLeaderboard(updated)
    dragItem.current = null
    dragTarget.current = null
    try {
      await Promise.all(updated.map(s => updateDoc(doc(db, 'hagency_leaderboard', s.id), { order: s.order })))
    } catch (e) {
      setNotice({ ok: false, msg: '排序保存失败: ' + e.message })
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      let rows
      if (file.name.endsWith('.csv')) {
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
        })
      } else {
        rows = JSON.parse(text)
        if (!Array.isArray(rows)) throw new Error('应为 JSON 数组格式')
      }

      let added = 0
      const skipped = []  // { name, reason }
      let currentBoard = leaderboard  // track in-memory additions for within-batch dupe check

      for (const row of rows) {
        const data = {
          nameZh: row.nameZh || row.name || '', nameEn: row.nameEn || '',
          income: Number(row.income) || 0, hours: Number(row.hours) || 0,
          fansGrowth: Number(row.fansGrowth) || 0,
          badgeZh: row.badgeZh || '优秀主播', badgeEn: row.badgeEn || 'Top Streamer',
          order: Number(row.order) || currentBoard.length + 1,
          photoUrl: row.photoUrl || '', tiktokUrl: row.tiktokUrl || '',
          bigoUrl: row.bigoUrl || '', instaUrl: row.instaUrl || '',
        }

        if (!data.nameZh) {
          skipped.push({ name: data.nameEn || '(unnamed)', reason: '缺少中文名称 nameZh' })
          continue
        }

        // Duplicate check — nameZh (always) and nameEn (if provided)
        const normZh = data.nameZh.trim().toLowerCase()
        const normEn = data.nameEn.trim().toLowerCase()
        const dupZh = currentBoard.find(s => s.nameZh.trim().toLowerCase() === normZh)
        const dupEn = normEn && currentBoard.find(s => s.nameEn && s.nameEn.trim().toLowerCase() === normEn)

        if (dupZh) {
          skipped.push({ name: data.nameZh, reason: `与已有主播「${dupZh.nameZh}」中文名重复` })
          continue
        }
        if (dupEn) {
          skipped.push({ name: data.nameZh, reason: `与已有主播「${dupEn.nameZh}」英文名重复 (${data.nameEn})` })
          continue
        }

        const ref = await addDoc(collection(db, 'hagency_leaderboard'), data)
        const newEntry = { id: ref.id, ...data }
        currentBoard = [...currentBoard, newEntry]
        setLeaderboard(l => [...l, newEntry].sort((a, b) => a.order - b.order))
        added++
      }

      const skipLines = skipped.map(s => `· ${s.name}：${s.reason}`).join('\n')
      const msg = skipped.length > 0
        ? `✅ 成功导入 ${added} 位主播\n⚠️ 跳过 ${skipped.length} 位：\n${skipLines}`
        : `✅ 成功导入 ${added} 位主播`
      setNotice({ ok: skipped.length === 0, msg, duration: skipped.length > 0 ? 8000 : 3500 })
    } catch (e) {
      setNotice({ ok: false, msg: '导入失败: ' + e.message })
    }
    e.target.value = ''
  }

  // ── Posts ────────────────────────────────────────────────
  const uploadPost = async () => {
    if (!postFile && !postCaptionZh && !postCaptionEn) { setNotice({ ok: false, msg: '请上传图片/视频或填写说明文字' }); return }
    setUploadingPost(true)
    try {
      let mediaUrl = '', mediaType = 'image'
      if (postFile) {
        const isVid = postFileType === 'video'
        const form = new FormData()
        form.append('file', postFile)
        form.append('upload_preset', CLOUDINARY_PRESET)
        form.append('folder', 'hagency/posts')
        const endpoint = isVid ? 'video' : 'image'
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${endpoint}/upload`, { method: 'POST', body: form })
        if (!res.ok) throw new Error('上传失败')
        mediaUrl = (await res.json()).secure_url
        mediaType = isVid ? 'video' : 'image'
      }
      const data = { mediaUrl, mediaType, captionZh: postCaptionZh, captionEn: postCaptionEn, createdAt: serverTimestamp() }
      const ref = await addDoc(collection(db, 'hagency_posts'), data)
      setPosts(p => [{ id: ref.id, ...data, createdAt: { toDate: () => new Date() } }, ...p])
      setNotice({ ok: true, msg: '动态已发布' })
      setPostFile(null); setPostPreview(null); setPostFileType('image'); setPostCaptionZh(''); setPostCaptionEn('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      setNotice({ ok: false, msg: '上传失败: ' + e.message })
    }
    setUploadingPost(false)
  }

  const deletePost = async (id) => {
    if (!confirm('确定删除这条动态？')) return
    try {
      await deleteDoc(doc(db, 'hagency_posts', id))
      setPosts(p => p.filter(x => x.id !== id))
      setNotice({ ok: true, msg: '删除成功' })
    } catch (e) {
      setNotice({ ok: false, msg: e.message })
    }
  }

  const SAMPLE_STREAMERS = [
    { nameZh: '小花', nameEn: 'XiaoHua', income: 8000, hours: 120, fansGrowth: 5000, badgeZh: '优秀主播', badgeEn: 'Top Streamer', order: 1, photoUrl: '', tiktokUrl: 'https://tiktok.com/@example', bigoUrl: '', instaUrl: '' },
    { nameZh: '大明', nameEn: 'DaMing',  income: 5500, hours:  90, fansGrowth: 3200, badgeZh: '人气主播', badgeEn: 'Rising Star',  order: 2, photoUrl: '', tiktokUrl: '', bigoUrl: 'https://bigo.tv/example', instaUrl: 'https://instagram.com/example' },
  ]

  const downloadSample = (format) => {
    let content, mime, ext
    const headers = ['nameZh','nameEn','income','hours','fansGrowth','badgeZh','badgeEn','order','photoUrl','tiktokUrl','bigoUrl','instaUrl']
    if (format === 'csv') {
      const rows = SAMPLE_STREAMERS.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
      content = [headers.join(','), ...rows].join('\n')
      mime = 'text/csv'
      ext = 'csv'
    } else {
      content = JSON.stringify(SAMPLE_STREAMERS, null, 2)
      mime = 'application/json'
      ext = 'json'
    }
    const blob = new Blob([content], { type: mime })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `hagency-leaderboard-sample.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const filteredSubs = statusFilter === 'all' ? submissions : submissions.filter(s => s.status === statusFilter)
  const approvedSubs = submissions.filter(s => s.status === 'approved')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {notice && (
        <div className={`fixed right-6 top-6 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-lg text-sm ${notice.ok ? 'border-emerald-300/45 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/70 dark:text-emerald-100' : 'border-red-300/45 bg-red-50 text-red-900 dark:border-red-500/25 dark:bg-red-950/70 dark:text-red-100'}`}>
          {notice.msg.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1 text-xs opacity-80' : ''}>{line}</p>
          ))}
        </div>
      )}

      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl text-pink-500" style={{ fontStyle: 'italic' }}>ℋ Agency</span>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-gray-400">Admin</span>
          </div>
          <a href="/h-agency" className="rounded-full border border-pink-200 px-3 py-1.5 font-mono text-xs text-pink-500 transition-colors hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950/30">
            查看公开页面 →
          </a>
        </div>
        <div className="mx-auto flex max-w-5xl gap-1 px-6 pb-3">
          {[['submissions', `申请 (${submissions.filter(s => s.status === 'pending').length} 待审)`], ['leaderboard', '排行榜'], ['posts', '动态']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${tab === k ? 'bg-pink-500 text-white' : 'text-gray-500 hover:text-pink-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {loading && <p className="text-center text-sm text-gray-400">加载中...</p>}

        {/* ── Submissions ── */}
        {tab === 'submissions' && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${statusFilter === s ? 'border-pink-500 bg-pink-500 text-white' : 'border-gray-200 text-gray-500 hover:border-pink-300 dark:border-gray-700'}`}>
                  {s === 'all' ? '全部' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredSubs.length === 0 && <EmptyCard text="暂无申请记录" />}
              {filteredSubs.map(s => (
                <div key={s.id} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</span>
                        <span className={`font-mono text-xs ${STATUS_COLOR[s.status] || 'text-gray-400'}`}>{STATUS_LABEL[s.status] || s.status}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>📱 {s.phone}</span>
                        {s.wechat && <span>💬 {s.wechat}</span>}
                        <span>🎭 {s.experience}</span>
                        <span>🎯 {s.specialization}</span>
                        <span>🎂 {s.age}岁</span>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-gray-600 dark:text-gray-300">{s.introduction}</p>
                      {s.social && <p className="mt-1 text-xs text-gray-400">社媒: {s.social}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      {s.status !== 'approved' && (
                        <button onClick={() => updateStatus(s.id, 'approved')} className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400">通过</button>
                      )}
                      {s.status !== 'rejected' && (
                        <button onClick={() => updateStatus(s.id, 'rejected')} className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">拒绝</button>
                      )}
                      {s.status === 'approved' && (
                        <button onClick={() => promoteSubmission(s)} className="rounded-xl bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-400">↑ 排行榜</button>
                      )}
                    </div>
                  </div>
                  {s.submittedAt?.toDate && (
                    <p className="mt-3 font-mono text-[10px] text-gray-300 dark:text-gray-600">{s.submittedAt.toDate().toLocaleString('zh-CN')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Leaderboard ── */}
        {tab === 'leaderboard' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl text-gray-900 dark:text-gray-100">排行榜管理</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadSample('csv')} className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 dark:border-gray-700">
                  📄 样本 CSV
                </button>
                <button onClick={() => downloadSample('json')} className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 dark:border-gray-700">
                  📋 样本 JSON
                </button>
                <button onClick={() => importInputRef.current?.click()} className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 dark:border-gray-700">
                  📥 批量导入 CSV / JSON
                </button>
                <input ref={importInputRef} type="file" accept=".csv,.json" onChange={handleImport} className="hidden" />
                <button
                  onClick={() => { setEditingStreamer('new'); setStreamerForm({ ...emptyStreamer, order: leaderboard.length + 1 }); setAvatarFile(null); setAvatarPreview(null); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}
                  className="rounded-full bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
                >
                  + 添加主播
                </button>
              </div>
            </div>

            {/* Form */}
            {editingStreamer && (
              <div ref={formRef} className="mb-6 rounded-2xl border border-pink-200 bg-pink-50/50 p-6 dark:border-pink-900/30 dark:bg-pink-950/20">
                <h4 className="mb-5 font-semibold text-gray-900 dark:text-gray-100">{editingStreamer === 'new' ? '添加主播' : '编辑主播'}</h4>

                {/* Avatar */}
                <div className="mb-5 flex items-center gap-4">
                  <div
                    className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-pink-300 bg-pink-50 flex items-center justify-center hover:border-pink-500 transition-colors"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarPreview
                      ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                      : <span className="text-3xl">📷</span>
                    }
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">头像照片</p>
                    <button onClick={() => avatarInputRef.current?.click()} className="rounded-xl border border-pink-200 px-3 py-1.5 text-xs text-pink-500 hover:bg-pink-100">
                      {avatarPreview ? '更换' : '上传'}
                    </button>
                    {avatarPreview && (
                      <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); setStreamerForm(f => ({ ...f, photoUrl: '' })) }} className="ml-2 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:text-red-500">移除</button>
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setAvatarFile(file)
                    setAvatarPreview(URL.createObjectURL(file))
                  }} />
                </div>

                {/* Basic info */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {[['nameZh', '主播名称（中文）'], ['nameEn', 'Streamer Name (EN)'], ['badgeZh', '称号（中文）'], ['badgeEn', 'Badge (EN)']].map(([k, label]) => (
                    <label key={k} className="block">
                      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</span>
                      <input value={streamerForm[k]} onChange={e => setStreamerForm(f => ({ ...f, [k]: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                    </label>
                  ))}
                  {[['income', '月收入（¥）'], ['hours', '直播时长（小时）'], ['fansGrowth', '粉丝增长'], ['order', '排序']].map(([k, label]) => (
                    <label key={k} className="block">
                      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">{label}</span>
                      <input type="number" value={streamerForm[k]} onChange={e => setStreamerForm(f => ({ ...f, [k]: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                    </label>
                  ))}
                </div>

                {/* Platform links */}
                <div className="mt-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">直播平台链接（填写才显示图标）</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[['tiktokUrl', '🎵 抖音 / TikTok'], ['bigoUrl', '🎮 BIGO Live'], ['instaUrl', '📸 Instagram']].map(([k, label]) => (
                      <label key={k} className="block">
                        <span className="mb-1 block font-mono text-[10px] text-gray-400">{label}</span>
                        <input value={streamerForm[k]} onChange={e => setStreamerForm(f => ({ ...f, [k]: e.target.value }))} placeholder="https://..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button onClick={saveStreamer} disabled={savingStreamer} className="rounded-full bg-pink-500 px-5 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60">
                    {savingStreamer ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => { setEditingStreamer(null); setStreamerForm(emptyStreamer); setAvatarFile(null); setAvatarPreview(null) }} className="rounded-full border border-gray-200 px-5 py-2 text-sm hover:border-gray-400 dark:border-gray-700">取消</button>
                </div>
              </div>
            )}

            {/* Leaderboard list — draggable */}
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">拖动排序</p>
            <div className="space-y-3">
              {leaderboard.length === 0 && <EmptyCard text="排行榜暂无数据" />}
              {leaderboard.map((s, i) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className="flex cursor-grab items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 active:cursor-grabbing active:opacity-50 dark:border-gray-800 dark:bg-gray-900"
                >
                  <span className="select-none text-gray-300 text-lg">⠿</span>
                  {s.photoUrl
                    ? <img src={s.photoUrl} alt={s.nameZh} className="h-11 w-11 shrink-0 rounded-full object-cover border-2 border-pink-200" />
                    : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 font-mono text-sm font-bold text-pink-400 dark:bg-pink-950/30">{i + 1}</span>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{s.nameZh}{s.nameEn && ` / ${s.nameEn}`}</p>
                    <p className="text-xs text-gray-400">¥{(s.income || 0).toLocaleString()} · {s.hours || 0}h · +{(s.fansGrowth || 0).toLocaleString()} fans</p>
                    <div className="mt-0.5 flex gap-2">
                      {s.tiktokUrl && <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[9px] text-gray-500">TikTok</span>}
                      {s.bigoUrl && <span className="rounded-full bg-purple-50 px-2 py-0.5 font-mono text-[9px] text-purple-400">BIGO</span>}
                      {s.instaUrl && <span className="rounded-full bg-orange-50 px-2 py-0.5 font-mono text-[9px] text-orange-400">Instagram</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openForm(s)} className="rounded-xl border border-gray-100 px-3 py-1.5 text-xs hover:border-pink-300 hover:text-pink-500 dark:border-gray-700">编辑</button>
                    <button onClick={() => deleteStreamer(s.id)} className="rounded-xl border border-gray-100 px-3 py-1.5 text-xs hover:border-red-300 hover:text-red-500 dark:border-gray-700">删除</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Approved submissions */}
            {approvedSubs.length > 0 && (
              <div className="mt-10">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">已通过申请 · 点击加入排行榜</span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  {approvedSubs.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm dark:bg-emerald-950/40">✓</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.specialization} · {s.experience}</p>
                      </div>
                      <button onClick={() => promoteSubmission(s)} className="rounded-xl bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600">
                        ↑ 加入排行榜
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Posts ── */}
        {tab === 'posts' && (
          <div>
            <h3 className="mb-4 font-display text-2xl text-gray-900 dark:text-gray-100">动态管理</h3>
            <div className="mb-8 rounded-2xl border border-pink-200 bg-pink-50/50 p-6 dark:border-pink-900/30 dark:bg-pink-950/20">
              <h4 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">发布新动态</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">图片 / 视频</label>
                  {postPreview ? (
                    <div className="relative">
                      {postFileType === 'video'
                        ? <video src={postPreview} className="h-40 w-full rounded-xl object-cover" muted playsInline />
                        : <img src={postPreview} alt="" className="h-40 w-full rounded-xl object-cover" />
                      }
                      <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 font-mono text-[10px] text-white">{postFileType === 'video' ? '🎬 视频' : '🖼 图片'}</span>
                      <button onClick={() => { setPostFile(null); setPostPreview(null); setPostFileType('image'); if (fileInputRef.current) fileInputRef.current.value = '' }} className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">删除</button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-pink-200 text-pink-400 transition-colors hover:border-pink-400 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950/30">
                      <span className="text-2xl">📷</span>
                      <span className="mt-1 text-sm">点击上传图片或视频</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setPostFile(f)
                    setPostPreview(URL.createObjectURL(f))
                    setPostFileType(f.type.startsWith('video/') ? 'video' : 'image')
                  }} className="hidden" />
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">说明文字（中文）</span>
                    <textarea rows={3} value={postCaptionZh} onChange={e => setPostCaptionZh(e.target.value)} placeholder="输入中文说明..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Caption (English)</span>
                    <textarea rows={3} value={postCaptionEn} onChange={e => setPostCaptionEn(e.target.value)} placeholder="Enter English caption..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                  </label>
                </div>
              </div>
              <button onClick={uploadPost} disabled={uploadingPost} className="mt-4 rounded-full bg-pink-500 px-6 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60">
                {uploadingPost ? '上传中...' : '发布动态'}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.length === 0 && <EmptyCard text="暂无动态" />}
              {posts.map(p => {
                const url = p.mediaUrl || p.imageUrl || ''
                const isVid = p.mediaType === 'video'
                return (
                  <div key={p.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                    {url && (
                      <div className="relative aspect-square">
                        {isVid
                          ? <video src={url} className="h-full w-full object-cover" muted playsInline />
                          : <img src={url} alt="" className="h-full w-full object-cover" />
                        }
                        {isVid && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white">🎬 视频</span>}
                      </div>
                    )}
                    <div className="p-3">
                      {p.captionZh && <p className="text-sm text-gray-600 dark:text-gray-300">{p.captionZh}</p>}
                      {p.captionEn && <p className="text-xs text-gray-400">{p.captionEn}</p>}
                      {p.createdAt?.toDate && <p className="mt-1 font-mono text-[10px] text-gray-300">{p.createdAt.toDate().toLocaleDateString('zh-CN')}</p>}
                      <button onClick={() => deletePost(p.id)} className="mt-2 rounded-xl border border-red-100 px-3 py-1 text-xs text-red-400 hover:border-red-300 hover:text-red-600 dark:border-red-900/30">删除</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyCard({ text }) {
  return <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-gray-700">{text}</div>
}

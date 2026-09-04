import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { logout } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'

const CLOUDINARY_CLOUD = 'db2ixn8zh'
const CLOUDINARY_PRESET = 'H-Agency'

const PIPELINE = ['pending', 'contacted', 'interview', 'trial', 'offer', 'approved', 'contracted', 'onboarding', 'active', 'rejected']
const STATUS_COLOR = {
  pending: 'text-amber-600', contacted: 'text-sky-600', interview: 'text-violet-600', trial: 'text-fuchsia-600',
  offer: 'text-pink-600', contracted: 'text-emerald-600', onboarding: 'text-teal-600', active: 'text-emerald-700',
  approved: 'text-emerald-600', rejected: 'text-red-500',
}
const STATUS_LABEL = {
  pending: '新申请', contacted: '已联系', interview: '面试安排', trial: '试播中', offer: '条件确认',
  contracted: '已签约', onboarding: '培训中', active: '活跃主播', approved: '已通过', rejected: '已拒绝',
}

const emptyStreamer = {
  nameZh: '', nameEn: '', slug: '', introZh: '', introEn: '', platform: '', handle: '',
  income: '', hours: '', fansGrowth: '', badgeZh: '优秀主播', badgeEn: 'Top Streamer', order: 0,
  photoUrl: '', homeImageUrl: '', honorImageUrl: '', rankingImageUrl: '', tiktokUrl: '', bigoUrl: '', instaUrl: '', visible: true,
  homeFeatured: false, homePosition: '', honorFeatured: false, honorPosition: '', rankingFeatured: false, rankingPosition: '',
}

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes') return true
  if (value === 0 || value === '0' || String(value).toLowerCase() === 'false' || String(value).toLowerCase() === 'no') return false
  return fallback
}

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
  const publicHome = window.location.pathname.startsWith('/h-agency') ? '/h-agency' : '/'
  const loginHome = window.location.pathname.startsWith('/h-agency') ? '/' : '/admin/login'
  const { user } = useAuth()
  const [tab, setTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const targetApplicationId = new URLSearchParams(window.location.search).get('application') || ''
  const focusedApplicationRef = useRef(false)

  const handleLogout = async () => {
    try {
      await logout()
      window.location.replace(loginHome)
    } catch {
      setNotice({ ok: false, msg: '退出失败，请稍后再试。' })
    }
  }

  // Leaderboard form
  const [editingStreamer, setEditingStreamer] = useState(null)
  const [streamerForm, setStreamerForm] = useState(emptyStreamer)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [savingStreamer, setSavingStreamer] = useState(false)
  const [promotingSubmissionId, setPromotingSubmissionId] = useState(null)
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
    if (loading || !targetApplicationId || focusedApplicationRef.current || !submissions.some(item => item.id === targetApplicationId)) return
    focusedApplicationRef.current = true
    setTab('submissions')
    setStatusFilter('all')
    window.setTimeout(() => document.getElementById(`application-${targetApplicationId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }, [loading, submissions, targetApplicationId])
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
      await updateDoc(doc(db, 'hagency_submissions', id), { status, updatedAt: serverTimestamp() })
      setSubmissions(s => s.map(x => x.id === id ? { ...x, status } : x))
      setNotice({ ok: true, msg: '状态已更新' })
    } catch (e) {
      setNotice({ ok: false, msg: e.message })
    }
  }

  // ── Leaderboard ──────────────────────────────────────────
  const openForm = (s) => {
    setPromotingSubmissionId(null)
    setEditingStreamer(s.id)
    setStreamerForm({
      nameZh: s.nameZh || '', nameEn: s.nameEn || '',
      slug: s.slug || '', introZh: s.introZh || '', introEn: s.introEn || '',
      platform: s.platform || '', handle: s.handle || '',
      income: s.income || '', hours: s.hours || '', fansGrowth: s.fansGrowth || '',
      badgeZh: s.badgeZh || '优秀主播', badgeEn: s.badgeEn || 'Top Streamer',
      order: s.order || 0,
      photoUrl: s.photoUrl || '', homeImageUrl: s.homeImageUrl || '', honorImageUrl: s.honorImageUrl || '', rankingImageUrl: s.rankingImageUrl || '', tiktokUrl: s.tiktokUrl || '',
      bigoUrl: s.bigoUrl || '', instaUrl: s.instaUrl || '',
      visible: s.visible !== false,
      homeFeatured: Boolean(s.homeFeatured),
      homePosition: s.homePosition || '',
      honorFeatured: Boolean(s.honorFeatured),
      honorPosition: s.honorPosition || '',
      rankingFeatured: Boolean(s.rankingFeatured),
      rankingPosition: s.rankingPosition || '',
      sourceApplicationId: s.sourceApplicationId || null,
    })
    setAvatarFile(null)
    setAvatarPreview(s.photoUrl || null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const promoteSubmission = (sub) => {
    setTab('leaderboard')
    setEditingStreamer('new')
    setPromotingSubmissionId(sub.id)
    setStreamerForm({
      ...emptyStreamer,
      nameZh: sub.name,
      badgeZh: sub.specialization || '签约主播',
      order: leaderboard.length + 1,
      photoUrl: sub.photoUrl || '',
      tiktokUrl: /tiktok|douyin/i.test(sub.social || '') ? sub.social : '',
      bigoUrl: /bigo/i.test(sub.social || '') ? sub.social : '',
      instaUrl: /instagram\.com|(^|\s)@/i.test(sub.social || '') ? sub.social : '',
    })
    setAvatarFile(null)
    setAvatarPreview(sub.photoUrl || null)
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
        visible: streamerForm.visible !== false,
        homeFeatured: Boolean(streamerForm.homeFeatured),
        homePosition: streamerForm.homeFeatured ? Math.min(3, Math.max(1, Number(streamerForm.homePosition) || 1)) : null,
        honorFeatured: Boolean(streamerForm.honorFeatured),
        honorPosition: streamerForm.honorFeatured ? Math.min(3, Math.max(1, Number(streamerForm.honorPosition) || 1)) : null,
        rankingFeatured: Boolean(streamerForm.rankingFeatured),
        rankingPosition: streamerForm.rankingFeatured ? Math.min(3, Math.max(1, Number(streamerForm.rankingPosition) || 1)) : null,
        sourceApplicationId: promotingSubmissionId || streamerForm.sourceApplicationId || null,
      }
      const placementRules = [
        ['homeFeatured', 'homePosition'],
        ['honorFeatured', 'honorPosition'],
        ['rankingFeatured', 'rankingPosition'],
      ]
      for (const [featuredKey, positionKey] of placementRules) {
        if (!data[featuredKey]) continue
        const conflict = leaderboard.find(item => item.id !== editingStreamer && item[featuredKey] && Number(item[positionKey]) === data[positionKey])
        if (conflict) {
          await updateDoc(doc(db, 'hagency_leaderboard', conflict.id), { [featuredKey]: false, [positionKey]: null })
          setLeaderboard(items => items.map(item => item.id === conflict.id ? { ...item, [featuredKey]: false, [positionKey]: null } : item))
        }
      }
      if (editingStreamer === 'new') {
        const ref = await addDoc(collection(db, 'hagency_leaderboard'), data)
        if (promotingSubmissionId) {
          await updateDoc(doc(db, 'hagency_submissions', promotingSubmissionId), {
            status: 'active', talentId: ref.id, convertedAt: serverTimestamp(),
          })
          setSubmissions(items => items.map(item => item.id === promotingSubmissionId ? { ...item, status: 'active', talentId: ref.id } : item))
        }
        setLeaderboard(l => [...l, { id: ref.id, ...data }].sort((a, b) => a.order - b.order))
      } else {
        await updateDoc(doc(db, 'hagency_leaderboard', editingStreamer), data)
        setLeaderboard(l => l.map(x => x.id === editingStreamer ? { ...x, ...data } : x).sort((a, b) => a.order - b.order))
      }
      setNotice({ ok: true, msg: '保存成功' })
      setEditingStreamer(null)
      setPromotingSubmissionId(null)
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
          slug: row.slug || '', introZh: row.introZh || '', introEn: row.introEn || '',
          platform: row.platform || '', handle: row.handle || '',
          photoUrl: row.photoUrl || '', homeImageUrl: row.homeImageUrl || '', honorImageUrl: row.honorImageUrl || '', rankingImageUrl: row.rankingImageUrl || '', tiktokUrl: row.tiktokUrl || '',
          bigoUrl: row.bigoUrl || '', instaUrl: row.instaUrl || '',
          visible: parseBoolean(row.visible, true),
          homeFeatured: parseBoolean(row.homeFeatured, false),
          homePosition: parseBoolean(row.homeFeatured, false) ? Math.min(3, Math.max(1, Number(row.homePosition) || 1)) : null,
          honorFeatured: parseBoolean(row.honorFeatured, false),
          honorPosition: parseBoolean(row.honorFeatured, false) ? Math.min(3, Math.max(1, Number(row.honorPosition) || 1)) : null,
          rankingFeatured: parseBoolean(row.rankingFeatured, false),
          rankingPosition: parseBoolean(row.rankingFeatured, false) ? Math.min(3, Math.max(1, Number(row.rankingPosition) || 1)) : null,
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
    { nameZh: '盼夏', nameEn: 'Panxia', slug: 'panxia', introZh: 'ℋ Agency 希望公会旗下百万主播。', introEn: 'Million Creator represented by ℋ Agency.', platform: 'BIGO LIVE', handle: 'panxia825', badgeZh: '百万主播 · 再攀高峰', badgeEn: 'Million Creator · Reaching New Heights', order: 1, photoUrl: 'https://agency.jeeprod.com/hagency/talents/panxia.jpg', homeImageUrl: 'https://agency.jeeprod.com/hagency/talents/home/panxia-portrait-v1.webp', honorImageUrl: 'https://agency.jeeprod.com/hagency/talents/panxia.jpg', rankingImageUrl: '', tiktokUrl: '', bigoUrl: '', instaUrl: '', visible: true, homeFeatured: true, homePosition: 1, honorFeatured: true, honorPosition: 1, rankingFeatured: false, rankingPosition: '' },
    { nameZh: '小暖', nameEn: 'Xiaonuan', slug: 'xiaonuan', introZh: 'ℋ Agency 希望公会旗下百万主播。', introEn: 'Million Creator represented by ℋ Agency.', platform: '抖音', handle: '07nuannuan15', badgeZh: '百万主播 · 高光时刻', badgeEn: 'Million Creator · Spotlight Moment', order: 2, photoUrl: 'https://agency.jeeprod.com/hagency/talents/xiaonuan.jpg', homeImageUrl: 'https://agency.jeeprod.com/hagency/talents/home/xiaonuan-portrait-v1.webp', honorImageUrl: 'https://agency.jeeprod.com/hagency/talents/xiaonuan.jpg', rankingImageUrl: '', tiktokUrl: '', bigoUrl: '', instaUrl: '', visible: true, homeFeatured: true, homePosition: 2, honorFeatured: true, honorPosition: 2, rankingFeatured: false, rankingPosition: '' },
    { nameZh: '贝贝', nameEn: 'Beibei', slug: 'beibei', introZh: 'ℋ Agency 希望公会旗下百万主播，也是本期主播高光榜亚军。', introEn: 'Million Creator and current talent highlight runner-up.', platform: '抖音', handle: 'bellbell__00', badgeZh: '百万主播 · 荣耀加冕', badgeEn: 'Million Creator · Crowned in Honor', order: 3, photoUrl: 'https://agency.jeeprod.com/hagency/talents/beibei-million.jpg', homeImageUrl: 'https://agency.jeeprod.com/hagency/talents/home/beibei-portrait-v1.webp', honorImageUrl: 'https://agency.jeeprod.com/hagency/talents/beibei-million.jpg', rankingImageUrl: 'https://agency.jeeprod.com/hagency/talents/bellbell-runner-up.jpg', tiktokUrl: '', bigoUrl: '', instaUrl: '', visible: true, homeFeatured: true, homePosition: 3, honorFeatured: true, honorPosition: 3, rankingFeatured: true, rankingPosition: 2 },
    { nameZh: '调皮的丝丝', nameEn: 'Isure', slug: 'isure', introZh: '本期主播高光榜冠军。', introEn: 'Current talent highlight champion.', platform: '抖音', handle: 'isure_0506', badgeZh: '冠军', badgeEn: 'Champion', order: 4, photoUrl: 'https://agency.jeeprod.com/hagency/talents/isure-champion.jpg', honorImageUrl: '', rankingImageUrl: 'https://agency.jeeprod.com/hagency/talents/isure-champion.jpg', tiktokUrl: '', bigoUrl: '', instaUrl: '', visible: true, homeFeatured: false, homePosition: '', honorFeatured: false, honorPosition: '', rankingFeatured: true, rankingPosition: 1 },
    { nameZh: '游采秉', nameEn: 'Dyorewszr2gt', slug: 'dyorewszr2gt', introZh: '本期主播高光榜季军。', introEn: 'Current talent highlight third place.', platform: '抖音', handle: 'dyorewszr2gt', badgeZh: '季军', badgeEn: 'Third Place', order: 5, photoUrl: 'https://agency.jeeprod.com/hagency/talents/dyorewszr2gt-third.jpg', honorImageUrl: '', rankingImageUrl: 'https://agency.jeeprod.com/hagency/talents/dyorewszr2gt-third.jpg', tiktokUrl: '', bigoUrl: '', instaUrl: '', visible: true, homeFeatured: false, homePosition: '', honorFeatured: false, honorPosition: '', rankingFeatured: true, rankingPosition: 3 },
  ]

  const downloadSample = (format) => {
    let content, mime, ext
    const headers = ['nameZh','nameEn','slug','introZh','introEn','platform','handle','income','hours','fansGrowth','badgeZh','badgeEn','order','photoUrl','homeImageUrl','honorImageUrl','rankingImageUrl','tiktokUrl','bigoUrl','instaUrl','visible','homeFeatured','homePosition','honorFeatured','honorPosition','rankingFeatured','rankingPosition']
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
  const promotableSubs = submissions.filter(s => ['approved', 'contracted', 'onboarding'].includes(s.status) && !s.talentId)
  const pipelineStats = {
    pending: submissions.filter(s => !s.status || s.status === 'pending').length,
    inProgress: submissions.filter(s => ['contacted', 'interview', 'trial', 'offer'].includes(s.status)).length,
    signed: submissions.filter(s => ['contracted', 'onboarding', 'active', 'approved'].includes(s.status)).length,
    active: submissions.filter(s => s.status === 'active').length,
  }

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
          <div className="flex items-center gap-2">
            {user?.email && <span className="hidden max-w-44 truncate text-[11px] text-gray-400 md:block">{user.email}</span>}
            <a href={publicHome} className="rounded-full border border-pink-200 px-3 py-1.5 font-mono text-xs text-pink-500 transition-colors hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950/30">公开页面 →</a>
            <button onClick={handleLogout} className="rounded-full border border-gray-200 px-3 py-1.5 font-mono text-xs text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:hover:text-gray-300">退出</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl gap-1 px-6 pb-3">
          {[['submissions', `招募流程 (${pipelineStats.pending} 新)`], ['leaderboard', '主播资料'], ['posts', '内容动态']].map(([k, label]) => (
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
            <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['新申请', pipelineStats.pending, '需要尽快查看'],
                ['跟进中', pipelineStats.inProgress, '联系至条件确认'],
                ['已签约', pipelineStats.signed, '含培训和活跃主播'],
                ['已转主播', pipelineStats.active, '已建立公开资料'],
              ].map(([label, value, note]) => (
                <div key={label} className="border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">{label}</p>
                  <p className="mt-2 font-display text-3xl text-[#a94f6a]">{value}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{note}</p>
                </div>
              ))}
            </div>
            <div className="ha-no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-2">
              {['all', ...PIPELINE].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${statusFilter === s ? 'border-pink-500 bg-pink-500 text-white' : 'border-gray-200 text-gray-500 hover:border-pink-300 dark:border-gray-700'}`}>
                  {s === 'all' ? '全部' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredSubs.length === 0 && <EmptyCard text="暂无申请记录" />}
              {filteredSubs.map(s => (
                <div id={`application-${s.id}`} key={s.id} className={`rounded-2xl border bg-white p-5 transition-shadow dark:bg-gray-900 ${targetApplicationId === s.id ? 'border-pink-300 shadow-[0_0_0_4px_rgba(236,72,153,0.10)] dark:border-pink-700' : 'border-gray-100 dark:border-gray-800'}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      {s.photoUrl ? (
                        <a href={s.photoUrl} target="_blank" rel="noopener noreferrer" className="group relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-pink-50">
                          <img src={s.photoUrl} alt={`${s.name} 的申请照片`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[9px] text-white opacity-0 transition group-hover:opacity-100">查看原图</span>
                        </a>
                      ) : (
                        <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-800">旧申请<br />无照片</div>
                      )}
                      <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</span>
                        <span className={`font-mono text-xs ${STATUS_COLOR[s.status] || 'text-gray-400'}`}>{STATUS_LABEL[s.status] || s.status}</span>
                      </div>
                      {s.applicationNumber && <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#a94f6a]">{s.applicationNumber}</p>}
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
                    </div>
                    <div className="flex shrink-0 flex-row items-end justify-between gap-2 sm:flex-col sm:items-end">
                      <label className="text-left sm:text-right">
                        <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-gray-400">当前阶段</span>
                        <select value={s.status || 'pending'} onChange={e => updateStatus(s.id, e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-pink-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          {PIPELINE.map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                        </select>
                      </label>
                      {['approved', 'contracted', 'onboarding'].includes(s.status) && !s.talentId && (
                        <button onClick={() => promoteSubmission(s)} className="rounded-xl bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-400">建立主播档案 →</button>
                      )}
                      {s.talentId && <span className="text-[10px] text-emerald-600">✓ 已关联主播档案</span>}
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
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h3 className="font-display text-2xl text-gray-900 dark:text-gray-100">主播资料与首页展示</h3><p className="mt-1 text-xs text-gray-400">管理主播资料、公开状态，以及首页三个推荐位置。</p></div>
              <div className="flex flex-wrap items-center gap-2">
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
                  onClick={() => { setPromotingSubmissionId(null); setEditingStreamer('new'); setStreamerForm({ ...emptyStreamer, order: leaderboard.length + 1 }); setAvatarFile(null); setAvatarPreview(null); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}
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
                  {[['nameZh', '主播名称（中文）'], ['nameEn', 'Streamer Name (EN)'], ['slug', '网址名称（如 panxia）'], ['platform', '主要平台'], ['handle', '平台 ID'], ['badgeZh', '称号（中文）'], ['badgeEn', 'Badge (EN)']].map(([k, label]) => (
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">个人简介（中文）</span><textarea rows={3} value={streamerForm.introZh} onChange={e => setStreamerForm(f => ({ ...f, introZh: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" /></label>
                  <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Profile Introduction (EN)</span><textarea rows={3} value={streamerForm.introEn} onChange={e => setStreamerForm(f => ({ ...f, introEn: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" /></label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">首页人物图 URL（选填）</span><input value={streamerForm.homeImageUrl} onChange={e => setStreamerForm(f => ({ ...f, homeImageUrl: e.target.value }))} placeholder="留空时使用头像照片" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" /></label>
                  <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">荣誉海报 URL（选填）</span><input value={streamerForm.honorImageUrl} onChange={e => setStreamerForm(f => ({ ...f, honorImageUrl: e.target.value }))} placeholder="留空时使用头像照片" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" /></label>
                  <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">榜单海报 URL（选填）</span><input value={streamerForm.rankingImageUrl} onChange={e => setStreamerForm(f => ({ ...f, rankingImageUrl: e.target.value }))} placeholder="留空时使用头像照片" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" /></label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><span><span className="block text-sm font-medium text-gray-700 dark:text-gray-200">公开主播资料</span><span className="mt-0.5 block text-[11px] text-gray-400">关闭后不会显示在公开网站</span></span><input type="checkbox" checked={streamerForm.visible !== false} onChange={e => setStreamerForm(f => ({ ...f, visible: e.target.checked }))} className="h-4 w-4 accent-pink-500" /></label>
                  {[
                    ['homeFeatured', 'homePosition', '首页精选主播', '首页主视觉与精选卡片'],
                    ['honorFeatured', 'honorPosition', '百万主播 / 荣誉', '荣誉加冕展示区'],
                    ['rankingFeatured', 'rankingPosition', '本期榜单 / 高光', '冠军、亚军、季军'],
                  ].map(([featuredKey, positionKey, title, help]) => (
                    <div key={featuredKey} className="rounded-xl border border-pink-200 bg-white px-4 py-3 dark:border-pink-900/40 dark:bg-gray-800">
                      <label className="flex items-center justify-between gap-3"><span><span className="block text-sm font-medium text-gray-700 dark:text-gray-200">{title}</span><span className="mt-0.5 block text-[11px] text-gray-400">{help}</span></span><input type="checkbox" checked={Boolean(streamerForm[featuredKey])} onChange={e => setStreamerForm(f => ({ ...f, [featuredKey]: e.target.checked, [positionKey]: e.target.checked ? (f[positionKey] || 1) : '' }))} className="h-4 w-4 accent-pink-500" /></label>
                      {streamerForm[featuredKey] && <label className="mt-3 block"><span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-pink-500">展示位置</span><select value={streamerForm[positionKey] || 1} onChange={e => setStreamerForm(f => ({ ...f, [positionKey]: Number(e.target.value) }))} className="w-full rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm text-gray-700 outline-none"><option value={1}>位置 1 · 左侧 / 冠军</option><option value={2}>位置 2 · 中间 / 亚军</option><option value={3}>位置 3 · 右侧 / 季军</option></select></label>}
                    </div>
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
                  <button onClick={() => { setEditingStreamer(null); setPromotingSubmissionId(null); setStreamerForm(emptyStreamer); setAvatarFile(null); setAvatarPreview(null) }} className="rounded-full border border-gray-200 px-5 py-2 text-sm hover:border-gray-400 dark:border-gray-700">取消</button>
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
                    <div className="mt-1 flex flex-wrap gap-2">
                      {s.visible === false && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[9px] text-gray-500">未公开</span>}
                      {s.homeFeatured && <span className="rounded-full bg-pink-100 px-2 py-0.5 font-mono text-[9px] text-pink-600">精选 #{s.homePosition || '?'}</span>}
                      {s.honorFeatured && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[9px] text-amber-600">荣誉 #{s.honorPosition || '?'}</span>}
                      {s.rankingFeatured && <span className="rounded-full bg-violet-50 px-2 py-0.5 font-mono text-[9px] text-violet-600">榜单 #{s.rankingPosition || '?'}</span>}
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
            {promotableSubs.length > 0 && (
              <div className="mt-10">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">已签约申请 · 建立公开主播资料</span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  {promotableSubs.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm dark:bg-emerald-950/40">✓</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.specialization} · {s.experience}</p>
                      </div>
                      <button onClick={() => promoteSubmission(s)} className="rounded-xl bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600">
                        建立主播档案 →
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

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login, loginWithGoogle, logout, resetPassword } from '../lib/auth'

const fieldClass = 'w-full rounded-2xl border border-[#decbd0] bg-white/75 px-4 py-3.5 text-sm text-[#24171c] outline-none transition placeholder:text-[#9c8a90] focus:border-[#b65f79] focus:bg-white focus:ring-4 focus:ring-[#dba7b7]/15'

function friendlyError(error) {
  const code = error?.code || ''
  if (code === 'auth/unauthorized-domain') return '当前域名尚未加入 Firebase 授权域名，请联系网站管理员。'
  if (code === 'auth/popup-closed-by-user') return '登录窗口已关闭，请重新尝试。'
  if (code === 'auth/popup-blocked') return '浏览器阻止了登录窗口，请允许弹出窗口后重试。'
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return '邮箱或密码不正确。'
  if (code === 'auth/too-many-requests') return '尝试次数过多，请稍后再试或重设密码。'
  if (code === 'auth/network-request-failed') return '网络连接失败，请检查网络后重试。'
  if (code === 'auth/invalid-email') return '请输入有效的邮箱地址。'
  return '登录失败，请稍后再试。'
}

export default function HAgencyLogin() {
  const { user, admin, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  if (authLoading) return <LoadingScreen />
  if (admin) return <Navigate to="/admin" replace />

  const handleEmailLogin = async event => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await login(email.trim(), password)
    } catch (error) {
      setMessage({ ok: false, text: friendlyError(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await loginWithGoogle()
    } catch (error) {
      setMessage({ ok: false, text: friendlyError(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    const address = email.trim()
    if (!address) {
      setMessage({ ok: false, text: '请先填写管理员邮箱，再点击重设密码。' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      await resetPassword(address)
      setMessage({ ok: true, text: '密码重设邮件已发送，请检查收件箱和垃圾邮件。' })
    } catch (error) {
      setMessage({ ok: false, text: friendlyError(error) })
    } finally {
      setLoading(false)
    }
  }

  const switchAccount = async () => {
    await logout()
    setMessage(null)
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#120c10] px-5 py-12 text-[#24171c] sm:items-center sm:py-16">
      <Helmet>
        <title>管理员登录 — ℋ Agency 希望公会</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://agency.jeeprod.com/admin/login" />
      </Helmet>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 10% 5%, rgba(230,188,199,.24), transparent 34%), radial-gradient(circle at 94% 90%, rgba(169,79,106,.2), transparent 34%)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

      <main className="relative mx-auto grid w-full max-w-5xl overflow-hidden border border-white/10 bg-[#f8f3f2] shadow-[0_40px_120px_rgba(0,0,0,.48)] lg:grid-cols-[.86fr_1.14fr]">
        <section className="relative hidden min-h-[660px] overflow-hidden bg-[#24171c] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full border border-[#e6bcc7]/20" />
          <div className="pointer-events-none absolute -bottom-36 -right-32 h-[430px] w-[430px] rounded-full bg-[#a94f6a]/15 blur-3xl" />
          <a href="/" className="relative flex items-center gap-4">
            <img src="/hagency/logo.jpg" alt="ℋ Agency 希望公会" className="h-16 w-16 rounded-full object-cover" />
            <div><p className="font-display text-3xl italic text-[#efced6]">ℋ Agency</p><p className="mt-1 text-[10px] tracking-[.3em] text-white/40">希望公会</p></div>
          </a>
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#d99eb0]">SECURE ADMIN ACCESS</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.08] text-[#f5dce2]">专业运营，<br />从清楚的后台开始。</h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/50">管理主播资料、招募流程与公会动态。仅限已授权的 ℋ Agency 管理员使用。</p>
          </div>
          <div className="relative border-t border-white/10 pt-5 font-mono text-[9px] uppercase tracking-[.2em] text-white/30">Protected by Firebase Authentication</div>
        </section>

        <section className="flex min-h-[620px] flex-col justify-center p-7 sm:p-12 lg:p-16">
          <a href="/" className="mb-12 flex items-center gap-3 lg:hidden"><img src="/hagency/logo.jpg" alt="" className="h-12 w-12 rounded-full object-cover" /><div><p className="font-display text-2xl italic text-[#a94f6a]">ℋ Agency</p><p className="text-[9px] tracking-[.25em] text-gray-400">希望公会</p></div></a>

          {user ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.28em] text-[#b66b81]">ACCESS DENIED</p>
              <h1 className="mt-4 font-display text-4xl leading-tight">这个账号没有后台权限</h1>
              <p className="mt-5 text-sm leading-7 text-gray-500">你目前登录的是 <strong className="font-medium text-[#24171c]">{user.email || '未知账号'}</strong>，但该账号不在管理员名单中。</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={switchAccount} className="rounded-full bg-[#24171c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#a94f6a]">换一个账号</button><a href="/" className="rounded-full border border-[#decbd0] px-6 py-3 text-center text-sm font-semibold text-[#754c58]">返回公开网站</a></div>
            </div>
          ) : (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.28em] text-[#b66b81]">ADMIN PORTAL</p>
              <h1 className="mt-4 font-display text-5xl leading-tight">管理员登录</h1>
              <p className="mt-4 text-sm leading-7 text-gray-500">使用已获授权的 Google 账号或管理员邮箱登录。</p>

              {message && <div role="status" className={`mt-6 border px-4 py-3 text-sm leading-6 ${message.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#e3c0ca] bg-[#fbecf0] text-[#953f59]'}`}>{message.text}</div>}

              <button type="button" onClick={handleGoogleLogin} disabled={loading} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#decbd0] bg-white px-4 py-3.5 text-sm font-semibold transition hover:border-[#b65f79] hover:bg-[#fffafb] disabled:opacity-60">
                <GoogleIcon /> 使用 Google 登录
              </button>

              <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-[#e3d4d8]" /><span className="font-mono text-[9px] uppercase tracking-[.2em] text-gray-400">或使用邮箱</span><span className="h-px flex-1 bg-[#e3d4d8]" /></div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.2em] text-[#9c5368]">管理员邮箱</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required className={fieldClass} placeholder="admin@example.com" /></label>
                <label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.2em] text-[#9c5368]">密码</span><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required className={`${fieldClass} pr-16`} placeholder="请输入密码" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-4 text-xs font-medium text-[#9c5368]">{showPassword ? '隐藏' : '显示'}</button></div></label>
                <div className="flex justify-end"><button type="button" onClick={handleReset} disabled={loading} className="text-xs text-[#9c5368] transition hover:text-[#24171c]">忘记密码？</button></div>
                <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[#24171c] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#a94f6a] disabled:opacity-60">{loading ? '正在验证…' : '登录后台'}</button>
              </form>

              <p className="mt-7 text-center text-[11px] leading-5 text-gray-400">后台不开放注册。需要新增管理员时，请由现有管理员授权。</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center bg-[#120c10] text-[#e8bdc8]"><span className="font-mono text-[10px] uppercase tracking-[.35em]">正在验证管理员身份…</span></div>
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
}

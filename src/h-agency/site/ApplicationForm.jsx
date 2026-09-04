import { useEffect, useRef, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import emailjs from '@emailjs/browser'
import { functions } from '../../lib/firebase'
import { useHAgencySite } from './SiteContext'

const initialForm = { name: '', age: '', phone: '', wechat: '', email: '', experience: '', specialization: '', introduction: '', social: '', company: '' }
const fieldClass = 'w-full border-0 border-b border-[#ddc9cf] bg-transparent px-0 py-3 text-sm text-[#24171c] outline-none transition placeholder:text-gray-300 focus:border-[#b65f79]'
const CLOUDINARY_CLOUD = 'db2ixn8zh'
const CLOUDINARY_PRESET = 'H-Agency'
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ACCEPTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const emailConfig = {
  key: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  service: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  template: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
}

async function uploadApplicationPhoto(file) {
  const data = new FormData()
  data.append('file', file)
  data.append('upload_preset', CLOUDINARY_PRESET)
  data.append('folder', 'hagency/applications')

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: data,
  })
  if (!response.ok) throw new Error('photo-upload-failed')
  const uploaded = await response.json()
  if (!uploaded.secure_url || !uploaded.public_id) throw new Error('photo-upload-failed')
  return { photoUrl: uploaded.secure_url, photoPublicId: uploaded.public_id }
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#a86a7c]">{label}</span>{children}</label>
}

export default function ApplicationForm() {
  const { lang } = useHAgencySite()
  const [form, setForm] = useState(initialForm)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const photoInputRef = useRef(null)
  const zh = lang === 'zh'
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const selectPhoto = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
      setResult({ ok: false, message: zh ? '照片仅支持 JPG、PNG 或 WebP 格式。' : 'Please upload a JPG, PNG or WebP photo.' })
      event.target.value = ''
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setResult({ ok: false, message: zh ? '照片不能超过 5MB。' : 'The photo must be 5MB or smaller.' })
      event.target.value = ''
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setResult(null)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const submit = async event => {
    event.preventDefault()
    if (!form.name || !form.age || !form.phone || !form.experience || !form.specialization || !form.introduction || !photoFile) {
      setResult({ ok: false, message: zh ? '请填写所有必填项目。' : 'Please complete all required fields.' })
      return
    }
    setSubmitting(true)
    setResult(null)
    try {
      const photo = await uploadApplicationPhoto(photoFile)
      const call = httpsCallable(functions, 'submitHAgencyApplication')
      const response = await call({ ...form, ...photo, locale: lang })
      const reference = response.data?.applicationNumber || ''
      const applicationId = response.data?.applicationId || ''
      const adminUrl = `https://agency.jeeprod.com/admin${applicationId ? `?application=${encodeURIComponent(applicationId)}` : ''}`
      if (emailConfig.key && emailConfig.service && emailConfig.template) {
        emailjs.init(emailConfig.key)
        emailjs.send(emailConfig.service, emailConfig.template, {
          from_name: form.name,
          to_email: 'jeejunhong@gmail.com',
          to_name: 'ℋ Agency 招募团队',
          message: `新主播申请：${form.name}${reference ? `（${reference}）` : ''}`,
          applicant_name: form.name,
          applicant_age: form.age,
          applicant_phone: form.phone,
          applicant_wechat: form.wechat || '未填写',
          applicant_email: form.email || '未填写',
          applicant_experience: form.experience,
          applicant_specialization: form.specialization,
          applicant_introduction: form.introduction,
          applicant_social: form.social || '未填写',
          applicant_photo_url: photo.photoUrl,
          application_number: reference,
          application_id: applicationId,
          admin_url: adminUrl,
          submitted_at: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' }),
        }).catch(() => {})
      }
      setResult({ ok: true, message: `${zh ? '申请已提交，我们将在 24 小时内联系你。' : 'Application submitted. Our team will contact you within 24 hours.'}${reference ? ` ${zh ? '申请编号' : 'Reference'}：${reference}` : ''}` })
      setForm(initialForm)
      removePhoto()
    } catch (error) {
      const photoFailed = error?.message === 'photo-upload-failed'
      setResult({
        ok: false,
        message: photoFailed
          ? (zh ? '照片上传失败，请检查网络或更换照片后再试。' : 'Photo upload failed. Check your connection or try another photo.')
          : (zh ? '提交失败，请稍后再试或通过 Instagram 联系我们。' : 'Submission failed. Please try again or contact us on Instagram.'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="border border-[#e4d3d7] bg-white p-6 shadow-[0_30px_80px_rgba(65,30,42,0.08)] sm:p-10">
      {result && <div className={`mb-7 border p-4 text-sm leading-6 ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#e7c8d2] bg-[#fbf0f3] text-[#9b405b]'}`}>{result.message}</div>}
      <input tabIndex={-1} autoComplete="off" value={form.company} onChange={event => set('company', event.target.value)} className="absolute left-[-9999px]" aria-hidden="true" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={`${zh ? '姓名' : 'Name'} *`}><input value={form.name} onChange={event => set('name', event.target.value)} placeholder={zh ? '请输入你的姓名' : 'Enter your name'} className={fieldClass} /></Field>
        <Field label={`${zh ? '年龄' : 'Age'} *`}><input type="number" value={form.age} onChange={event => set('age', event.target.value)} placeholder={zh ? '请输入你的年龄' : 'Enter your age'} className={fieldClass} /></Field>
        <Field label={`${zh ? '联系电话' : 'Phone'} *`}><input type="tel" value={form.phone} onChange={event => set('phone', event.target.value)} placeholder={zh ? '请输入联系电话' : 'Enter your phone'} className={fieldClass} /></Field>
        <Field label={zh ? '微信号' : 'WeChat'}><input value={form.wechat} onChange={event => set('wechat', event.target.value)} placeholder={zh ? '选填' : 'Optional'} className={fieldClass} /></Field>
      </div>
      <div className="mt-5"><Field label={zh ? '邮箱' : 'Email'}><input type="email" value={form.email} onChange={event => set('email', event.target.value)} placeholder={zh ? '选填' : 'Optional'} className={fieldClass} /></Field></div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label={`${zh ? '直播经验' : 'Experience'} *`}><select value={form.experience} onChange={event => set('experience', event.target.value)} className={fieldClass}><option value="">{zh ? '请选择' : 'Select'}</option><option value="无经验">{zh ? '无经验' : 'No experience'}</option><option value="1-3个月">{zh ? '1-3个月' : '1-3 months'}</option><option value="3-12个月">{zh ? '3-12个月' : '3-12 months'}</option><option value="1年以上">{zh ? '1年以上' : '1+ years'}</option></select></Field>
        <Field label={`${zh ? '擅长领域' : 'Specialization'} *`}><select value={form.specialization} onChange={event => set('specialization', event.target.value)} className={fieldClass}><option value="">{zh ? '请选择' : 'Select'}</option><option value="唱歌">{zh ? '唱歌' : 'Singing'}</option><option value="跳舞">{zh ? '跳舞' : 'Dancing'}</option><option value="聊天互动">{zh ? '聊天互动' : 'Chatting'}</option><option value="才艺表演">{zh ? '才艺表演' : 'Talent show'}</option><option value="其他">{zh ? '其他' : 'Other'}</option></select></Field>
      </div>
      <div className="mt-5"><Field label={`${zh ? '个人简介' : 'About yourself'} *`}><textarea rows="5" value={form.introduction} onChange={event => set('introduction', event.target.value)} placeholder={zh ? '介绍你的特长、优势和对直播的想法…' : 'Tell us about your strengths and goals…'} className={fieldClass} /></Field></div>
      <div className="mt-5"><Field label={zh ? '社交媒体账号' : 'Social media'}><input value={form.social} onChange={event => set('social', event.target.value)} placeholder={zh ? '抖音、TikTok、BIGO 或 Instagram（选填）' : 'Douyin, TikTok, BIGO or Instagram (optional)'} className={fieldClass} /></Field></div>
      <div className="mt-7">
        <Field label={`${zh ? '本人清晰照片' : 'Clear portrait photo'} *`}>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only" />
          {photoPreview ? (
            <div className="mt-3 flex items-center gap-4 border border-[#ead9de] bg-[#fffafb] p-3">
              <img src={photoPreview} alt={zh ? '申请照片预览' : 'Application photo preview'} className="h-24 w-20 shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#24171c]">{photoFile?.name}</p>
                <p className="mt-1 text-xs leading-5 text-gray-400">{zh ? '申请通过后，这张照片会自动带入主播档案；公开前仍可在后台更换。' : 'If approved, this photo will be carried into the talent profile and can still be replaced before publishing.'}</p>
                <button type="button" onClick={removePhoto} className="mt-2 text-xs font-medium text-[#a94f6a]">{zh ? '移除并重选' : 'Remove and choose another'}</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => photoInputRef.current?.click()} className="mt-3 flex w-full items-center gap-4 border border-dashed border-[#d9b8c2] bg-[#fffafb] px-5 py-6 text-left transition hover:border-[#a94f6a] hover:bg-[#fdf4f6]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3e1e6] text-xl" aria-hidden="true">＋</span>
              <span><strong className="block text-sm font-medium text-[#6e3f4c]">{zh ? '上传正面或半身照' : 'Upload a portrait'}</strong><small className="mt-1 block text-[11px] leading-5 text-gray-400">{zh ? 'JPG、PNG、WebP，最大 5MB；请勿上传带大量文字的海报。' : 'JPG, PNG or WebP, up to 5MB. Please avoid poster artwork with large text.'}</small></span>
            </button>
          )}
        </Field>
      </div>
      <button type="submit" disabled={submitting} className="mt-8 w-full rounded-full bg-[#24171c] py-4 text-sm font-semibold text-white transition hover:bg-[#a94f6a] disabled:opacity-60">{submitting ? (zh ? '提交中…' : 'Submitting…') : (zh ? '提交申请' : 'Submit application')}</button>
      <p className="pt-4 text-center text-[11px] leading-5 text-gray-400">{zh ? '提交即表示你同意我们为招募联系你。申请资料与照片仅供内部审核，未经确认不会公开。' : 'By submitting, you agree to be contacted about recruitment. Your details and photo are for internal review and will not be published without confirmation.'}</p>
    </form>
  )
}

import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { useLang } from '../contexts/LangContext'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const inputCls = 'w-full rounded-2xl border border-ink/12 bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink/28 focus:border-ink/38 dark:border-paper/12 dark:bg-ink-soft dark:placeholder:text-paper/28 dark:focus:border-paper/38'

export default function ContactForm() {
  const { t } = useLang()
  const formRef = useRef(null)
  const [fields, setFields] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'success' | 'error'

  const set = (key) => (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fields.name.trim() || !fields.email.trim() || !fields.message.trim()) return

    setStatus('sending')
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        { from_name: fields.name, from_email: fields.email, message: fields.message },
        PUBLIC_KEY,
      )
      setStatus('success')
      setFields({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-start justify-center gap-4 rounded-[2rem] border border-emerald-300/40 bg-emerald-50/60 px-8 py-10 dark:border-emerald-500/20 dark:bg-emerald-950/30">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
          ✓ Sent
        </p>
        <p className="text-sm leading-7 text-ink/70 dark:text-paper/70">{t('contactSuccess')}</p>
        <button
          onClick={() => setStatus('idle')}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/38 underline-offset-3 hover:text-ink dark:text-paper/38 dark:hover:text-paper"
        >
          {t('contactSend')} →
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={fields.name}
        onChange={set('name')}
        placeholder={t('contactNamePh')}
        required
        className={inputCls}
        aria-label={t('contactName')}
      />
      <input
        type="email"
        value={fields.email}
        onChange={set('email')}
        placeholder={t('contactEmailPh')}
        required
        className={inputCls}
        aria-label={t('contactEmail')}
      />
      <textarea
        rows={5}
        value={fields.message}
        onChange={set('message')}
        placeholder={t('contactMessagePh')}
        required
        className={inputCls}
        aria-label={t('contactMessage')}
      />

      {status === 'error' && (
        <p className="rounded-xl bg-accent/8 px-4 py-2.5 text-xs leading-5 text-accent">
          {t('contactError')}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] text-paper transition-colors hover:bg-accent disabled:opacity-50 dark:bg-paper dark:text-ink dark:hover:bg-accent dark:hover:text-paper"
      >
        {status === 'sending' ? t('contactSending') : t('contactSend')}
      </button>
    </form>
  )
}

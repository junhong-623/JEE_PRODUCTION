import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { ENTRIES_UPDATED_EVENT, deleteEntry, getAllEntries, saveEntry, sanitizeSlug } from '../lib/projects'

const emptyForm = {
  type: 'portfolio',
  slug: '',
  title: '',
  titleZh: '',
  description: '',
  descriptionZh: '',
  url: '',
  iconUrl: '',
  order: 0,
  visible: true,
  internalPath: '',
}

export default function AdminPanel({ open, onClose }) {
  const { t } = useLang()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const isInternalEntry = Boolean(form.internalPath)

  useEffect(() => {
    if (!notice) return
    const timeoutId = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(timeoutId)
  }, [notice])

  useEffect(() => {
    if (open) {
      loadEntries()
    }
  }, [open])

  const loadEntries = async () => {
    try {
      setEntries(await getAllEntries())
    } catch (err) {
      setError(err.message || 'Failed to load entries')
    }
  }

  const startNew = (type) => {
    setEditingId('new')
    setForm({ ...emptyForm, type, order: entries.length + 1 })
    setError('')
  }

  const startEdit = (entry) => {
    setEditingId(entry.id)
    setForm({
      type: entry.type,
      slug: entry.slug,
      title: entry.title || '',
      titleZh: entry.titleZh || '',
      description: entry.description || '',
      descriptionZh: entry.descriptionZh || '',
      url: entry.url || '',
      iconUrl: entry.iconUrl || '',
      order: entry.order ?? 0,
      visible: Boolean(entry.visible),
      internalPath: entry.internalPath || '',
    })
    setError('')
  }

  const cancel = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSave = async () => {
    const slug = sanitizeSlug(form.slug)

    if (!slug) {
      setError(t('slugRequired'))
      return
    }

    if (!form.title.trim()) {
      setError(t('titleRequired'))
      return
    }

    if (!isInternalEntry && !form.url.trim()) {
      setError(t('urlRequired'))
      return
    }

    setSaving(true)
    setError('')

    try {
      await saveEntry({
        previousId: editingId === 'new' ? null : editingId,
        entry: { ...form, slug },
      })
      await loadEntries()
      window.dispatchEvent(new Event(ENTRIES_UPDATED_EVENT))
      setNotice({ type: 'success', message: t('saveSuccess') })
      cancel()
    } catch (err) {
      setError(err.message || t('saveFailed'))
      setNotice({ type: 'error', message: err.message || t('saveFailed') })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirmDelete'))) return
    try {
      await deleteEntry(id)
      await loadEntries()
      window.dispatchEvent(new Event(ENTRIES_UPDATED_EVENT))
      setNotice({ type: 'success', message: t('deleteSuccess') })
    } catch (err) {
      setNotice({ type: 'error', message: err.message || t('deleteFailed') })
    }
  }

  if (!open) return null

  const portfolioEntries = entries.filter((entry) => entry.type === 'portfolio')
  const bookmarkEntries = entries.filter((entry) => entry.type === 'bookmark')

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-ink/10 bg-paper/95 shadow-[0_24px_80px_rgba(13,13,13,0.18)] backdrop-blur dark:border-paper/10 dark:bg-ink/95">
        {notice && (
          <div className="pointer-events-none absolute right-6 top-6 z-20">
            <div className={`min-w-64 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
              notice.type === 'success'
                ? 'border-emerald-300/45 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/70 dark:text-emerald-100'
                : 'border-accent/30 bg-orange-50 text-orange-900 dark:border-accent/25 dark:bg-orange-950/60 dark:text-orange-100'
            }`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-70">
                {notice.type === 'success' ? t('success') : t('error')}
              </p>
              <p className="mt-1 text-sm">{notice.message}</p>
            </div>
          </div>
        )}

        <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5 dark:border-paper/10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/35 dark:text-paper/35">
              {t('admin')}
            </p>
            <h2 className="mt-1 font-display text-3xl">{t('adminTitle')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onClose(); navigate('/matetrip-admin') }}
              className="rounded-full border border-sky-400/30 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-sky-500 transition-colors hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20"
            >
              MateTrip Admin
            </button>
            <button
              onClick={() => { onClose(); navigate('/mall/admin') }}
              className="rounded-full border border-emerald-400/30 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-emerald-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              Mall Admin
            </button>
            <button
              onClick={() => { onClose(); navigate('/h-agency/admin') }}
              className="rounded-full border border-pink-400/30 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-pink-500 transition-colors hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
            >
              ℋ Agency Admin
            </button>
            <button onClick={onClose} className="text-sm text-ink/45 transition-colors hover:text-ink dark:text-paper/45 dark:hover:text-paper">
              {t('close')}
            </button>
          </div>
        </header>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-y-auto border-b border-ink/10 px-6 py-6 dark:border-paper/10 lg:border-b-0 lg:border-r">
            <SectionList title={t('portfolio')} entries={portfolioEntries} onAdd={() => startNew('portfolio')} onEdit={startEdit} onDelete={handleDelete} />
            <div className="mt-10">
              <SectionList title={t('bookmarks')} entries={bookmarkEntries} onAdd={() => startNew('bookmark')} onEdit={startEdit} onDelete={handleDelete} />
            </div>
          </div>

          <div className="overflow-y-auto px-6 py-6">
            {editingId ? (
              <div className="space-y-5">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/35 dark:text-paper/35">
                    {editingId === 'new' ? t('addEntry') : t('editEntry')}
                  </p>
                  <h3 className="mt-2 font-display text-3xl">{form.title || t('untitled')}</h3>
                </div>

                <Field label={t('entryType')}>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    className={inputClassName}
                    disabled={isInternalEntry}
                  >
                    <option value="portfolio">{t('portfolio')}</option>
                    <option value="bookmark">{t('bookmarks')}</option>
                  </select>
                </Field>

                <Field label={t('slug')}>
                  <input
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: sanitizeSlug(event.target.value) }))}
                    className={inputClassName}
                    placeholder="my-next-idea"
                    disabled={isInternalEntry}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('titleEn')}>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label={t('titleZh')}>
                    <input
                      value={form.titleZh}
                      onChange={(event) => setForm((current) => ({ ...current, titleZh: event.target.value }))}
                      className={inputClassName}
                    />
                  </Field>
                </div>

                <Field label={t('descriptionEn')}>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className={inputClassName}
                  />
                </Field>

                <Field label={t('descriptionZh')}>
                  <textarea
                    rows={3}
                    value={form.descriptionZh}
                    onChange={(event) => setForm((current) => ({ ...current, descriptionZh: event.target.value }))}
                    className={inputClassName}
                  />
                </Field>

                {isInternalEntry ? (
                  <Field label={t('route')}>
                    <input
                      value={form.internalPath}
                      className={`${inputClassName} opacity-70`}
                      disabled
                    />
                  </Field>
                ) : (
                  <Field label={t('targetUrl')}>
                    <input
                      type="url"
                      value={form.url}
                      onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                      className={inputClassName}
                      placeholder="https://..."
                    />
                  </Field>
                )}

                <Field label={t('iconUrl')}>
                  <div className="space-y-3">
                    {form.iconUrl && (
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.4rem] border border-ink/10 bg-paper/70 dark:border-paper/10 dark:bg-ink-soft">
                        <img src={form.iconUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <input
                      value={form.iconUrl}
                      onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))}
                      className={inputClassName}
                      placeholder="https://..."
                    />
                  </div>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('order')}>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
                      className={inputClassName}
                    />
                  </Field>

                  <Field label={t('visibility')}>
                    <label className="flex h-[50px] items-center gap-3 rounded-2xl border border-ink/12 px-4 dark:border-paper/12">
                      <input
                        type="checkbox"
                        checked={form.visible}
                        onChange={(event) => setForm((current) => ({ ...current, visible: event.target.checked }))}
                        className="h-4 w-4 accent-accent"
                      />
                      <span className="text-sm">{form.visible ? t('visible') : t('hidden')}</span>
                    </label>
                  </Field>
                </div>

                {error && <p className="text-sm text-accent">{error}</p>}
                {isInternalEntry && (
                  <p className="text-sm text-ink/50 dark:text-paper/50">
                    {t('systemEntryHint')}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.25em] text-paper transition-colors hover:bg-accent disabled:opacity-50 dark:bg-paper dark:text-ink dark:hover:bg-accent dark:hover:text-paper"
                  >
                    {saving ? t('loading') : t('save')}
                  </button>
                  <button
                    onClick={cancel}
                    className="rounded-full border border-ink/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-ink dark:border-paper/12 dark:hover:border-paper"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-ink/12 px-8 text-center dark:border-paper/12">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/35 dark:text-paper/35">
                    {t('admin')}
                  </p>
                  <h3 className="mt-3 font-display text-3xl">{t('selectEntry')}</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/55 dark:text-paper/55">
                    {t('adminHint')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function SectionList({ title, entries, onAdd, onEdit, onDelete }) {
  const { t } = useLang()

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink/35 dark:text-paper/35">
            {title}
          </p>
          <h3 className="mt-1 font-display text-2xl">{title}</h3>
        </div>
        <button
          onClick={onAdd}
          className="rounded-full border border-ink/12 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-ink dark:border-paper/12 dark:hover:border-paper"
        >
          {t('add')}
        </button>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-[1.6rem] border border-ink/10 bg-paper/65 p-4 dark:border-paper/10 dark:bg-ink/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl">{entry.title}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/35 dark:text-paper/35">
                  /{entry.slug}
                </p>
              </div>
              <span className="rounded-full border border-ink/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35 dark:border-paper/10 dark:text-paper/35">
                {entry.internalPath ? t('builtIn') : (entry.visible ? t('visible') : t('hidden'))}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-ink/55 dark:text-paper/55">
              {entry.description || entry.url}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onEdit(entry)}
                className="rounded-full border border-ink/12 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-ink dark:border-paper/12 dark:hover:border-paper"
              >
                {t('edit')}
              </button>
              {!entry.internalPath && (
                <button
                  onClick={() => onDelete(entry.id)}
                  className="rounded-full border border-ink/12 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent dark:border-paper/12 dark:hover:border-accent"
                >
                  {t('delete')}
                </button>
              )}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="rounded-[1.6rem] border border-dashed border-ink/12 px-5 py-8 text-center dark:border-paper/12">
            <p className="text-sm text-ink/45 dark:text-paper/45">{t('emptySection')}</p>
          </div>
        )}
      </div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-paper/40">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClassName = 'w-full rounded-2xl border border-ink/12 bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink dark:border-paper/12 dark:bg-ink-soft dark:focus:border-paper'

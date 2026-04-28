import { useRef, useState } from 'react'
import { uploadNodeImage } from '../lib/cloudinary'

export default function NodePropertiesPanel({ node, onUpdate, onDelete, readOnly }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const set = (key, value) => onUpdate(node.id, { ...node.data, [key]: value })

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadNodeImage(file)
      set('imageUrl', url)
    } catch (err) {
      alert('Image upload failed: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const nodeColors = {
    start: '#22c55e', end: '#ef4444', process: '#3b82f6',
    decision: '#eab308', io: '#8b5cf6',
  }
  const color = nodeColors[node.type] || '#94a3b8'

  const canHaveImage = ['process', 'io'].includes(node.type)

  return (
    <aside className="w-64 shrink-0 border-l border-ink/8 dark:border-paper/8 bg-paper/60 dark:bg-ink/50 backdrop-blur flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-ink/8 dark:border-paper/8">
        <div className="flex items-center gap-2.5">
          <span style={{ background: color + '22', border: `1.5px solid ${color}`, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block' }} />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 dark:text-paper/40">
            {node.type} node
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-1.5">
            Label
          </label>
          <input
            value={node.data.label || ''}
            onChange={e => set('label', e.target.value)}
            disabled={readOnly}
            placeholder="Node label..."
            className="w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink/30 disabled:opacity-50 dark:border-paper/10 dark:bg-ink dark:text-paper dark:focus:border-paper/30"
          />
        </div>

        {/* Description */}
        {['process', 'decision', 'io'].includes(node.type) && (
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-1.5">
              Description
            </label>
            <textarea
              value={node.data.description || ''}
              onChange={e => set('description', e.target.value)}
              disabled={readOnly}
              placeholder="Optional description..."
              rows={3}
              className="w-full resize-none rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink/30 disabled:opacity-50 dark:border-paper/10 dark:bg-ink dark:text-paper dark:focus:border-paper/30"
            />
          </div>
        )}

        {/* Image */}
        {canHaveImage && (
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-1.5">
              Attached Image
            </label>
            {node.data.imageUrl ? (
              <div className="relative">
                <img
                  src={node.data.imageUrl} alt=""
                  className="w-full rounded-xl object-cover max-h-40 border border-ink/8 dark:border-paper/8"
                />
                {!readOnly && (
                  <button
                    onClick={() => set('imageUrl', null)}
                    className="absolute right-2 top-2 h-6 w-6 rounded-full bg-ink/70 text-paper text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              !readOnly && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 dark:border-paper/15 py-4 text-xs text-ink/35 dark:text-paper/35 hover:border-ink/30 dark:hover:border-paper/30 hover:text-ink/55 dark:hover:text-paper/55 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink dark:border-paper/20 dark:border-t-paper" />
                  ) : (
                    <span className="text-base">↑</span>
                  )}
                  {uploading ? 'Uploading…' : 'Attach image'}
                </button>
              )
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        )}
      </div>

      {/* Delete */}
      {!readOnly && (
        <div className="p-4 border-t border-ink/8 dark:border-paper/8">
          <button
            onClick={() => onDelete(node.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <span>✕</span> Delete node
          </button>
        </div>
      )}
    </aside>
  )
}

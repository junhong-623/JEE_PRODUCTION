const LINE_STYLES = [
  { value: 'solid',  label: 'Solid',  dash: undefined },
  { value: 'dashed', label: 'Dashed', dash: '8,4' },
  { value: 'dotted', label: 'Dotted', dash: '2,5' },
]

export default function EdgePropertiesPanel({ edge, onUpdate, onDelete, readOnly }) {
  const currentStyle = edge.data?.lineStyle || 'solid'

  return (
    <aside className="w-64 shrink-0 border-l border-ink/8 dark:border-paper/8 bg-paper/60 dark:bg-ink/50 backdrop-blur flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-ink/8 dark:border-paper/8">
        <div className="flex items-center gap-2.5">
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="28" height="12" viewBox="0 0 28 12">
              <line x1="0" y1="6" x2="28" y2="6" stroke="#94a3b8" strokeWidth="2"
                strokeDasharray={LINE_STYLES.find(s => s.value === currentStyle)?.dash} />
            </svg>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 dark:text-paper/40">
            connection
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Label */}
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-1.5">
            Label
          </label>
          <input
            value={edge.label || ''}
            onChange={e => onUpdate(edge.id, 'label', e.target.value)}
            disabled={readOnly}
            placeholder="e.g. Yes, No, True…"
            className="w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink/30 disabled:opacity-50 dark:border-paper/10 dark:bg-ink dark:text-paper dark:focus:border-paper/30"
          />
          <p className="mt-1.5 font-mono text-[9px] text-ink/25 dark:text-paper/25">
            Shown at the midpoint of the line.
          </p>
        </div>

        {/* Line style */}
        <div>
          <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-2">
            Line Style
          </label>
          <div className="flex flex-col gap-1.5">
            {LINE_STYLES.map(s => (
              <button
                key={s.value}
                disabled={readOnly}
                onClick={() => onUpdate(edge.id, 'lineStyle', s.value)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors disabled:opacity-50 ${
                  currentStyle === s.value
                    ? 'border-ink/25 bg-ink/6 dark:border-paper/25 dark:bg-paper/8'
                    : 'border-ink/8 dark:border-paper/8 hover:border-ink/18 dark:hover:border-paper/18'
                }`}
              >
                <svg width="40" height="10" viewBox="0 0 40 10" className="shrink-0">
                  <line x1="0" y1="5" x2="40" y2="5"
                    stroke={currentStyle === s.value ? '#64748b' : '#94a3b8'}
                    strokeWidth="2"
                    strokeDasharray={s.dash}
                  />
                </svg>
                <span className="text-xs text-ink/60 dark:text-paper/60">{s.label}</span>
                {currentStyle === s.value && (
                  <span className="ml-auto text-[10px] text-ink/40 dark:text-paper/40">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete */}
      {!readOnly && (
        <div className="p-4 border-t border-ink/8 dark:border-paper/8">
          <button
            onClick={() => onDelete(edge.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <span>✕</span> Delete connection
          </button>
        </div>
      )}
    </aside>
  )
}

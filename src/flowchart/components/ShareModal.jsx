import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createShareCode, getSharesForFlowchart, deleteShareCode } from '../services/firestore'

export default function ShareModal({ flowchartId, flowchartTitle, onClose }) {
  const { user } = useAuth()
  const [shares, setShares] = useState([])
  const [permission, setPermission] = useState('view')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setShares(await getSharesForFlowchart(flowchartId)) }
    finally { setLoading(false) }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await createShareCode(flowchartId, permission, user.uid, flowchartTitle)
      await load()
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (code) => {
    await deleteShareCode(code)
    setShares(s => s.filter(x => x.code !== code))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-ink/8 dark:border-paper/8 bg-paper dark:bg-ink shadow-[0_32px_80px_rgba(13,13,13,0.2)] overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-ink/8 dark:border-paper/8">
          <h2 className="font-display text-xl">Share Flowchart</h2>
          <p className="mt-1 text-xs text-ink/40 dark:text-paper/40 truncate">"{flowchartTitle}"</p>
        </div>

        <div className="px-7 py-5 space-y-5">
          {/* Generate */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-3">
              Generate invite code
            </p>
            <div className="flex items-center gap-2.5">
              <select
                value={permission}
                onChange={e => setPermission(e.target.value)}
                className="flex-1 rounded-xl border border-ink/10 dark:border-paper/10 bg-paper dark:bg-ink px-3 py-2 text-sm text-ink dark:text-paper outline-none"
              >
                <option value="view">View only</option>
                <option value="edit">Can edit</option>
              </select>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-ink dark:bg-paper px-4 py-2 text-sm font-medium text-paper dark:text-ink hover:bg-accent dark:hover:bg-accent dark:hover:text-paper transition-colors disabled:opacity-50"
              >
                {generating
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper dark:border-ink/30 dark:border-t-ink" />
                  : <span>＋</span>}
                Generate
              </button>
            </div>
          </div>

          {/* Codes list */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/30 dark:text-paper/30 mb-3">
              Active codes {shares.length > 0 && `(${shares.length})`}
            </p>
            {loading ? (
              <div className="space-y-2">
                {[0,1].map(i => <div key={i} className="h-12 rounded-xl animate-pulse bg-ink/4 dark:bg-paper/4" />)}
              </div>
            ) : shares.length === 0 ? (
              <p className="text-center py-6 text-xs text-ink/25 dark:text-paper/25">No active codes</p>
            ) : (
              <div className="space-y-2">
                {shares.map(s => (
                  <div key={s.code} className="flex items-center gap-2.5 rounded-xl border border-ink/8 dark:border-paper/8 bg-ink/2 dark:bg-paper/2 px-3.5 py-2.5">
                    <code className="flex-1 font-mono text-base font-semibold tracking-[0.15em] text-ink dark:text-paper">
                      {s.code}
                    </code>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      s.permission === 'edit'
                        ? 'bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400'
                        : 'bg-ink/6 text-ink/40 dark:bg-paper/6 dark:text-paper/40'
                    }`}>
                      {s.permission}
                    </span>
                    <button
                      onClick={() => handleCopy(s.code)}
                      className="rounded-lg px-2 py-1 text-[10px] font-mono text-ink/40 dark:text-paper/40 hover:text-ink dark:hover:text-paper transition-colors"
                    >
                      {copied === s.code ? '✓' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDelete(s.code)}
                      className="rounded-lg px-1.5 py-1 text-[10px] text-ink/25 dark:text-paper/25 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-ink/30 dark:text-paper/30 leading-5">
            Share the 6-character code. Recipients paste it in the dashboard sidebar to join.
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-ink/25 dark:text-paper/25 hover:bg-ink/6 dark:hover:bg-paper/6 hover:text-ink dark:hover:text-paper transition-colors text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

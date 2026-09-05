// Animated SVG chart primitives: AnimatedCount, Sparkline, Donut, ProgressRing, BarChart, AreaChart
import { useEffect, useRef, useState } from 'react'

export function useInView(opts = { threshold: 0.2, rootMargin: '0px' }) {
  const ref  = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } })
    }, opts)
    obs.observe(ref.current)
    const t = setTimeout(() => setSeen(true), 800)
    return () => { obs.disconnect(); clearTimeout(t) }
  }, [])
  return [ref, seen]
}

export function AnimatedCount({ value = 0, dur = 1400, prefix = '', suffix = '', decimals = 0, separator = ',', className = '', style = {} }) {
  const [ref, seen] = useInView({ threshold: 0.3 })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!seen) return
    let raf, t0
    const step = (t) => {
      if (!t0) t0 = t
      const p = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(value * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [seen, value, dur])
  const fmt = (x) => {
    const fixed = x.toFixed(decimals)
    const [int, dec] = fixed.split('.')
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return dec != null ? `${grouped}.${dec}` : grouped
  }
  return (
    <span ref={ref} className={`js-count ${className}`} style={style}>
      {prefix}{fmt(n)}{suffix}
    </span>
  )
}

export function Sparkline({ data, width = 220, height = 64, color = '#10b981', fill = 'rgba(16,185,129,0.18)', strokeWidth = 1.6, showDot = true }) {
  const [ref, seen] = useInView({ threshold: 0.2 })
  const w = width, h = height
  const max = Math.max(...data), min = Math.min(...data)
  const span = (max - min) || 1
  const pad = 4
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * (w - pad * 2) + pad,
    h - pad - ((v - min) / span) * (h - pad * 2),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const dArea = `${d} L ${w - pad} ${h} L ${pad} ${h} Z`
  const lastX = pts[pts.length - 1][0], lastY = pts[pts.length - 1][1]
  const pathRef = useRef(null)
  const [len, setLen] = useState(0)
  useEffect(() => { if (pathRef.current) setLen(pathRef.current.getTotalLength()) }, [data])
  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sp-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill={`url(#sp-${color.replace('#', '')})`} style={{ opacity: seen ? 1 : 0, transition: 'opacity .8s .3s' }} />
      <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: len, strokeDashoffset: seen ? 0 : len, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}/>
      {showDot && (
        <g style={{ opacity: seen ? 1 : 0, transition: 'opacity .4s 1.2s' }}>
          <circle cx={lastX} cy={lastY} r="6" fill={color} fillOpacity="0.18" />
          <circle cx={lastX} cy={lastY} r="3" fill={color} />
        </g>
      )}
    </svg>
  )
}

export function Donut({ data, size = 200, thickness = 22, centerLabel, centerValue, gap = 0.02 }) {
  const [ref, seen] = useInView({ threshold: 0.3 })
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = size / 2 - thickness / 2 - 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', overflow: 'visible' }}>
      <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total
          const segLen = c * frac - c * gap
          const offset = -c * acc
          acc += frac
          return (
            <circle key={i} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeLinecap="butt"
              strokeDasharray={`${seen ? Math.max(0, segLen) : 0} ${c}`}
              strokeDashoffset={offset}
              style={{ transition: `stroke-dasharray 1.2s ${i * 0.12 + 0.1}s cubic-bezier(0.22, 1, 0.36, 1)` }} />
          )
        })}
      </g>
      {centerLabel !== undefined && (
        <g textAnchor="middle">
          <text x={size / 2} y={size / 2 - 6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, fill: 'rgba(241,245,249,0.4)' }}>
            {centerLabel}
          </text>
          <text x={size / 2} y={size / 2 + 20}
            style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: -0.5, fill: '#f1f5f9' }}>
            {centerValue}
          </text>
        </g>
      )}
    </svg>
  )
}

export function ProgressRing({ value = 0.65, size = 64, thickness = 6, color = '#10b981', track = 'rgba(255,255,255,0.08)', children }) {
  const [ref, seen] = useInView({ threshold: 0.3 })
  const r = size / 2 - thickness / 2 - 1
  const c = 2 * Math.PI * r
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, display: 'inline-flex' }}>
      <svg width={size} height={size}>
        <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke={track} strokeWidth={thickness} />
          <circle r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={seen ? c - c * value : c}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        </g>
      </svg>
      {children != null && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function BarChart({ data, width = 280, height = 120, color = '#10b981', highlight }) {
  const [ref, seen] = useInView({ threshold: 0.3 })
  const max = Math.max(1, ...data.map(d => d.value))
  const barW = (width - (data.length - 1) * 8) / data.length
  return (
    <svg ref={ref} width={width} height={height + 18} viewBox={`0 0 ${width} ${height + 18}`} style={{ display: 'block', width: '100%', maxWidth: width, height: 'auto' }}>
      {data.map((d, i) => {
        const h = (d.value / max) * height
        const isH = highlight === i
        return (
          <g key={i}>
            <rect x={i * (barW + 8)} y={height - h} width={barW} height={seen ? h : 0}
              fill={isH ? '#f5d570' : color}
              opacity={isH ? 1 : 0.62}
              rx={3}
              style={{ transition: `height .8s ${i * 0.06 + 0.1}s cubic-bezier(0.22, 1, 0.36, 1), y .8s ${i * 0.06 + 0.1}s cubic-bezier(0.22, 1, 0.36, 1)` }}
            />
            <text x={i * (barW + 8) + barW / 2} y={height + 12}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'rgba(241,245,249,0.4)', letterSpacing: 0.5 }}>
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function SeriesPath({ d, color, si, seen }) {
  const ref = useRef(null)
  const [len, setLen] = useState(0)
  useEffect(() => { if (ref.current) setLen(ref.current.getTotalLength()) }, [d])
  return (
    <path ref={ref} d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ strokeDasharray: len, strokeDashoffset: seen ? 0 : len, transition: `stroke-dashoffset 1.6s ${si * 0.2 + 0.2}s cubic-bezier(0.22, 1, 0.36, 1)` }} />
  )
}

export function AreaChart({ series, width = 720, height = 240, padding = 24, yTicks = 4, xLabels = [] }) {
  const [ref, seen] = useInView({ threshold: 0.2 })
  const all = series.flatMap(s => s.data)
  const max = Math.max(...all) * 1.1, min = 0
  const innerW = width - padding * 2
  const innerH = height - padding * 2 - 16
  const xy = (data) => data.map((v, i) => [
    padding + (i / (data.length - 1)) * innerW,
    padding + innerH - ((v - min) / (max - min || 1)) * innerH,
  ])
  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = padding + (innerH / yTicks) * i
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(241,245,249,0.06)" strokeDasharray="2 4" />
            <text x={padding - 8} y={y + 3} textAnchor="end"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'rgba(241,245,249,0.3)', letterSpacing: 0.5 }}>
              {Math.round(max - (max / yTicks) * i)}
            </text>
          </g>
        )
      })}
      {xLabels.map((lab, i) => (
        <text key={i} x={padding + (i / (xLabels.length - 1)) * innerW} y={height - 4} textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'rgba(241,245,249,0.4)', letterSpacing: 0.5 }}>
          {lab}
        </text>
      ))}
      {series.map((s, si) => {
        const pts = xy(s.data)
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
        const dArea = `${d} L ${padding + innerW} ${padding + innerH} L ${padding} ${padding + innerH} Z`
        return (
          <g key={si}>
            <defs>
              <linearGradient id={`area-${si}-${s.color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={dArea} fill={`url(#area-${si}-${s.color.replace('#','')})`}
              style={{ opacity: seen ? 1 : 0, transition: `opacity 1s ${si * 0.18 + 0.3}s` }} />
            <SeriesPath d={d} color={s.color} si={si} seen={seen} />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill={s.color}
                style={{ opacity: seen ? 1 : 0, transition: `opacity .3s ${si * 0.18 + 0.6 + i * 0.04}s` }}/>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

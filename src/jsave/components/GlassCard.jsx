export default function GlassCard({ children, className = '', onClick, glow }) {
  return (
    <div
      className={`glass-card${glow ? ' glass-glow' : ''}${onClick ? ' cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

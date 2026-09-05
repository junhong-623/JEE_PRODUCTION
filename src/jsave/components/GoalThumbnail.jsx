export default function GoalThumbnail({ goal, size = 40, className = '' }) {
  if (goal?.coverUrl) {
    return <img className={`jsave-goal-thumbnail ${className}`} src={goal.coverUrl} alt="" width={size} height={size} style={{ width: size, height: size }} />
  }
  return <span className={`jsave-goal-thumbnail fallback ${className}`} aria-hidden="true" style={{ width: size, height: size, fontSize: Math.max(14, size * 0.5) }}>{goal?.emoji || '🎯'}</span>
}

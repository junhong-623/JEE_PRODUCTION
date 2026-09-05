export default function ItemThumbnail({ item, size = 40, className = '' }) {
  if (item?.coverUrl) {
    return <img className={`jsave-item-thumbnail ${className}`} src={item.coverUrl} alt="" width={size} height={size} style={{ width: size, height: size }} />
  }
  return <span className={`jsave-item-thumbnail fallback ${className}`} aria-hidden="true" style={{ width: size, height: size, fontSize: Math.max(14, size * 0.5) }}>{item?.emoji || '📦'}</span>
}

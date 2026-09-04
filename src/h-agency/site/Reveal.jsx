import { useEffect, useRef, useState } from 'react'

export default function Reveal({ children, className = '', delay = 0, direction = 'up', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setVisible(true)
      observer.disconnect()
    }, { threshold: 0.13, rootMargin: '0px 0px -7% 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <Tag ref={ref} className={`ha-reveal ha-reveal-${direction} ${visible ? 'is-visible' : ''} ${className}`} style={{ '--ha-reveal-delay': `${delay}ms` }}>{children}</Tag>
}

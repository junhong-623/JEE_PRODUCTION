import React, { useEffect, useRef } from 'react'

export default function SnowEffect() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const flakes = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      d: Math.random() * 1.5 + 0.3,
      drift: Math.random() * 0.5 - 0.25,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    let angle = 0

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      angle += 0.008

      for (const f of flakes) {
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`
        ctx.fill()

        f.y += f.d
        f.x += f.drift + Math.sin(angle) * 0.3

        if (f.y > canvas.height) {
          f.y = -5
          f.x = Math.random() * canvas.width
        }
        if (f.x > canvas.width) f.x = 0
        if (f.x < 0) f.x = canvas.width
      }

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="snow-canvas" aria-hidden="true" />
}

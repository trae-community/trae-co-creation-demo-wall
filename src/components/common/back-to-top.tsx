'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!show) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center backdrop-blur-md hover:bg-green-500/30 transition-all shadow-lg animate-dropdown-pop"
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}

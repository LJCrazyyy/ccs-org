"use client"
import { useEffect, useState } from 'react'

export default function VariantSwitcher() {
  const [variant, setVariant] = useState<'a'|'b'>(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const v = params.get('variant')
      if (v === 'a' || v === 'b') return v
    } catch {}
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('site-variant') : null
    return stored === 'b' ? 'b' : 'a'
  })

  useEffect(() => {
    document.body.classList.remove('variant-a', 'variant-b')
    document.body.classList.add(variant === 'a' ? 'variant-a' : 'variant-b')
    try { window.localStorage.setItem('site-variant', variant) } catch {}
  }, [variant])

  return (
    <div className="variant-switcher" role="toolbar" aria-label="Layout variant switcher">
      <button
        onClick={() => setVariant(variant === 'a' ? 'b' : 'a')}
        aria-pressed={variant === 'b'}
        className="px-3 py-1 rounded"
      >
        {variant === 'a' ? 'Variant A' : 'Variant B'}
      </button>
    </div>
  )
}

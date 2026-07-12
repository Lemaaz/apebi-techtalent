'use client'

import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from 'react'

type ScrollRevealProps = {
  as?: ElementType
  className?: string
} & HTMLAttributes<HTMLElement>

/** Fade + rise a section in once it enters the viewport — mirrors the mockup's `data-reveal` behavior. */
export function ScrollReveal({ as, className = '', ...props }: ScrollRevealProps) {
  const Tag = as ?? 'div'
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:!opacity-100 motion-reduce:!translate-y-0 motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      {...props}
    />
  )
}

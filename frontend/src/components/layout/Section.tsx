import type { ReactNode } from 'react'
import { Reveal } from '../motion/Reveal'

interface SectionProps {
  id: string
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  dark?: boolean
}

export function Section({ id, title, subtitle, children, className = '', dark = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-20 md:py-32 ${dark ? 'bg-forest text-ivory' : 'bg-ivory text-ink'} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 text-center md:mb-20">
          <div className={`gold-rule om-rule-animate mx-auto mb-6 w-16 ${dark ? 'opacity-60' : ''}`} />
          <h2 className="font-display text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">{title}</h2>
          {subtitle && (
            <p className={`mx-auto mt-4 max-w-xl font-display text-lg italic md:text-xl ${dark ? 'text-ivory/60' : 'text-stone'}`}>
              {subtitle}
            </p>
          )}
          <div className={`gold-rule om-rule-animate mx-auto mt-6 w-10 ${dark ? 'opacity-40' : 'opacity-60'}`} />
        </Reveal>
        {children}
      </div>
    </section>
  )
}

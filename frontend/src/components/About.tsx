import { site } from '../data/site'
import { Reveal } from './motion/Reveal'
import { Section } from './layout/Section'

export function About() {
  return (
    <Section id="about" title="О мастере" subtitle="Традиции частного загородного строительства">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <Reveal className="space-y-6 text-base leading-[1.8] text-stone md:text-lg">
          {site.about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          <div className="flex flex-wrap gap-3 pt-4">
            {site.materials.map((material, index) => (
              <Reveal key={material} delay={80 + index * 60}>
                <span className="inline-block border border-gold/30 px-4 py-1.5 text-[10px] tracking-[0.15em] text-gold-muted uppercase">
                  {material}
                </span>
              </Reveal>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="group relative">
            <div className="absolute -inset-3 border border-gold/25 transition-colors duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/45" />
            <img
              src="/photos/house-04.jpg"
              alt="Коттедж в процессе строительства"
              className="om-image-pan relative aspect-[4/5] w-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

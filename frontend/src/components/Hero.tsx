import { site } from '../data/site'

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-forest">
      <img
        src="/photos/house-01.jpg"
        alt="Коттедж — реализованный проект"
        className="om-ken-burns absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest/90 via-forest/70 to-forest/95" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-32 text-center">
        <div className="gold-rule om-rise om-rule-animate mb-8 w-24" />
        <p className="om-rise om-delay-1 mb-6 text-[11px] font-medium tracking-[0.35em] text-gold-light uppercase">
          ИП · Загородное строительство
        </p>
        <h1 className="om-rise om-delay-2 font-display text-5xl leading-[1.1] font-medium text-ivory md:text-7xl lg:text-8xl">
          {site.name}
        </h1>
        <p className="om-rise om-delay-3 mt-6 max-w-lg font-display text-xl text-ivory/80 italic md:text-2xl">
          {site.tagline}
        </p>
        <p className="om-rise om-delay-4 mt-8 max-w-md text-sm leading-relaxed text-ivory/55">{site.description}</p>
        <div className="gold-rule om-rise om-delay-5 om-rule-animate mt-10 w-16" />
        <div className="om-rise om-delay-5 mt-10 flex flex-wrap justify-center gap-5">
          <a
            href="#portfolio"
            className="om-btn border border-gold/60 bg-gold/10 px-8 py-3 text-[11px] font-medium tracking-[0.2em] text-gold-light uppercase hover:bg-gold/20"
          >
            Смотреть резиденции
          </a>
          <a
            href="#contact"
            className="om-btn border border-ivory/25 px-8 py-3 text-[11px] font-medium tracking-[0.2em] text-ivory/80 uppercase hover:border-ivory/50 hover:text-ivory"
          >
            Связаться
          </a>
        </div>
      </div>
    </section>
  )
}

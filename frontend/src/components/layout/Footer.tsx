import { site } from '../../data/site'

export function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-forest py-14 text-ivory/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-display text-2xl text-ivory">{site.name}</p>
          <p className="mt-1 text-[10px] tracking-[0.25em] text-gold-muted uppercase">{site.title}</p>
        </div>
        <div className="gold-rule hidden w-24 md:block" />
        <p className="text-center text-xs tracking-wide md:text-right">
          &copy; {new Date().getFullYear()} ИП {site.name}
        </p>
      </div>
    </footer>
  )
}

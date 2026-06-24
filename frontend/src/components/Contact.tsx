import { useState, type FormEvent } from 'react'
import { site } from '../data/site'
import { Reveal } from './motion/Reveal'
import { Section } from './layout/Section'

export function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Section id="contact" title="Контакты" subtitle="Обсудим ваш проект" dark>
      <div className="mx-auto grid max-w-4xl gap-16 md:grid-cols-2">
        <Reveal>
          <div>
            <p className="text-base leading-[1.8] text-ivory/70 md:text-lg">{site.contact.message}</p>
          {site.contact.phone && (
            <p className="mt-6">
              <a href={`tel:${site.contact.phone}`} className="font-display text-xl text-gold-light hover:underline">
                {site.contact.phone}
              </a>
            </p>
          )}
          {site.contact.email && (
            <p className="mt-3">
              <a href={`mailto:${site.contact.email}`} className="text-gold-light hover:underline">
                {site.contact.email}
              </a>
            </p>
          )}
          </div>
        </Reveal>

        <Reveal delay={120}>
        <form onSubmit={handleSubmit} className="space-y-5 border border-gold/20 bg-forest-light/50 p-8">
          <div>
            <label htmlFor="name" className="mb-2 block text-[10px] tracking-[0.2em] text-gold-muted uppercase">
              Имя
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full border border-gold/20 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold/50 focus:outline-none"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-[10px] tracking-[0.2em] text-gold-muted uppercase">
              Телефон
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="w-full border border-gold/20 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold/50 focus:outline-none"
              placeholder="+7 (___) ___-__-__"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-[10px] tracking-[0.2em] text-gold-muted uppercase">
              Сообщение
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full resize-none border border-gold/20 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold/50 focus:outline-none"
              placeholder="Участок, площадь, пожелания..."
            />
          </div>
          <button
            type="submit"
            className="om-btn w-full border border-gold/60 bg-gold/10 py-3.5 text-[11px] font-medium tracking-[0.2em] text-gold-light uppercase hover:bg-gold/20"
          >
            Отправить заявку
          </button>
          {submitted && (
            <p className="text-center text-xs text-ivory/50">
              Спасибо! Форма пока демонстрационная.
            </p>
          )}
        </form>
        </Reveal>
      </div>
    </Section>
  )
}

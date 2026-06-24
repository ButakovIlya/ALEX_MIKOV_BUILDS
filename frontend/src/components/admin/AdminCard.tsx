import type { ReactNode } from 'react'

type AdminCardProps = {
  title: string
  description?: string
  badge?: string
  children: ReactNode
}

export function AdminCard({ title, description, badge, children }: AdminCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-gold/20 bg-ivory shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-gold/10 bg-parchment/40 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-forest">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-stone">{description}</p>}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-muted">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

type AdminTab = 'info' | 'media' | 'model'

type AdminTabsProps = {
  active: AdminTab
  onChange: (tab: AdminTab) => void
  photoCount: number
  videoCount: number
  hasModel: boolean
}

export function AdminTabs({ active, onChange, photoCount, videoCount, hasModel }: AdminTabsProps) {
  const tabs: { id: AdminTab; label: string; count?: string }[] = [
    { id: 'info', label: 'Основное' },
    { id: 'media', label: 'Медиа', count: `${photoCount} фото · ${videoCount} видео` },
    { id: 'model', label: '3D', count: hasModel ? '1' : '0' },
  ]

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-gold/20 bg-parchment/50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-4 py-2 text-left transition-colors ${
            active === tab.id ? 'bg-forest text-ivory shadow-sm' : 'text-stone hover:bg-ivory hover:text-forest'
          }`}
        >
          <span className="block text-sm font-medium">{tab.label}</span>
          {tab.count && (
            <span className={`block text-[10px] ${active === tab.id ? 'text-ivory/60' : 'text-stone/70'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export type { AdminTab }

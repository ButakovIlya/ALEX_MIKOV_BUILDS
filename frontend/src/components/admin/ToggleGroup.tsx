type ToggleGroupProps<T extends string> = {
  label: string
  value: T | null
  options: Record<T, string>
  onChange: (value: T | null) => void
  allowEmpty?: boolean
}

export function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  allowEmpty = true,
}: ToggleGroupProps<T>) {
  const entries = Object.entries(options) as [T, string][]
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-forest">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, text]) => {
          const active = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(active && allowEmpty ? null : key)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active ? 'bg-forest text-ivory shadow-sm' : 'bg-parchment text-ink hover:bg-parchment/80'
              }`}
            >
              {text}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

type CheckboxGroupProps = {
  label: string
  items: { key: string; label: string; checked: boolean }[]
  onChange: (key: string, checked: boolean) => void
}

export function CheckboxGroup({ label, items, onChange }: CheckboxGroupProps) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-forest">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {items.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => onChange(item.key, e.target.checked)}
              className="h-4 w-4 accent-forest"
            />
            {item.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

type SelectFieldProps<T extends string> = {
  label: string
  value: T | null
  options: Record<T, string>
  onChange: (value: T | null) => void
  className?: string
}

export function SelectField<T extends string>({ label, value, options, onChange, className = '' }: SelectFieldProps<T>) {
  return (
    <label className={`block text-sm font-medium text-forest ${className}`}>
      {label}
      <select
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        className="mt-1.5 w-full rounded-lg border border-gold/25 bg-white px-3 py-2.5 text-sm text-ink"
      >
        <option value="">—</option>
        {(Object.entries(options) as [T, string][]).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  )
}

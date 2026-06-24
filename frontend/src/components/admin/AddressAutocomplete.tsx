import { useEffect, useRef, useState } from 'react'
import { searchAddresses, type AddressSuggestion } from '../../api/client'

type AddressAutocompleteProps = {
  value: string
  onChange: (address: string) => void
  onSelect: (item: AddressSuggestion) => void
  inputClass: string
}

export function AddressAutocomplete({ value, onChange, onSelect, inputClass }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([])
      return
    }
    const id = window.setTimeout(() => {
      setLoading(true)
      void searchAddresses(value)
        .then((rows) => {
          setSuggestions(rows)
          setOpen(rows.length > 0)
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, 400)
    return () => window.clearTimeout(id)
  }, [value])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        placeholder="Начните вводить адрес…"
        className={inputClass}
        autoComplete="off"
      />
      {loading && <p className="mt-1 text-xs text-stone">Поиск…</p>}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gold/20 bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={`${s.display_name}-${s.latitude}-${s.longitude}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-parchment"
                onClick={() => {
                  onSelect(s)
                  setOpen(false)
                }}
              >
                {s.display_name}
              </button>
            </li>
          ))}
          <li className="border-t border-gold/10 px-3 py-1 text-[10px] text-stone">© OpenStreetMap</li>
        </ul>
      )}
    </div>
  )
}

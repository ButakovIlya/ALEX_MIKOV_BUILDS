import { useMemo, useState } from 'react'

type MortgageCalculatorProps = {
  priceRub: number
}

function formatRub(n: number) {
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`
}

/** Annuity monthly payment */
function calcMonthly(loan: number, annualRate: number, years: number) {
  if (loan <= 0) return 0
  const n = years * 12
  if (n <= 0) return 0
  if (annualRate <= 0) return loan / n
  const r = annualRate / 100 / 12
  return (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1)
}

export function MortgageCalculator({ priceRub }: MortgageCalculatorProps) {
  const [downPct, setDownPct] = useState(30)
  const [years, setYears] = useState(20)
  const [rate, setRate] = useState(19)

  const downRub = useMemo(() => (priceRub * downPct) / 100, [priceRub, downPct])
  const loan = useMemo(() => Math.max(0, priceRub - downRub), [priceRub, downRub])
  const monthly = useMemo(() => calcMonthly(loan, rate, years), [loan, rate, years])

  const termPresets = [5, 10, 15, 20, 25, 30]

  return (
    <div className="rounded-xl border border-gold/20 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg text-forest">Рассчитать ипотеку</h3>
      <p className="mt-1 text-xs text-stone">Стоимость {formatRub(priceRub)}</p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-stone">
            <span>Первоначальный взнос</span>
            <span className="font-medium text-forest">
              {formatRub(downRub)} · {downPct}%
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-stone">
            <span>Срок кредита</span>
            <span className="font-medium text-forest">{years} лет</span>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {termPresets.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYears(y)}
                className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                  years === y ? 'bg-forest text-ivory' : 'bg-parchment text-stone hover:bg-parchment/80'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-stone">
            <span>Процентная ставка</span>
            <span className="font-medium text-forest">{rate.toFixed(1)}%</span>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <input
            type="number"
            min={0}
            max={50}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-5 rounded-lg bg-parchment/60 p-4">
        <p className="text-xs text-stone">Ежемесячный платёж</p>
        <p className="font-display text-2xl text-gold">{formatRub(monthly)}</p>
        <p className="mt-2 text-xs text-stone">
          Сумма кредита {formatRub(loan)} · {years * 12} мес.
        </p>
      </div>
    </div>
  )
}

export function pricePerSqm(priceRub: number | null | undefined, areaSqm: number | null | undefined) {
  if (priceRub == null || priceRub <= 0 || areaSqm == null || areaSqm <= 0) return null
  return Math.round(priceRub / areaSqm)
}

type UploadProgressProps = {
  label: string
  percent: number | null
}

export function UploadProgress({ label, percent }: UploadProgressProps) {
  if (percent === null) return null
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-xs text-stone">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-parchment ring-1 ring-gold/10">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-muted to-gold transition-all duration-200" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

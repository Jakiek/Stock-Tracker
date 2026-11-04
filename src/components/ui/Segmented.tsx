export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string }[]
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-control border border-border bg-surface-sunk p-0.5"
    >
      {options.map((o) => {
        const aktif = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={aktif}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-[8px] px-3 text-[13px] font-semibold transition-colors ${
              aktif ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

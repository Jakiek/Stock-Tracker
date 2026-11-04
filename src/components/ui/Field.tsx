import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'

const KONTROL =
  'h-10 w-full rounded-control border bg-surface px-3 text-sm text-text transition-colors outline-none placeholder:text-subtle focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus'

function garis(error?: string) {
  return error ? 'border-loss' : 'border-border-strong'
}

/** Label sungguhan + galat dengan ikon (bukan warna saja) + petunjuk opsional. */
export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
  aside,
}: {
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
  htmlFor: string
  aside?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-text">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} className="flex items-center gap-1.5 text-[12.5px] text-loss">
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : (
        hint && <p className="text-[12.5px] text-muted">{hint}</p>
      )}
    </div>
  )
}

export function TextInput({
  label,
  error,
  hint,
  aside,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; aside?: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} htmlFor={id} aside={aside}>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${KONTROL} ${garis(error)} ${className}`}
        {...rest}
      />
    </Field>
  )
}

export function SelectInput({
  label,
  error,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} error={error} htmlFor={id}>
      <select id={id} aria-invalid={!!error} className={`${KONTROL} ${garis(error)} pr-8`} {...rest}>
        {children}
      </select>
    </Field>
  )
}

const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/**
 * Input bilangan bulat (rupiah atau jumlah). Awalan opsional di dalam kolom,
 * diformat dengan titik saat kehilangan fokus — bukan saat mengetik.
 */
export function NumberInput({
  label,
  value,
  onChange,
  error,
  hint,
  prefix,
  suffix,
  aside,
  placeholder,
}: {
  label: string
  value: number | null
  onChange: (n: number | null) => void
  error?: string
  hint?: ReactNode
  prefix?: string
  suffix?: ReactNode
  aside?: ReactNode
  placeholder?: string
}) {
  const id = useId()
  const [fokus, setFokus] = useState(false)
  const [draf, setDraf] = useState('')

  const tampil = fokus ? draf : value === null ? '' : fmt.format(value)

  return (
    <Field label={label} error={error} hint={hint} htmlFor={id} aside={aside}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`${KONTROL} ${garis(error)} tnum text-right ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-[92px]' : ''}`}
          value={tampil}
          onFocus={() => {
            // Teks TIDAK diubah saat fokus: kalau "3.400" mendadak jadi "3400",
            // seleksi/kursor pengguna hilang dan ketikan baru tersambung ke angka lama.
            setDraf(value === null ? '' : fmt.format(value))
            setFokus(true)
          }}
          onBlur={() => setFokus(false)}
          onChange={(e) => {
            setDraf(e.target.value.replace(/[^\d.]/g, ''))
            const digit = e.target.value.replace(/\D/g, '')
            onChange(digit === '' ? null : Number(digit))
          }}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-1 flex items-center">{suffix}</span>
        )}
      </div>
    </Field>
  )
}

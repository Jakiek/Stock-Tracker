import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIAN: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-brand-700 dark:hover:opacity-90 border border-transparent',
  secondary: 'bg-surface text-text border border-border-strong hover:bg-surface-sunk',
  ghost:
    'bg-transparent text-muted border border-transparent hover:bg-surface-sunk hover:text-text',
  danger: 'bg-loss text-white border border-transparent hover:opacity-90',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md'
  icon?: IconName
  children?: ReactNode
}) {
  const ukuran = size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-10 px-4 text-sm'
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-[120ms] ease-ui disabled:cursor-not-allowed disabled:opacity-50 ${ukuran} ${VARIAN[variant]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
}

/** Tombol ikon persegi dengan label untuk pembaca layar. Target sentuh 40px. */
export function IconButton({
  icon,
  label,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-sunk hover:text-text ${className}`}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}

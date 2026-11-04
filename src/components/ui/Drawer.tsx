import { useEffect, useRef, type ReactNode } from 'react'
import { IconButton } from './Button'

/**
 * Drawer dari kanan di layar lebar, lembar penuh di layar sempit.
 * Dipilih untuk form transaksi karena daftar di belakangnya tetap terlihat.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const sebelum = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // fokus ke kolom pertama
    const t = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      sebelum?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-0 flex flex-col bg-surface shadow-lg sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] sm:border-l sm:border-border"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <IconButton icon="x" label="Tutup" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

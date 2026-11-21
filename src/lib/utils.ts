import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhp(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

/** Matches Admin → Courses **Title** (not legacy subtitle-only labels on enrollment). */
export function programCatalogLabel(program: {
  code?: string
  title?: string
  subtitle?: string | null
}): string {
  const title = program.title?.trim() ?? ''
  const subtitle = program.subtitle?.trim() ?? ''
  if (title) {
    if (!subtitle || subtitle === '—' || subtitle === title) return title
    if (title.length <= 12 && subtitle.length > title.length) return `${title} — ${subtitle}`
    return title
  }
  return subtitle || program.code?.trim() || 'Course'
}
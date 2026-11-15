import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

/** Filled head + shoulders inside a circle — matches classic account / sign-in glyph. */
export function UserAccountNavIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('shrink-0', className)}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle cx="12" cy="9.35" r="3.05" fill="currentColor" />
      <path
        fill="currentColor"
        d="M6.1 18.25c.95-2.65 3.2-4.35 5.9-4.35s4.95 1.7 5.9 4.35a7.15 7.15 0 0 1-5.9 2.75 7.15 7.15 0 0 1-5.9-2.75Z"
      />
    </svg>
  )
}
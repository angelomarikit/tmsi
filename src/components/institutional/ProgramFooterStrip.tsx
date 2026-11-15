import { Flower2, Medal, ScrollText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type FooterProgramItem = {
  slug: string
  icon: LucideIcon
  line1: string
  line2: string
}

/** Copy matches homepage reference strip (four ancillary LEAP programs). */
const items: FooterProgramItem[] = [
  {
    slug: 'certificate-philosophy-transcendentalism-ph',
    icon: ScrollText,
    line1: 'Certificate in the',
    line2: 'Philosophy of Transcendentalism-PH',
  },
  {
    slug: 'luminarian-order',
    icon: Flower2,
    line1: 'The Luminarian Order',
    line2: '(Level I, II & III)',
  },
  {
    slug: 'lecs-diplomate-metaphysical-healing-art',
    icon: Medal,
    line1: 'LECS – Diplomate',
    line2: 'in Metaphysical Healing Art',
  },
  {
    slug: 'lecs-fellow-metaphysical-healing-arts',
    icon: Medal,
    line1: 'LECS – Fellow',
    line2: 'in Metaphysical Healing Arts',
  },
]

export function ProgramFooterStrip() {
  return (
    <section
      className="w-full border-t-[3px] border-gold bg-gradient-to-b from-forest via-emerald-institutional to-[#052a22] py-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.25)]"
      aria-label="Additional LEAP programs"
    >
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={item.slug}
              to={`/courses/${item.slug}`}
              className="group relative flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5 sm:px-6"
            >
              {index > 0 ? (
                <span
                  className="absolute left-0 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-white/35 lg:block"
                  aria-hidden
                />
              ) : null}
              <Icon
                className="h-9 w-9 shrink-0 text-gold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                strokeWidth={1.35}
                aria-hidden
              />
              <span className="min-w-0 text-left leading-tight text-white">
                <span className="block text-[11px] font-semibold tracking-wide text-gold-light sm:text-xs">
                  {item.line1}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-white/95 sm:text-[11px]">
                  {item.line2}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
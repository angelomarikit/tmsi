import { BookOpen, Sparkles } from 'lucide-react'

/**
 * Reference-style academic accent without document previews.
 * Replaced former ILR thumbnail in masthead.
 */
export function MastheadDecoration() {
  return (
    <div
      className="hidden h-20 w-36 flex-col items-center justify-center rounded-lg border border-gold/45 bg-gradient-to-br from-forest/80 to-emerald-institutional px-2 shadow-lg lg:flex"
      aria-hidden
    >
      <div className="flex items-center gap-2 text-gold-light">
        <BookOpen className="h-5 w-5" />
        <Sparkles className="h-4 w-4" />
      </div>
      <p className="mt-1 text-center text-[9px] leading-tight text-white/85">
        Lifelong Learning
        <br />
        <span className="text-gold-light">Ad Lucem</span>
      </p>
    </div>
  )
}
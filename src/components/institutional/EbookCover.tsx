import type { EbookRecord } from '@/data/ebooks'

type EbookCoverProps = {
  ebook: EbookRecord
}

export function EbookCover({ ebook }: EbookCoverProps) {
  if (ebook.coverImagePath) {
    return (
      <div className="w-20 shrink-0 overflow-hidden rounded border border-gold/40 shadow-sm">
        <img
          src={ebook.coverImagePath}
          alt={`Cover: ${ebook.title}`}
          className="h-28 w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className="w-20 shrink-0 rounded border border-gold/40 bg-gradient-to-b from-cream to-gold/20 p-1 shadow-inner"
      role="img"
      aria-label={`${ebook.title} — cover missing`}
    >
      <div className="flex h-28 flex-col items-center justify-center bg-emerald-institutional/90 px-1 text-center">
        <span className="font-display text-[8px] leading-tight text-gold-light">No cover</span>
        <span className="mt-1 text-[7px] text-white/70">CMS upload</span>
      </div>
    </div>
  )
}
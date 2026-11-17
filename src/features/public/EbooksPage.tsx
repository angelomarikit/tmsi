import { EbookCard } from '@/components/institutional/EbookCard'
import {
  ebookCategoryLabels,
  type EbookCategory,
} from '@/data/ebooks'
import { ebookPdfStorageReady } from '@/lib/ebook-catalog-merge'
import { mapDbEbookToRecord } from '@/lib/supabase/ebook-mappers'
import { fetchPublishedEbooks } from '@/lib/supabase/queries'
import { BookOpen, Flower2, Landmark, Orbit, PersonStanding } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

const categoryIcons: Record<EbookCategory, typeof BookOpen> = {
  all: BookOpen,
  philosophical: Landmark,
  metaphysical: Orbit,
  transcendental: PersonStanding,
  holistic: Flower2,
}

export function EbooksPage() {
  const [category, setCategory] = useState<EbookCategory>('all')
  const [query, setQuery] = useState('')

  const { data: dbRows, isLoading } = useQuery({
    queryKey: ['content', 'ebooks-published'],
    queryFn: fetchPublishedEbooks,
    staleTime: 60_000,
  })

  const catalog = useMemo(() => {
    return (dbRows ?? [])
      .filter((row) => ebookPdfStorageReady(row.pdf_path))
      .map((row) => mapDbEbookToRecord(row))
  }, [dbRows])

  const filtered = useMemo(() => {
    return catalog.filter((book) => {
      const matchesCategory = category === 'all' || book.category === category
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.pdfStoragePath.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [catalog, category, query])

  const empty = !isLoading && catalog.length === 0

  return (
    <>
      <section className="border-b border-gold/30 bg-gradient-to-b from-cream to-white px-4 py-10 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-forest sm:text-4xl">
          Free Downloadable eBooks
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink/80">
          Published titles with PDFs hosted by TMSI–LAPS. New releases appear here after staff upload
          and publish in Admin.
        </p>
        <label className="mx-auto mt-6 block max-w-md text-left text-xs font-medium text-ink">
          Search eBooks
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
            placeholder="Title"
            disabled={empty}
          />
        </label>
      </section>

      {!empty ? (
        <section className="border-b border-gold/20 bg-cream/60 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-[1440px] flex-wrap gap-2">
            {(Object.keys(ebookCategoryLabels) as EbookCategory[]).map((key) => {
              const Icon = categoryIcons[key]
              const active = category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={
                    active
                      ? 'inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white shadow'
                      : 'inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ivory px-4 py-2 text-xs font-medium text-ink'
                  }
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {ebookCategoryLabels[key]}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-ink/60">Loading catalog…</p>
        ) : empty ? (
          <div className="rounded-xl border border-dashed border-gold/40 bg-white px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-forest">No eBooks published yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/75">
              New titles will appear here when they are published by TMSI–LAPS.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((ebook) => (
              <EbookCard key={ebook.id} ebook={ebook} />
            ))}
          </div>
        )}
        {!isLoading && !empty && filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink/70">No eBooks match your filters.</p>
        ) : null}
      </section>
    </>
  )
}
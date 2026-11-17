import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import {
  EbookAdminActions,
  formatEbookStatus,
} from '@/components/admin/EbookAdminActions'
import { useStaff } from '@/contexts/StaffContext'
import { ebookRecords } from '@/data/ebooks'
import { fetchAdminEbooks } from '@/lib/supabase/admin-queries'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ExternalLink, Upload } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function AdminEbookDetailPage() {
  const { legacySlug } = useParams<{ legacySlug: string }>()
  const { isStaff } = useStaff()

  const staticBook = legacySlug
    ? ebookRecords.find((b) => b.id === legacySlug)
    : undefined

  const { data: dbRows, refetch } = useQuery({
    queryKey: ['admin', 'ebooks'],
    queryFn: fetchAdminEbooks,
  })

  const dbBook = dbRows?.find(
    (r) => (r.legacy_slug ?? r.id) === legacySlug || r.id === legacySlug,
  )

  const title = dbBook?.title ?? staticBook?.title ?? legacySlug
  const status = dbBook?.publication_status ?? staticBook?.publishStatus ?? 'missing'
  const rights = dbBook?.rights_confirmed ?? false
  const cover = dbBook?.cover_path ?? staticBook?.coverImagePath
  const legacy = dbBook?.legacy_slug ?? staticBook?.id ?? legacySlug ?? ''

  return (
    <div>
      <Link to="/admin/ebooks" className="text-sm text-forest underline">
        ← Back to eBooks
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-forest">{title}</h1>
      <p className="mt-1 text-sm text-ink/70">
        Status: {formatEbookStatus(status)} · Rights: {rights ? 'Confirmed' : 'Pending'}
      </p>
      <StaffUploadBanner />

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-gold/35 bg-white shadow-sm">
          {cover ? (
            <img src={cover} alt="" className="aspect-[3/4] w-full object-cover" />
          ) : (
            <div className="flex aspect-[3/4] flex-col items-center justify-center bg-emerald-institutional/90 text-white">
              <BookOpen className="h-12 w-12 opacity-80" aria-hidden />
              <p className="mt-2 px-4 text-center text-xs">No cover yet</p>
            </div>
          )}
        </div>

        <section className="rounded-xl border-2 border-gold/40 bg-cream/50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-forest">
            <Upload className="h-4 w-4" aria-hidden />
            Upload & publish
          </h2>
          <p className="mt-2 text-xs text-ink/70">
            Upload the PDF and optional cover, then confirm rights before Publish so the public
            download button works.
          </p>
          <div className={cn('mt-4', !isStaff && 'pointer-events-none opacity-50')}>
            <EbookAdminActions
              legacySlug={legacy}
              onChanged={() => void refetch()}
              variant="large"
            />
          </div>
          <Link
            to="/ebooks"
            target="_blank"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-forest underline"
          >
            View public catalog
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  )
}
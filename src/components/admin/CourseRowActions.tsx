import { archiveCourse, publishCourse } from '@/lib/supabase/course-admin'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

type Props = {
  programId: string
  slug: string
  publicationStatus: string
  onChanged: () => void
  onEdit: () => void
}

export function CourseRowActions({
  programId,
  slug,
  publicationStatus,
  onChanged,
  onEdit,
}: Props) {
  const isLive = publicationStatus === 'published'

  return (
    <div className="flex flex-wrap gap-1">
      <Link
        to={`/admin/courses/${slug}/materials`}
        className="rounded-md border border-forest/30 bg-forest/10 px-2 py-1 text-[10px] font-medium text-forest no-underline"
      >
        Manage
      </Link>
      <button
        type="button"
        disabled={isLive}
        className="rounded-md border border-forest/30 bg-forest/10 px-2 py-1 text-[10px] font-medium text-forest disabled:cursor-not-allowed disabled:opacity-40"
        onClick={async () => {
          try {
            await publishCourse(programId)
            toast.success('Course published on public site')
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Publish failed')
          }
        }}
      >
        Publish
      </button>
      <button
        type="button"
        className="rounded-md border border-gold/40 bg-ivory px-2 py-1 text-[10px] font-medium text-forest"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-900"
        onClick={async () => {
          if (
            !window.confirm(
              `Archive “${slug}”? The course will be hidden from the public catalog. Enrollments are kept.`,
            )
          ) {
            return
          }
          try {
            await archiveCourse(programId)
            toast.success('Course archived')
            onChanged()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed')
          }
        }}
      >
        Delete
      </button>
    </div>
  )
}
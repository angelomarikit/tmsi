import { useStaff } from '@/contexts/StaffContext'
import { resetLeapCourseCatalog } from '@/lib/supabase/course-catalog-reset'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  onReset: () => void
}

export function CourseCatalogResetButton({ onReset }: Props) {
  const { isStaff } = useStaff()
  const [busy, setBusy] = useState(false)

  if (!isStaff) return null

  async function onClick() {
    if (
      !window.confirm(
        'This permanently deletes ALL courses, LEAP PDF records, and enrollment applications.\n\nType OK in the next dialog only if you want a completely fresh catalog.',
      )
    ) {
      return
    }
    const typed = window.prompt('Type RESET to wipe the course catalog (database rows only):')
    if (typed?.trim() !== 'RESET') {
      toast.message('Reset canceled — text did not match RESET')
      return
    }

    setBusy(true)
    try {
      const result = await resetLeapCourseCatalog()
      toast.success(
        `Catalog cleared: ${result.programs_deleted ?? 0} program(s), ${result.content_items_deleted ?? 0} material row(s). ${result.storage_note ?? 'Delete Storage course-materials/ manually.'}`,
        { duration: 12_000 },
      )
      onReset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-red-300/80 bg-red-50 px-4 py-2 text-xs font-semibold text-red-950 disabled:opacity-45"
      onClick={() => void onClick()}
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
      {busy ? 'Resetting…' : 'Reset all courses'}
    </button>
  )
}
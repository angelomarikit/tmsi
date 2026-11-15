import { Upload } from 'lucide-react'

type Props = {
  onOpenUpload: () => void
}

/** Header action — opens add-eBook modal (no title dropdown). */
export function EbookAdminUploadHeader({ onOpenUpload }: Props) {
  return (
    <button
      type="button"
      className="btn-gloss-green inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white shadow-sm"
      onClick={onOpenUpload}
    >
      <Upload className="h-4 w-4" aria-hidden />
      Upload
    </button>
  )
}
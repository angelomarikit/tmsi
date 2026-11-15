import { useStaff } from '@/contexts/StaffContext'
import { Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

type AdminUploadButtonProps = {
  label: string
  accept: string
  disabled?: boolean
  onFile: (file: File) => Promise<void>
}

export function AdminUploadButton({
  label,
  accept,
  disabled,
  onFile,
}: AdminUploadButtonProps) {
  const { isStaff } = useStaff()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      await onFile(file)
    } finally {
      setBusy(false)
    }
  }

  const blocked = !isStaff || disabled || busy

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        disabled={blocked}
        title={!isStaff ? 'Admin sign-in required' : undefined}
        className={
          label === 'Upload'
            ? 'btn-gloss-green inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45'
            : label === 'PDF' || label === 'Cover'
              ? 'btn-gloss-gold inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45'
              : 'inline-flex items-center gap-1 rounded-md border border-gold/40 bg-cream px-2 py-1 text-[10px] font-medium text-forest disabled:cursor-not-allowed disabled:opacity-45'
        }
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3 w-3" aria-hidden />
        {busy ? '…' : label}
      </button>
    </>
  )
}
import { FileUp } from 'lucide-react'
import { useId, useRef, type ChangeEvent, type ReactNode } from 'react'

type AdminFormFilePickerProps = {
  label: string
  accept: string
  value: File | null
  onChange: (file: File | null) => void
  chooseLabel?: string
  hint?: ReactNode
  disabled?: boolean
}

export function AdminFormFilePicker({
  label,
  accept,
  value,
  onChange,
  chooseLabel = 'Choose file',
  hint,
  disabled,
}: AdminFormFilePickerProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.files?.[0] ?? null)
  }

  function clear() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="block text-xs font-medium text-ink">
      <span id={inputId}>{label}</span>
      <fieldset className="mt-2 flex flex-wrap items-center gap-2 border-0 p-0">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={onInputChange}
          tabIndex={-1}
        />
        <button
          type="button"
          disabled={disabled}
          className="btn-gloss-gold inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="h-3.5 w-3.5" aria-hidden />
          {chooseLabel}
        </button>
        {value ? (
          <>
            <span
              className="max-w-[220px] truncate rounded-md border border-gold/30 bg-white px-2 py-1.5 text-[11px] font-normal text-ink/80"
              title={value.name}
            >
              {value.name}
            </span>
            <button
              type="button"
              className="text-[11px] font-medium text-forest underline disabled:opacity-45"
              disabled={disabled}
              onClick={clear}
            >
              Clear
            </button>
          </>
        ) : (
          <span className="text-[11px] font-normal text-ink/55">No file chosen</span>
        )}
      </fieldset>
      {hint ? <p className="mt-1 text-[10px] font-normal text-ink/55">{hint}</p> : null}
    </div>
  )
}